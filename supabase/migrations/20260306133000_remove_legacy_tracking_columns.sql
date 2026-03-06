-- Remove migration-era legacy tracking from items now that the system is fully custom_fields based.

-- 1) Drop dependent view first
DROP VIEW IF EXISTS public.items_with_details CASCADE;

-- 2) Drop legacy tracking columns from items
ALTER TABLE public.items
DROP COLUMN IF EXISTS legacy_type,
DROP COLUMN IF EXISTS legacy_id;

-- 3) Recreate view without legacy columns and with compatibility fields derived from custom_fields
CREATE OR REPLACE VIEW public.items_with_details
WITH (security_invoker = true) AS
SELECT
  i.id,
  i.game_id,
  i.category_id,
  i.name,
  i.slug,
  i.price,
  i.description,
  i.icon,
  i.custom_fields,
  COALESCE((
    SELECT jsonb_agg(opt)
    FROM jsonb_array_elements(COALESCE(i.custom_fields, '[]'::jsonb)) cf
    CROSS JOIN LATERAL jsonb_array_elements_text(COALESCE(cf->'selectedOptions', '[]'::jsonb)) opt
    WHERE lower(COALESCE(cf->>'fieldName', '')) = 'platform'
  ), '[]'::jsonb) AS platforms,
  COALESCE((
    SELECT jsonb_agg(opt)
    FROM jsonb_array_elements(COALESCE(i.custom_fields, '[]'::jsonb)) cf
    CROSS JOIN LATERAL jsonb_array_elements_text(COALESCE(cf->'selectedOptions', '[]'::jsonb)) opt
    WHERE lower(COALESCE(cf->>'fieldName', '')) = 'version'
  ), '[]'::jsonb) AS versions,
  i.details,
  i.active,
  i.featured,
  i.stock_enabled,
  i.stock_quantity,
  i.stock_unlimited,
  i.created_at,
  i.updated_at,
  g.name AS game_name,
  g.slug AS game_slug,
  g.icon_url AS game_icon_url,
  c.name AS category_name,
  c.slug AS category_slug
FROM public.items i
LEFT JOIN public.games g ON i.game_id = g.id
LEFT JOIN public.categories c ON i.category_id = c.id;

GRANT SELECT ON public.items_with_details TO anon, authenticated;
