"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { actionDb, createAdminClient, hasAdminClient } from "@/lib/supabase/admin";
import { getProfile, requireCapability } from "@/lib/auth";
import { siteUrl, slugify } from "@/lib/utils";
import { notifyDiscord } from "@/lib/discord";
import {
  orderDeliveredEmail,
  orderStatusEmail,
  orderStatusSubject,
  sendEmail,
  type SendResult,
} from "@/lib/email";
import { getStripe, stripeConfigured } from "@/lib/stripe";
import { formatMoney } from "@/lib/currency";
import {
  ALL_CAPABILITIES,
  CAPABILITIES_DEFAULT,
  STAFF_ROLES,
  type Capability,
  type Role,
} from "@/lib/types";

export interface AdminResult {
  ok: boolean;
  message: string;
  id?: string;
}

const ok = (message: string, id?: string): AdminResult => ({ ok: true, message, id });
const fail = (message: string): AdminResult => ({ ok: false, message });

/**
 * Resolves the slug for an upsert. A new row derives its slug from an explicit
 * value or its name. On an UPDATE, the slug is only changed when an explicit
 * non-empty value is supplied — otherwise `undefined` is returned so the caller
 * omits the column and the existing slug (and its live URL) is preserved.
 */
function resolveSlug(
  id: string,
  provided: string,
  name: string
): string | undefined {
  const p = provided.trim();
  if (p) return slugify(p);
  if (!id) return slugify(name);
  return undefined;
}

async function audit(
  action: string,
  entity: string,
  entityId: string | null,
  meta: Record<string, unknown> = {}
) {
  try {
    const profile = await getProfile();
    const supabase = await actionDb();
    await supabase.from("audit_logs").insert({
      actor_id: profile?.id ?? null,
      action,
      entity,
      entity_id: entityId,
      meta,
    });
  } catch {
    // audit logging is best-effort
  }
}

function refreshStore() {
  revalidatePath("/", "layout");
  // Bust the cached global data (settings, rates, categories, sections).
  revalidateTag("site");
}

/* ───────────────────────── Games ───────────────────────── */

export async function upsertGame(formData: FormData): Promise<AdminResult> {
  try {
    await requireCapability("manage_games");
  } catch {
    return fail("Unauthorized");
  }
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return fail("Name is required.");
  const slug = resolveSlug(id, String(formData.get("slug") ?? ""), name);
  const row = {
    name,
    ...(slug !== undefined ? { slug } : {}),
    description: String(formData.get("description") ?? "").trim() || null,
    intro: String(formData.get("intro") ?? "").trim() || null,
    image_url: String(formData.get("image_url") ?? "") || null,
    banner_url: String(formData.get("banner_url") ?? "") || null,
    is_active: formData.get("is_active") === "on",
    is_featured: formData.get("is_featured") === "on",
    sort_order: Number(formData.get("sort_order") ?? 0) || 0,
  };
  const supabase = await actionDb();
  const query = id
    ? supabase.from("games").update(row).eq("id", id).select("id").single()
    : supabase.from("games").insert(row).select("id").single();
  const { data, error } = await query;
  if (error) {
    return fail(error.code === "23505" ? "Slug already exists." : error.message);
  }
  await audit(id ? "game.update" : "game.create", "game", data.id, { name });
  refreshStore();
  return ok("Game saved.", data.id);
}

export async function deleteGame(formData: FormData): Promise<AdminResult> {
  try {
    await requireCapability("manage_games");
  } catch {
    return fail("Unauthorized");
  }
  const id = String(formData.get("id") ?? "");
  const supabase = await actionDb();
  const { error } = await supabase.from("games").delete().eq("id", id);
  if (error) return fail("Could not delete — remove its products first.");
  await audit("game.delete", "game", id);
  refreshStore();
  return ok("Game deleted.");
}

/* ─────────────────────── Categories ────────────────────── */

export async function upsertCategory(formData: FormData): Promise<AdminResult> {
  try {
    await requireCapability("manage_categories");
  } catch {
    return fail("Unauthorized");
  }
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return fail("Name is required.");
  const slug = resolveSlug(id, String(formData.get("slug") ?? ""), name);
  const row = {
    name,
    ...(slug !== undefined ? { slug } : {}),
    description: String(formData.get("description") ?? "").trim() || null,
    intro: String(formData.get("intro") ?? "").trim() || null,
    icon: String(formData.get("icon") ?? "").trim() || null,
    sort_order: Number(formData.get("sort_order") ?? 0) || 0,
    is_active: formData.get("is_active") === "on",
  };
  const supabase = await actionDb();
  const query = id
    ? supabase.from("categories").update(row).eq("id", id).select("id").single()
    : supabase.from("categories").insert(row).select("id").single();
  const { data, error } = await query;
  if (error) {
    return fail(error.code === "23505" ? "Slug already exists." : error.message);
  }
  await audit(id ? "category.update" : "category.create", "category", data.id, { name });
  refreshStore();
  return ok("Category saved.", data.id);
}

export async function deleteCategory(formData: FormData): Promise<AdminResult> {
  try {
    await requireCapability("manage_categories");
  } catch {
    return fail("Unauthorized");
  }
  const id = String(formData.get("id") ?? "");
  const supabase = await actionDb();
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) return fail("Could not delete — remove its products first.");
  await audit("category.delete", "category", id);
  refreshStore();
  return ok("Category deleted.");
}

/* ───────────────────────── Products ─────────────────────── */

