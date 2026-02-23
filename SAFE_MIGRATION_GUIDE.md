# Safe Database Migration Guide

## Overview
This guide ensures you can safely run the multi-game migration and rollback if needed.

## Risk Assessment

### ✅ Low Risk Areas
- **No data deletion** - Original `products` and `services` tables remain untouched
- **No data modification** - Only reads from existing tables
- **Additive changes** - Only creates new tables, doesn't alter existing ones
- **Reversible** - Complete rollback script provided

### ⚠️ Potential Risks
- Migration could fail mid-execution (rare with Supabase)
- New tables might conflict if migration was partially run before
- RLS policies might not work if there are permission issues
- Frontend might break if database succeeds but code deployment fails

## Safe Migration Process

### Step 1: Pre-Migration (REQUIRED)

**Before touching anything, run the pre-migration checks:**

```sql
-- In Supabase SQL Editor, run:
-- File: pre_migration_checks.sql
```

**Review the output for:**
- ✓ All checks should pass
- Number of products/services to migrate
- No table name conflicts
- RLS is properly configured

**If anything shows ⚠️, investigate before proceeding!**

### Step 2: Backup (HIGHLY RECOMMENDED)

**Option A: Supabase Automatic Backups**
- Supabase automatically backs up your database
- You can restore from the Dashboard → Database → Backups
- Available for paid plans (Pro/Team)

**Option B: Manual Export (FREE, works for all plans)**

```bash
# Export via Supabase CLI
supabase db dump -f backup_before_migration.sql

# Or via pg_dump if you have direct access
pg_dump -h your-project.supabase.co \
  -U postgres \
  -d postgres \
  -f backup_before_migration.sql
```

**Option C: Quick Manual Backup (via SQL)**

```sql
-- Create backup tables (temporary, in same database)
CREATE TABLE backup_products_20260223 AS SELECT * FROM public.products;
CREATE TABLE backup_services_20260223 AS SELECT * FROM public.services;
CREATE TABLE backup_orders_20260223 AS SELECT * FROM public.orders;

-- Verify backups
SELECT COUNT(*) FROM backup_products_20260223;
SELECT COUNT(*) FROM backup_services_20260223;
SELECT COUNT(*) FROM backup_orders_20260223;
```

### Step 3: Run Migration

**Now run the main migration:**

```sql
-- In Supabase SQL Editor, run:
-- File: 20260223000000_multi_game_support.sql
```

**Watch for:**
- No error messages in the output
- Success messages like "INSERT 0 4" (for 4 games)
- All SQL statements execute successfully

### Step 4: Post-Migration Verification

**Immediately after migration, verify everything worked:**

```sql
-- In Supabase SQL Editor, run:
-- File: post_migration_verification.sql
```

**Check that:**
- ✓ All new tables created (games, categories, items)
- ✓ Data counts match (products/services migrated to items)
- ✓ Indexes and policies exist
- ✓ Original tables still intact
- ✓ Sample data looks correct

### Step 5: Test the Application

**Test these critical paths:**

1. **Homepage**: Categories display in header
2. **Category Pages**: `/accounts/gta5` loads with items
3. **Item Detail**: Click an item, details page loads
4. **Add to Cart**: Still works correctly
5. **Checkout**: Payment flow unaffected
6. **Admin Pages**: 
   - `/admin/games` - Can view/edit games
   - `/admin/items` - Can view/edit items
   - `/admin/orders` - Still works

### Step 6: Monitor

**For the first 24 hours after migration:**
- Watch for error reports
- Monitor Supabase logs
- Check user behavior analytics
- Test on mobile devices

## Rollback Procedures

### When to Rollback

Rollback if:
- Migration fails with errors
- Data counts don't match after migration
- Frontend completely breaks
- Critical functionality stops working
- You need to revert for emergency reasons

### Quick Rollback (Frontend Only)

If the database is fine but frontend is broken:

```bash
# Option 1: Git revert
git revert HEAD~2..HEAD  # Revert last 2 commits (adjust as needed)
npm run build
vercel --prod

# Option 2: Checkout previous version
git checkout <previous-commit-hash>
npm run build
vercel --prod
```

Old routes (`/products`, `/services`) will work with original tables.

### Full Database Rollback

If you need to completely undo the migration:

```sql
-- In Supabase SQL Editor, run:
-- File: rollback_multi_game_support.sql
```

**This will:**
- ✓ Drop all new tables (games, categories, items)
- ✓ Remove helper functions and views
- ✓ Leave original tables intact
- ✓ Restore database to pre-migration state

