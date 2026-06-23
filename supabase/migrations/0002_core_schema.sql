-- ─────────────────────────────────────────────────────────────────────────
-- Zeuservices — core tables, helper functions and triggers
-- ─────────────────────────────────────────────────────────────────────────

create extension if not exists pgcrypto with schema extensions;

-- Profiles extend auth.users. role is the single source of truth for
-- admin access and is protected by a trigger below.
create table if not exists zeus.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  username text unique,
  avatar_url text,
  role text not null default 'customer'
    check (role in ('customer','support','admin','super_admin')),
  preferred_currency text not null default 'USD',
  discord_id text,
  discord_username text,
  is_banned boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists zeus.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  icon text,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists zeus.games (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  image_url text,
  banner_url text,
  is_active boolean not null default true,
  is_featured boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists zeus.products (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references zeus.games(id) on delete restrict,
  category_id uuid not null references zeus.categories(id) on delete restrict,
  name text not null,
  slug text not null unique,
  description text,
  image_url text,
  base_price numeric(10,2) not null default 0,
  compare_at_price numeric(10,2),
  delivery_type text not null default 'manual'
    check (delivery_type in ('instant','manual')),
  delivery_instructions text,
  stock int,
  is_active boolean not null default true,
  is_featured boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists products_game_idx on zeus.products (game_id);
create index if not exists products_category_idx on zeus.products (category_id);
create index if not exists products_active_idx on zeus.products (is_active, is_featured);

create table if not exists zeus.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references zeus.products(id) on delete cascade,
  name text not null,
  price numeric(10,2) not null,
  compare_at_price numeric(10,2),
  stock int,
  sort_order int not null default 0,
  is_active boolean not null default true
);
create index if not exists variants_product_idx on zeus.product_variants (product_id);

create table if not exists zeus.product_fields (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references zeus.products(id) on delete cascade,
  label text not null,
  field_type text not null default 'text'
    check (field_type in ('text','email','password','select','textarea')),
  placeholder text,
  options jsonb not null default '[]',
  required boolean not null default true,
  sort_order int not null default 0
);
create index if not exists fields_product_idx on zeus.product_fields (product_id);

create table if not exists zeus.exchange_rates (
  code text primary key,
  rate numeric(12,6) not null,
  symbol text not null default '$',
  label text not null default '',
  updated_at timestamptz not null default now()
);

create table if not exists zeus.orders (
  id uuid primary key default gen_random_uuid(),
  order_number bigint generated always as identity unique,
  user_id uuid references zeus.profiles(id) on delete set null,
  email text,
  status text not null default 'pending'
    check (status in ('pending','paid','processing','completed','cancelled','refunded')),
  currency text not null default 'USD',
  exchange_rate numeric(12,6) not null default 1,
  subtotal_usd numeric(10,2) not null default 0,
  total numeric(10,2) not null default 0,
  stripe_session_id text unique,
  stripe_payment_intent text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists orders_user_idx on zeus.orders (user_id);
create index if not exists orders_status_idx on zeus.orders (status);
create index if not exists orders_created_idx on zeus.orders (created_at);

create table if not exists zeus.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references zeus.orders(id) on delete cascade,
  product_id uuid references zeus.products(id) on delete set null,
  variant_id uuid references zeus.product_variants(id) on delete set null,
  product_name text not null,
  variant_name text,
  quantity int not null default 1 check (quantity > 0),
  unit_price numeric(10,2) not null,
  unit_price_usd numeric(10,2) not null,
  custom_fields jsonb not null default '{}',
  delivered_payload text,
  delivered_at timestamptz
);
create index if not exists order_items_order_idx on zeus.order_items (order_id);

create table if not exists zeus.reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references zeus.profiles(id) on delete cascade,
  author_name text,
  product_id uuid references zeus.products(id) on delete set null,
  rating int not null check (rating between 1 and 5),
  title text,
  content text not null,
  is_approved boolean not null default false,
  is_featured boolean not null default false,
  admin_reply text,
  created_at timestamptz not null default now()
);
create index if not exists reviews_product_idx on zeus.reviews (product_id);
create index if not exists reviews_approved_idx on zeus.reviews (is_approved);

create table if not exists zeus.blog_posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid references zeus.profiles(id) on delete set null,
  title text not null,
  slug text not null unique,
  excerpt text,
  content text not null default '',
  image_url text,
  tags text[] not null default '{}',
  is_published boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists zeus.faqs (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  answer text not null,
  category text not null default 'General',
  sort_order int not null default 0,
  is_active boolean not null default true
);

create table if not exists zeus.giveaways (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  description text,
  image_url text,
  prize text not null,
  ends_at timestamptz not null,
  is_active boolean not null default true,
  winner_user_id uuid references zeus.profiles(id) on delete set null,
  requirement_text text,
  created_at timestamptz not null default now()
);

create table if not exists zeus.giveaway_entries (
  id uuid primary key default gen_random_uuid(),
  giveaway_id uuid not null references zeus.giveaways(id) on delete cascade,
  user_id uuid not null references zeus.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (giveaway_id, user_id)
);

