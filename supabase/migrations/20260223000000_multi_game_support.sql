-- Multi-Game Platform Support Migration
-- This migration transforms the database from single-game (GTA5) to multi-game platform
-- with new category structure: Topups, Boosting, Accounts

-- Step 1: Create games table
CREATE TABLE IF NOT EXISTS public.games (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  icon_url TEXT NULL,
  description TEXT NULL,
  is_active BOOLEAN DEFAULT true,
  is_coming_soon BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT games_pkey PRIMARY KEY (id)
);

-- Step 2: Create categories table (Topups, Boosting, Accounts)
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT NULL,
  icon TEXT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT categories_pkey PRIMARY KEY (id)
);

-- Step 3: Create items table (replaces products and services)
CREATE TABLE IF NOT EXISTS public.items (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL,
  category_id UUID NOT NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  price NUMERIC(10, 2) NOT NULL,
  description TEXT NULL,
  icon TEXT NULL,
  platforms JSONB NULL DEFAULT '[]'::jsonb,
  versions JSONB NULL DEFAULT '[]'::jsonb,
  details JSONB NULL DEFAULT '[]'::jsonb,
  active BOOLEAN DEFAULT true,
  featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Legacy fields for backwards compatibility during migration
  legacy_type TEXT NULL, -- 'product' or 'service'
  legacy_id UUID NULL,
  CONSTRAINT items_pkey PRIMARY KEY (id),
  CONSTRAINT items_game_id_fkey FOREIGN KEY (game_id) REFERENCES games (id) ON DELETE CASCADE,
  CONSTRAINT items_category_id_fkey FOREIGN KEY (category_id) REFERENCES categories (id) ON DELETE CASCADE,
  CONSTRAINT items_slug_game_category_unique UNIQUE (slug, game_id, category_id)
);

-- Step 4: Insert default games
INSERT INTO public.games (name, slug, icon_url, description, is_active, is_coming_soon, display_order) VALUES
  ('GTA 5', 'gta5', '/game-icons/gta5.webp', 'Grand Theft Auto V Online', true, false, 1),
  ('Forza Horizon 6', 'forza-horizon-6', '/game-icons/forza-horizon-6.webp', 'Forza Horizon 6', false, true, 2),
  ('Fortnite', 'fortnite', '/game-icons/fortnite.webp', 'Fortnite Battle Royale', true, false, 3),
  ('Rocket League', 'rocket-league', '/game-icons/rocket-league.webp', 'Rocket League', true, false, 4)
ON CONFLICT (slug) DO NOTHING;

-- Step 5: Insert default categories
INSERT INTO public.categories (name, slug, description, display_order) VALUES
  ('Topups', 'topups', 'In-game currency and credits', 1),
  ('Boosting', 'boosting', 'Level up and progression services', 2),
  ('Accounts', 'accounts', 'Premium modded accounts', 3)
ON CONFLICT (slug) DO NOTHING;

