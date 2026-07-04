import { createAdminClient, hasAdminClient } from "@/lib/supabase/admin";

/**
 * Claims any guest orders (user_id IS NULL) whose email matches a now-signed-in
 * user, so purchases made before creating an account show up in their order
 * history. Idempotent and best-effort — never throws into the caller.
 *
 * Uses the service role because the orders UPDATE RLS policy is staff-only and
 * guest rows aren't visible to the user's own session.
 */
export async function attachGuestOrders(
  userId: string,
  email: string | null | undefined
): Promise<void> {
  if (!userId || !email || !hasAdminClient()) return;
  try {
    const db = createAdminClient();
    // Escape LIKE metacharacters so an address containing "_" or "%" can't match
    // (and thus claim) other people's guest orders. ilike keeps the match
    // case-insensitive, which is how email is compared everywhere else.
    const escaped = email.replace(/([\\%_])/g, "\\$1");
    await db
      .from("orders")
      .update({ user_id: userId })
      .is("user_id", null)
      .ilike("email", escaped);
  } catch {
    // best effort
  }
}
