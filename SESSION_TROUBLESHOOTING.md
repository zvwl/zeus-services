# Session & CAPTCHA Troubleshooting Guide

## Problem Summary
- User logs in ✓
- User places order → Gets kicked out ✗
- CAPTCHA sometimes fails on login
- Sessions table exists but might have missing RLS policies

## Root Causes

### 1. **CAPTCHA Token Reuse** (FIXED ✓)
We already fixed this by resetting CAPTCHA immediately after each login attempt.

### 2. **Session Not Being Created** (POSSIBLE)
The app tries to call `createSessionRecord()` but might fail silently if RLS policies aren't set up.

### 3. **Access Token Expiration During Checkout** (LIKELY)
The checkout function refreshes the session to get access token, but if session is invalid, user gets logged out.

### 4. **Auth State Change Not Updating** (POSSIBLE)
When checkout completes, an auth event might trigger that clears the user state.

## Step-by-Step Diagnosis

### 1. Check Sessions Table Configuration
Run in Supabase SQL Editor:

```sql
-- Check if RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'sessions';

-- Check all policies
SELECT policyname, permissive, roles, qual
FROM pg_policies
WHERE tablename = 'sessions'
ORDER BY policyname;

-- Check if you can insert a session (test auth)
-- This will only work if authenticated
INSERT INTO public.sessions (user_id, user_agent, ip_address)
VALUES (auth.uid(), 'Test', '127.0.0.1')
RETURNING *;
```

### 2. Check Admin/Customer Records
```sql
-- Check if your user exists in customers table
SELECT user_id, email, name, created_at
FROM public.customers
WHERE email = 'your-email@example.com';

-- Check if your user is admin
SELECT user_id, active, created_at
FROM public.admin_users
WHERE user_id = 'your-user-id';
```

### 3. Monitor Browser Console During Checkout
Watch for these errors:
- "Session expired"
- "Failed to fetch access token"
- "createSessionRecord error"
- "Unauthorized" on create-order or create-checkout-session

### 4. Check Supabase Logs
In Supabase Dashboard:
1. Go to `Authentication` → `Logs`
2. Look for `Failed token refresh` or `Session expired`
3. Go to `Edge Functions` → Logs for `create-order` and `create-checkout-session` errors

## Solutions

### Solution 1: Ensure Sessions RLS Policies Exist
If the SQL check above shows NO policies, run this:

```sql
-- Enable RLS if not already enabled
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

-- Drop old policies if they exist
DROP POLICY IF EXISTS "users_create_sessions" ON public.sessions;
DROP POLICY IF EXISTS "users_view_sessions" ON public.sessions;
DROP POLICY IF EXISTS "users_update_sessions" ON public.sessions;
DROP POLICY IF EXISTS "users_delete_sessions" ON public.sessions;

-- Create new policies
CREATE POLICY "users_create_sessions"
  ON public.sessions
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "users_view_sessions"
  ON public.sessions
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "users_update_sessions"
  ON public.sessions
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "users_delete_sessions"
  ON public.sessions
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());
```

### Solution 2: Handle Session Expiry Gracefully in App
The app already tries to handle this in `handleCheckout()`:
```javascript
const { data: sessionData } = await supabase.auth.getSession()
const sessionUser = sessionData?.session?.user
const accessToken = sessionData?.session?.access_token

if (!sessionUser?.id) {
  // Redirect to login if no session
  navigate('/login')
}
```

This should work, but if you keep getting logged out, it might be that:
1. The session token is being invalidated by Supabase
2. The auth state listener is clearing the user on some event

### Solution 3: Check Token Refresh
Add logging to see if token refresh is failing:

In `src/contexts/AuthContext.jsx`, after line 160 (in onAuthStateChange):
```javascript
const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
  console.log('Auth state changed:', _event, session?.user?.id);
  // ... rest of code
})
```

Then check browser console during checkout to see if there's an unexpected auth event.

### Solution 4: Verify Email Before Checkout
The CheckoutPage already checks this:
```javascript
if (!emailVerified) {
  alert('Please verify your email before checking out')
  return
}
```

Make sure your email IS verified before testing checkout.

### Solution 5: Check CAPTCHA Issues  
If you still see CAPTCHA errors:
1. Your hCaptcha sitekey might be wrong (check `.env`)
2. The CAPTCHA might be rate-limited (Supabase sees too many failed attempts)
3. Supabase might need time to refresh CAPTCHA configuration (wait 5 mins)

## Testing Checklist

- [ ] Login with email + password
- [ ] Verify email (check email inbox for verification link)
- [ ] Add item to cart
- [ ] Go to checkout
- [ ] Complete order (don't get logged out)
- [ ] Navigate to Orders page
- [ ] See your order there
- [ ] Try logging out and back in
- [ ] Check browser console - no errors
- [ ] Check Supabase logs - no "Session expired" errors

## If Problem Persists

1. Run all the SQL diagnostics above
2. Take screenshots of any error messages
3. Check browser DevTools Network tab during checkout - see if any requests fail
4. Check Supabase function logs for errors in `create-order` or `create-checkout-session`
5. Share the specific error message you see

## What NOT to Blame (Probably)
- ❌ DOMPurify - it only sanitizes displayed HTML, doesn't affect sessions
- ❌ Display name validation - only affects signup, not checkout
- ❌ Reviews/products tables - not involved in checkout flow
- ✓ CAPTCHA - we fixed token reuse
- ✓ Session management - might need RLS policies
- ✓ Token refresh - might be timing out
