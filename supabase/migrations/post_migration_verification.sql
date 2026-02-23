-- POST-MIGRATION VERIFICATION
-- Run this AFTER the main migration to verify everything worked correctly

-- ============================================
-- STEP 1: Verify new tables were created
-- ============================================

SELECT 
  'New Tables Created:' as check_category,
  tablename,
  '✓' as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('games', 'categories', 'items')
ORDER BY tablename;

-- ============================================
-- STEP 2: Verify data migration
-- ============================================

-- Count games
SELECT 
  'Games Count:' as check_name,
  COUNT(*) as count,
  CASE WHEN COUNT(*) = 4 THEN '✓ Expected 4 games' ELSE '⚠ Should have 4 games' END as status
FROM public.games;

-- Count categories
SELECT 
  'Categories Count:' as check_name,
  COUNT(*) as count,
  CASE WHEN COUNT(*) = 3 THEN '✓ Expected 3 categories' ELSE '⚠ Should have 3 categories' END as status
FROM public.categories;

-- Verify product migration
SELECT 
  'Products Migrated:' as check_name,
  COUNT(*) as items_count,
  (SELECT COUNT(*) FROM public.products WHERE active = true) as original_count,
  CASE 
    WHEN COUNT(*) = (SELECT COUNT(*) FROM public.products WHERE active = true) 
    THEN '✓ All products migrated' 
    ELSE '⚠ Counts do not match' 
  END as status
FROM public.items 
WHERE legacy_type = 'product';

-- Verify service migration
SELECT 
  'Services Migrated:' as check_name,
  COUNT(*) as items_count,
  (SELECT COUNT(*) FROM public.services WHERE active = true) as original_count,
  CASE 
    WHEN COUNT(*) = (SELECT COUNT(*) FROM public.services WHERE active = true) 
    THEN '✓ All services migrated' 
    ELSE '⚠ Counts do not match' 
  END as status
FROM public.items 
WHERE legacy_type = 'service';

-- ============================================
-- STEP 3: Verify indexes were created
-- ============================================

SELECT 
  'Indexes on new tables:' as check_category,
  tablename,
  indexname,
  '✓' as status
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND tablename IN ('games', 'categories', 'items')
ORDER BY tablename, indexname;

-- ============================================
-- STEP 4: Verify RLS policies
-- ============================================

SELECT 
  'RLS Policies on new tables:' as check_category,
  tablename,
  policyname,
  cmd as command,
  '✓' as status
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN ('games', 'categories', 'items')
ORDER BY tablename, policyname;

-- ============================================
-- STEP 5: Verify functions and views
-- ============================================

-- Check functions
SELECT 
  'Functions Created:' as check_category,
  routine_name,
  '✓' as status
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN ('get_popular_items_by_category', 'get_games_for_category')
ORDER BY routine_name;

-- Check views
SELECT 
  'Views Created:' as check_category,
  table_name,
  '✓' as status
FROM information_schema.views 
WHERE table_schema = 'public' 
  AND table_name = 'items_with_details';

-- ============================================
-- STEP 6: Sample data verification
-- ============================================

-- Show sample of migrated items
SELECT 
  'Sample Migrated Items (first 5):' as info,
  i.name,
  g.name as game,
  c.name as category,
  i.legacy_type,
  i.price
FROM public.items i
JOIN public.games g ON i.game_id = g.id
JOIN public.categories c ON i.category_id = c.id
ORDER BY i.created_at
LIMIT 5;

-- ============================================
-- STEP 7: Check original tables
-- ============================================

SELECT 
  'Original Tables Status:' as check_category,
  tablename,
  CASE 
    WHEN tablename IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('products', 'services'))
    THEN '✓ Still exists (safe for rollback)'
    ELSE '⚠ Missing'
  END as status
FROM (VALUES ('products'), ('services')) AS t(tablename);

-- ============================================
-- STEP 8: Verify trigger
-- ============================================

SELECT 
  'Triggers on new tables:' as check_category,
  trigger_name,
  event_object_table,
  action_timing || ' ' || event_manipulation as trigger_type,
  '✓' as status
FROM information_schema.triggers
WHERE event_object_schema = 'public'
  AND event_object_table IN ('games', 'categories', 'items');

-- ============================================
-- FINAL SUMMARY
-- ============================================

SELECT 
  '=================================' as message
UNION ALL SELECT 'POST-MIGRATION VERIFICATION COMPLETE'
UNION ALL SELECT '================================='
UNION ALL SELECT ''
UNION ALL SELECT 'Review all checks above:'
UNION ALL SELECT '- All should show ✓ status'
UNION ALL SELECT '- Sample data should look correct'
UNION ALL SELECT '- Original tables should still exist'
UNION ALL SELECT ''
UNION ALL SELECT 'Next Steps:'
UNION ALL SELECT '1. Test the frontend application'
UNION ALL SELECT '2. Visit /admin/games to see the new tables'
UNION ALL SELECT '3. Visit /admin/items to see migrated items'
UNION ALL SELECT '4. Test category pages like /accounts/gta5'
UNION ALL SELECT ''
UNION ALL SELECT 'If anything looks wrong:'
UNION ALL SELECT '1. Run rollback_multi_game_support.sql'
UNION ALL SELECT '2. Your original data will remain intact'
UNION ALL SELECT '3. Report the issue for debugging';
