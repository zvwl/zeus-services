// Publishable Supabase credentials (safe to ship to the browser — security
// is enforced by Row Level Security). Environment variables always win; these
// fallbacks keep fresh deployments working before env vars are set. `||` (not
// `??`) so an env var explicitly set to an EMPTY string also falls back rather
// than producing an invalid client ("supabaseKey is required").
export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://xdvbhungoadwlmeddelt.supabase.co";

export const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhkdmJodW5nb2Fkd2xtZWRkZWx0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4NDk0ODMsImV4cCI6MjA4NDQyNTQ4M30.K-40dY0-q-XFRT2wEyLQyXGRLnjDuOG0W0Q_S8pK20E";
