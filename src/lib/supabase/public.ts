import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/config";

// Request-independent anon client for cached reads of PUBLIC data (site
// settings, exchange rates, categories, homepage sections). It uses no cookies
// or session, so it's safe to call inside unstable_cache (which runs outside
// the request scope). RLS still applies as an anonymous visitor.
export function createPublicClient() {
  return createSupabaseClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    db: { schema: "zeus" },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
