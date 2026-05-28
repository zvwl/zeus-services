-- Supabase is changing the default: after October 30 2026, new tables in
-- the public schema won't have implicit grants. This migration makes all
-- grants explicit so the site keeps working regardless of that change.

-- Schema-level usage (required so roles can see the schema at all)
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- ── Publicly browsable tables (no login required) ──────────────────────────
GRANT SELECT ON public.games              TO anon, authenticated;
GRANT SELECT ON public.categories         TO anon, authenticated;
GRANT SELECT ON public.items              TO anon, authenticated;
GRANT SELECT ON public.items_with_details TO anon, authenticated;
GRANT SELECT ON public.reviews            TO anon, authenticated;
GRANT SELECT ON public.status_announcements TO anon, authenticated;

-- Orders: anon needs SELECT for post-checkout lookup by session_id
GRANT SELECT              ON public.orders TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.orders TO authenticated;

-- ── Admin-writable tables (RLS restricts to admins; grant is still required) ─
GRANT SELECT, INSERT, UPDATE, DELETE ON public.games               TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.categories          TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.items               TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reviews             TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.status_announcements TO authenticated;

-- ── User-owned tables ────────────────────────────────────────────────────────
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customers TO authenticated;

-- Checkout sessions: anon needed for guest checkout
GRANT SELECT, INSERT ON public.checkout_sessions TO anon, authenticated;

-- Sessions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sessions TO authenticated;

-- ── Admin-only tables (RLS enforces; grant makes them accessible to the API) ─
GRANT SELECT                           ON public.admin_users             TO authenticated;
GRANT SELECT, INSERT                   ON public.admin_actions           TO authenticated;
GRANT SELECT                           ON public.admin_actions_with_names TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE   ON public.eldorado_sellers        TO authenticated;

-- ── Service role: needs full access for edge functions / triggers ───────────
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;

-- ── Future-proof: grant on any sequence objects too ─────────────────────────
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