export interface ProductPayload {
  id?: string;
  game_id: string;
  category_id: string;
  name: string;
  slug?: string;
  description?: string;
  image_url?: string | null;
  base_price: number;
  compare_at_price?: number | null;
  delivery_type: "instant" | "manual";
  delivery_instructions?: string | null;
  stock?: number | null;
  is_active: boolean;
  is_featured: boolean;
  sort_order?: number;
  pricing_mode?: "fixed" | "custom";
  custom_unit_label?: string | null;
  custom_price_per_unit?: number | null;
  custom_min?: number | null;
  custom_max?: number | null;
  custom_step?: number | null;
  variants: {
    id?: string;
    name: string;
    price: number;
    compare_at_price?: number | null;
    stock?: number | null;
    sort_order?: number;
    is_active?: boolean;
  }[];
  fields: {
    id?: string;
    label: string;
    field_type: "text" | "email" | "password" | "select" | "textarea";
    placeholder?: string | null;
    options?: string[];
    required?: boolean;
    sort_order?: number;
  }[];
  addons?: {
    id?: string;
    name: string;
    description?: string | null;
    price: number;
    is_active?: boolean;
    image_url?: string | null;
  }[];
}

export async function upsertProduct(payloadJson: string): Promise<AdminResult> {
  try {
    await requireCapability("manage_products");
  } catch {
    return fail("Unauthorized");
  }
  let payload: ProductPayload;
  try {
    payload = JSON.parse(payloadJson);
  } catch {
    return fail("Invalid payload.");
  }
  if (!payload.name?.trim()) return fail("Name is required.");
  if (!payload.game_id || !payload.category_id) {
    return fail("Game and category are required.");
  }
  if (!Number.isFinite(Number(payload.base_price)) || Number(payload.base_price) < 0) {
    return fail("Base price must be a positive number.");
  }

  const supabase = await actionDb();
  const slug = resolveSlug(payload.id ?? "", payload.slug ?? "", payload.name);
  const row = {
    game_id: payload.game_id,
    category_id: payload.category_id,
    name: payload.name.trim(),
    ...(slug !== undefined ? { slug } : {}),
    description: payload.description?.trim() || null,
    image_url: payload.image_url || null,
    base_price: Number(payload.base_price),
    compare_at_price: payload.compare_at_price
      ? Number(payload.compare_at_price)
      : null,
    delivery_type: payload.delivery_type === "instant" ? "instant" : "manual",
    delivery_instructions: payload.delivery_instructions?.trim() || null,
    stock:
      payload.stock === null || payload.stock === undefined || `${payload.stock}` === ""
        ? null
        : Math.max(0, Math.floor(Number(payload.stock))),
    is_active: Boolean(payload.is_active),
    is_featured: Boolean(payload.is_featured),
    // Preserve the existing ordering on edit when the form doesn't send one,
    // rather than silently resetting it to 0.
    ...(payload.sort_order != null && `${payload.sort_order}` !== ""
      ? { sort_order: Number(payload.sort_order) || 0 }
      : payload.id
        ? {}
        : { sort_order: 0 }),
    pricing_mode: payload.pricing_mode === "custom" ? "custom" : "fixed",
    custom_unit_label: payload.custom_unit_label?.trim() || null,
    custom_price_per_unit:
      payload.custom_price_per_unit != null &&
      `${payload.custom_price_per_unit}` !== ""
        ? Number(payload.custom_price_per_unit)
        : null,
    custom_min:
      payload.custom_min != null && `${payload.custom_min}` !== ""
        ? Number(payload.custom_min)
        : null,
    custom_max:
      payload.custom_max != null && `${payload.custom_max}` !== ""
        ? Number(payload.custom_max)
        : null,
    custom_step:
      payload.custom_step != null && `${payload.custom_step}` !== ""
        ? Number(payload.custom_step)
        : null,
  };

  const query = payload.id
    ? supabase.from("products").update(row).eq("id", payload.id).select("id").single()
    : supabase.from("products").insert(row).select("id").single();
  const { data: product, error } = await query;
  if (error || !product) {
    return fail(
      error?.code === "23505" ? "Slug already exists." : error?.message ?? "Save failed."
    );
  }

  // Track any failure while syncing children so we don't report a clean save
  // over a partial one.
  let syncFailed = false;
  const check = (error: { message?: string } | null) => {
    if (error) syncFailed = true;
  };

  // Sync variants: delete removed, upsert the rest.
  const keepVariantIds = payload.variants.filter((v) => v.id).map((v) => v.id!);
  if (payload.id) {
    let del = supabase.from("product_variants").delete().eq("product_id", product.id);
    if (keepVariantIds.length > 0) {
      del = del.not("id", "in", `(${keepVariantIds.join(",")})`);
    }
    check((await del).error);
  }
  for (const [i, v] of payload.variants.entries()) {
    if (!v.name?.trim() || !Number.isFinite(Number(v.price))) continue;
    const vRow = {
      product_id: product.id,
      name: v.name.trim(),
      price: Number(v.price),
      compare_at_price: v.compare_at_price ? Number(v.compare_at_price) : null,
      stock:
        v.stock === null || v.stock === undefined || `${v.stock}` === ""
          ? null
          : Math.max(0, Math.floor(Number(v.stock))),
      sort_order: i,
      is_active: v.is_active !== false,
    };
    check(
      v.id
        ? (await supabase.from("product_variants").update(vRow).eq("id", v.id)).error
        : (await supabase.from("product_variants").insert(vRow)).error
    );
  }

  // Sync custom fields.
  const keepFieldIds = payload.fields.filter((f) => f.id).map((f) => f.id!);
  if (payload.id) {
    let del = supabase.from("product_fields").delete().eq("product_id", product.id);
    if (keepFieldIds.length > 0) {
      del = del.not("id", "in", `(${keepFieldIds.join(",")})`);
    }
    check((await del).error);
  }
  for (const [i, f] of payload.fields.entries()) {
    if (!f.label?.trim()) continue;
    const fRow = {
      product_id: product.id,
      label: f.label.trim(),
      field_type: f.field_type ?? "text",
      placeholder: f.placeholder?.trim() || null,
      options: f.options ?? [],
      required: f.required !== false,
      sort_order: i,
    };
    check(
      f.id
        ? (await supabase.from("product_fields").update(fRow).eq("id", f.id)).error
        : (await supabase.from("product_fields").insert(fRow)).error
    );
  }

  // Sync add-ons (delete removed, upsert the rest) — same pattern as variants.
  const keepAddonIds = (payload.addons ?? []).filter((a) => a.id).map((a) => a.id!);
  if (payload.id) {
    let del = supabase.from("product_addons").delete().eq("product_id", product.id);
    if (keepAddonIds.length > 0) {
      del = del.not("id", "in", `(${keepAddonIds.join(",")})`);
    }
    check((await del).error);
  }
  for (const [i, a] of (payload.addons ?? []).entries()) {
    if (!a.name?.trim()) continue;
    const aRow = {
      product_id: product.id,
      name: a.name.trim(),
      description: a.description?.trim() || null,
      price: Number.isFinite(Number(a.price)) ? Number(a.price) : 0,
      sort_order: i,
      // Respect an explicit inactive flag instead of forcing every add-on active.
      is_active: a.is_active !== false,
    };
    check(
      a.id
        ? (await supabase.from("product_addons").update(aRow).eq("id", a.id)).error
        : (await supabase.from("product_addons").insert(aRow)).error
    );
  }

  await audit(payload.id ? "product.update" : "product.create", "product", product.id, {
    name: row.name,
  });
  refreshStore();
  revalidatePath("/admin/products");
  if (syncFailed) {
    return {
      ok: true,
      message:
        "Product saved, but some options/fields/add-ons didn't save. Re-check them.",
      id: product.id,
    };
  }
  return ok("Product saved.", product.id);
}

