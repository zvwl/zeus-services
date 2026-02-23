-- Fix missing icons for migrated items
-- Set icon to the game's icon_url for items that don't have an icon

UPDATE public.items i
SET icon = g.icon_url
FROM public.games g
WHERE i.game_id = g.id
  AND (i.icon IS NULL OR i.icon = '')
  AND g.icon_url IS NOT NULL
  AND g.icon_url != '';

-- Verify the updates
SELECT COUNT(*) as updated_items FROM public.items WHERE icon IS NOT NULL;
