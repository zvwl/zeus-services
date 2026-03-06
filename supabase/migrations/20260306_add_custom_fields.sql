-- Add flexible custom fields column to items table
-- This allows unlimited custom dropdown fields beyond just platforms and versions

ALTER TABLE public.items 
ADD COLUMN IF NOT EXISTS custom_fields JSONB NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.items.custom_fields IS 'Flexible array of custom fields. Each field has a fieldName and selectedOptions array. Example: [{"fieldName":"Platform","selectedOptions":["Steam","Epic Games"]},{"fieldName":"Region","selectedOptions":["US","EU"]}]';

-- Migrate existing platforms and versions into custom_fields structure for new unified system
-- This is optional - only run if you want to consolidate everything into custom_fields
-- UPDATE public.items 
-- SET custom_fields = (
--   SELECT jsonb_agg(field)
--   FROM (
--     SELECT jsonb_build_object('fieldName', 'Platform', 'selectedOptions', platforms) AS field
--     WHERE platforms IS NOT NULL AND jsonb_array_length(platforms) > 0
--     UNION ALL
--     SELECT jsonb_build_object('fieldName', 'Version', 'selectedOptions', versions) AS field
--     WHERE versions IS NOT NULL AND jsonb_array_length(versions) > 0
--   ) fields
-- )
-- WHERE platforms IS NOT NULL OR versions IS NOT NULL;