export async function duplicateProduct(formData: FormData): Promise<AdminResult> {
  try {
    await requireCapability("manage_products");
  } catch {
    return fail("Unauthorized");
  }
  const id = String(formData.get("id") ?? "");
  const supabase = await actionDb();
  const { data: src } = await supabase
    .from("products")
    .select("*, variants:product_variants(*), fields:product_fields(*), addons:product_addons(*)")
    .eq("id", id)
    .maybeSingle();
  if (!src) return fail("Product not found.");

  const baseRow = {
    game_id: src.game_id,
    category_id: src.category_id,
    name: `${src.name} (copy)`,
    description: src.description,
    image_url: src.image_url,
    base_price: src.base_price,
    compare_at_price: src.compare_at_price,
    delivery_type: src.delivery_type,
    delivery_instructions: src.delivery_instructions,
    stock: src.stock,
    is_active: false, // saved as a hidden draft
    is_featured: false,
    sort_order: src.sort_order,
    pricing_mode: src.pricing_mode,
    custom_unit_label: src.custom_unit_label,
    custom_price_per_unit: src.custom_price_per_unit,
    custom_min: src.custom_min,
    custom_max: src.custom_max,
    custom_step: src.custom_step,
  };

  let created: { id: string } | null = null;
  for (let attempt = 0; attempt < 5; attempt++) {
    const slug = slugify(`${src.slug}-copy${attempt > 0 ? `-${attempt + 1}` : ""}`);
    const { data, error } = await supabase
      .from("products")
      .insert({ ...baseRow, slug })
      .select("id")
      .single();
    if (!error && data) {
      created = data;
      break;
    }
    if (error?.code !== "23505") {
      return fail(error?.message ?? "Could not duplicate.");
    }
  }
  if (!created) return fail("Could not generate a unique slug.");

  for (const [i, v] of (src.variants ?? []).entries()) {
    await supabase.from("product_variants").insert({
      product_id: created.id,
      name: v.name,
      price: v.price,
      compare_at_price: v.compare_at_price,
      stock: v.stock,
      sort_order: i,
      is_active: v.is_active,
    });
  }
  for (const [i, f] of (src.fields ?? []).entries()) {
    await supabase.from("product_fields").insert({
      product_id: created.id,
      label: f.label,
      field_type: f.field_type,
      placeholder: f.placeholder,
      options: f.options ?? [],
      required: f.required,
      sort_order: i,
    });
  }
  for (const [i, a] of (src.addons ?? []).entries()) {
    await supabase.from("product_addons").insert({
      product_id: created.id,
      name: a.name,
      description: a.description,
      price: a.price,
      image_url: a.image_url,
      sort_order: i,
      is_active: a.is_active,
    });
  }

  await audit("product.duplicate", "product", created.id, { from: id });
  refreshStore();
  revalidatePath("/admin/products");
  return ok("Product duplicated — saved as a hidden draft.", created.id);
}

