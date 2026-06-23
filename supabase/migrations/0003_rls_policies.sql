-- ─────────────────────────────────────────────────────────────────────────
-- Zeuservices — Row Level Security
-- Everything is locked down by default; service_role bypasses RLS.
-- ─────────────────────────────────────────────────────────────────────────

alter table zeus.profiles          enable row level security;
alter table zeus.categories        enable row level security;
alter table zeus.games             enable row level security;
alter table zeus.products          enable row level security;
alter table zeus.product_variants  enable row level security;
alter table zeus.product_fields    enable row level security;
alter table zeus.exchange_rates    enable row level security;
alter table zeus.orders            enable row level security;
alter table zeus.order_items       enable row level security;
alter table zeus.reviews           enable row level security;
alter table zeus.blog_posts        enable row level security;
alter table zeus.faqs              enable row level security;
alter table zeus.giveaways         enable row level security;
alter table zeus.giveaway_entries  enable row level security;
alter table zeus.support_tickets   enable row level security;
alter table zeus.ticket_messages   enable row level security;
alter table zeus.donations         enable row level security;
alter table zeus.site_sections     enable row level security;
alter table zeus.site_settings     enable row level security;
alter table zeus.audit_logs        enable row level security;

-- Profiles: users see/edit their own; staff see all; admins may moderate.
-- role / is_banned changes are additionally guarded by the trigger.
create policy "profiles_select" on zeus.profiles for select
  using (id = (select auth.uid()) or zeus.is_staff());
create policy "profiles_insert_own" on zeus.profiles for insert to authenticated
  with check (id = (select auth.uid()) and role = 'customer' and is_banned = false);
create policy "profiles_update" on zeus.profiles for update to authenticated
  using (id = (select auth.uid()) or zeus.is_admin())
  with check (id = (select auth.uid()) or zeus.is_admin());

-- Catalog: public read of active rows, admin write.
create policy "categories_select" on zeus.categories for select
  using (is_active or zeus.is_staff());
create policy "categories_admin" on zeus.categories for all to authenticated
  using (zeus.is_admin()) with check (zeus.is_admin());

create policy "games_select" on zeus.games for select
  using (is_active or zeus.is_staff());
create policy "games_admin" on zeus.games for all to authenticated
  using (zeus.is_admin()) with check (zeus.is_admin());

create policy "products_select" on zeus.products for select
  using (is_active or zeus.is_staff());
create policy "products_admin" on zeus.products for all to authenticated
  using (zeus.is_admin()) with check (zeus.is_admin());

create policy "variants_select" on zeus.product_variants for select
  using (is_active or zeus.is_staff());
create policy "variants_admin" on zeus.product_variants for all to authenticated
  using (zeus.is_admin()) with check (zeus.is_admin());

create policy "fields_select" on zeus.product_fields for select using (true);
create policy "fields_admin" on zeus.product_fields for all to authenticated
  using (zeus.is_admin()) with check (zeus.is_admin());

create policy "rates_select" on zeus.exchange_rates for select using (true);
create policy "rates_admin" on zeus.exchange_rates for all to authenticated
  using (zeus.is_admin()) with check (zeus.is_admin());

-- Orders: owners read their own; staff read & update all.
-- Order creation happens server-side with the service role only.
create policy "orders_select" on zeus.orders for select
  using (user_id = (select auth.uid()) or zeus.is_staff());
create policy "orders_staff_update" on zeus.orders for update to authenticated
  using (zeus.is_staff()) with check (zeus.is_staff());

create policy "order_items_select" on zeus.order_items for select
  using (
    zeus.is_staff()
    or exists (
      select 1 from zeus.orders o
      where o.id = order_id and o.user_id = (select auth.uid())
    )
  );
create policy "order_items_staff_update" on zeus.order_items for update to authenticated
  using (zeus.is_staff()) with check (zeus.is_staff());