-- Step 6: Migrate existing products to items table
-- All products go to 'Accounts' category for GTA5
INSERT INTO public.items (
  game_id,
  category_id,
  name,
  slug,
  price,
  description,
  icon,
  platforms,
  versions,
  details,
  active,
  created_at,
  updated_at,
  legacy_type,
  legacy_id
)
SELECT 
  (SELECT id FROM public.games WHERE slug = 'gta5'),
  (SELECT id FROM public.categories WHERE slug = 'accounts'),
  p.name,
  LOWER(REPLACE(REPLACE(p.name, ' ', '-'), '''', '')),
  p.price,
  p.description,
  p.icon,
  p.platforms,
  p.versions,
  p.details,
  p.active,
  p.created_at,
  p.updated_at,
  'product',
  p.id
FROM public.products p
WHERE NOT EXISTS (
  SELECT 1 FROM public.items WHERE legacy_type = 'product' AND legacy_id = p.id
);

-- Step 7: Migrate existing services to items table
-- All services go to 'Boosting' category for GTA5
INSERT INTO public.items (
  game_id,
  category_id,
  name,
  slug,
  price,
  description,
  icon,
  platforms,
  versions,
  details,
  active,
  created_at,
  updated_at,
  legacy_type,
  legacy_id
)
SELECT 
  (SELECT id FROM public.games WHERE slug = 'gta5'),
  (SELECT id FROM public.categories WHERE slug = 'boosting'),
  s.name,
  LOWER(REPLACE(REPLACE(s.name, ' ', '-'), '''', '')),
  s.price,
  s.description,
  s.icon,
  s.platforms,
  s.versions,
  s.details,
  s.active,
  s.created_at,
  s.updated_at,
  'service',
  s.id
FROM public.services s
WHERE NOT EXISTS (
  SELECT 1 FROM public.items WHERE legacy_type = 'service' AND legacy_id = s.id
);

-- Step 8: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_games_slug ON public.games USING btree (slug);
CREATE INDEX IF NOT EXISTS idx_games_active ON public.games USING btree (is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_games_display_order ON public.games USING btree (display_order);

CREATE INDEX IF NOT EXISTS idx_categories_slug ON public.categories USING btree (slug);
CREATE INDEX IF NOT EXISTS idx_categories_display_order ON public.categories USING btree (display_order);

CREATE INDEX IF NOT EXISTS idx_items_game_id ON public.items USING btree (game_id);
CREATE INDEX IF NOT EXISTS idx_items_category_id ON public.items USING btree (category_id);
CREATE INDEX IF NOT EXISTS idx_items_active ON public.items USING btree (active) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_items_game_category ON public.items USING btree (game_id, category_id);
CREATE INDEX IF NOT EXISTS idx_items_slug ON public.items USING btree (slug);
CREATE INDEX IF NOT EXISTS idx_items_featured ON public.items USING btree (featured) WHERE featured = true;

-- Step 9: Create RLS policies for games
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;

CREATE POLICY "games_select_anon_policy" ON public.games
  FOR SELECT TO anon USING (true);

CREATE POLICY "games_select_policy" ON public.games
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "games_insert_policy" ON public.games
  FOR INSERT TO authenticated 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admin_users 
      WHERE user_id = auth.uid() AND active = true
    )
  );

CREATE POLICY "games_update_policy" ON public.games
  FOR UPDATE TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users 
      WHERE user_id = auth.uid() AND active = true
    )
  );

CREATE POLICY "games_delete_policy" ON public.games
  FOR DELETE TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users 
      WHERE user_id = auth.uid() AND active = true
    )
  );

-- Step 10: Create RLS policies for categories
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "categories_select_anon_policy" ON public.categories
  FOR SELECT TO anon USING (true);

CREATE POLICY "categories_select_policy" ON public.categories
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "categories_insert_policy" ON public.categories
  FOR INSERT TO authenticated 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admin_users 
      WHERE user_id = auth.uid() AND active = true
    )
  );

CREATE POLICY "categories_update_policy" ON public.categories
  FOR UPDATE TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users 
      WHERE user_id = auth.uid() AND active = true
    )
  );

CREATE POLICY "categories_delete_policy" ON public.categories
  FOR DELETE TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users 
      WHERE user_id = auth.uid() AND active = true
    )
  );

-- Step 11: Create RLS policies for items
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "items_select_anon_policy" ON public.items
  FOR SELECT TO anon USING (active = true);

CREATE POLICY "items_select_policy" ON public.items
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "items_admin_select_policy" ON public.items
  FOR SELECT TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users 
      WHERE user_id = auth.uid() AND active = true
    )
  );

CREATE POLICY "items_insert_policy" ON public.items
  FOR INSERT TO authenticated 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admin_users 
      WHERE user_id = auth.uid() AND active = true
    )
  );

CREATE POLICY "items_update_policy" ON public.items
  FOR UPDATE TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users 
      WHERE user_id = auth.uid() AND active = true
    )
  );

CREATE POLICY "items_delete_policy" ON public.items
  FOR DELETE TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users 
      WHERE user_id = auth.uid() AND active = true
    )
  );

