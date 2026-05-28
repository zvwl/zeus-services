-- ── Fix 1: update_eldorado_sellers_timestamp ─────────────────────────────────
-- Missing SET search_path — mutable search_path lets an attacker create objects
-- in another schema that shadow built-ins the function uses.
CREATE OR REPLACE FUNCTION public.update_eldorado_sellers_timestamp()
RETURNS TRIGGER LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- ── Fix 2: get_discord_id ────────────────────────────────────────────────────
-- Any authenticated user could call /rest/v1/rpc/get_discord_id with any UUID
-- and retrieve another user's Discord ID. Only service_role (edge functions) needs this.
REVOKE EXECUTE ON FUNCTION public.get_discord_id(uuid) FROM authenticated;

-- ── Fix 3: get_user_email ────────────────────────────────────────────────────
-- Internal admin check referenced public.profiles which does not exist in this
-- database, so the guard was always failing for admins. Switch to admin_users.
-- Keep EXECUTE for authenticated because admin_actions_with_names view needs it.
CREATE OR REPLACE FUNCTION public.get_user_email(user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NOT (
    current_setting('request.jwt.claims', true)::jsonb->>'role' = 'service_role'
    OR EXISTS (
      SELECT 1 FROM public.admin_users au
      WHERE au.user_id = auth.uid()
        AND au.active = true
    )
  ) THEN
    RAISE EXCEPTION 'Permission denied';
  END IF;
  RETURN (SELECT email FROM auth.users WHERE id = user_id);
END;
$$;