-- Reviews: public read approved; owners read their own; verified customers
-- insert (forced unapproved); admins moderate.
create policy "reviews_select" on zeus.reviews for select
  using (is_approved or user_id = (select auth.uid()) or zeus.is_staff());
create policy "reviews_insert_own" on zeus.reviews for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and is_approved = false
    and is_featured = false
    and admin_reply is null
  );
create policy "reviews_admin_update" on zeus.reviews for update to authenticated
  using (zeus.is_admin()) with check (zeus.is_admin());
create policy "reviews_delete" on zeus.reviews for delete to authenticated
  using (user_id = (select auth.uid()) or zeus.is_admin());

-- Blog: public read published, admin write.
create policy "blog_select" on zeus.blog_posts for select
  using (is_published or zeus.is_staff());
create policy "blog_admin" on zeus.blog_posts for all to authenticated
  using (zeus.is_admin()) with check (zeus.is_admin());

create policy "faqs_select" on zeus.faqs for select
  using (is_active or zeus.is_staff());
create policy "faqs_admin" on zeus.faqs for all to authenticated
  using (zeus.is_admin()) with check (zeus.is_admin());

-- Giveaways: public read (incl. past ones), admin write.
create policy "giveaways_select" on zeus.giveaways for select using (true);
create policy "giveaways_admin" on zeus.giveaways for all to authenticated
  using (zeus.is_admin()) with check (zeus.is_admin());

-- Entries: users manage their own entry into live giveaways; counts are
-- exposed via the security-definer function instead of public reads.
create policy "entries_select" on zeus.giveaway_entries for select
  using (user_id = (select auth.uid()) or zeus.is_staff());
create policy "entries_insert_own" on zeus.giveaway_entries for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1 from zeus.giveaways g
      where g.id = giveaway_id and g.is_active and g.ends_at > now()
    )
  );
create policy "entries_admin_delete" on zeus.giveaway_entries for delete to authenticated
  using (zeus.is_admin());

-- Support tickets: owner + staff.
create policy "tickets_select" on zeus.support_tickets for select
  using (user_id = (select auth.uid()) or zeus.is_staff());
create policy "tickets_insert_own" on zeus.support_tickets for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy "tickets_update" on zeus.support_tickets for update to authenticated
  using (user_id = (select auth.uid()) or zeus.is_staff())
  with check (user_id = (select auth.uid()) or zeus.is_staff());

create policy "ticket_messages_select" on zeus.ticket_messages for select
  using (
    zeus.is_staff()
    or exists (
      select 1 from zeus.support_tickets t
      where t.id = ticket_id and t.user_id = (select auth.uid())
    )
  );
create policy "ticket_messages_insert" on zeus.ticket_messages for insert to authenticated
  with check (
    (zeus.is_staff() and is_staff = true)
    or (
      is_staff = false
      and sender_id = (select auth.uid())
      and exists (
        select 1 from zeus.support_tickets t
        where t.id = ticket_id and t.user_id = (select auth.uid())
      )
    )
  );

-- Donations: completed ones are public (donor wall); writes are server-side.
create policy "donations_select" on zeus.donations for select
  using (status = 'completed' or zeus.is_staff());

-- Site sections & settings: public read, admin write. The bootstrap admin
-- list is only visible to staff.
create policy "sections_select" on zeus.site_sections for select
  using (is_active or zeus.is_staff());
create policy "sections_admin" on zeus.site_sections for all to authenticated
  using (zeus.is_admin()) with check (zeus.is_admin());

create policy "settings_select" on zeus.site_settings for select
  using (key <> 'bootstrap_admin_emails' or zeus.is_staff());
create policy "settings_admin" on zeus.site_settings for all to authenticated
  using (zeus.is_admin()) with check (zeus.is_admin());

-- Audit log: staff write, staff read.
create policy "audit_select" on zeus.audit_logs for select
  using (zeus.is_staff());
create policy "audit_insert" on zeus.audit_logs for insert to authenticated
  with check (zeus.is_staff());
