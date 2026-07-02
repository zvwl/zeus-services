-- ─────────────────────────────────────────────────────────────────────────
-- Zeuservices — security hardening + correctness fixes (audit follow-up)
-- Idempotent: safe to re-run. Apply with `execute_sql` / `supabase db query`.
-- ─────────────────────────────────────────────────────────────────────────

-- 1) Homepage sections: allow the "How it works" (steps) and CTA banner kinds
--    that the app already renders but the original CHECK constraint rejected.
alter table zeus.site_sections drop constraint if exists site_sections_kind_check;
alter table zeus.site_sections
  add constraint site_sections_kind_check check (kind in (
    'hero','categories','featured_products','games','stats','reviews',
    'faq','steps','cta_banner','discord','giveaway','rich_text'
  ));

-- 2) One-time bootstrap. Previously ANY signup whose email was in
--    site_settings.bootstrap_admin_emails became super_admin — a permanent,
--    repeatable escalation path if that setting were ever writable. Now the
--    auto-grant only fires while NO super_admin exists yet (true bootstrap).
create or replace function zeus.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  bootstrap jsonb;
  new_role text := 'customer';
  uname text;
  is_discord boolean;
  has_super boolean;
begin
  select exists (select 1 from zeus.profiles where role = 'super_admin')
    into has_super;
  if not has_super then
    select value into bootstrap from zeus.site_settings
      where key = 'bootstrap_admin_emails';
    if bootstrap is not null and new.email is not null
       and bootstrap ? lower(new.email) then
      new_role := 'super_admin';
    end if;
  end if;

  uname := coalesce(
    new.raw_user_meta_data->>'username',
    new.raw_user_meta_data->>'user_name',
    new.raw_user_meta_data->>'preferred_username',
    new.raw_user_meta_data->>'full_name',
    split_part(coalesce(new.email, 'user'), '@', 1)
  );
  uname := left(regexp_replace(uname, '[^a-zA-Z0-9_]', '_', 'g'), 20);
  is_discord := (new.raw_app_meta_data->>'provider') = 'discord';

  begin
    insert into zeus.profiles (id, email, username, avatar_url, role, discord_id, discord_username)
    values (
      new.id, new.email, uname,
      new.raw_user_meta_data->>'avatar_url', new_role,
      case when is_discord then new.raw_user_meta_data->>'provider_id' end,
      case when is_discord then new.raw_user_meta_data->>'full_name' end
    )
    on conflict (id) do nothing;
  exception when unique_violation then
    insert into zeus.profiles (id, email, username, avatar_url, role)
    values (
      new.id, new.email,
      left(uname, 14) || '_' || substr(md5(random()::text), 1, 4),
      new.raw_user_meta_data->>'avatar_url', new_role
    )
    on conflict (id) do nothing;
  end;
  return new;
end;
$$;

-- 3) Defense in depth: even a (non-super) admin must not be able to write the
--    bootstrap_admin_emails setting via the Data API. Restrict that one key to
--    super admins; all other settings stay admin-writable.
drop policy if exists "settings_admin" on zeus.site_settings;
create policy "settings_admin" on zeus.site_settings for all to authenticated
  using (
    zeus.is_admin()
    and (key <> 'bootstrap_admin_emails' or zeus.is_super_admin())
  )
  with check (
    zeus.is_admin()
    and (key <> 'bootstrap_admin_emails' or zeus.is_super_admin())
  );

-- 4) Atomic stock decrements (used at fulfillment). A single UPDATE per call is
--    row-locked, so concurrent paid orders serialise instead of racing on a
--    read-then-write, and stock can never go negative. SECURITY DEFINER +
--    pinned search_path; execute is limited to the service role (the schema's
--    default grants would otherwise expose these to anon/authenticated).
create or replace function zeus.decrement_stock(p_id uuid, p_qty int)
returns void language sql security definer set search_path = '' as $$
  update zeus.products
     set stock = greatest(0, stock - p_qty)
   where id = p_id and stock is not null;
$$;

create or replace function zeus.decrement_variant_stock(v_id uuid, p_qty int)
returns void language sql security definer set search_path = '' as $$
  update zeus.product_variants
     set stock = greatest(0, stock - p_qty)
   where id = v_id and stock is not null;
$$;

revoke all on function zeus.decrement_stock(uuid, int) from public, anon, authenticated;
revoke all on function zeus.decrement_variant_stock(uuid, int) from public, anon, authenticated;
grant execute on function zeus.decrement_stock(uuid, int) to service_role;
grant execute on function zeus.decrement_variant_stock(uuid, int) to service_role;

-- 5) Donor wall privacy: the public completed-donations feed must not expose
--    the donor's user_id or Stripe session id. Narrow the anon role's column
--    access to display-safe fields only (RLS still limits rows to completed).
revoke select on zeus.donations from anon;
grant select (id, name, message, amount, currency, status, created_at)
  on zeus.donations to anon;

notify pgrst, 'reload config';
