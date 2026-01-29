# Payment Flow Diagnostics & Troubleshooting Guide

## Current Issue
After Stripe payment, you're redirected to `/cart?success=true&session_id=...` but:
- ❌ Stuck on "Loading order details"
- ❌ Getting signed out
- ❌ Order not displaying

## Root Cause Analysis

The flow is breaking at one of these points:

### 1. **Session Not Being Restored After Redirect**
Currently: `AuthContext.jsx` has a 200ms delay to restore session
```javascript
await new Promise(resolve => setTimeout(resolve, 200))
const { data: { session }, error } = await supabase.auth.getSession()
```

**Question**: Is the session being restored?
- Check browser DevTools → Application → Local Storage
- Look for `sb-{PROJECT_ID}-auth-token` key
- If empty → session wasn't saved during checkout

---

### 2. **Stripe Webhook Not Creating Orders**
The webhook should fire when Stripe confirms payment:
1. Payment completes on Stripe
2. Stripe calls your webhook: `POST /functions/v1/stripe-webhook`
3. Webhook creates order in database
4. You redirect to success page
5. Frontend queries order by session_id

**To Check This in Supabase:**

```sql
-- Check if orders table has any entries
SELECT id, checkout_session_id, user_id, status, payment_status, created_at 
FROM orders 
ORDER BY created_at DESC 
LIMIT 10;

-- Check your recent payment's session ID
-- Replace cs_test_... with your actual session ID from the URL
SELECT * FROM orders WHERE checkout_session_id = 'cs_test_a1M8YMIMwZzSSj9B4qTztLnJEPUWdjPqjvg86TJC7ZnFcVXmSdc4rnrZyY';
```

If the order exists → Problem is in the frontend fetching
If the order doesn't exist → Webhook isn't being called

---

### 3. **Frontend Can't Find Order**
`get-order-by-session` function queries with:
```typescript
const { data, error } = await supabaseService
  .from("orders")
  .select("*")
  .eq("checkout_session_id", sessionId)
  .maybeSingle();
```

**To debug the function:**
```bash
# In Supabase Dashboard → Functions → get-order-by-session → Logs
# Check if the function is being called and what it returns
```

---

## Step-by-Step Diagnostic

### Step 1: Check if Order is Created
1. Go to Supabase Dashboard
2. Go to SQL Editor
3. Run this query with your session ID:
```sql
SELECT * FROM orders 
WHERE checkout_session_id = 'cs_test_a1M8YMIMwZzSSj9B4qTztLnJEPUWdjPqjvg86TJC7ZnFcVXmSdc4rnrZyY'
LIMIT 1;
```

**If order EXISTS:**
- Problem is in frontend fetching
- Check CartPage console logs
- Should show "Order found" or "Order not found" after retries

**If order DOESN'T EXIST:**
- Webhook isn't creating the order
- Check Stripe Webhook Logs (stripe.com → Webhooks → Event history)
- Look for `checkout.session.completed` event for your session ID
- Check if webhook returned 200 status

---

### Step 2: Check Stripe Webhook Status
1. Go to stripe.com → Developers → Webhooks
2. Find your endpoint (should be like `https://zeuservices.com/functions/v1/stripe-webhook`)
3. Click it and check recent events
4. Look for your payment session ID in the event history
5. Click the event to see:
   - Request: Did Stripe send the event?
   - Response: Did your webhook return 200?
   - Logs: Any error messages?

If webhook shows ❌ (failed attempts):
- Check Supabase Function Logs
- Go to Supabase → Functions → stripe-webhook → Logs
- Search for your session ID
- Look for error messages

---

### Step 3: Check Browser Console During Payment
When you complete payment and get redirected:

**Expected logs in order:**
```
📋 Starting session restoration...
✅ Session check complete: {hasSession: true, email: 'your@email.com'}
✅ User session restored: your@email.com
✅ Success page check: {hasUser: true, email: 'your@email.com', authLoading: false}
✅ User is logged in: your@email.com
💳 Payment success! Fetching order: cs_test_...
Waiting for Supabase session hydration...
Session check result: {hasSession: true, email: 'your@email.com'}
Access token available: true
✅ Order found: order_xyz
```

**If you see different logs:**
- Note what's different
- This tells us where the flow breaks

---

## Required Supabase Checks

Before you try another payment, verify these in Supabase:

### 1. Database RLS Policies
```sql
-- Check orders table RLS policies
SELECT * FROM pg_policies WHERE tablename = 'orders';

-- Make sure service role can insert orders
-- And anon key can select orders by session_id
```

### 2. Environment Variables in Supabase
Verify these are set in your Supabase project:
- ✅ `STRIPE_WEBHOOK_SECRET` - from Stripe
- ✅ `NOTES_ENC_KEY` - for encrypting order notes
- ✅ `FRONTEND_URL` - should be https://zeuservices.com

### 3. Function Permissions
All three functions need to be callable:
- `create-checkout-session` - Creates Stripe session
- `stripe-webhook` - Handles Stripe events
- `get-order-by-session` - Fetches order

Check each function's visibility/permissions in Supabase Dashboard

---

## What to Do Now

1. **Run the SQL query** above to check if order was created
2. **Check Stripe webhook logs** to see if webhook was called
3. **Check Supabase function logs** for any errors
4. **Share the results** with me and I can help fix the exact issue

If order was created:
- Problem is in frontend → I'll fix the CartPage fetch logic

If order wasn't created:
- Problem is in webhook → I'll fix the stripe-webhook function

---

## Important: Session Persistence

Your session is saved in localStorage with key:
```
sb-{SUPABASE_PROJECT_ID}-auth-token
```

This is set automatically when you log in. After Stripe redirect:
1. Page reloads
2. Supabase detects the stored token in localStorage
3. Session is restored
4. You stay logged in

**If this isn't working:**
- Check if localStorage is being blocked
- Check if cookies/storage are disabled
- Check if privacy mode is enabled

---

## Session Not Being Saved?

If `persistSession: true` isn't working, it might be because:
1. ❌ Private/Incognito mode blocks localStorage
2. ❌ Browser privacy settings block storage
3. ❌ Site data is being cleared automatically
4. ❌ Session expires before webhook completes

**Solution**: Once you figure out where the flow breaks, I can add fallback recovery logic.

---

## Next Steps

1. Check the Supabase query results
2. Check Stripe webhook status  
3. Check Supabase function logs
4. Run a test payment and watch the logs
5. Report back what you find

Then I can identify the exact fix needed!
