-- ROLLBACK SCRIPT for Multi-Game Platform Migration
-- Run this ONLY if you need to completely undo the multi-game migration
-- WARNING: This will delete all data in the new tables

-- Step 1: Drop the helper functions
DROP FUNCTION IF EXISTS public.get_games_for_category(TEXT);
DROP FUNCTION IF EXISTS public.get_popular_items_by_category(TEXT, INTEGER);

-- Step 2: Drop the view
DROP VIEW IF EXISTS public.items_with_details;

-- Step 3: Drop triggers
DROP TRIGGER IF EXISTS items_sitemap_ping ON public.items;

-- Step 4: Drop the new tables (CASCADE will remove all dependent objects)
DROP TABLE IF EXISTS public.items CASCADE;
DROP TABLE IF EXISTS public.categories CASCADE;
DROP TABLE IF EXISTS public.games CASCADE;

-- Step 5: Remove the added column from orders (optional)
ALTER TABLE public.orders DROP COLUMN IF EXISTS items_v2;

-- COMPLETE: The database is now back to the original state
-- Your products and services tables are still intact and unchanged
-- Your existing orders are still intact
-- All old functionality should work as before

-- Verification queries:
-- SELECT COUNT(*) FROM public.products; -- Should still have your products
-- SELECT COUNT(*) FROM public.services; -- Should still have your services
-- SELECT COUNT(*) FROM public.orders; -- Should still have your orders
