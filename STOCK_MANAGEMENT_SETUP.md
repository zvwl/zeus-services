# Stock Management Setup Guide

✅ **STATUS: FULLY IMPLEMENTED**

All stock management features are now live on the website! This guide shows you how to use them.

## Quick Start

1. **Database Migration**: Already applied ✅
2. **Frontend Code**: All pages updated ✅
3. **Webhook Integration**: Stock decreases on purchase ✅

## How to Use Stock Management

### Enabling Stock for an Item (Admin Panel)

1. Go to **Admin Dashboard** → **Items**
2. Click **Edit** on any item
3. Scroll to **"Stock Management"** section
4. Check **☑ Enable Stock Tracking**
5. Choose one:
   - **Limited stock**: Set a number (e.g., 10 accounts available)
   - **Unlimited stock**: Check **☑ Unlimited Stock** (for services that never run out)
6. Click **Save**

### What Customers See

**When an item has stock enabled:**
- ✅ Green badge: "5 in stock" (shows quantity)
- 🔴 Red badge: "Out of Stock" (when quantity = 0)
- 🚫 Disabled "Add to Cart" button when out of stock
- 📝 Message: "This item is currently out of stock. Check back later for restock!"

**When stock is disabled:**
- No badge shown
- Item always available

## Step 1: Apply Database Migration

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor** (left sidebar)
3. Click **New Query**
4. Copy the entire contents of `/supabase/migrations/20260225000000_add_stock_management.sql`
5. Paste into the SQL editor
6. Click **Run** (or press Ctrl/Cmd + Enter)
7. You should see "Success. No rows returned" - this is correct!

## Step 2: Verify Migration

Run this query to verify the new columns were added:

```sql
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'items' 
AND column_name IN ('stock_enabled', 'stock_quantity', 'stock_unlimited')
ORDER BY column_name;
```

You should see 3 rows showing the new columns.

## Step 3: Test Stock Functions

Test the stock check function:

```sql
-- Enable stock for a test item (replace with real item ID)
UPDATE items 
SET stock_enabled = true, stock_quantity = 10, stock_unlimited = false
WHERE id = 'YOUR_ITEM_ID_HERE';

-- Check if item is in stock
SELECT is_item_in_stock('YOUR_ITEM_ID_HERE');
-- Should return: true

-- Test decreasing stock
SELECT decrease_item_stock('YOUR_ITEM_ID_HERE', 1);
-- Should return: true

-- Check new stock level
SELECT stock_quantity FROM items WHERE id = 'YOUR_ITEM_ID_HERE';
-- Should return: 9
```

## Step 4: Frontend Implementation ✅

**All frontend components have been updated:**

✅ **AdminItemsPage.jsx**
- Stock management form fields (Enable, Unlimited, Quantity)
- Preview shows stock status
- Saves all stock fields to database

✅ **ServiceCard.jsx** 
- Stock badges on all service cards
- "Out of Stock" red badge or "X in stock" green badge

✅ **CategoryPage.jsx**
- Stock badges on cards
- Out-of-stock items show opacity 0.7
- "Out of Stock" button replaces "View Details"

✅ **ItemDetailPage.jsx**
- Stock badge next to price
- Out-of-stock message displayed
- "Add to Cart" disabled when no stock

✅ **ServiceDetail.jsx**
- Stock badge next to price
- Out-of-stock message displayed
- Platform selection disabled when no stock

✅ **Stripe Webhook** (`supabase/functions/stripe-webhook/index.ts`)
- Automatically calls `decrease_item_stock()` after successful payment
- Loops through all items in order
- Decreases stock by purchased quantity

## How Stock Management Works

### Three Stock Modes:

1. **Stock Disabled** (`stock_enabled = false`)
   - Item is always available
   - No stock tracking
   - Default for all existing items

2. **Limited Stock** (`stock_enabled = true`, `stock_unlimited = false`)
   - Item tracks inventory
   - When `stock_quantity` reaches 0, item shows "Out of Stock"
   - Stock decreases by 1 with each purchase

3. **Unlimited Stock** (`stock_enabled = true`, `stock_unlimited = true`)
   - Item always shows as "In Stock"
   - Useful for digital goods that never run out
   - Stock quantity is ignored

