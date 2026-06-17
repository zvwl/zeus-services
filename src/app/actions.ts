"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getProfile, getUser } from "@/lib/auth";
import { notifyDiscord } from "@/lib/discord";

export interface ActionResult {
  ok: boolean;
  message: string;
}

/** Customers with at least one paid order can leave reviews. */
export async function submitReview(formData: FormData): Promise<ActionResult> {
  const user = await getUser();
  if (!user) return { ok: false, message: "Please log in to leave a review." };

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

  await supabase.from("ticket_messages").insert({
    ticket_id: ticket.id,
    sender_id: user.id,
    is_staff: false,
    message,
  });

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

  const ticketId = String(formData.get("ticket_id") ?? "");
  const message = String(formData.get("message") ?? "").slice(0, 4000).trim();
  if (!ticketId || message.length < 1) {
    return { ok: false, message: "Message cannot be empty." };
  }

  const staff = ["support", "admin", "super_admin"].includes(profile.role);
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
  const staff = ["support", "admin", "super_admin"].includes(profile.role);

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