-- Step 12: Create trigger for sitemap ping on items
CREATE OR REPLACE TRIGGER items_sitemap_ping
AFTER INSERT OR DELETE OR UPDATE ON public.items
FOR EACH STATEMENT
EXECUTE FUNCTION ping_sitemap_on_change();

-- Step 13: Update orders table to reference items
-- Add new columns for the new structure
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS items_v2 JSONB NULL;

-- Note: We keep the existing 'items' column for backwards compatibility
-- New orders will use 'items_v2' which includes game_id and category_id references

-- Step 14: Create a view for easy querying of items with game and category info
CREATE OR REPLACE VIEW public.items_with_details AS
SELECT 
  i.*,
  g.name as game_name,
  g.slug as game_slug,
  g.icon_url as game_icon,
  c.name as category_name,
  c.slug as category_slug
FROM public.items i
JOIN public.games g ON i.game_id = g.id
JOIN public.categories c ON i.category_id = c.id;

-- Grant access to the view
GRANT SELECT ON public.items_with_details TO anon, authenticated;

-- Step 15: Create helper function to get popular items by category
CREATE OR REPLACE FUNCTION public.get_popular_items_by_category(
  category_slug_param TEXT,
  limit_count INTEGER DEFAULT 8
)
RETURNS TABLE (
  item_id UUID,
  item_game_id UUID,
  item_category_id UUID,
  item_name TEXT,
  item_slug TEXT,
  item_price NUMERIC,
  item_description TEXT,
  item_icon TEXT,
  game_name TEXT,
  game_slug TEXT,
  game_icon TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    i.id as item_id,
    i.game_id as item_game_id,
    i.category_id as item_category_id,
    i.name as item_name,
    i.slug as item_slug,
    i.price as item_price,
    i.description as item_description,
    i.icon as item_icon,
    g.name as game_name,
    g.slug as game_slug,
    g.icon_url as game_icon
  FROM public.items i
  JOIN public.games g ON i.game_id = g.id
  JOIN public.categories c ON i.category_id = c.id
  WHERE c.slug = category_slug_param
    AND i.active = true
    AND g.is_active = true
  ORDER BY i.featured DESC, i.created_at DESC
  LIMIT limit_count;
END;
$$;

-- Step 16: Create helper function to get games by category
CREATE OR REPLACE FUNCTION public.get_games_for_category(category_slug_param TEXT)
RETURNS TABLE (
  game_id UUID,
  game_name TEXT,
  game_slug TEXT,
  game_icon_url TEXT,
  item_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  target_category_id UUID;
BEGIN
  -- Get the category ID first
  SELECT c.id INTO target_category_id
  FROM public.categories c
  WHERE c.slug = category_slug_param;

  RETURN QUERY
  SELECT 
    g.id as game_id,
    g.name as game_name,
    g.slug as game_slug,
    g.icon_url as game_icon_url,
    COUNT(i.id) as item_count
  FROM public.games g
  JOIN public.items i ON g.id = i.game_id
    AND i.category_id = target_category_id
    AND i.active = true
  WHERE g.is_active = true OR g.is_coming_soon = true
  GROUP BY g.id, g.name, g.slug, g.icon_url
  HAVING COUNT(i.id) > 0
  ORDER BY g.display_order, g.name;
END;
$$;

-- Step 17: Add comments for documentation
COMMENT ON TABLE public.games IS 'Stores all supported games in the platform';
COMMENT ON TABLE public.categories IS 'Stores the three main categories: Topups, Boosting, Accounts';
COMMENT ON TABLE public.items IS 'Unified table for all sellable items across games and categories';
COMMENT ON COLUMN public.items.legacy_type IS 'For migration: tracks if item came from products or services table';
COMMENT ON COLUMN public.items.legacy_id IS 'For migration: stores original ID from products or services table';

-- Step 18: Grant permissions
GRANT SELECT ON public.games TO anon, authenticated;
GRANT SELECT ON public.categories TO anon, authenticated;
GRANT SELECT ON public.items TO anon, authenticated;
GRANT USAGE ON SCHEMA public TO anon, authenticated;
