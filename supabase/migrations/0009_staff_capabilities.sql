-- Zeuservices — granular staff capabilities.
-- Per-staff permission override on profiles. NULL = use the role's default
-- capabilities; an explicit array = exactly those capabilities. Only meaningful
-- for support/admin (super_admin always has everything). `manage_team` stays
-- super-admin-only and is never granted to a lower role (enforced in the app).
alter table zeus.profiles
  add column if not exists capabilities text[] default null;

-- Extend the privilege-escalation guard so only super admins can change a
-- profile's capabilities (mirrors how role changes are already protected).
-- Without this, a staff member with a permissive profiles UPDATE policy could
-- self-grant capabilities via the API.
create or replace function zeus.protect_profile_fields()
 returns trigger
 language plpgsql
 security definer
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
