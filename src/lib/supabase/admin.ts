import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_URL } from "@/lib/config";

// Service-role client — bypasses RLS. Server only. Used by trusted code
// paths that act without a user context (Stripe webhooks, checkout).
export function createAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured");
  }
  return createSupabaseClient(SUPABASE_URL, key, {
    db: { schema: "zeus" },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function hasAdminClient() {
  return Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
}

/**
 * Client for admin server actions to perform writes with, AFTER the action has
 * authorized the actor with `requireCapability(...)`.
 *
 * Why not the RLS-scoped user client? RLS write policies key on the coarse
 * ROLE (is_admin/is_staff), so they cannot express the granular per-staff
 * capability model: a `support` user granted `manage_products` would pass the
 * action guard but have their write silently rejected by RLS. Once the action
 * has verified the capability, the service role makes that capability the true
 * boundary. Falls back to the RLS user client if no service key is configured
 * (degrades to role-based behaviour rather than failing outright).
 */
export async function actionDb() {
  if (hasAdminClient()) return createAdminClient();
  const { createClient } = await import("./server");
  return createClient();
}
