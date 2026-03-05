# URGENT: Deploy Stripe Checkout Fix

## What This Fixes
Your Stripe checkout fails when users add multiple items to cart (500-char metadata limit).
This fix allows unlimited cart items by storing data in database instead of Stripe metadata.

## Quick Deploy Steps

### 1️⃣ Run Database Migration (1 minute)

1. Open **Supabase Dashboard** → **SQL Editor**
2. Click **New Query**
3. Copy entire contents of: `supabase/migrations/20260305_checkout_sessions_table.sql`
4. Paste into SQL editor
5. Click **Run** (or Ctrl/Cmd + Enter)
6. Should see: ✅ "Success. No rows returned"

### 2️⃣ Deploy Edge Functions (2 minutes)

#### Option A: CLI (if you have Supabase CLI installed)
```powershell
cd c:\dev\Zeuservices
supabase functions deploy create-checkout-session
supabase functions deploy stripe-webhook
```

#### Option B: Dashboard (if no CLI)
1. Go to **Supabase Dashboard** → **Edge Functions**
2. Click **create-checkout-session**
3. Replace ALL code with contents from: `supabase/functions/create-checkout-session/index.ts`
4. Click **Deploy**
5. Wait for deployment to complete
6. Click **stripe-webhook**
7. Replace ALL code with contents from: `supabase/functions/stripe-webhook/index.ts`
8. Click **Deploy**
9. Wait for deployment to complete

### 3️⃣ Test It (1 minute)

1. Go to your website
2. Add 5+ items to cart
3. Click "Pay with Stripe"
4. Should redirect to Stripe checkout (no error!)
5. Use test card: `4242 4242 4242 4242`
6. Complete payment
7. Verify order appears in Orders page

## What Changed

- **Database**: New `checkout_sessions` table stores cart temporarily
- **create-checkout-session**: Stores cart in DB, passes only session ID to Stripe
- **stripe-webhook**: Fetches cart from DB using session ID

## If You See Errors

### "Table checkout_sessions does not exist"
→ Run the SQL migration (Step 1)

### "Failed to prepare checkout"
→ Make sure migration ran successfully
→ Check Supabase Dashboard → Database → Tables for `checkout_sessions`

### Still getting 500-char error
→ Make sure BOTH functions are deployed with new code
→ Hard refresh your website (Ctrl+Shift+R)

## Need Help?

Share error messages from:
- Browser console (F12 → Console tab)
- Supabase Dashboard → Edge Functions → Logs

---

**After deployment, the 500-character limit will be completely eliminated.**
Users can add unlimited items to cart without any errors.
