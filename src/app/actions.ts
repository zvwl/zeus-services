"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient, hasAdminClient } from "@/lib/supabase/admin";
import { can, getProfile, getUser } from "@/lib/auth";
import { notifyDiscord } from "@/lib/discord";

/**
 * Removes the signed-in user's leftover UNVERIFIED 2FA factors (from a cancelled
 * enrollment). Done with the admin API so it doesn't fire the user-facing
 * "MFA factor removed" email that a normal unenroll would.
 */
export async function cleanupUnverifiedMfa(): Promise<void> {
  const user = await getUser();
  if (!user || !hasAdminClient()) return;
  try {
    const db = createAdminClient();
    const { data } = await db.auth.admin.mfa.listFactors({ userId: user.id });
    for (const factor of data?.factors ?? []) {
      if (factor.status === "unverified") {
        await db.auth.admin.mfa.deleteFactor({ id: factor.id, userId: user.id });
      }
    }
  } catch {
    // best effort
  }
}

export interface ActionResult {
  ok: boolean;
  message: string;
}

/** Blocks banned accounts from taking write actions across the site. Returns
 *  an error result if suspended, otherwise null. */
async function banGuard(): Promise<ActionResult | null> {
  const profile = await getProfile();
  if (profile?.is_banned) {
    return { ok: false, message: "Your account is suspended. Contact support." };
  }
  return null;
}

/** Customers who bought the product can leave one review for it. */
export async function submitReview(formData: FormData): Promise<ActionResult> {
  const user = await getUser();
  if (!user) return { ok: false, message: "Please log in to leave a review." };
  const banned = await banGuard();
  if (banned) return banned;

  const rating = Math.floor(Number(formData.get("rating")));
  const title = String(formData.get("title") ?? "").slice(0, 120).trim();
  const content = String(formData.get("content") ?? "").slice(0, 2000).trim();
  const productId = String(formData.get("product_id") ?? "").trim() || null;

  if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
    return { ok: false, message: "Please pick a star rating." };
  }
  if (content.length < 10) {
    return { ok: false, message: "Review must be at least 10 characters." };
  }

  const supabase = await createClient();

  // Verify a completed purchase. For a product review, require that this user
  // actually bought THAT product (not merely any order).
  if (productId) {
    const { count: purchased } = await supabase
      .from("order_items")
      .select("id, orders!inner(user_id, status)", { count: "exact", head: true })
      .eq("product_id", productId)
      .eq("orders.user_id", user.id)
      .in("orders.status", ["paid", "processing", "completed"]);
    if (!purchased) {
      return {
        ok: false,
        message: "You can only review products you've purchased.",
      };
    }
    // One review per product per customer.
    const { count: already } = await supabase
      .from("reviews")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("product_id", productId);
    if (already) {
      return { ok: false, message: "You've already reviewed this product." };
    }
  } else {
    const { count } = await supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .in("status", ["paid", "processing", "completed"]);
    if (!count) {
      return {
        ok: false,
        message: "Only customers with a completed purchase can leave reviews.",
      };
    }
    // One general (non-product) review per customer.
    const { count: already } = await supabase
      .from("reviews")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .is("product_id", null);
    if (already) {
      return { ok: false, message: "You've already left a review — thank you!" };
    }
  }

  // Snapshot the username so reviews stay publicly displayable without
  // exposing the profiles table.
  const { data: profile } = await supabase
    .from("profiles")
    .select("username, avatar_url")
    .eq("id", user.id)
    .maybeSingle();

  const { error } = await supabase.from("reviews").insert({
    user_id: user.id,
    author_name: profile?.username ?? null,
    author_avatar: profile?.avatar_url ?? null,
    product_id: productId,
    rating,
    title: title || null,
    content,
    is_approved: false,
    is_featured: false,
  });
  if (error) return { ok: false, message: "Could not submit review." };

  revalidatePath("/reviews");
  return {
    ok: true,
    message: "Thanks! Your review is pending approval by our team.",
  };
}

