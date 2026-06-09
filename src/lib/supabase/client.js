import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// DEV ONLY: set NEXT_PUBLIC_DEV_ADMIN_BYPASS=true and
// NEXT_PUBLIC_DEV_SUPABASE_SERVICE_ROLE_KEY=<your service role key> in .env.local
// to bypass auth and RLS in local development. NEVER set these in production.
const isDevBypass = process.env.NEXT_PUBLIC_DEV_ADMIN_BYPASS === 'true'
const devServiceKey = process.env.NEXT_PUBLIC_DEV_SUPABASE_SERVICE_ROLE_KEY
const activeKey = (isDevBypass && devServiceKey) ? devServiceKey : supabaseAnonKey

export const supabase = createBrowserClient(supabaseUrl, activeKey, {
  auth: {
    persistSession: !isDevBypass,
    detectSessionInUrl: !isDevBypass,
    autoRefreshToken: !isDevBypass,
  },
})

export const isDevBypassActive = isDevBypass

// Returns the best available auth token for edge function calls.
// In dev bypass mode returns the service role key so edge functions accept the request.
export const getAuthToken = async () => {
  if (isDevBypass && devServiceKey) return devServiceKey
  const { data: { session } } = await supabase.auth.getSession()
  return session?.access_token || null
}
