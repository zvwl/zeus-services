# 🔑 KEYS SETUP GUIDE - ZEUSERVICES PRODUCTION

## CRITICAL: GET FRESH KEYS FOR ALL SERVICES

Below are the **exact keys** you need to refresh and configure. Follow this guide step by step.

---

## 1️⃣ SUPABASE KEYS 🗄️

### Where to get them:
1. Go to: https://supabase.com/dashboard/project/xdvbhungoadwlmeddelt/settings/api
2. Find these keys:

### Keys needed:
```env
VITE_SUPABASE_URL=https://xdvbhungoadwlmeddelt.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### For Edge Functions (Set in Supabase Dashboard):
Go to: https://supabase.com/dashboard/project/xdvbhungoadwlmeddelt/functions

Add these secrets:
```
SUPABASE_URL=https://xdvbhungoadwlmeddelt.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=[Get from API settings - Service Role Key]
FRONTEND_URL=https://zeuservices.com
```

---

## 2️⃣ STRIPE KEYS 💳

### Where to get them:
https://dashboard.stripe.com/apikeys

### Keys needed (BOTH test and live):

#### Test Mode Keys (for development):
```env
VITE_STRIPE_PUBLISHABLE_KEY_TEST=pk_test_51SpdS9RrRqjoNftZEdiaxFTy...
```

#### Live Mode Keys (for production):
```env
VITE_STRIPE_PUBLISHABLE_KEY_LIVE=pk_live_[GET THIS FROM STRIPE]
```

#### Active Key (switch between test/live):
```env
# For development:
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_51SpdS9RrRqjoNftZEdiaxFTy...

# For production:
# VITE_STRIPE_PUBLISHABLE_KEY=pk_live_[YOUR_LIVE_KEY]
```

### For Edge Functions (Set in Supabase Dashboard):
```
STRIPE_SECRET_KEY_TEST=sk_test_[GET FROM STRIPE]
STRIPE_SECRET_KEY_LIVE=sk_live_[GET FROM STRIPE]
STRIPE_SECRET_KEY=sk_test_[ACTIVE KEY]
STRIPE_WEBHOOK_SECRET=whsec_[GET FROM STRIPE WEBHOOKS]
```

### Stripe Webhook Setup:
1. Go to: https://dashboard.stripe.com/webhooks
2. Click "Add endpoint"
3. URL: `https://xdvbhungoadwlmeddelt.supabase.co/functions/v1/stripe-webhook`
4. Events to select:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
5. Copy the **Signing Secret** (starts with `whsec_`)
6. Add to Supabase Edge Functions secrets as `STRIPE_WEBHOOK_SECRET`

---

## 3️⃣ HCAPTCHA KEYS 🤖

### hCaptcha Sitekey
Current key to use: `9342fb48-1750-4ca6-90bc-31b840108d18`
Make sure hostnames include `zeuservices.com`, `www.zeuservices.com`, and `localhost`.

### Where to get them:
https://dashboard.hcaptcha.com/sites

### Keys needed:
```env
# Public Site Key (goes in .env)
VITE_HCAPTCHA_SITEKEY=[COMPLETE KEY FROM HCAPTCHA]
```

### For Edge Functions (Set in Supabase Dashboard):
```
HCAPTCHA_SECRET=[SECRET KEY FROM HCAPTCHA]
```

### How to set up hCaptcha correctly:

1. **Login/Signup**: https://dashboard.hcaptcha.com/
2. **Add a New Site**:
   - Site Name: `ZeusServices`
   - Hostnames: 
     - `zeuservices.com`
     - `www.zeuservices.com`
     - `localhost` (for testing)
3. **Get Keys**:
   - **Sitekey**: This is your public key → Add to `.env` as `VITE_HCAPTCHA_SITEKEY`
   - **Secret Key**: Click "Settings" → Copy secret → Add to Supabase Edge Functions
4. **Test it**: 
   - Go to your signup page
   - The hCaptcha widget should appear
   - Complete the challenge
   - Signup should work

---

## 4️⃣ VERCEL DEPLOYMENT 🚀