create table if not exists zeus.support_tickets (
  id uuid primary key default gen_random_uuid(),
  ticket_number bigint generated always as identity unique,
  user_id uuid not null references zeus.profiles(id) on delete cascade,
  subject text not null,
  category text not null default 'General',
  status text not null default 'open'
    check (status in ('open','answered','closed')),
  priority text not null default 'normal'
    check (priority in ('low','normal','high')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists zeus.ticket_messages (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references zeus.support_tickets(id) on delete cascade,
  sender_id uuid references zeus.profiles(id) on delete set null,
  is_staff boolean not null default false,
  message text not null,
  created_at timestamptz not null default now()
);
create index if not exists ticket_messages_ticket_idx on zeus.ticket_messages (ticket_id);

create table if not exists zeus.donations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references zeus.profiles(id) on delete set null,
  name text,
  message text,
  amount numeric(10,2) not null,
  currency text not null default 'USD',
  status text not null default 'pending' check (status in ('pending','completed')),
  stripe_session_id text unique,
  created_at timestamptz not null default now()
);

create table if not exists zeus.site_sections (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in (
    'hero','categories','featured_products','games','stats','reviews',
    'faq','discord','giveaway','rich_text'
  )),
  title text,
  subtitle text,
  content jsonb not null default '{}',
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists zeus.site_settings (
  key text primary key,
  value jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists zeus.audit_logs (
  id bigint generated always as identity primary key,
  actor_id uuid references zeus.profiles(id) on delete set null,
  action text not null,
  entity text not null,
  entity_id text,
  meta jsonb not null default '{}',
  created_at timestamptz not null default now()
);

-- ── Helper functions ─────────────────────────────────────────────────────
-- SECURITY DEFINER so RLS policies can check roles without recursion.

create or replace function zeus.is_staff() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from zeus.profiles
    where id = auth.uid() and role in ('support','admin','super_admin')
  );
$$;

create or replace function zeus.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from zeus.profiles
    where id = auth.uid() and role in ('admin','super_admin')
  );
$$;

create or replace function zeus.is_super_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from zeus.profiles
    where id = auth.uid() and role = 'super_admin'
  );
$$;

-- Public, safe aggregates (RLS keeps the underlying tables private).
create or replace function zeus.giveaway_entry_count(gid uuid) returns integer
language sql stable security definer set search_path = '' as $$
  select count(*)::int from zeus.giveaway_entries where giveaway_id = gid;
$$;

create or replace function zeus.giveaway_winner_name(gid uuid) returns text
language sql stable security definer set search_path = '' as $$
  select p.username from zeus.giveaways g
  join zeus.profiles p on p.id = g.winner_user_id
  where g.id = gid;
$$;

create or replace function zeus.set_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Privilege escalation protection: role / ban changes only by super admins
-- (admins may ban), regardless of what RLS would otherwise allow.
create or replace function zeus.protect_profile_fields() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if current_user in ('postgres','service_role','supabase_admin','supabase_auth_admin') then
    return new;
  end if;
  if new.role is distinct from old.role and not zeus.is_super_admin() then
    raise exception 'Only super admins can change roles';
  end if;
  if new.is_banned is distinct from old.is_banned and not zeus.is_admin() then
    raise exception 'Only admins can change ban status';
  end if;
  return new;
end;
$$;

drop trigger if exists zeus_protect_profile on zeus.profiles;
create trigger zeus_protect_profile
  before update on zeus.profiles
  for each row execute function zeus.protect_profile_fields();

-- Create a profile automatically on signup. First user matching
-- site_settings.bootstrap_admin_emails becomes super_admin.
create or replace function zeus.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  bootstrap jsonb;
  new_role text := 'customer';
  uname text;
  is_discord boolean;
begin
  select value into bootstrap from zeus.site_settings where key = 'bootstrap_admin_emails';
  if bootstrap is not null and new.email is not null and bootstrap ? lower(new.email) then
    new_role := 'super_admin';
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
      new.id,
      new.email,
      uname,
      new.raw_user_meta_data->>'avatar_url',
      new_role,
      case when is_discord then new.raw_user_meta_data->>'provider_id' end,
      case when is_discord then new.raw_user_meta_data->>'full_name' end
    )
    on conflict (id) do nothing;
  exception when unique_violation then
    -- username taken: retry with a random suffix
    insert into zeus.profiles (id, email, username, avatar_url, role)
    values (
      new.id, new.email,
      left(uname, 14) || '_' || substr(md5(random()::text), 1, 4),
      new.raw_user_meta_data->>'avatar_url',
      new_role
    )
    on conflict (id) do nothing;
  end;
  return new;
end;
$$;

drop trigger if exists zeus_on_auth_user_created on auth.users;
create trigger zeus_on_auth_user_created
  after insert on auth.users
  for each row execute function zeus.handle_new_user();

-- updated_at triggers
drop trigger if exists zeus_profiles_updated on zeus.profiles;
create trigger zeus_profiles_updated before update on zeus.profiles
  for each row execute function zeus.set_updated_at();
drop trigger if exists zeus_products_updated on zeus.products;
create trigger zeus_products_updated before update on zeus.products
  for each row execute function zeus.set_updated_at();
drop trigger if exists zeus_orders_updated on zeus.orders;
create trigger zeus_orders_updated before update on zeus.orders
  for each row execute function zeus.set_updated_at();
drop trigger if exists zeus_blog_updated on zeus.blog_posts;
create trigger zeus_blog_updated before update on zeus.blog_posts
  for each row execute function zeus.set_updated_at();
