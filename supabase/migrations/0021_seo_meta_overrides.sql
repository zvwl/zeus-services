-- ────────────────────────────────────────────────────────────────────────────
-- Zeuservices — per-record SEO metadata overrides + catalog freshness
--
-- meta_title / meta_description let admins hand-write the SERP snippet for a
-- record instead of the mechanical fallback (name / truncated body text).
-- games & categories gain updated_at (+ trigger) so the sitemap can report an
-- honest lastModified instead of created_at.
-- ────────────────────────────────────────────────────────────────────────────

alter table zeus.games
  add column if not exists meta_title text,
  add column if not exists meta_description text,
  add column if not exists updated_at timestamptz not null default now();

alter table zeus.categories
  add column if not exists meta_title text,
  add column if not exists meta_description text,
  add column if not exists updated_at timestamptz not null default now();

alter table zeus.products
  add column if not exists meta_title text,
  add column if not exists meta_description text;

alter table zeus.blog_posts
  add column if not exists meta_title text,
  add column if not exists meta_description text;

drop trigger if exists zeus_games_updated on zeus.games;
create trigger zeus_games_updated before update on zeus.games
  for each row execute function zeus.set_updated_at();

drop trigger if exists zeus_categories_updated on zeus.categories;
create trigger zeus_categories_updated before update on zeus.categories
  for each row execute function zeus.set_updated_at();

-- ────────────────────────────────────────────────────────────────────────────
-- Hand-written SERP snippets for the core catalog (Semrush research 2026-07).
-- The layout's title template appends "— Zeuservices", so no brand here.
-- COALESCE keeps any values an admin has already written.
-- ────────────────────────────────────────────────────────────────────────────

update zeus.games set
  meta_title = coalesce(meta_title, 'GTA 5 Modded Accounts, Money Boosts & Recovery'),
  meta_description = coalesce(meta_description, 'Cheap GTA 5 & GTA Online services: modded accounts for PS5, PS4, Xbox and PC, money boosts and rank recovery. Fast, safe delivery from a store trusted by thousands.')
where slug = 'gta-5';

update zeus.games set
  meta_title = coalesce(meta_title, 'Fortnite Accounts, Cheap V-Bucks & Boosting'),
  meta_description = coalesce(meta_description, 'Buy Fortnite OG accounts with rare skins, cheap V-Bucks top-ups and boosting. Instant, safe delivery worldwide with full email access and warranty.')
where slug = 'fortnite';

update zeus.games set
  meta_title = coalesce(meta_title, 'Rocket League Credits, Boosting & Accounts'),
  meta_description = coalesce(meta_description, 'Cheap Rocket League credits, professional rank boosting and ready-to-play accounts. Fast delivery on PlayStation, Xbox, PC and Switch — warranty included.')
where slug = 'rocket-league';

update zeus.categories set
  meta_title = coalesce(meta_title, 'Cheap Game Top-Ups — V-Bucks, GTA Money & RL Credits'),
  meta_description = coalesce(meta_description, 'In-game currency for less: cheap V-Bucks, GTA money boosts and Rocket League credits. Fast, secure delivery and 24/7 support on every order.')
where slug = 'topups';

update zeus.categories set
  meta_title = coalesce(meta_title, 'Game Boosting Services — Ranks, Wins & Recovery'),
  meta_description = coalesce(meta_description, 'Professional boosting for GTA 5, Fortnite and Rocket League: rank boosts, wins and recoveries by experienced players. Discreet, fast and warranty-backed.')
where slug = 'boosting';

update zeus.categories set
  meta_title = coalesce(meta_title, 'Buy Game Accounts — GTA Modded, Fortnite OG & More'),
  meta_description = coalesce(meta_description, 'Ready-to-play accounts with full email access: GTA 5 modded accounts, Fortnite OG skin accounts and Rocket League accounts. Instant delivery and warranty.')
where slug = 'accounts';