Vercel doesn't need special keys, but you need to add environment variables:

### Where to add them:
https://vercel.com/your-username/zeuservices/settings/environment-variables

### Add these variables:
```
VITE_SUPABASE_URL=https://xdvbhungoadwlmeddelt.supabase.co
VITE_SUPABASE_ANON_KEY=[Your Supabase Anon Key]
VITE_FRONTEND_URL=https://zeuservices.com
VITE_STRIPE_PUBLISHABLE_KEY=[Your Stripe Live Publishable Key]
VITE_HCAPTCHA_SITEKEY=[Your Complete hCaptcha Sitekey]
```

Make sure to select **Production** environment when adding these.

---

## 5️⃣ 2FA SETUP 🔐

### Database Migration:
Run this SQL in your Supabase SQL Editor:

```sql
-- This file already exists at: supabase/migrations/20260122_add_2fa_support.sql
-- Run it in Supabase Dashboard > SQL Editor
```

Go to: https://supabase.com/dashboard/project/xdvbhungoadwlmeddelt/sql/new

Copy and paste the contents of `supabase/migrations/20260122_add_2fa_support.sql` and run it.

### Frontend Integration:
2FA UI is now available in Settings > Security tab. The infrastructure is ready, but actual TOTP generation requires additional npm packages:

```bash
npm install otplib qrcode
```

Then implement the full 2FA flow (already scaffolded in SettingsPage.jsx).

---

## 📝 SUMMARY CHECKLIST

- [ ] **Supabase Keys**: Get fresh ANON key and SERVICE_ROLE key
- [ ] **Stripe Test Keys**: Verify test keys work
- [ ] **Stripe Live Keys**: Get production keys (pk_live_ and sk_live_)
- [ ] **Stripe Webhook**: Create webhook endpoint and get signing secret
- [ ] **hCaptcha Sitekey**: Get COMPLETE sitekey (current one is incomplete!)
- [ ] **hCaptcha Secret**: Get secret key for server-side validation
- [ ] **Vercel Env Vars**: Add all production keys to Vercel dashboard
- [ ] **Supabase Edge Functions**: Add all secrets (Stripe, hCaptcha, Supabase)
- [ ] **2FA Migration**: Run the SQL migration in Supabase
- [ ] **Test Everything**: Test signup, login, captcha, payments

---

## 🚨 IMPORTANT NOTES

1. **Never commit `.env` file** - It's already in `.gitignore`
2. **Use `.env.example` as template** - Fill in real values in `.env`
3. **Keep test keys** - Don't delete them, switch between test/live as needed
4. **hCaptcha is REQUIRED** - Both login and signup now require it
5. **Test mode first** - Always test with Stripe test keys before going live

---

## 🎯 QUICK START

1. **Clone `.env.example` to `.env`**:
   ```bash
   copy .env.example .env
   ```

2. **Fill in all keys in `.env`** (follow sections above)

3. **Add keys to Supabase Edge Functions**:
   - Dashboard > Edge Functions > Secrets

4. **Add keys to Vercel**:
   - Dashboard > Settings > Environment Variables

5. **Test locally**:
   ```bash
   npm run dev
   ```

6. **Deploy to production**:
   ```bash
   git add .
   git commit -m "Production ready with secure keys"
   git push origin main
   ```

Vercel will auto-deploy from your GitHub repository.

---

## 🆘 TROUBLESHOOTING

### hCaptcha not showing:
- Check that `VITE_HCAPTCHA_SITEKEY` is set correctly in `.env`
- Verify the key is COMPLETE (not truncated)
- Check browser console for errors
- Verify hostname is allowed in hCaptcha dashboard

### Stripe checkout failing:
- Verify `STRIPE_SECRET_KEY` is set in Supabase Edge Functions
- Check `FRONTEND_URL` is set correctly
- Test with test mode first (pk_test_ and sk_test_)

### Authentication issues:
- Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are correct
- Check Supabase > Authentication > URL Configuration
- Ensure redirect URLs include `https://zeuservices.com/**`

---

**Last Updated**: January 22, 2026
**Need Help?** Check the Discord or contact support.
