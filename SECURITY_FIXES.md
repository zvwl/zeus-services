# 🔐 SECURITY FIX CHECKLIST - IMMEDIATE ACTIONS

**Status**: CORS Fixed ✅  
**Next**: hCaptcha Sitekey & Key Rotation

---

## ✅ COMPLETED (Today)

### 1. CORS Wildcard Vulnerability - FIXED ✅
**All 8 Edge Functions Updated**:
- ✅ `create-checkout-session`
- ✅ `create-order`
- ✅ `get-user-orders`
- ✅ `get-user-order`
- ✅ `get-admin-orders`
- ✅ `notify-order-admins`
- ✅ `detect-location`
- ✅ `refund-order`

**Change**: `Access-Control-Allow-Origin: "*"` → `FRONTEND_URL`  
**Result**: Only `https://zeuservices.com` can access your APIs  
**Status**: Deployed to GitHub ✅ (Vercel auto-deploying)

---

## ⚠️ CRITICAL ACTIONS REQUIRED THIS WEEK

### 2. Verify hCaptcha Sitekey
**Current Issue**: File indicates key is incomplete

**Action**: 
```bash
# 1. Go to https://dashboard.hcaptcha.com/sites
# 2. Find your Zeus Services site
# 3. Copy the COMPLETE sitekey
# 4. Update .env file:
VITE_HCAPTCHA_SITEKEY=[COMPLETE_KEY]

# 5. Add to Vercel environment variables
# 6. Add HCAPTCHA_SECRET to Supabase Edge Function secrets
```

**Time Estimate**: 5 minutes  
**Urgency**: HIGH (bot protection depends on this)

---

### 3. Rotate ALL Keys (Production Access)
**⚠️ CRITICAL**: If .env was ever committed or shared, keys are compromised

**Rotate These Keys**:
```
□ Supabase ANON_KEY (VITE_SUPABASE_ANON_KEY)
□ Supabase SERVICE_ROLE_KEY
□ Stripe Secret Key Test (sk_test_...)
□ Stripe Secret Key Live (sk_live_...)
□ Stripe Webhook Secret (whsec_...)
□ hCaptcha Secret
□ RESEND_API_KEY
□ NOTES_ENC_KEY
```

**Check if Keys are Exposed**:
```bash
# In your repo root:
git log --all -S "VITE_SUPABASE_ANON_KEY" --oneline
git log --all -S "pk_live_" --oneline
```

**If Keys Found in History**:
1. **Immediately rotate all keys** (use old keys to create new ones)
2. Clean git history (advanced - ask for help)
3. Force push (⚠️ destructive operation)

**How to Rotate**:
1. **Supabase** → Project Settings → API → Rotate Keys
2. **Stripe** → Account Settings → API Keys → Create new keys
3. **hCaptcha** → Site Settings → Regenerate Secret
4. **Resend** → Account Settings → Create new API key

**Time Estimate**: 30 minutes  
**Urgency**: CRITICAL (if keys are exposed)

---

## 📋 NEXT WEEK FIXES

### 4. Add Password Strength Validation
**File**: [src/pages/SignupPage.jsx](src/pages/SignupPage.jsx)

**Change From**:
```jsx
if (password.length < 6) {
  setError('Password must be at least 6 characters')
}
```

**Change To**:
```jsx
const hasUpperCase = /[A-Z]/.test(password);
const hasLowerCase = /[a-z]/.test(password);
const hasNumbers = /[0-9]/.test(password);
const isStrong = password.length >= 12 && 
  hasUpperCase && hasLowerCase && hasNumbers;

if (!isStrong) {
  setError('Password must be 12+ chars with uppercase, lowercase, and numbers')
}
```

**Time Estimate**: 5 minutes

---

### 5. Add Server-Side Input Validation
**Files to Update**:
- `supabase/functions/create-checkout-session/index.ts`
- `supabase/functions/create-order/index.ts`
- `supabase/functions/get-user-orders/index.ts`

**Example Fix**:
```typescript
// Add validation at start of function
if (!Array.isArray(items) || items.length === 0) {
  return new Response(JSON.stringify({ error: "Invalid items" }), { 
    status: 400,
    headers: corsHeaders
  });
}

if (typeof total_amount !== 'number' || total_amount <= 0 || total_amount > 10000) {
  return new Response(JSON.stringify({ error: "Invalid total_amount" }), { 
    status: 400,
    headers: corsHeaders
  });
}

if (!currency || !/^[A-Z]{3}$/.test(currency)) {
  return new Response(JSON.stringify({ error: "Invalid currency" }), { 
    status: 400,
    headers: corsHeaders
  });
}

if (customer_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer_email)) {
  return new Response(JSON.stringify({ error: "Invalid email" }), { 
    status: 400,
    headers: corsHeaders
  });
}
```

**Time Estimate**: 15 minutes per function

---

## 📌 MONTHLY MAINTENANCE

### Create Key Rotation Schedule
**File**: Create [KEY_ROTATION.md](KEY_ROTATION.md)

**Rotation Schedule**:
- Stripe keys: Every 6 months
- Supabase keys: Every 3 months
- hCaptcha secret: Every 3 months
- RESEND_API_KEY: Every 6 months
- NOTES_ENC_KEY: Every 3 months

**Template**:
```markdown
# Key Rotation Schedule

## Last Rotations
- Stripe: [Date]
- Supabase: [Date]
- hCaptcha: [Date]

## Next Rotation Dates
- Stripe: [Date + 6 months]
- Supabase: [Date + 3 months]
...
```

---

## 🎯 VERIFICATION STEPS

### Before Going to Production:
1. ✅ Verify CORS headers only allow `https://zeuservices.com`
2. ✅ Test hCaptcha on signup/login pages
3. ✅ Verify all secrets are rotated
4. ✅ Check password validation on signup
5. ✅ Test Edge Functions with invalid input
6. ✅ Verify no logs contain sensitive data

### Quick Security Test:
```bash
# Test CORS from another domain (should fail)
curl -H "Origin: https://attacker.com" https://zeuservices.com/api/create-checkout

# Test with invalid input (should fail with validation error)
curl -X POST https://zeuservices.com/api/create-order \
  -H "Content-Type: application/json" \
  -d '{"items": [], "total_amount": -100}'
```

---

## 📞 SUPPORT

For each security fix:
1. Read the description
2. Understand the risk
3. Implement the fix
4. Test locally
5. Commit and push
6. Verify Vercel deployment

---

**Document Created**: January 25, 2026  
**Document Type**: Security Action Plan  
**Priority**: CRITICAL  
**Estimated Total Time**: 2-3 hours  

✅ All CORS fixes deployed and live
⏳ Next: hCaptcha sitekey verification & key rotation