export async function deleteProduct(formData: FormData): Promise<AdminResult> {
  try {
    await requireCapability("manage_products");
  } catch {
    return fail("Unauthorized");
  }
  const id = String(formData.get("id") ?? "");
  const supabase = await actionDb();
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) return fail(error.message);
  await audit("product.delete", "product", id);
  refreshStore();
  return ok("Product deleted.");
}

/* ───────────────────────── Orders ───────────────────────── */

const ORDER_STATUSES = [
  "pending",
  "paid",
  "processing",
  "completed",
  "cancelled",
  "refunded",
];

export async function updateOrderStatus(formData: FormData): Promise<AdminResult> {
  try {
    await requireCapability("manage_orders");
  } catch {
    return fail("Unauthorized");
  }
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!ORDER_STATUSES.includes(status)) return fail("Invalid status.");
  const supabase = await actionDb();
  const { data: existing } = await supabase
    .from("orders")
    .select("status, email, reference, order_number, total, currency")
    .eq("id", id)
    .maybeSingle();
  if (!existing) return fail("Order not found.");
  const { error } = await supabase
    .from("orders")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return fail(error.message);

  // Email the customer about the change (best effort, only on a real change).
  let emailResult: SendResult | null = null;
  if (existing.email && existing.status !== status) {
    const ref = existing.reference ?? `#${existing.order_number}`;
    emailResult = await sendEmail({
      to: existing.email,
      subject: orderStatusSubject(ref, status),
      html: orderStatusEmail({
        orderNumber: ref,
        status,
        total: Number(existing.total),
        currency: existing.currency,
      }),
    });
  }
  await audit("order.status", "order", id, { status, email: emailResult });

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${id}`);
  const note =
    emailResult && !emailResult.ok ? ` (email not sent: ${emailResult.error})` : "";
  return ok(`Order marked ${status}.${note}`);
}

export async function refundOrder(formData: FormData): Promise<AdminResult> {
  try {
    await requireCapability("issue_refunds");
  } catch {
    return fail("You don't have permission to issue refunds.");
  }
  if (!stripeConfigured()) return fail("Stripe is not configured.");
  const id = String(formData.get("id") ?? "");
  const supabase = await actionDb();
  const { data: order } = await supabase
    .from("orders")
    .select("status, stripe_payment_intent, email, reference, order_number, total, currency")
    .eq("id", id)
    .maybeSingle();
  if (!order) return fail("Order not found.");
  if (order.status === "refunded") return fail("This order is already refunded.");
  if (!order.stripe_payment_intent) {
    return fail("No Stripe payment found to refund.");
  }

  try {
    await getStripe().refunds.create({
      payment_intent: order.stripe_payment_intent,
    });
  } catch (e) {
    console.error("Stripe refund failed:", e);
    return fail(e instanceof Error ? e.message : "Refund failed at Stripe.");
  }

  await supabase
    .from("orders")
    .update({ status: "refunded", updated_at: new Date().toISOString() })
    .eq("id", id);

  const ref = order.reference ?? `#${order.order_number}`;
  let emailResult: SendResult | null = null;
  if (order.email) {
    emailResult = await sendEmail({
      to: order.email,
      subject: orderStatusSubject(ref, "refunded"),
      html: orderStatusEmail({
        orderNumber: ref,
        status: "refunded",
        total: Number(order.total),
        currency: order.currency,
      }),
    });
  }
  await audit("order.refund", "order", id, {
    amount: order.total,
    currency: order.currency,
    email: emailResult,
  });
  await notifyDiscord({
    title: `Order ${ref} refunded`,
    fields: [
      {
        name: "Amount",
        value: formatMoney(Number(order.total), order.currency),
        inline: true,
      },
    ],
    color: 0xfbbf24,
  });

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${id}`);
  const note = emailResult?.ok
    ? " Customer was emailed."
    : emailResult
      ? ` (email not sent: ${emailResult.error})`
      : "";
  return ok(`Refund issued.${note}`);
}

export async function deliverOrderItem(formData: FormData): Promise<AdminResult> {
  try {
    await requireCapability("manage_orders");
  } catch {
    return fail("Unauthorized");
  }
  const itemId = String(formData.get("item_id") ?? "");
  const payload = String(formData.get("payload") ?? "").trim();
  if (!payload) return fail("Delivery message cannot be empty.");

  const supabase = await actionDb();
  const { data: item, error } = await supabase
    .from("order_items")
    .update({ delivered_payload: payload, delivered_at: new Date().toISOString() })
    .eq("id", itemId)
    .select("order_id, product_name")
    .single();
  if (error || !item) return fail(error?.message ?? "Item not found.");

  // Complete the order if every item is now delivered.
  const { data: siblings } = await supabase
    .from("order_items")
    .select("delivered_at")
    .eq("order_id", item.order_id);
  if ((siblings ?? []).every((s) => s.delivered_at !== null)) {
    await supabase
      .from("orders")
      .update({ status: "completed", updated_at: new Date().toISOString() })
      .eq("id", item.order_id);
  }

  // Notify the customer their item is ready (Resend) — best effort.
  const { data: order } = await supabase
    .from("orders")
    .select("order_number, reference, email")
    .eq("id", item.order_id)
    .maybeSingle();
  if (order?.email) {
    const orderRef = order.reference ?? `#${order.order_number}`;
    await sendEmail({
      to: order.email,
      subject: `Your Zeuservices order ${orderRef} is ready`,
      html: orderDeliveredEmail({
        orderNumber: orderRef,
        productName: item.product_name,
        payload,
      }),
    });
  }

  await audit("order.deliver_item", "order_item", itemId);
  revalidatePath(`/admin/orders/${item.order_id}`);
  revalidatePath("/admin/orders");
  return ok("Item delivered.");
}