### Stock Behavior Examples:

**Example 1: Limited Account Stock**
```
GTA 5 Premium Account
stock_enabled: true
stock_unlimited: false
stock_quantity: 5

→ Shows "5 in stock"
→ After 5 purchases: "Out of Stock"
→ Add to cart button disabled
```

**Example 2: Unlimited Boosting Service**
```
GTA 5 Rank Boost
stock_enabled: true
stock_unlimited: true
stock_quantity: null

→ Always available
→ Never runs out
→ Shows "Available"
```

**Example 3: Stock Disabled (Default)**
```
GTA 5 Money Package
stock_enabled: false
stock_unlimited: false
stock_quantity: null

→ No stock tracking
→ Always available
→ No stock badge shown
```

## Managing Stock in Admin Panel

After code updates are deployed:

1. Go to **Admin Dashboard** → **Items**
2. Edit any item
3. You'll see new "Stock Management" section with:
   - ☐ Enable Stock Tracking
   - ☐ Unlimited Stock
   - Stock Quantity (number input)

4. Configure based on your needs:
   - **Digital services (rank boosts, etc.)**: Enable + Unlimited
   - **Pre-made accounts**: Enable + Set quantity (e.g., 10)
   - **No tracking needed**: Leave stock disabled

## Restocking Items

To restock an item when you get new inventory:

**Option 1: Admin Panel**
1. Edit the item
2. Update "Stock Quantity" to new number
3. Save

**Option 2: SQL Query**
```sql
UPDATE items
SET stock_quantity = 20,  -- New stock amount
    updated_at = NOW()
WHERE name = 'GTA 5 Premium Account';
```

## Monitoring Stock Levels

Query to see all items with low stock:

```sql
SELECT 
  i.name,
  i.stock_quantity,
  g.name as game,
  c.name as category
FROM items i
JOIN games g ON i.game_id = g.id
JOIN categories c ON i.category_id = c.id
WHERE i.stock_enabled = true
  AND i.stock_unlimited = false
  AND i.stock_quantity < 5  -- Low stock threshold
ORDER BY i.stock_quantity ASC;
```

## Troubleshooting

**Issue: Migration fails with "column already exists"**
- Solution: Already been run! This is expected, migration was already applied.

**Issue: Stock not decreasing after purchase**
- Check webhook logs in Supabase: **Functions** → **stripe-webhook** → **Logs**
- Look for: `✅ Stock decreased for item {id} by {quantity}`
- If you see `⚠️ Item {id} stock was already 0`, item was out of stock before purchase
- Verify item has `stock_enabled = true` in database

**Issue: Items showing out of stock incorrectly**
- Run: `SELECT id, name, stock_enabled, stock_unlimited, stock_quantity FROM items WHERE stock_enabled = true;`
- Check values are correct
- Fix: Edit item in admin panel and update stock quantity

**Issue: Can add out-of-stock items to cart**
- Clear browser cache and refresh page
- Check item's stock fields in database are correct
- Verify latest code is deployed

## Testing the Full Workflow

1. **Enable stock on a test item:**
   - Admin Panel → Items → Edit item
   - ☑ Enable Stock Tracking
   - Set Stock Quantity = 2
   - Save

2. **Customer view:**
   - Browse to the item page
   - Should see green badge "2 in stock"
   - Add to cart and checkout (test payment)

3. **After first purchase:**
   - Check webhook logs: should see `✅ Stock decreased`
   - Refresh item page: badge should show "1 in stock"

4. **After second purchase:**
   - Stock hits 0
   - Item shows red "Out of Stock" badge
   - "Add to Cart" button is disabled
   - Out-of-stock message appears

5. **Restock:**
   - Admin Panel → Edit item → Set Stock Quantity = 5
   - Save
   - Customer page shows "5 in stock" and cart button enabled again

## Need Help?

The complete system is implemented and ready to use. All pages automatically handle stock:
- Admin panel for managing stock
- Service cards show badges
- Detail pages block purchases when out of stock
- Webhook decreases stock on successful payment

Stock management is fully integrated! 🎉
