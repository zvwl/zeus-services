# Multi-Game Platform Implementation

## Overview
This document describes the transformation of the Zeus Services website from a single-game (GTA5) platform to a multi-game marketplace with reorganized categories.

## Key Changes

### 1. Category Structure
**Old Categories:**
- Products
- Services

**New Categories:**
- **Topups** - In-game currency and credits
- **Boosting** - Level up and progression services  
- **Accounts** - Premium modded accounts

### 2. Supported Games
1. **GTA 5** (Active) - All categories
2. **Forza Horizon 6** (Coming Soon) - All categories planned
3. **Fortnite** (Active) - Topups (V-Bucks)
4. **Rocket League** (Active) - Boosting and Topups only

### 3. Database Schema Changes

#### New Tables Created:
- **`games`** - Stores all supported games
  - `id`, `name`, `slug`, `icon_url`, `description`
  - `is_active`, `is_coming_soon`, `display_order`
  
- **`categories`** - The three main categories
  - `id`, `name`, `slug`, `description`, `display_order`
  
- **`items`** - Unified table replacing products and services
  - `id`, `game_id`, `category_id`, `name`, `slug`, `price`
  - `description`, `icon`, `platforms`, `versions`, `details`
  - `active`, `featured`
  - Legacy fields: `legacy_type`, `legacy_id` (for migration tracking)

#### Views Created:
- **`items_with_details`** - Convenient view joining items with game and category info

#### Functions Created:
- **`get_popular_items_by_category(category_slug, limit)`** - Get featured items for a category
- **`get_games_for_category(category_slug)`** - Get all games that have items in a category

### 4. Frontend Components

#### New Components:
- **`CategoryDropdown.jsx`** - Dropdown menu showing games for each category
  - Displays on hover (desktop) or click (mobile)
  - Shows game icons, names, and item counts
  - Includes search functionality
  
- **`CategoryPage.jsx`** - Displays items for a specific game/category combo
  - Route: `/:categorySlug/:gameSlug`
  - Filters by platform, search, and price
  
- **`ItemDetailPage.jsx`** - Individual item detail page
  - Route: `/:categorySlug/:gameSlug/:itemSlug`
  - Platform and version selection
  - Add to cart functionality

#### Updated Components:
- **`Header.jsx`** - Now uses `CategoryDropdown` instead of static links
- **`App.jsx`** - Added new routes for category pages

#### New Admin Pages:
- **`AdminGamesPage.jsx`** - Manage games (CRUD operations)
- **`AdminItemsPage.jsx`** - Manage items across all games and categories
- **`AdminDashboard.jsx`** - Updated with navigation cards to all admin sections

### 5. URL Structure

#### Old Structure:
```
/products
/services  
/service/:id
/product/:id
```

#### New Structure:
```
/:categorySlug/:gameSlug
/:categorySlug/:gameSlug/:itemSlug

Examples:
/accounts/gta5
/boosting/rocket-league
/topups/fortnite
/accounts/gta5/rank-500-account
```

### 6. Migration Strategy

The database migration (`20260223000000_multi_game_support.sql`) handles:
1. Creating new tables (games, categories, items)
2. Migrating existing products → items (category: accounts, game: gta5)
3. Migrating existing services → items (category: boosting, game: gta5)
4. Setting up RLS policies for all new tables
5. Creating indexes for performance
6. Preserving legacy data with `legacy_type` and `legacy_id` columns

**Legacy tables are NOT deleted** - they remain for reference and rollback safety.

## Deployment Steps

### 1. Database Migration
```bash
# Run the migration in Supabase SQL Editor
# File: supabase/migrations/20260223000000_multi_game_support.sql
```

### 2. Add Game Icons
Upload game icons to your public folder:
```
public/game-icons/
  ├── gta5.webp
  ├── forza-horizon-6.webp
  ├── fortnite.webp
  ├── rocket-league.webp
  └── default.webp
```

Recommended size: 128x128px, WebP format for performance.

### 3. Verify Migration
After running the migration, verify:
- [ ] All games are visible in `/admin/games`
- [ ] All categories exist in the database
- [ ] Legacy products migrated to items
- [ ] Legacy services migrated to items
- [ ] Items appear in the new category pages

### 4. Update Content
Using the admin panels:
1. **Manage Games** (`/admin/games`)
   - Update game icons
   - Set display order
   - Mark coming soon games

2. **Manage Items** (`/admin/items`)
   - Review migrated items
   - Add new items for other games
   - Set featured items
   - Update prices and descriptions

### 5. Testing Checklist
- [ ] Category dropdowns work on header
- [ ] Game icons display correctly
- [ ] Category pages load for each game
- [ ] Item detail pages work
- [ ] Add to cart functions correctly
- [ ] Search within categories works
- [ ] Platform filters work
- [ ] Admin pages are accessible
- [ ] Old URLs still work (legacy routes)

## Future Considerations

### Adding a New Game:
1. Go to `/admin/games`
2. Add game with name, slug, icon, description
3. Set display order and active status
4. Go to `/admin/items`
5. Create items for that game in relevant categories

### Adding a New Category:
1. Add to `categories` table via SQL
2. Update display order
3. Restart frontend (categories cached at app level)

### Removing the Legacy Tables:
Once confident the migration is successful:
```sql
-- Backup first!
DROP TABLE IF EXISTS public.products CASCADE;
DROP TABLE IF EXISTS public.services CASCADE;
```

Note: This will break old routes `/products` and `/services` if not handled.

## Important Notes

1. **Backward Compatibility**: Old routes for `/products`, `/services`, `/service/:id`, and `/product/:id` are maintained for SEO and bookmarks.

2. **Cart System**: The cart system has been updated to handle the new item structure while maintaining compatibility with the checkout flow.

3. **Orders**: New orders will use the updated item structure. Historical orders remain unchanged.

4. **SEO**: Each category/game combination gets its own SEO-optimized page with proper meta tags.

5. **Performance**: Database indexes and views are optimized for the new multi-game structure.

## Troubleshooting

### Categories not showing in header:
- Check Supabase console for `categories` table
- Verify RLS policies allow anonymous read access
- Check browser console for errors

### Items not loading:
- Verify `items` table has data
- Check that `game_id` and `category_id` match existing records
- Verify RLS policies on `items` table

### Game icons not displaying:
- Ensure icons are uploaded to `public/game-icons/`
- Check `icon_url` in `games` table matches file path
- Verify file permissions

### Migration failed:
- Check Supabase logs for specific SQL errors
- Ensure no conflicting constraints
- Verify foreign key relationships

## Support

For issues or questions:
- Review Supabase logs in the dashboard
- Check browser console for frontend errors
- Verify database schema matches migration file
- Contact development team

## Version History

- **v2.0.0** (2026-02-23) - Multi-game platform implementation
  - Added games, categories, and items tables
  - Migrated products and services to unified items table
  - Updated UI with category dropdowns and game selection
  - Created new admin panels for games and items management