/* ───────────────────────── Reviews ──────────────────────── */

export async function moderateReview(formData: FormData): Promise<AdminResult> {
  try {
    await requireCapability("manage_reviews");
  } catch {
    return fail("Unauthorized");
  }
  const id = String(formData.get("id") ?? "");
  const op = String(formData.get("op") ?? "");
  const supabase = await actionDb();

  if (op === "delete") {
    const { error } = await supabase.from("reviews").delete().eq("id", id);
    if (error) return fail(error.message);
  } else if (op === "approve" || op === "unapprove") {
    const { error } = await supabase
      .from("reviews")
      .update({ is_approved: op === "approve" })
      .eq("id", id);
    if (error) return fail(error.message);
  } else if (op === "feature" || op === "unfeature") {
    const { error } = await supabase
      .from("reviews")
      .update({ is_featured: op === "feature" })
      .eq("id", id);
    if (error) return fail(error.message);
  } else if (op === "reply") {
    const reply = String(formData.get("reply") ?? "").trim();
    const { error } = await supabase
      .from("reviews")
      .update({ admin_reply: reply || null })
      .eq("id", id);
    if (error) return fail(error.message);
  } else {
    return fail("Unknown operation.");
  }

  await audit(`review.${op}`, "review", id);
  revalidatePath("/admin/reviews");
  revalidatePath("/reviews");
  revalidatePath("/");
  return ok("Review updated.");
}

/* ────────────────────────── Blog ────────────────────────── */

