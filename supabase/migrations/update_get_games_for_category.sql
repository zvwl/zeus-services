-- Update get_games_for_category to only return games with items in that category
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
