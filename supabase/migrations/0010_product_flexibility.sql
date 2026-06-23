-- Zeuservices — flexible listings: custom-amount pricing + add-on bundles.

-- 1) Custom-amount pricing mode. A product can be priced as "any amount × unit
--    price" via a slider, instead of fixed variants. pricing_mode 'fixed' keeps
--    the existing behaviour (base price / variants).
alter table zeus.products
  add column if not exists pricing_mode text not null default 'fixed'
    check (pricing_mode in ('fixed', 'custom')),
  add column if not exists custom_unit_label text,          -- e.g. "gold", "1,000 V-Bucks"
  add column if not exists custom_price_per_unit numeric,   -- USD per unit
  add column if not exists custom_min numeric,              -- min units
  add column if not exists custom_max numeric,              -- max units
  add column if not exists custom_step numeric;             -- slider step

-- 2) Add-ons / bundle items a buyer can tack onto a product at checkout.
create table if not exists zeus.product_addons (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references zeus.products(id) on delete cascade,
  name text not null,
  description text,
  price numeric not null default 0,            -- USD
  image_url text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists product_addons_product_idx on zeus.product_addons (product_id);

alter table zeus.product_addons enable row level security;

drop policy if exists product_addons_public_read on zeus.product_addons;
create policy product_addons_public_read on zeus.product_addons
  for select using (is_active or zeus.is_staff());

drop policy if exists product_addons_admin_all on zeus.product_addons;
create policy product_addons_admin_all on zeus.product_addons
  for all using (zeus.is_admin()) with check (zeus.is_admin());

-- 3) Cart lines can now carry a chosen custom amount and selected add-ons.
--    Stored as a display snapshot; checkout always re-validates against the DB.
alter table zeus.cart_items
  add column if not exists extra jsonb not null default '{}'::jsonb;