export async function upsertPost(formData: FormData): Promise<AdminResult> {
  let profile;
  try {
    profile = await requireCapability("manage_blog");
  } catch {
    return fail("Unauthorized");
  }
  const id = String(formData.get("id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return fail("Title is required.");
  const isPublished = formData.get("is_published") === "on";
  const row: Record<string, unknown> = {
    title,
    slug: slugify(String(formData.get("slug") ?? "") || title),
    excerpt: String(formData.get("excerpt") ?? "").trim() || null,
    content: String(formData.get("content") ?? ""),
    image_url: String(formData.get("image_url") ?? "") || null,
    tags: String(formData.get("tags") ?? "")
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean),
    is_published: isPublished,
    updated_at: new Date().toISOString(),
  };
  if (!id) row.author_id = profile.id;

  const supabase = await actionDb();

  // Stamp published_at only on the FIRST transition to published — never
  // re-stamp on later edits, or the public blog order and SEO dates churn.
  if (isPublished) {
    let firstPublish = true;
    if (id) {
      const { data: existing } = await supabase
        .from("blog_posts")
        .select("published_at")
        .eq("id", id)
        .maybeSingle();
      if (existing?.published_at) firstPublish = false;
    }
    if (firstPublish) row.published_at = new Date().toISOString();
  }
  const query = id
    ? supabase.from("blog_posts").update(row).eq("id", id).select("id").single()
    : supabase.from("blog_posts").insert(row).select("id").single();
  const { data, error } = await query;
  if (error) {
    return fail(error.code === "23505" ? "Slug already exists." : error.message);
  }
  await audit(id ? "post.update" : "post.create", "blog_post", data.id, { title });
  revalidatePath("/blog");
  revalidatePath("/admin/blog");
  return ok("Post saved.", data.id);
}

export async function deletePost(formData: FormData): Promise<AdminResult> {
  try {
    await requireCapability("manage_blog");
  } catch {
    return fail("Unauthorized");
  }
  const id = String(formData.get("id") ?? "");
  const supabase = await actionDb();
  const { error } = await supabase.from("blog_posts").delete().eq("id", id);
  if (error) return fail(error.message);
  await audit("post.delete", "blog_post", id);
  revalidatePath("/blog");
  revalidatePath("/admin/blog");
  return ok("Post deleted.");
}

/* ────────────────────────── FAQs ────────────────────────── */

export async function upsertFaq(formData: FormData): Promise<AdminResult> {
  try {
    await requireCapability("manage_faqs");
  } catch {
    return fail("Unauthorized");
  }
  const id = String(formData.get("id") ?? "");
  const question = String(formData.get("question") ?? "").trim();
  const answer = String(formData.get("answer") ?? "").trim();
  if (!question || !answer) return fail("Question and answer are required.");
  const row = {
    question,
    answer,
    category: String(formData.get("category") ?? "General").trim() || "General",
    sort_order: Number(formData.get("sort_order") ?? 0) || 0,
    is_active: formData.get("is_active") === "on",
  };
  const supabase = await actionDb();
  const { error } = id
    ? await supabase.from("faqs").update(row).eq("id", id)
    : await supabase.from("faqs").insert(row);
  if (error) return fail(error.message);
  await audit(id ? "faq.update" : "faq.create", "faq", id || null);
  revalidatePath("/faq");
  revalidatePath("/admin/faqs");
  revalidatePath("/");
  return ok("FAQ saved.");
}

export async function deleteFaq(formData: FormData): Promise<AdminResult> {
  try {
    await requireCapability("manage_faqs");
  } catch {
    return fail("Unauthorized");
  }
  const id = String(formData.get("id") ?? "");
  const supabase = await actionDb();
  const { error } = await supabase.from("faqs").delete().eq("id", id);
  if (error) return fail(error.message);
  revalidatePath("/faq");
  revalidatePath("/admin/faqs");
  return ok("FAQ deleted.");
}

/* ──────────────────────── Site pages ─────────────────────── */

/** Update an editable site page (terms/privacy/refunds). Pages are a fixed
 *  set seeded by migration — this edits content/title only, never creates. */
export async function savePage(formData: FormData): Promise<AdminResult> {
  try {
    await requireCapability("manage_pages");
  } catch {
    return fail("Unauthorized");
  }
  const slug = String(formData.get("slug") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const content = String(formData.get("content") ?? "").trim();
  if (!slug) return fail("Missing page slug.");
  if (!title) return fail("Title is required.");
  if (!content) return fail("Content is required.");
  const supabase = await actionDb();
  const { data, error } = await supabase
    .from("pages")
    .update({ title, content })
    .eq("slug", slug)
    .select("slug")
    .maybeSingle();
  if (error) return fail(error.message);
  if (!data) {
    return fail(
      "Page not found — run migration 0013_editable_pages.sql on this database first."
    );
  }
  await audit("page.update", "page", slug, { title });
  revalidatePath(`/${slug}`);
  revalidatePath("/admin/pages");
  refreshStore();
  return ok("Page saved.");
}

/* ──────────────────────── Giveaways ─────────────────────── */

export async function upsertGiveaway(formData: FormData): Promise<AdminResult> {
  try {
    await requireCapability("manage_giveaways");
  } catch {
    return fail("Unauthorized");
  }
  const id = String(formData.get("id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const prize = String(formData.get("prize") ?? "").trim();
  const endsAt = String(formData.get("ends_at") ?? "");
  if (!title || !prize || !endsAt) {
    return fail("Title, prize and end date are required.");
  }
  const endsDate = new Date(endsAt);
  if (Number.isNaN(endsDate.getTime())) return fail("Invalid end date.");
  const slug = resolveSlug(id, String(formData.get("slug") ?? ""), title);
  const row = {
    title,
    ...(slug !== undefined ? { slug } : {}),
    description: String(formData.get("description") ?? "").trim() || null,
    image_url: String(formData.get("image_url") ?? "") || null,
    prize,
    ends_at: endsDate.toISOString(),
    requirement_text: String(formData.get("requirement_text") ?? "").trim() || null,
    is_active: formData.get("is_active") === "on",
  };
  const supabase = await actionDb();
  const query = id
    ? supabase.from("giveaways").update(row).eq("id", id).select("id").single()
    : supabase.from("giveaways").insert(row).select("id").single();
  const { data, error } = await query;
  if (error) {
    return fail(error.code === "23505" ? "Slug already exists." : error.message);
  }
  await audit(id ? "giveaway.update" : "giveaway.create", "giveaway", data.id, { title });
  revalidatePath("/giveaways");
  revalidatePath("/admin/giveaways");
  revalidatePath("/");
  return ok("Giveaway saved.", data.id);
}

export async function deleteGiveaway(formData: FormData): Promise<AdminResult> {
  try {
    await requireCapability("manage_giveaways");
  } catch {
    return fail("Unauthorized");
  }
  const id = String(formData.get("id") ?? "");
  const supabase = await actionDb();
  const { error } = await supabase.from("giveaways").delete().eq("id", id);
  if (error) return fail(error.message);
  revalidatePath("/giveaways");
  revalidatePath("/admin/giveaways");
  return ok("Giveaway deleted.");
}

export async function pickGiveawayWinner(formData: FormData): Promise<AdminResult> {
  try {
    await requireCapability("manage_giveaways");
  } catch {
    return fail("Unauthorized");
  }
  const id = String(formData.get("id") ?? "");
  const supabase = await actionDb();
  // Count first, then draw a single random entry by offset — so the draw is
  // fair across ALL entries, not just the first page PostgREST would return.
  const { count } = await supabase
    .from("giveaway_entries")
    .select("id", { count: "exact", head: true })
    .eq("giveaway_id", id);
  if (!count || count === 0) return fail("No entries yet.");

  const offset = Math.floor(Math.random() * count);
  const { data: winnerRows } = await supabase
    .from("giveaway_entries")
    .select("user_id")
    .eq("giveaway_id", id)
    .order("id")
    .range(offset, offset);
  const winner = winnerRows?.[0];
  if (!winner) return fail("Could not draw a winner — try again.");

  const { error } = await supabase
    .from("giveaways")
    .update({ winner_user_id: winner.user_id, is_active: false })
    .eq("id", id);
  if (error) return fail(error.message);

  await audit("giveaway.winner", "giveaway", id, { winner: winner.user_id });
  await notifyDiscord({
    title: "Giveaway winner drawn",
    description: `A winner has been selected from ${count} entries.`,
    color: 0xfbbf24,
  });
  revalidatePath("/giveaways");
  revalidatePath("/admin/giveaways");
  return ok(`Winner drawn from ${count} entries.`);
}

/* ───────────────────────── Tickets ──────────────────────── */

export async function updateTicketMeta(formData: FormData): Promise<AdminResult> {
  try {
    await requireCapability("manage_support");
  } catch {
    return fail("Unauthorized");
  }
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  const priority = String(formData.get("priority") ?? "");
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (["open", "answered", "closed"].includes(status)) updates.status = status;
  if (["low", "normal", "high"].includes(priority)) updates.priority = priority;

  const supabase = await actionDb();
  const { error } = await supabase.from("support_tickets").update(updates).eq("id", id);
  if (error) return fail(error.message);
  revalidatePath("/admin/support");
  revalidatePath(`/admin/support/${id}`);
  return ok("Ticket updated.");
}

/* ──────────────────────── Sections ──────────────────────── */

const SECTION_KINDS = [
  "hero",
  "categories",
  "featured_products",
  "games",
  "stats",
  "reviews",
  "faq",
  "steps",
  "cta_banner",
  "discord",
  "giveaway",
  "rich_text",
];

export async function upsertSection(formData: FormData): Promise<AdminResult> {
  try {
    await requireCapability("manage_layout");
  } catch {
    return fail("Unauthorized");
  }
  const id = String(formData.get("id") ?? "");
  const kind = String(formData.get("kind") ?? "");
  if (!SECTION_KINDS.includes(kind)) return fail("Invalid section type.");
  let content: Record<string, unknown> = {};
  const contentRaw = String(formData.get("content") ?? "").trim();
  if (contentRaw) {
    try {
      content = JSON.parse(contentRaw);
    } catch {
      return fail("Content must be valid JSON.");
    }
  }
  const supabase = await actionDb();

  if (id) {
    const { error } = await supabase
      .from("site_sections")
      .update({
        kind,
        title: String(formData.get("title") ?? "").trim() || null,
        subtitle: String(formData.get("subtitle") ?? "").trim() || null,
        content,
      })
      .eq("id", id);
    if (error) return fail(error.message);
  } else {
    const { data: maxRow } = await supabase
      .from("site_sections")
      .select("sort_order")
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();
    const { error } = await supabase.from("site_sections").insert({
      kind,
      title: String(formData.get("title") ?? "").trim() || null,
      subtitle: String(formData.get("subtitle") ?? "").trim() || null,
      content,
      sort_order: (maxRow?.sort_order ?? 0) + 1,
      is_active: true,
    });
    if (error) return fail(error.message);
  }
  await audit(id ? "section.update" : "section.create", "site_section", id || null, { kind });
  refreshStore();
  return ok("Section saved.");
}

export async function moveSection(formData: FormData): Promise<AdminResult> {
  try {
    await requireCapability("manage_layout");
  } catch {
    return fail("Unauthorized");
  }
  const id = String(formData.get("id") ?? "");
  const dir = String(formData.get("dir") ?? "up");
  const supabase = await actionDb();
  const { data: sections } = await supabase
    .from("site_sections")
    .select("id, sort_order")
    .order("sort_order");
  if (!sections) return fail("No sections.");
  const idx = sections.findIndex((s) => s.id === id);
  const swapIdx = dir === "up" ? idx - 1 : idx + 1;
  if (idx < 0 || swapIdx < 0 || swapIdx >= sections.length) {
    return fail("Can't move further.");
  }
  const a = sections[idx];
  const b = sections[swapIdx];
  await supabase.from("site_sections").update({ sort_order: b.sort_order }).eq("id", a.id);
  await supabase.from("site_sections").update({ sort_order: a.sort_order }).eq("id", b.id);
  refreshStore();
  return ok("Moved.");
}

export async function toggleSection(formData: FormData): Promise<AdminResult> {
  try {
    await requireCapability("manage_layout");
  } catch {
    return fail("Unauthorized");
  }
  const id = String(formData.get("id") ?? "");
  const supabase = await actionDb();
  const { data: section } = await supabase
    .from("site_sections")
    .select("is_active")
    .eq("id", id)
    .maybeSingle();
  if (!section) return fail("Not found.");
  await supabase
    .from("site_sections")
    .update({ is_active: !section.is_active })
    .eq("id", id);
  refreshStore();
  return ok(section.is_active ? "Section hidden." : "Section visible.");
}

export async function deleteSection(formData: FormData): Promise<AdminResult> {
  try {
    await requireCapability("manage_layout");
  } catch {
    return fail("Unauthorized");
  }
  const id = String(formData.get("id") ?? "");
  const supabase = await actionDb();
  const { error } = await supabase.from("site_sections").delete().eq("id", id);
  if (error) return fail(error.message);
  refreshStore();
  return ok("Section deleted.");
}

/* ──────────────────────── Settings ──────────────────────── */

// Settings keys that must NEVER be writable through the generic settings form.
// `bootstrap_admin_emails` is read by the signup trigger to auto-grant
// super_admin — letting a plain `admin` (who holds manage_settings by default)
// write it would be a privilege-escalation path to super_admin. Privileged
// settings are managed by super admins only, out of band.
const RESERVED_SETTING_KEYS = new Set(["bootstrap_admin_emails"]);

export async function saveSettings(formData: FormData): Promise<AdminResult> {
  try {
    await requireCapability("manage_settings");
  } catch {
    return fail("Unauthorized");
  }
  const supabase = await actionDb();
  for (const [key, value] of formData.entries()) {
    if (!key.startsWith("setting_")) continue;
    const settingKey = key.slice("setting_".length);
    if (RESERVED_SETTING_KEYS.has(settingKey)) continue; // never editable here
    const { error } = await supabase
      .from("site_settings")
      .upsert({ key: settingKey, value: String(value), updated_at: new Date().toISOString() });
    if (error) return fail(`${settingKey}: ${error.message}`);
  }
  await audit("settings.update", "site_settings", null);
  refreshStore();
  return ok("Settings saved.");
}

export async function saveRates(formData: FormData): Promise<AdminResult> {
  try {
    await requireCapability("manage_settings");
  } catch {
    return fail("Unauthorized");
  }
  const supabase = await actionDb();
  for (const [key, value] of formData.entries()) {
    if (!key.startsWith("rate_")) continue;
    const code = key.slice("rate_".length).toUpperCase();
    const rate = Number(value);
    if (!Number.isFinite(rate) || rate <= 0) return fail(`Invalid rate for ${code}.`);
    const { error } = await supabase
      .from("exchange_rates")
      .update({ rate, updated_at: new Date().toISOString() })
      .eq("code", code);
    if (error) return fail(error.message);
  }
  await audit("rates.update", "exchange_rates", null);
  refreshStore();
  return ok("Exchange rates saved.");
}

/* ─────────────────────── Team / users ───────────────────── */

const ASSIGNABLE_ROLES: Role[] = ["customer", "support", "admin", "super_admin"];

export async function setUserRole(formData: FormData): Promise<AdminResult> {
  let actor;
  try {
    actor = await requireCapability("manage_team");
  } catch {
    return fail("Only super admins can manage roles.");
  }
  const userId = String(formData.get("user_id") ?? "");
  const role = String(formData.get("role") ?? "") as Role;
  if (!ASSIGNABLE_ROLES.includes(role)) return fail("Invalid role.");
  if (userId === actor.id) return fail("You can't change your own role.");

  const supabase = await actionDb();
  const { error } = await supabase.from("profiles").update({ role }).eq("id", userId);
  if (error) return fail(error.message);
  await audit("user.role", "profile", userId, { role });
  revalidatePath("/admin/team");
  revalidatePath("/admin/customers");
  return ok(`Role updated to ${role}.`);
}

export async function inviteUser(formData: FormData): Promise<AdminResult> {
  try {
    await requireCapability("manage_team");
  } catch {
    return fail("Only super admins can invite users.");
  }
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(email)) return fail("Enter a valid email address.");
  if (!hasAdminClient()) {
    return fail("Invites aren't configured (missing service role key).");
  }

  const db = createAdminClient();
  const { error } = await db.auth.admin.inviteUserByEmail(email, {
    // Land invitees on the set-password page (they have no password yet).
    redirectTo: siteUrl("/auth/callback?next=/reset-password"),
  });
  if (error) {
    return fail(
      error.message.toLowerCase().includes("already")
        ? "That email already has an account."
        : error.message
    );
  }
  await audit("user.invite", "profile", null, { email });
  revalidatePath("/admin/team");
  return ok(`Invite sent to ${email}.`);
}

export async function toggleBan(formData: FormData): Promise<AdminResult> {
  let actor;
  try {
    actor = await requireCapability("manage_customers");
  } catch {
    return fail("Unauthorized");
  }
  const userId = String(formData.get("user_id") ?? "");
  if (userId === actor.id) return fail("You can't ban yourself.");
  const supabase = await actionDb();
  const { data: target } = await supabase
    .from("profiles")
    .select("is_banned, role")
    .eq("id", userId)
    .maybeSingle();
  if (!target) return fail("User not found.");
  // Only super admins may ban ANY staff member (support included). Writes now
  // run through the service role, so the DB trigger no longer backs this up —
  // this in-action check is the sole guard, and must cover every staff tier.
  if (STAFF_ROLES.includes(target.role as Role) && actor.role !== "super_admin") {
    return fail("Only super admins can ban staff.");
  }
  const { error } = await supabase
    .from("profiles")
    .update({ is_banned: !target.is_banned })
    .eq("id", userId);
  if (error) return fail(error.message);
  await audit(target.is_banned ? "user.unban" : "user.ban", "profile", userId);
  revalidatePath("/admin/customers");
  return ok(target.is_banned ? "User unbanned." : "User banned.");
}

export async function setUserCapabilities(
  formData: FormData
): Promise<AdminResult> {
  let actor;
  try {
    actor = await requireCapability("manage_team");
  } catch {
    return fail("Only super admins can manage permissions.");
  }
  const userId = String(formData.get("user_id") ?? "");
  if (userId === actor.id) {
    return fail("You can't change your own permissions.");
  }

  const raw = String(formData.get("capabilities") ?? "");
  // The sentinel resets to role defaults (null); otherwise an explicit set,
  // sanitised against the known list. manage_team is never grantable here.
  let capabilities: Capability[] | null;
  if (raw === CAPABILITIES_DEFAULT) {
    capabilities = null;
  } else {
    capabilities = raw
      .split(",")
      .map((c) => c.trim())
      .filter(
        (c): c is Capability =>
          (ALL_CAPABILITIES as string[]).includes(c) && c !== "manage_team"
      );
  }

  const supabase = await actionDb();
  const { data: target } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();
  if (!target) return fail("User not found.");
  if (target.role === "super_admin") {
    return fail("Super admins already have full access.");
  }
  if (!["support", "admin"].includes(target.role)) {
    return fail("Promote the user to staff before setting permissions.");
  }

  const { error } = await supabase
    .from("profiles")
    .update({ capabilities })
    .eq("id", userId);
  if (error) return fail(error.message);

  await audit("user.capabilities", "profile", userId, { capabilities });
  revalidatePath("/admin/team");
  return ok(capabilities === null ? "Reset to role defaults." : "Permissions updated.");
}
