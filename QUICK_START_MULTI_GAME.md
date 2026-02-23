# Quick Start Guide - Multi-Game Platform

## Prerequisites
- Supabase project set up
- Node.js and npm installed
- Access to Supabase SQL editor

## Step-by-Step Setup

### 1. Run Database Migration

**⚠️ IMPORTANT: Safety First!**
Before running the migration, review the [SAFE_MIGRATION_GUIDE.md](SAFE_MIGRATION_GUIDE.md) for:
- Pre-migration safety checks
- Backup procedures
- Rollback instructions

**Quick Migration Steps:**

1. **Run Pre-Migration Checks** (RECOMMENDED)
   - Open Supabase Dashboard → SQL Editor
   - Run `supabase/migrations/pre_migration_checks.sql`
   - Verify all checks pass ✓

2. **Run Main Migration**
   - Copy contents of `supabase/migrations/20260223000000_multi_game_support.sql`
   - Paste and run in SQL Editor
   - Verify no errors in the output

3. **Run Post-Migration Verification** (REQUIRED)
   - Run `supabase/migrations/post_migration_verification.sql`
   - Verify all counts match ✓

**Expected Result:**
- 3 new tables: `games`, `categories`, `items`
- Your existing products migrated to `items` (category: accounts)
- Your existing services migrated to `items` (category: boosting)
- Original `products` and `services` tables remain intact (safe for rollback)

### 2. Prepare Game Icons

1. Create game icon files (128x128px, WebP format recommended):
   - `gta5.webp`
   - `forza-horizon-6.webp`
   - `fortnite.webp`
   - `rocket-league.webp`
   - `default.webp` (fallback)

2. Place them in: `public/game-icons/`

**Icon Resources:**
- Use official game logos/artwork
- Ensure transparent or solid backgrounds
- Test visibility at small sizes (40x40px)

### 3. Install Dependencies

```bash
npm install
```

No new dependencies required - all changes use existing packages.

### 4. Start Development Server

```bash
npm run dev
```

### 5. Verify Migration

Visit these URLs to confirm everything works:

1. **Homepage**: `http://localhost:5173/`
   - Header should show: Topups, Boosting, Accounts (instead of Products/Services)
   - Hover over each to see game dropdown

2. **Admin Dashboard**: `http://localhost:5173/admin/dashboard`
   - Should see navigation cards for Games and Items

3. **Admin Games**: `http://localhost:5173/admin/games`
   - Should show 4 games (GTA 5, Forza Horizon 6, Fortnite, Rocket League)
   - Add/edit games as needed

4. **Admin Items**: `http://localhost:5173/admin/items`
   - Should show migrated products and services
   - Filter by game and category

5. **Category Pages**: Try these URLs:
   - `http://localhost:5173/accounts/gta5`
   - `http://localhost:5173/boosting/gta5`

### 6. Customize Your Games

#### Add Items for Other Games:

1. Go to `/admin/items`
2. Click "Add New Item"
3. Select game (e.g., Fortnite)
4. Select category (e.g., Topups)
5. Fill in details (name, price, description, etc.)
6. Select platforms (if applicable)
7. Add details/features
8. Mark as active and/or featured
9. Submit

#### Update Game Settings:

1. Go to `/admin/games`
2. Edit each game:
   - Set proper icon URLs
   - Update descriptions
   - Set display order
   - Mark Forza Horizon 6 as "Coming Soon"
   - Ensure GTA 5, Fortnite, Rocket League are "Active"

### 7. Test User Flow

1. **Browse Categories**:
   - Hover over "Accounts" → Click "GTA 5"
   - Should see `/accounts/gta5` with all account items

2. **View Item Details**:
   - Click any item card
   - Should see `/accounts/gta5/item-slug` with full details

3. **Add to Cart**:
   - Select platform and version
   - Click "Add to Cart"
   - Should redirect to cart page

4. **Check Responsiveness**:
   - Test on mobile (resize browser)
   - Category dropdowns should work on mobile
   - Admin pages should be usable

### 8. Deploy to Production

#### Vercel Deployment:

```bash
# Build locally to test
npm run build

# Deploy (if using Vercel CLI)
vercel --prod

# Or push to GitHub (if connected to Vercel)
git add .
git commit -m "Implement multi-game platform"
git push origin main
```

#### Run Migration on Production:

1. Go to your production Supabase project
2. Run the same migration SQL
3. Verify tables were created
4. Check items were migrated correctly

### 9. Post-Deployment Checklist

- [ ] All games visible in production
- [ ] Game icons loading correctly
- [ ] Category dropdowns work
- [ ] Item pages load properly
- [ ] Add to cart functional
- [ ] Checkout flow still works
- [ ] Admin pages accessible
- [ ] Old URLs redirect or still work
- [ ] SEO meta tags correct
- [ ] Mobile responsive

## Common Issues

### Issue: Categories not showing in header
**Solution**: 
- Check Supabase → Table Editor → `categories` table exists
- Verify RLS policies allow anonymous SELECT
- Clear browser cache

### Issue: Items not loading on category pages
**Solution**:
- Check `items` table has `game_id` and `category_id` set correctly
- Verify items are marked as `active = true`
- Check browser console for API errors

### Issue: Game icons not displaying
**Solution**:
- Verify files exist in `public/game-icons/`
- Check `icon_url` in `games` table matches file path exactly
- Try clearing CDN cache if using one
- Check browser console for 404 errors

### Issue: Migration errors
**Solution**:
- Check for existing table name conflicts
- Ensure you have proper Supabase permissions
- Try running migration SQL in smaller chunks
- Check Supabase logs for detailed error messages

## Next Steps

1. **Populate Items**: Add items for Fortnite, Rocket League, etc.
2. **Update Icons**: Replace placeholder icons with real game artwork
3. **Set Featured**: Mark featured items for better visibility
4. **Test Orders**: Place test orders to ensure checkout works
5. **SEO Optimization**: Update meta descriptions for each game/category
6. **Analytics**: Monitor which games/categories get most traffic

## Support Resources

- **Full Documentation**: See `MULTI_GAME_IMPLEMENTATION.md`
- **Database Schema**: Check migration file for table structures
- **Supabase Docs**: https://supabase.com/docs
- **React Router**: https://reactrouter.com/

## Rollback Plan

If something goes wrong:

1. **Frontend Rollback**:
   ```bash
   git revert HEAD
   npm run build
   vercel --prod
   ```

2. **Database Rollback**:
   - Legacy tables (`products`, `services`) are preserved
   - Simply revert frontend changes
   - Old routes will work with old tables

3. **Emergency Hotfix**:
   - Remove category dropdown routes from `App.jsx`
   - Restore old header navigation
   - Deploy immediately

## Success Metrics

After deployment, track:
- Time on site (should increase with more options)
- Cart conversion rate
- Most popular games/categories
- Mobile vs desktop usage
- Page load times

---

**Need Help?** 
Check the main documentation: `MULTI_GAME_IMPLEMENTATION.md`
Review database migration: `supabase/migrations/20260223000000_multi_game_support.sql`
