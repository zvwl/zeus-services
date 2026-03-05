# Fix Security Warnings - Checkout Sessions

## What These Warnings Mean

1. **Function Search Path Mutable** - Fixed by setting explicit search_path
2. **RLS Policy Always True** - Fixed by restricting inserts to owner or guest
3. **Leaked Password Protection** - Auth config (separate issue)

## Quick Fix (1 minute)

### Run the Security Fix

1. Open **Supabase Dashboard** → **SQL Editor**
2. Click **New Query**
3. Copy entire contents of: `supabase/migrations/20260305_fix_checkout_sessions_security.sql`
4. Paste and click **Run**
5. Should see: ✅ "Success. No rows returned"

This fixes warnings #1 and #2.

### Verify Fixes

Run this query to confirm policies are correct:
```sql
SELECT policyname, permissive, cmd, with_check 
FROM pg_policies 
WHERE tablename = 'checkout_sessions';
```

You should see:
- ✅ Policy: "Users can insert own or guest checkout sessions"
- ✅ With Check: `((auth.uid() = user_id) OR (user_id IS NULL))`

## What Changed

### Before (Security Risk ⚠️)
```sql
-- Anyone could insert with any user_id
WITH CHECK (true)
```

### After (Secure ✅)
```sql
-- Users can only insert their own sessions or guest sessions
WITH CHECK (auth.uid() = user_id OR user_id IS NULL)
```

This prevents:
- ❌ User A creating checkout sessions as User B
- ✅ User A creating their own sessions
- ✅ Guest users creating anonymous sessions

## Warning #3: Leaked Password Protection

This is a general Auth security feature, not related to checkout_sessions table.

**To enable (optional):**
1. Go to **Supabase Dashboard** → **Authentication** → **Policies**
2. Find "Password Requirements"
3. Enable "Check against compromised password database"

This prevents users from using passwords found in data breaches.

## Testing

After running the fix, test checkout still works:
1. Add items to cart (logged in)
2. Proceed to checkout → Should work ✅
3. Add items to cart (logged out/guest)
4. Proceed to checkout → Should work ✅

Both scenarios should work because:
- Logged in: `auth.uid() = user_id` ✅
- Guest: `user_id IS NULL` ✅
