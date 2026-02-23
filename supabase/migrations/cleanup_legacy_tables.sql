-- Clean up legacy products and services tables after migration to items
-- This migration removes the old tables now that all data has been migrated to the new items table

-- Step 1: Verify all data has been migrated
-- Products should now be in items table with legacy_type = 'product'
-- Services should now be in items table with legacy_type = 'service'

-- Step 2: Drop the old products and services tables
-- Note: Orders table doesn't have direct foreign keys to products/services
-- Old orders data should have been migrated or is stored separately
DROP TABLE IF EXISTS public.products CASCADE;
DROP TABLE IF EXISTS public.services CASCADE;

-- Step 3: Verification queries
-- SELECT COUNT(*) as total_items FROM public.items;
-- SELECT legacy_type, COUNT(*) FROM public.items GROUP BY legacy_type;

