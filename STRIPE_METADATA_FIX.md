# Stripe Metadata 500-Character Limit Fix

## Problem
When users added multiple items to cart, Stripe checkout failed with error:
```
Metadata values can have up to 500 characters, but you passed in a value that is 577+ characters
```

This happened because cart items with details were being stored in Stripe metadata as JSON, exceeding the 500-character limit even with minimal data.

## Solution
Completely bypassed the metadata limit by storing cart items in a database table before checkout:
- **Before**: Cart items stored in Stripe metadata (limited to 500 chars)
- **After**: Cart items stored in `checkout_sessions` table, only session ID in metadata
- Webhook fetches full cart data from database using session ID
- Supports unlimited cart items regardless of size

## Changes Made

### 1. Database Migration: `supabase/migrations/20260305_checkout_sessions_table.sql`
- Created `checkout_sessions` table to temporarily store cart data
- Includes automatic expiration after 24 hours
- RLS policies for security
- Cleanup function for expired sessions

### 2. `supabase/functions/create-checkout-session/index.ts`
- Generates unique session ID before Stripe checkout
- Stores full cart items in `checkout_sessions` table
- Passes only session ID in Stripe metadata (~50 chars vs 500+)

### 3. `supabase/functions/stripe-webhook/index.ts`
- Fetches cart data from `checkout_sessions` table using session ID
- Creates order with full item details
- Cleans up checkout session after successful order

## How to Deploy

### Step 1: Run Database Migration
```sql
-- In Supabase SQL Editor, run:
-- File: supabase/migrations/20260305_checkout_sessions_table.sql
```

Or via CLI:
```bash
supabase db push
```

### Step 2: Deploy Edge Functions

Via Supabase CLI (Recommended):
```bash
supabase functions deploy create-checkout-session
supabase functions deploy stripe-webhook
```

Or via Dashboard:
1. Go to Supabase Dashboard → **Edge Functions**
2. Update each function with code from local files
3. Click **Deploy** for each

## Testing

After deployment, test the fix:

1. **Add many items to cart** (10+ items with long names)
2. **Proceed to checkout** with Stripe
3. **Complete payment** using test card: `4242 4242 4242 4242`
4. **Verify**:
   - Payment succeeds ✅
   - Order is created in database ✅
   - Order items display correctly ✅
   - No metadata limit error ❌
   - Checkout session cleaned up ✅

## Architecture

### Checkout Flow
```
User Cart → create-checkout-session
  ↓
Generate session_id
  ↓
Store items in checkout_sessions table
  ↓
Create Stripe session (metadata: {session_id})
  ↓
User pays via Stripe
  ↓
Webhook receives checkout.session.completed
  ↓
Fetch items from checkout_sessions table
  ↓
Create order in orders table
  ↓
Delete checkout_sessions record
```

### Metadata Size Comparison

**Before** (577+ characters, fails with 4 items):
```json
[{"id":"...","platform":"Epic Games","version":"Standard","quantity":1,"price_usd":9.99,"price_converted":9.99}, ...]
```

**After** (~50 characters, works with unlimited items):
```json
{"session_id":"cs_1234567890_abc123","user_id":"..."}
```

## Benefits

- ✅ Fixes 500-character metadata limit permanently
- ✅ Supports unlimited cart items (no size restrictions)
- ✅ Ensures data integrity (all details in database)
- ✅ Auto-cleanup of expired sessions
- ✅ No frontend changes required
- ✅ More secure (sensitive data not in Stripe metadata)

## Maintenance

### Clean Up Expired Sessions

Checkout sessions auto-expire after 24 hours. To manually clean them:

```sql
SELECT cleanup_expired_checkout_sessions();
```

Or set up a cron job (Supabase Dashboard → Database → Cron Jobs):
```sql
-- Run daily at 3 AM
SELECT cron.schedule(
  'cleanup-checkout-sessions',
  '0 3 * * *',
  $$ SELECT cleanup_expired_checkout_sessions() $$
);
```

## Rollback (if needed)

If you need to revert these changes:

1. Drop the table:
```sql
DROP TABLE IF EXISTS public.checkout_sessions CASCADE;
```

2. Restore functions from git:
```bash
git checkout HEAD~1 supabase/functions/create-checkout-session/index.ts
git checkout HEAD~1 supabase/functions/stripe-webhook/index.ts
```

3. Redeploy the functions
