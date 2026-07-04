-- Zeuservices — foreign-key indexes, money/quantity CHECK constraints, and
-- small schema-hygiene fixes.

-- ── 1. Covering indexes for the 12 unindexed foreign keys ───────────────────
-- These back ON DELETE CASCADE/SET NULL fan-out (account & product deletion) and
-- the user-scoped filters used by RLS and hot queries.
create index if not exists audit_logs_actor_idx        on zeus.audit_logs (actor_id);
create index if not exists blog_posts_author_idx        on zeus.blog_posts (author_id);
create index if not exists cart_items_product_idx        on zeus.cart_items (product_id);
create index if not exists cart_items_variant_idx        on zeus.cart_items (variant_id);
create index if not exists donations_user_idx            on zeus.donations (user_id);
create index if not exists giveaway_entries_user_idx     on zeus.giveaway_entries (user_id);
create index if not exists giveaways_winner_idx          on zeus.giveaways (winner_user_id);
create index if not exists order_items_product_idx       on zeus.order_items (product_id);
create index if not exists order_items_variant_idx       on zeus.order_items (variant_id);
create index if not exists reviews_user_idx              on zeus.reviews (user_id);
create index if not exists support_tickets_user_idx      on zeus.support_tickets (user_id);
create index if not exists ticket_messages_sender_idx    on zeus.ticket_messages (sender_id);

-- ── 2. Range constraints on money & quantity ────────────────────────────────
-- The database is the last line of defence for a payments business; admin writes
-- go through the service role and bypass all app-side validation. Preflight
-- confirmed the production data already satisfies these.
alter table zeus.products
  add constraint products_base_price_nonneg      check (base_price >= 0) not valid,
  add constraint products_compare_price_nonneg   check (compare_at_price is null or compare_at_price >= 0) not valid,
  add constraint products_stock_nonneg           check (stock is null or stock >= 0) not valid,
  add constraint products_custom_price_sane       check (custom_price_per_unit is null or custom_price_per_unit > 0) not valid,
  add constraint products_custom_bounds_sane      check (
        (custom_min is null or custom_min >= 0)
    and (custom_max is null or custom_min is null or custom_max >= custom_min)
    and (custom_step is null or custom_step > 0)
  ) not valid;
alter table zeus.products validate constraint products_base_price_nonneg;
alter table zeus.products validate constraint products_compare_price_nonneg;
alter table zeus.products validate constraint products_stock_nonneg;
alter table zeus.products validate constraint products_custom_price_sane;
alter table zeus.products validate constraint products_custom_bounds_sane;

alter table zeus.product_variants
  add constraint variants_price_nonneg check (price >= 0) not valid,
  add constraint variants_stock_nonneg check (stock is null or stock >= 0) not valid;
alter table zeus.product_variants validate constraint variants_price_nonneg;
alter table zeus.product_variants validate constraint variants_stock_nonneg;

alter table zeus.product_addons
  add constraint addons_price_nonneg check (price >= 0) not valid;
alter table zeus.product_addons validate constraint addons_price_nonneg;

alter table zeus.orders
  add constraint orders_totals_nonneg       check (subtotal_usd >= 0 and total >= 0) not valid,
  add constraint orders_exchange_rate_pos   check (exchange_rate > 0) not valid;
alter table zeus.orders validate constraint orders_totals_nonneg;
alter table zeus.orders validate constraint orders_exchange_rate_pos;

alter table zeus.order_items
  add constraint order_items_prices_nonneg check (unit_price >= 0 and unit_price_usd >= 0) not valid;
alter table zeus.order_items validate constraint order_items_prices_nonneg;

alter table zeus.donations
  add constraint donations_amount_pos check (amount > 0) not valid;
alter table zeus.donations validate constraint donations_amount_pos;

alter table zeus.exchange_rates
  add constraint rates_rate_pos check (rate > 0) not valid;
alter table zeus.exchange_rates validate constraint rates_rate_pos;

-- ── 3. Schema hygiene ───────────────────────────────────────────────────────
-- orders.reference is always generated at insert time and was backfilled in
-- 0006; enforce it so an order can never exist without a customer-quotable ref.
alter table zeus.orders alter column reference set not null;

-- support_tickets has updated_at but (unlike every other zeus table) no trigger,
-- so "order by updated_at desc" on /support relied on every writer remembering
-- to set it manually. Add the standard trigger.
drop trigger if exists zeus_tickets_updated on zeus.support_tickets;
create trigger zeus_tickets_updated before update on zeus.support_tickets
  for each row execute function zeus.set_updated_at();

-- ── 4. Storage bucket hard limits ───────────────────────────────────────────
-- The 4 MB / raster-only rule lived only in the upload API route, which a
-- signed-in user can bypass by calling storage directly with their JWT. Pin the
-- limits on the buckets so they hold on every upload path.
update storage.buckets
  set file_size_limit = 4194304,
      allowed_mime_types = array['image/png','image/jpeg','image/webp','image/gif']
  where id in ('zeus-avatars','zeus-assets');
