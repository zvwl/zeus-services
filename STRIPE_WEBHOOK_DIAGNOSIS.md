# Stripe Webhook Payment Processing Diagnosis

## Problem
- Payment succeeds on Stripe
- Redirect to `/cart?success=true&session_id=...` happens
- Page shows "Loading order details..." forever
- Or shows error "Order is taking longer than expected"
- Services disappear when user is logged in

## Root Cause Analysis

The flow is:
1. User clicks "Pay with Stripe"
2. App redirects to Stripe checkout page
3. User completes payment on Stripe
4. **Stripe sends webhook to `/functions/v1/stripe-webhook`** ← ORDER CREATED HERE
5. Webhook creates order in `orders` table
6. User redirected back to `/cart?success=true&session_id=XXX`
7. CartPage tries to fetch the order from `get-user-orders` function
8. If webhook hasn't completed yet, order doesn't exist → retry loop
9. Eventually timeout after 60 seconds

**Issue: Stripe webhook might be failing silently**

## Diagnostic Steps

### 1. Check Supabase Edge Function Logs
In Supabase Dashboard:
1. Go to `Edge Functions`
2. Select `stripe-webhook`
3. Check the **Logs** tab
4. Filter by recent time
5. Look for any errors or failed executions

### 2. Check Stripe Event Logs
In Stripe Dashboard:
1. Go to `Developers` → `Events`
2. Look for recent `charge.succeeded` or `checkout.session.completed` events
3. Click on event to see webhook delivery status
4. Check if webhook was sent to `https://[your-domain]/functions/v1/stripe-webhook`
5. See if it got **HTTP 200** or an error

### 3. Check Orders Table Directly
In Supabase SQL Editor:

```sql
-- Check if orders exist with this session_id
SELECT 
  id,
  user_id,
  checkout_session_id,
  status,
  payment_status,
  created_at
FROM public.orders
WHERE checkout_session_id = 'cs_test_...' -- Replace with your actual session ID from URL
LIMIT 5;

-- Count recent orders
SELECT COUNT(*) as total_orders
FROM public.orders
WHERE created_at > NOW() - INTERVAL '1 hour';

-- Check for any errors in order creation
SELECT 
  id,
  user_id,
  error_message,
  created_at
FROM public.order_errors
WHERE created_at > NOW() - INTERVAL '1 hour'
LIMIT 10;
```

### 4. Check Webhook Signature
The webhook signature might be failing. In Supabase Edge Functions logs, look for:
```
"Verifying: timestamp=..., computed=..., expected=..., valid=..."
```

If `valid=false`, the signature verification is failing.

## Common Issues

### Issue 1: Webhook Signature Secret Wrong
**Symptom**: Logs show "invalid=false" in signature verification

**Fix**: Check your `STRIPE_WEBHOOK_SECRET` environment variable in Supabase:
1. Go to Supabase Project Settings
2. Environment Variables
3. Check that `STRIPE_WEBHOOK_SECRET` is the signing secret (starts with `whsec_`) NOT the API key

### Issue 2: Orders Table RLS Policy Blocking Inserts
**Symptom**: Webhook runs but doesn't create order, no error in logs

**Fix**: Run in Supabase SQL Editor:
```sql
-- Check orders table RLS policies
SELECT policyname, permissive, roles, qual, with_check
FROM pg_policies
WHERE tablename = 'orders'
ORDER BY policyname;

-- The stripe-webhook function uses service_role, which bypasses RLS
-- But if policies block service_role, it will fail
-- Check that orders table allows service_role to insert
```

### Issue 3: Webhook Function Timeout
**Symptom**: Logs show "Function execution timeout"

**Fix**: The function might be taking too long. Check:
1. How long does it take to fetch items from database?
2. How long does payment verification take?
3. Network latency to external APIs?

**Solution**: Reduce complexity or increase timeout in function.

### Issue 4: User Session Invalid During Webhook
**Symptom**: Webhook tries to get user but auth.uid() returns null

**Fix**: The webhook runs in `service_role` context, not user context. It should work. But check logs.

## Solutions

### Solution 1: Verify Webhook is Configured
In Stripe Dashboard:
1. Go to `Developers` → `Webhooks`
2. Look for endpoint: `https://[your-domain]/functions/v1/stripe-webhook`
3. Check if it's **Enabled**
4. Check **Events** being listened to:
   - Should include: `checkout.session.completed`
   - Should include: `charge.succeeded`

### Solution 2: Retry Failed Webhook Manually
In Stripe Dashboard Event details:
1. Click event
2. Look for "Resend" button
3. Manually resend webhook
4. Watch Supabase logs to see if it processes

### Solution 3: Check Network Connectivity
The function might not be able to:
1. Connect to Supabase database
2. Call external APIs
3. Send emails

Check network errors in logs.

### Solution 4: Increase Retry Timeout
We've already updated CartPage to retry for up to 60 seconds instead of 10 seconds.

If orders are being created but slowly:
- Increase `MAX_RETRIES` to 30 and `RETRY_DELAY` to 2000ms = 60 seconds total

## Testing Checklist

- [ ] Check Supabase stripe-webhook function logs for errors
- [ ] Check Stripe webhook delivery logs
- [ ] Verify orders table has at least one order from past 1 hour
- [ ] Verify `STRIPE_WEBHOOK_SECRET` is correct (starts with `whsec_`)
- [ ] Check if webhook is enabled in Stripe dashboard
- [ ] Try manual webhook resend in Stripe dashboard
- [ ] Open browser DevTools Network tab during payment
- [ ] Check console for "Services fetched: X services" message
- [ ] Test on incognito/private window (to avoid cache issues)

## Temporary Workaround

If webhook continues failing:
1. After payment, user is redirected to `/cart?success=true`
2. User sees error "Order is taking longer than expected"
3. User clicks "View All Orders" button
4. Order should appear there within a few minutes

This isn't ideal but the payment DID go through and the order IS being created.

## What We've Fixed So Far

✅ CAPTCHA token reuse - reset immediately after login
✅ Services query - added logging to debug RLS issues
✅ Order fetch timeout - increased from 10 retries to 15 retries + hard 60s timeout
✅ Better error messages - users know to check Orders page

## Next Steps

1. **Check the logs** - Run the SQL diagnostics above
2. **Verify Stripe webhook is enabled** - Check Stripe dashboard
3. **Test with test card** - Use Stripe test card `4242 4242 4242 4242`
4. **Monitor function logs** - Watch for errors during next test payment
5. **Share logs** - If issue persists, share Supabase function logs

## Important Files
- `supabase/functions/stripe-webhook/index.ts` - Webhook handler
- `supabase/functions/create-checkout-session/index.ts` - Creates Stripe session
- `supabase/functions/get-user-orders/index.ts` - Fetches user orders
- `src/pages/CartPage.jsx` - Displays order after payment
