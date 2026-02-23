-- PRE-MIGRATION SAFETY CHECKS AND BACKUP
-- Run this BEFORE running the main migration to verify everything is ready

-- ============================================
-- STEP 1: Verify existing data
-- ============================================

-- Check how many products will be migrated
SELECT 
  'Products to migrate:' as check_name,
  COUNT(*) as count,
  CASE WHEN COUNT(*) > 0 THEN '✓ Ready' ELSE '⚠ No products found' END as status
FROM public.products WHERE active = true;

-- Check how many services will be migrated
SELECT 
  'Services to migrate:' as check_name,
  COUNT(*) as count,
  CASE WHEN COUNT(*) > 0 THEN '✓ Ready' ELSE '⚠ No services found' END as status
FROM public.services WHERE active = true;

-- Check for existing orders
SELECT 
  'Existing orders:' as check_name,
  COUNT(*) as count,
  CASE WHEN COUNT(*) > 0 THEN '✓ Has orders' ELSE 'ℹ No orders yet' END as status
FROM public.orders;

-- ============================================
-- STEP 2: Check for naming conflicts
-- ============================================

-- Verify tables don't already exist
SELECT 
  'Table conflicts:' as check_name,
  COUNT(*) as conflict_count,
  CASE 
    WHEN COUNT(*) > 0 THEN '⚠ WARNING: New tables already exist! Migration may fail or overwrite data.'
    ELSE '✓ Safe: No table conflicts'
  END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('games', 'categories', 'items');

-- ============================================
-- STEP 3: Verify RLS is working
-- ============================================

-- Check if RLS is enabled on existing tables
SELECT 
  tablename,
  rowsecurity as rls_enabled,
  CASE WHEN rowsecurity THEN '✓ Enabled' ELSE '⚠ Disabled' END as status
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('products', 'services', 'orders')
ORDER BY tablename;

-- ============================================
-- STEP 4: Create backup snapshots (metadata only)
-- ============================================

-- Create a backup of product IDs and names for verification
CREATE TEMP TABLE IF NOT EXISTS backup_products_snapshot AS
SELECT id, name, price, active, created_at
FROM public.products;

-- Create a backup of service IDs and names for verification
CREATE TEMP TABLE IF NOT EXISTS backup_services_snapshot AS
SELECT id, name, price, active, created_at
FROM public.services;

-- Display backup counts
SELECT 'Product backup created:' as info, COUNT(*) as count FROM backup_products_snapshot
UNION ALL
SELECT 'Service backup created:' as info, COUNT(*) as count FROM backup_services_snapshot;

-- ============================================
-- STEP 5: Check disk space and table sizes
-- ============================================

-- Estimate current table sizes
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('products', 'services', 'orders', 'admin_actions', 'reviews')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- ============================================
-- FINAL MESSAGE
-- ============================================

SELECT 
  '=================================' as message
UNION ALL SELECT 'PRE-MIGRATION CHECKS COMPLETE'
UNION ALL SELECT '================================='
UNION ALL SELECT ''
UNION ALL SELECT 'If all checks show ✓, you can proceed with the migration.'
UNION ALL SELECT 'If any show ⚠, review the issues before proceeding.'
UNION ALL SELECT ''
UNION ALL SELECT 'To proceed:'
UNION ALL SELECT '1. Review all check results above'
UNION ALL SELECT '2. Run the main migration: 20260223000000_multi_game_support.sql'
UNION ALL SELECT '3. Verify with post-migration checks'
UNION ALL SELECT ''
UNION ALL SELECT 'To rollback if needed:'
UNION ALL SELECT '1. Run: rollback_multi_game_support.sql'
UNION ALL SELECT '2. Your original data (products, services) will remain intact';
