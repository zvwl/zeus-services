-- FIX FOR AMBIGUOUS COLUMN REFERENCE ERROR
-- Run this in Supabase SQL Editor to fix the get_games_for_category function

-- Drop the existing functions
DROP FUNCTION IF EXISTS public.get_games_for_category(TEXT);
DROP FUNCTION IF EXISTS public.get_popular_items_by_category(TEXT, INTEGER);

-- Recreate get_popular_items_by_category with explicit column aliases
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

-- Recreate get_games_for_category with explicit variable handling
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
  -- Get the category ID first to avoid ambiguous column references
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
  LEFT JOIN public.items i ON g.id = i.game_id 
    AND i.category_id = target_category_id
    AND i.active = true
  WHERE g.is_active = true OR g.is_coming_soon = true
  GROUP BY g.id, g.name, g.slug, g.icon_url
  ORDER BY g.display_order, g.name;
END;
$$;

-- VERIFICATION
-- Test the functions to ensure they work
SELECT * FROM public.get_games_for_category('accounts');
SELECT * FROM public.get_games_for_category('boosting');
SELECT * FROM public.get_games_for_category('topups');