**After rollback:**
```bash
# Revert frontend code
git revert HEAD
npm run build
vercel --prod

# Everything should work as before
```

### Verify Rollback

```sql
-- Check that new tables are gone
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('games', 'categories', 'items');
-- Should return 0 rows

-- Check that original tables still exist
SELECT COUNT(*) FROM public.products;
SELECT COUNT(*) FROM public.services;
-- Should show your original data counts
```

## Emergency Recovery

### If Migration Partially Failed

```sql
-- Clean up partial migration
DROP TABLE IF EXISTS public.items CASCADE;
DROP TABLE IF EXISTS public.categories CASCADE;
DROP TABLE IF EXISTS public.games CASCADE;

-- Then re-run the full migration
-- File: 20260223000000_multi_game_support.sql
```

### If You Lose Data (Worst Case)

```sql
-- Restore from backup tables
INSERT INTO public.products SELECT * FROM backup_products_20260223;
INSERT INTO public.services SELECT * FROM backup_services_20260223;
INSERT INTO public.orders SELECT * FROM backup_orders_20260223;

-- Or restore from Supabase backup via Dashboard
```

### If Frontend and Database Desync

```bash
# Match frontend and database states:

# Option A: Both to old state
# 1. Run rollback_multi_game_support.sql
# 2. git revert the frontend changes

# Option B: Both to new state  
# 1. Re-run migration if needed
# 2. Redeploy frontend changes
```

## Best Practices Checklist

**Before Migration:**
- [ ] Run pre-migration checks
- [ ] Create database backup
- [ ] Test migration in development/staging first
- [ ] Schedule during low-traffic period
- [ ] Have rollback plan ready
- [ ] Notify team members

**During Migration:**
- [ ] Read each error message carefully
- [ ] Don't skip verification steps
- [ ] Take screenshots of check results
- [ ] Document any issues

**After Migration:**
- [ ] Run post-migration verification
- [ ] Test all critical user flows
- [ ] Monitor for 24 hours
- [ ] Keep backup for at least 7 days
- [ ] Document any issues encountered

## Testing Environments

**Recommended approach:**

1. **Local Development First**
   ```bash
   # Use local Supabase instance
   supabase start
   # Run migration locally
   # Test thoroughly
   ```

2. **Staging/Preview Environment**
   ```bash
   # Create preview deployment
   vercel --prod=false
   # Run migration on staging database
   # Full QA testing
   ```

3. **Production Last**
   ```bash
   # Only after successful staging test
   # Run during low-traffic hours
   # Have team available for support
   ```

## Support & Troubleshooting

### Common Issues

**Issue: "relation already exists"**
- **Cause**: Migration partially ran before
- **Fix**: Run rollback script first, then re-run migration

**Issue: "permission denied"**
- **Cause**: Insufficient database permissions
- **Fix**: Ensure you're using the service_role key or have admin access

**Issue: Items count doesn't match**
- **Cause**: `active = false` items not migrated
- **Fix**: Expected, migration only moves active items
- **If problem**: Check WHERE clauses in migration

**Issue: Frontend shows errors**
- **Cause**: Code expects new structure but database not migrated
- **Fix**: Run migration, or rollback frontend changes

### Getting Help

1. **Check Supabase Logs**
   - Dashboard → Database → Logs
   - Look for error messages

2. **Check Browser Console**
   - F12 → Console tab
   - Look for API errors

3. **Review Migration Output**
   - Each SQL statement should succeed
   - Look for "ERROR" or "FATAL" messages

4. **Verify RLS Policies**
   ```sql
   SELECT * FROM pg_policies 
   WHERE schemaname = 'public' 
     AND tablename IN ('games', 'categories', 'items');
   ```

## File Reference

- `20260223000000_multi_game_support.sql` - Main migration
- `pre_migration_checks.sql` - Run first to verify safety
- `post_migration_verification.sql` - Run after to verify success
- `rollback_multi_game_support.sql` - Emergency rollback
- `MULTI_GAME_IMPLEMENTATION.md` - Full technical documentation
- `QUICK_START_MULTI_GAME.md` - Quick setup guide

## Timeline Estimate

- Pre-migration checks: **5 minutes**
- Creating backup: **5-10 minutes**
- Running migration: **2-5 minutes**
- Post-migration verification: **5 minutes**
- Testing application: **15-30 minutes**
- **Total: ~30-60 minutes**

Schedule 2 hours to be safe and allow for troubleshooting.

---

**Remember**: Your original data is safe. The migration doesn't delete anything. You can always rollback!
