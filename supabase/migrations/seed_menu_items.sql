-- Seed items to control category dropdowns
-- Creates minimal active items so category menus show the correct games

-- GTA 5 -> Boosting
INSERT INTO public.items (game_id, category_id, name, slug, price, description, icon, platforms, versions, details, active, featured)
SELECT 
  g.id,
  c.id,
  'RP & Money Boost',
  'gta5-money-boost',
  14.99,
  'Boost your GTA Online account with RP and cash progression.',
  g.icon_url,
  '[]'::jsonb,
  '[]'::jsonb,
  '[]'::jsonb,
  true,
  false
FROM public.games g
JOIN public.categories c ON c.slug = 'boosting'
WHERE g.slug = 'gta5'
  AND NOT EXISTS (
    SELECT 1 FROM public.items i
    WHERE i.game_id = g.id AND i.category_id = c.id AND i.slug = 'gta5-money-boost'
  );

-- GTA 5 -> Accounts
INSERT INTO public.items (game_id, category_id, name, slug, price, description, icon, platforms, versions, details, active, featured)
SELECT 
  g.id,
  c.id,
  'Premium Modded Account',
  'gta5-modded-account',
  24.99,
  'High-level GTA Online modded account with unlocks and progression.',
  g.icon_url,
  '[]'::jsonb,
  '[]'::jsonb,
  '[]'::jsonb,
  true,
  false
FROM public.games g
JOIN public.categories c ON c.slug = 'accounts'
WHERE g.slug = 'gta5'
  AND NOT EXISTS (
    SELECT 1 FROM public.items i
    WHERE i.game_id = g.id AND i.category_id = c.id AND i.slug = 'gta5-modded-account'
  );

-- Rocket League -> Boosting
INSERT INTO public.items (game_id, category_id, name, slug, price, description, icon, platforms, versions, details, active, featured)
SELECT 
  g.id,
  c.id,
  'Competitive Rank Boost',
  'competitive-rank-boost',
  19.99,
  'Climb ranks fast with pro coaching and safe boosting.',
  g.icon_url,
  '[]'::jsonb,
  '[]'::jsonb,
  '[]'::jsonb,
  true,
  false
FROM public.games g
JOIN public.categories c ON c.slug = 'boosting'
WHERE g.slug = 'rocket-league'
  AND NOT EXISTS (
    SELECT 1 FROM public.items i
    WHERE i.game_id = g.id AND i.category_id = c.id AND i.slug = 'competitive-rank-boost'
  );

-- Rocket League -> Topups
INSERT INTO public.items (game_id, category_id, name, slug, price, description, icon, platforms, versions, details, active, featured)
SELECT 
  g.id,
  c.id,
  'Rocket League Credits',
  'rocket-league-credits',
  9.99,
  'Top up your account with Rocket League credits.',
  g.icon_url,
  '[]'::jsonb,
  '[]'::jsonb,
  '[]'::jsonb,
  true,
  false
FROM public.games g
JOIN public.categories c ON c.slug = 'topups'
WHERE g.slug = 'rocket-league'
  AND NOT EXISTS (
    SELECT 1 FROM public.items i
    WHERE i.game_id = g.id AND i.category_id = c.id AND i.slug = 'rocket-league-credits'
  );

-- Fortnite -> Topups
INSERT INTO public.items (game_id, category_id, name, slug, price, description, icon, platforms, versions, details, active, featured)
SELECT 
  g.id,
  c.id,
  'V-Bucks Topup',
  'v-bucks-topup',
  12.99,
  'Get V-Bucks delivered fast and safely.',
  g.icon_url,
  '[]'::jsonb,
  '[]'::jsonb,
  '[]'::jsonb,
  true,
  false
FROM public.games g
JOIN public.categories c ON c.slug = 'topups'
WHERE g.slug = 'fortnite'
  AND NOT EXISTS (
    SELECT 1 FROM public.items i
    WHERE i.game_id = g.id AND i.category_id = c.id AND i.slug = 'v-bucks-topup'
  );

-- Forza Horizon 6 -> Topups
INSERT INTO public.items (game_id, category_id, name, slug, price, description, icon, platforms, versions, details, active, featured)
SELECT 
  g.id,
  c.id,
  'Forza Horizon Money',
  'forza-money-topup',
  14.99,
  'In-game money topups for Forza Horizon 6.',
  g.icon_url,
  '[]'::jsonb,
  '[]'::jsonb,
  '[]'::jsonb,
  true,
  false
FROM public.games g
JOIN public.categories c ON c.slug = 'topups'
WHERE g.slug = 'forza-horizon-6'
  AND NOT EXISTS (
    SELECT 1 FROM public.items i
    WHERE i.game_id = g.id AND i.category_id = c.id AND i.slug = 'forza-money-topup'
  );
