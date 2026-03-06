-- Move legacy item option data to custom_fields and remove old columns.
-- Keeps app compatibility by exposing derived platforms/versions in items_with_details view.

-- 1) Ensure custom_fields exists
ALTER TABLE public.items
ADD COLUMN IF NOT EXISTS custom_fields JSONB NOT NULL DEFAULT '[]'::jsonb;

-- 2) Backfill custom_fields from legacy columns when custom_fields is empty
UPDATE public.items i
SET custom_fields = src.new_custom_fields
FROM (
  SELECT
    id,
    COALESCE(
      jsonb_agg(field) FILTER (WHERE field IS NOT NULL),
      '[]'::jsonb
    ) AS new_custom_fields
  FROM (
    SELECT
      id,
      CASE
        WHEN platforms IS NOT NULL AND jsonb_typeof(platforms) = 'array' AND jsonb_array_length(platforms) > 0
          THEN jsonb_build_object(
            'fieldName', 'Platform',
            'availableOptions', platforms,
            'selectedOptions', platforms
          )
        ELSE NULL
      END AS field
    FROM public.items

    UNION ALL

    SELECT
      id,
      CASE
        WHEN versions IS NOT NULL AND jsonb_typeof(versions) = 'array' AND jsonb_array_length(versions) > 0
          THEN jsonb_build_object(
            'fieldName', 'Version',
            'availableOptions', versions,
            'selectedOptions', versions
          )
        ELSE NULL
      END AS field
    FROM public.items
  ) t
  GROUP BY id
) src
WHERE i.id = src.id
  AND (
    i.custom_fields IS NULL
    OR jsonb_typeof(i.custom_fields) <> 'array'
    OR jsonb_array_length(i.custom_fields) = 0
  );

-- 3) Drop old option columns
ALTER TABLE public.items
DROP COLUMN IF EXISTS platforms,
DROP COLUMN IF EXISTS versions;

-- 4) Recreate view with custom_fields and derived compatibility columns
DROP VIEW IF EXISTS public.items_with_details CASCADE;

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
  i.legacy_type,
  i.legacy_id,
  g.name AS game_name,
  g.slug AS game_slug,
  g.icon_url AS game_icon_url,
  c.name AS category_name,
  c.slug AS category_slug
FROM public.items i
LEFT JOIN public.games g ON i.game_id = g.id
LEFT JOIN public.categories c ON i.category_id = c.id;

GRANT SELECT ON public.items_with_details TO anon, authenticated;
