-- Zeuservices — RLS performance pass (clears the Supabase advisor warnings on
-- zeus.* tables without changing who can do what).
--
-- Two classes of warning are fixed here:
--
-- 1. multiple_permissive_policies: every catalog table paired a public
--    "<t>_select" policy with an "<t>_admin FOR ALL" policy. Because FOR ALL
--    includes SELECT, each authenticated SELECT evaluated BOTH policies (and the
--    admin one calls zeus.is_admin() — a subquery — per row). We split every
--    FOR ALL admin policy into explicit INSERT/UPDATE/DELETE policies so SELECT
--    is covered by exactly one policy again.
--
-- 2. auth_rls_initplan: the four zeus.cart_items policies (added in 0008) used
--    bare auth.uid(), re-evaluated per row. We wrap them as (select auth.uid())
--    like every other zeus policy, and scope them "to authenticated".
--
-- We also wrap the STABLE helper calls (zeus.is_staff()/zeus.is_admin()) in a
-- scalar subselect in the read policies so they evaluate once per statement
-- instead of once per row. Admin WRITES are unaffected functionally: they run
-- through the service role (actionDb), which bypasses RLS entirely.

-- Helper: replace a "<t>_admin FOR ALL" policy with split write policies.
do $$
declare
  t record;
begin
  for t in
    select unnest(array[
      'categories','games','products','product_variants','product_fields',
      'exchange_rates','blog_posts','faqs','giveaways','site_sections','pages'
    ]) as tbl,
    unnest(array[
      'categories_admin','games_admin','products_admin','variants_admin','fields_admin',
      'rates_admin','blog_admin','faqs_admin','giveaways_admin','sections_admin','pages_admin'
    ]) as pol
  loop
    execute format('drop policy if exists %I on zeus.%I', t.pol, t.tbl);
    execute format($f$create policy %I on zeus.%I for insert to authenticated with check ((select zeus.is_admin()))$f$, t.pol||'_insert', t.tbl);
    execute format($f$create policy %I on zeus.%I for update to authenticated using ((select zeus.is_admin())) with check ((select zeus.is_admin()))$f$, t.pol||'_update', t.tbl);
    execute format($f$create policy %I on zeus.%I for delete to authenticated using ((select zeus.is_admin()))$f$, t.pol||'_delete', t.tbl);
  end loop;
end $$;

-- product_addons: its FOR ALL policy also omitted "to authenticated", which made
-- it apply to every role (anon, authenticator, ...) and produced extra lints.
drop policy if exists product_addons_admin_all on zeus.product_addons;
create policy product_addons_admin_insert on zeus.product_addons for insert to authenticated with check ((select zeus.is_admin()));
create policy product_addons_admin_update on zeus.product_addons for update to authenticated using ((select zeus.is_admin())) with check ((select zeus.is_admin()));
create policy product_addons_admin_delete on zeus.product_addons for delete to authenticated using ((select zeus.is_admin()));

-- site_settings: preserve the bootstrap-key guard from 0011 in every write policy.
drop policy if exists settings_admin on zeus.site_settings;
create policy settings_admin_insert on zeus.site_settings for insert to authenticated
  with check ((select zeus.is_admin()) and (key <> 'bootstrap_admin_emails' or (select zeus.is_super_admin())));
create policy settings_admin_update on zeus.site_settings for update to authenticated
  using ((select zeus.is_admin()) and (key <> 'bootstrap_admin_emails' or (select zeus.is_super_admin())))
  with check ((select zeus.is_admin()) and (key <> 'bootstrap_admin_emails' or (select zeus.is_super_admin())));
create policy settings_admin_delete on zeus.site_settings for delete to authenticated
  using ((select zeus.is_admin()) and (key <> 'bootstrap_admin_emails' or (select zeus.is_super_admin())));

-- Re-create the public read policies wrapping the helper call as an InitPlan.
drop policy if exists categories_select on zeus.categories;
create policy categories_select on zeus.categories for select using (is_active or (select zeus.is_staff()));
drop policy if exists games_select on zeus.games;
create policy games_select on zeus.games for select using (is_active or (select zeus.is_staff()));
drop policy if exists products_select on zeus.products;
create policy products_select on zeus.products for select using (is_active or (select zeus.is_staff()));
drop policy if exists variants_select on zeus.product_variants;
create policy variants_select on zeus.product_variants for select using (is_active or (select zeus.is_staff()));
drop policy if exists faqs_select on zeus.faqs;
create policy faqs_select on zeus.faqs for select using (is_active or (select zeus.is_staff()));
drop policy if exists blog_select on zeus.blog_posts;
create policy blog_select on zeus.blog_posts for select using (is_published or (select zeus.is_staff()));
drop policy if exists sections_select on zeus.site_sections;
create policy sections_select on zeus.site_sections for select using (is_active or (select zeus.is_staff()));
drop policy if exists product_addons_public_read on zeus.product_addons;
create policy product_addons_public_read on zeus.product_addons for select using (is_active or (select zeus.is_staff()));
drop policy if exists settings_select on zeus.site_settings;
create policy settings_select on zeus.site_settings for select using (key <> 'bootstrap_admin_emails' or (select zeus.is_staff()));
drop policy if exists donations_select on zeus.donations;
create policy donations_select on zeus.donations for select using (status = 'completed' or (select zeus.is_staff()));

-- cart_items: wrap auth.uid() and scope to authenticated (guests never hit the DB cart).
drop policy if exists cart_items_select_own on zeus.cart_items;
create policy cart_items_select_own on zeus.cart_items for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists cart_items_insert_own on zeus.cart_items;
create policy cart_items_insert_own on zeus.cart_items for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists cart_items_update_own on zeus.cart_items;
create policy cart_items_update_own on zeus.cart_items for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists cart_items_delete_own on zeus.cart_items;
create policy cart_items_delete_own on zeus.cart_items for delete to authenticated using ((select auth.uid()) = user_id);

notify pgrst, 'reload config';
