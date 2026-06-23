-- Zeuservices — shopping cart.
-- Hybrid model: guests keep their cart in localStorage; signed-in users get a
-- DB-backed cart so it persists across devices. One row per cart line.
-- (Custom fields make lines distinct, so identical product+variant lines only
-- merge when both have empty custom_fields — handled in the app.)
create table if not exists zeus.cart_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references zeus.products(id) on delete cascade,
  variant_id uuid references zeus.product_variants(id) on delete cascade,
  quantity int not null default 1 check (quantity > 0 and quantity <= 99),
  custom_fields jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists cart_items_user_idx on zeus.cart_items (user_id);

alter table zeus.cart_items enable row level security;

-- A user can only ever see or touch their own cart rows. No staff/admin access
-- needed — carts are private and transient.
drop policy if exists cart_items_select_own on zeus.cart_items;
create policy cart_items_select_own on zeus.cart_items
  for select using (auth.uid() = user_id);

drop policy if exists cart_items_insert_own on zeus.cart_items;
create policy cart_items_insert_own on zeus.cart_items
  for insert with check (auth.uid() = user_id);

drop policy if exists cart_items_update_own on zeus.cart_items;
create policy cart_items_update_own on zeus.cart_items
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists cart_items_delete_own on zeus.cart_items;
create policy cart_items_delete_own on zeus.cart_items
  for delete using (auth.uid() = user_id);
