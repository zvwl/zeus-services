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