export async function createTicket(formData: FormData): Promise<ActionResult> {
  const user = await getUser();
  if (!user) return { ok: false, message: "Please log in to open a ticket." };
  const banned = await banGuard();
  if (banned) return banned;

  const subject = String(formData.get("subject") ?? "").slice(0, 150).trim();
  const category = String(formData.get("category") ?? "General").slice(0, 50);
  const message = String(formData.get("message") ?? "").slice(0, 4000).trim();
  if (subject.length < 3) return { ok: false, message: "Subject is too short." };
  if (message.length < 10) return { ok: false, message: "Message is too short." };

  const supabase = await createClient();
  const { data: ticket, error } = await supabase
    .from("support_tickets")
    .insert({ user_id: user.id, subject, category })
    .select("id, ticket_number")
    .single();
  if (error || !ticket) return { ok: false, message: "Could not open ticket." };

  const { error: msgError } = await supabase.from("ticket_messages").insert({
    ticket_id: ticket.id,
    sender_id: user.id,
    is_staff: false,
    message,
  });
  // The opening message is the whole point of the ticket — if it fails to save,
  // roll the empty ticket back rather than leaving a blank thread.
  if (msgError) {
    await supabase.from("support_tickets").delete().eq("id", ticket.id);
    return { ok: false, message: "Could not open ticket. Please try again." };
  }

  await notifyDiscord({
    title: `🎫 New support ticket #${ticket.ticket_number}`,
    description: subject,
    fields: [{ name: "Category", value: category, inline: true }],
    color: 0x38bdf8,
  });

  revalidatePath("/support");
  return { ok: true, message: `Ticket #${ticket.ticket_number} opened.` };
}

export async function replyToTicket(formData: FormData): Promise<ActionResult> {
  const profile = await getProfile();
  if (!profile) return { ok: false, message: "Please log in." };
  // Customers who are banned can't post; staff replies are unaffected.
  const staff = can(profile, "manage_support");
  if (!staff && profile.is_banned) {
    return { ok: false, message: "Your account is suspended. Contact support." };
  }

  const ticketId = String(formData.get("ticket_id") ?? "");
  const message = String(formData.get("message") ?? "").slice(0, 4000).trim();
  if (!ticketId || message.length < 1) {
    return { ok: false, message: "Message cannot be empty." };
  }

  const supabase = await createClient();

  const { data: ticket } = await supabase
    .from("support_tickets")
    .select("id, user_id, status, ticket_number")
    .eq("id", ticketId)
    .maybeSingle();
  if (!ticket) return { ok: false, message: "Ticket not found." };
  if (!staff && ticket.user_id !== profile.id) {
    return { ok: false, message: "Not your ticket." };
  }
  if (ticket.status === "closed") {
    return { ok: false, message: "This ticket is closed." };
  }

  const { error } = await supabase.from("ticket_messages").insert({
    ticket_id: ticketId,
    sender_id: profile.id,
    is_staff: staff,
    message,
  });
  if (error) return { ok: false, message: "Could not send reply." };

  await supabase
    .from("support_tickets")
    .update({
      status: staff ? "answered" : "open",
      updated_at: new Date().toISOString(),
    })
    .eq("id", ticketId);

  revalidatePath(`/support/${ticketId}`);
  revalidatePath(`/admin/support/${ticketId}`);
  return { ok: true, message: "Reply sent." };
}

export async function closeTicket(formData: FormData): Promise<ActionResult> {
  const profile = await getProfile();
  if (!profile) return { ok: false, message: "Please log in." };
  const ticketId = String(formData.get("ticket_id") ?? "");
  const staff = can(profile, "manage_support");

  const supabase = await createClient();
  const { data: ticket } = await supabase
    .from("support_tickets")
    .select("id, user_id")
    .eq("id", ticketId)
    .maybeSingle();
  if (!ticket) return { ok: false, message: "Ticket not found." };
  if (!staff && ticket.user_id !== profile.id) {
    return { ok: false, message: "Not your ticket." };
  }

  await supabase
    .from("support_tickets")
    .update({ status: "closed", updated_at: new Date().toISOString() })
    .eq("id", ticketId);
  revalidatePath(`/support/${ticketId}`);
  revalidatePath("/support");
  revalidatePath(`/admin/support/${ticketId}`);
  return { ok: true, message: "Ticket closed." };
}

export async function enterGiveaway(formData: FormData): Promise<ActionResult> {
  const user = await getUser();
  if (!user) return { ok: false, message: "Please log in to enter." };
  const banned = await banGuard();
  if (banned) return banned;

  const giveawayId = String(formData.get("giveaway_id") ?? "");
  const supabase = await createClient();

  const { data: giveaway } = await supabase
    .from("giveaways")
    .select("id, ends_at, is_active, slug")
    .eq("id", giveawayId)
    .maybeSingle();
  if (!giveaway || !giveaway.is_active) {
    return { ok: false, message: "This giveaway is not active." };
  }
  if (new Date(giveaway.ends_at) < new Date()) {
    return { ok: false, message: "This giveaway has ended." };
  }

  const { error } = await supabase
    .from("giveaway_entries")
    .insert({ giveaway_id: giveawayId, user_id: user.id });
  if (error) {
    if (error.code === "23505") {
      return { ok: false, message: "You've already entered this giveaway." };
    }
    return { ok: false, message: "Could not enter giveaway." };
  }

  revalidatePath(`/giveaways/${giveaway.slug}`);
  return { ok: true, message: "You're in! Good luck ⚡" };
}
