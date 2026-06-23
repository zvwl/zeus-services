"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient, hasAdminClient } from "@/lib/supabase/admin";
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

async function audit(
  action: string,
  entity: string,
  entityId: string | null,
  meta: Record<string, unknown> = {}
) {
  try {
    const profile = await getProfile();
    const supabase = await createClient();
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
  const row = {
    name,
    slug: slugify(String(formData.get("slug") ?? "") || name),
    description: String(formData.get("description") ?? "").trim() || null,
    image_url: String(formData.get("image_url") ?? "") || null,
    banner_url: String(formData.get("banner_url") ?? "") || null,
    is_active: formData.get("is_active") === "on",
    is_featured: formData.get("is_featured") === "on",
    sort_order: Number(formData.get("sort_order") ?? 0) || 0,
  };
  const supabase = await createClient();
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
  const supabase = await createClient();
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
  const row = {
    name,
    slug: slugify(String(formData.get("slug") ?? "") || name),
    description: String(formData.get("description") ?? "").trim() || null,
    icon: String(formData.get("icon") ?? "").trim() || null,
    sort_order: Number(formData.get("sort_order") ?? 0) || 0,
    is_active: formData.get("is_active") === "on",
  };
  const supabase = await createClient();
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
  const supabase = await createClient();
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

  const supabase = await createClient();
  const row = {
    game_id: payload.game_id,
    category_id: payload.category_id,
    name: payload.name.trim(),
    slug: slugify(payload.slug || payload.name),
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
    sort_order: Number(payload.sort_order ?? 0) || 0,
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

  // Sync variants: delete removed, upsert the rest.
  const keepVariantIds = payload.variants.filter((v) => v.id).map((v) => v.id!);
  if (payload.id) {
    let del = supabase.from("product_variants").delete().eq("product_id", product.id);
    if (keepVariantIds.length > 0) {
      del = del.not("id", "in", `(${keepVariantIds.join(",")})`);
    }
    await del;
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
    if (v.id) {
      await supabase.from("product_variants").update(vRow).eq("id", v.id);
    } else {
      await supabase.from("product_variants").insert(vRow);
    }
  }

  // Sync custom fields.
  const keepFieldIds = payload.fields.filter((f) => f.id).map((f) => f.id!);
  if (payload.id) {
    let del = supabase.from("product_fields").delete().eq("product_id", product.id);
    if (keepFieldIds.length > 0) {
      del = del.not("id", "in", `(${keepFieldIds.join(",")})`);
    }
    await del;
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
    if (f.id) {
      await supabase.from("product_fields").update(fRow).eq("id", f.id);
    } else {
      await supabase.from("product_fields").insert(fRow);
    }
  }

  await audit(payload.id ? "product.update" : "product.create", "product", product.id, {
    name: row.name,
  });
  refreshStore();
  return ok("Product saved.", product.id);
}

export async function deleteProduct(formData: FormData): Promise<AdminResult> {
  try {
    await requireCapability("manage_products");
  } catch {
    return fail("Unauthorized");
  }
  const id = String(formData.get("id") ?? "");
  const supabase = await createClient();
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
  const supabase = await createClient();
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
  const supabase = await createClient();
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
    title: `↩️ Order ${ref} refunded`,
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

  const supabase = await createClient();
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
      subject: `Your Zeuservices order ${orderRef} is ready 🎉`,
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
  const supabase = await createClient();

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
  if (isPublished) row.published_at = new Date().toISOString();
  if (!id) row.author_id = profile.id;

  const supabase = await createClient();
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
  const supabase = await createClient();
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
    is_active: formData.get("is_active") !== "off",
  };
  const supabase = await createClient();
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
  const supabase = await createClient();
  const { error } = await supabase.from("faqs").delete().eq("id", id);
  if (error) return fail(error.message);
  revalidatePath("/faq");
  revalidatePath("/admin/faqs");
  return ok("FAQ deleted.");
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
  const row = {
    title,
    slug: slugify(String(formData.get("slug") ?? "") || title),
    description: String(formData.get("description") ?? "").trim() || null,
    image_url: String(formData.get("image_url") ?? "") || null,
    prize,
    ends_at: new Date(endsAt).toISOString(),
    requirement_text: String(formData.get("requirement_text") ?? "").trim() || null,
    is_active: formData.get("is_active") === "on",
  };
  const supabase = await createClient();
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
  const supabase = await createClient();
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
  const supabase = await createClient();
  const { data: entries } = await supabase
    .from("giveaway_entries")
    .select("user_id")
    .eq("giveaway_id", id);
  if (!entries || entries.length === 0) return fail("No entries yet.");

  const winner = entries[Math.floor(Math.random() * entries.length)];
  const { error } = await supabase
    .from("giveaways")
    .update({ winner_user_id: winner.user_id, is_active: false })
    .eq("id", id);
  if (error) return fail(error.message);

  await audit("giveaway.winner", "giveaway", id, { winner: winner.user_id });
  await notifyDiscord({
    title: "🏆 Giveaway winner drawn",
    description: `A winner has been selected from ${entries.length} entries.`,
    color: 0xfbbf24,
  });
  revalidatePath("/giveaways");
  revalidatePath("/admin/giveaways");
  return ok(`Winner drawn from ${entries.length} entries.`);
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

  const supabase = await createClient();
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
  const supabase = await createClient();

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
  const supabase = await createClient();
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
  const supabase = await createClient();
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
  const supabase = await createClient();
  const { error } = await supabase.from("site_sections").delete().eq("id", id);
  if (error) return fail(error.message);
  refreshStore();
  return ok("Section deleted.");
}

/* ──────────────────────── Settings ──────────────────────── */

export async function saveSettings(formData: FormData): Promise<AdminResult> {
  try {
    await requireCapability("manage_settings");
  } catch {
    return fail("Unauthorized");
  }
  const supabase = await createClient();
  for (const [key, value] of formData.entries()) {
    if (!key.startsWith("setting_")) continue;
    const settingKey = key.slice("setting_".length);
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
  const supabase = await createClient();
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

  const supabase = await createClient();
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
  const supabase = await createClient();
  const { data: target } = await supabase
    .from("profiles")
    .select("is_banned, role")
    .eq("id", userId)
    .maybeSingle();
  if (!target) return fail("User not found.");
  if (["admin", "super_admin"].includes(target.role) && actor.role !== "super_admin") {
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

  const supabase = await createClient();
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
