-- CRITICAL security fix — profile privilege-escalation.
--
-- zeus.protect_profile_fields() was declared SECURITY DEFINER, so `current_user`
-- inside it resolved to the function OWNER (postgres) rather than the PostgREST
-- request role. The privileged-role bypass at the top therefore fired for EVERY
-- caller, and the role / capabilities / is_banned guards below it never ran —
-- the trigger was inert. Combined with a column-unrestricted profiles UPDATE
-- policy and table-level UPDATE granted to `authenticated`, any signed-in
-- customer could PATCH their own profiles row to role='super_admin' straight
-- through the Data API and take over the admin panel.
--
-- Fix 1: recreate the function as SECURITY INVOKER (drop `security definer`) so
--        current_user reflects the real request role. 'authenticated'/'anon'
--        fall through to the guards; service_role/postgres still hit the bypass.
-- Fix 2 (defense in depth): revoke table-level UPDATE from anon/authenticated and
--        re-grant only the three display columns a user is allowed to edit.
--        Everything sensitive is writable only via the service role (admin
--        actions and trusted server paths already use it).
create or replace function zeus.protect_profile_fields()
 returns trigger
 language plpgsql
 set search_path to ''
as $function$
begin
  if current_user in ('postgres','service_role','supabase_admin','supabase_auth_admin') then
    return new;
  end if;
  if new.role is distinct from old.role and not zeus.is_super_admin() then
    raise exception 'Only super admins can change roles';
  end if;
  if new.capabilities is distinct from old.capabilities and not zeus.is_super_admin() then
    raise exception 'Only super admins can change capabilities';
  end if;
  if new.is_banned is distinct from old.is_banned and not zeus.is_admin() then
    raise exception 'Only admins can change ban status';
  end if;
  return new;
end;
$function$;

revoke update on zeus.profiles from anon, authenticated;
grant update (username, avatar_url, preferred_currency) on zeus.profiles to authenticated;

notify pgrst, 'reload config';
