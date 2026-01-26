# Supabase Security Configuration

## ✅ RLS Policies - FIXED

All duplicate policies have been cleaned up. Current state:

- **admin_actions**: 2 policies (insert, select) - Optimized with `(SELECT auth.uid())`
- **admin_users**: 1 policy (select) - Allows checking admin status
- **customers**: 3 policies (insert, select, update) - Users manage own records
- **orders**: 3 policies (insert, select, update) - Users see own, admins see all
- **sessions**: 4 policies (delete, insert, select, update) - Users manage own sessions

Migration applied: `20260126_clean_all_policies.sql`

---

## ⚠️ Manual Configuration Required

### 1. Enable Leaked Password Protection

**Status:** ⚠️ DISABLED (needs manual fix)

**Location:** Supabase Dashboard → Authentication → Providers → Email

**What it does:** Checks user passwords against the HaveIBeenPwned database to prevent use of compromised passwords.

**Steps:**
1. Go to your Supabase project dashboard
2. Navigate to **Authentication → Providers**
3. Click on **"Email"** provider
4. Scroll down to **"Leaked Password Protection"**
5. Toggle it to **Enabled**
6. Click **"Save"**

---

## 📊 Unused Indexes (Optional)

The following indexes on `admin_actions` may be unused:

- `idx_admin_actions_action_type` - For filtering by action type
- `idx_admin_actions_order_id` - For looking up by order ID
- `idx_admin_actions_admin_user_id` - For filtering by admin user

**Recommendation:** **Keep them** - The Activity Logs dashboard uses these for filtering and sorting. They provide fast lookups for:
- Date range filtering (created_at index)
- Action type filtering
- Admin-specific activity views

Monitor usage over time in Supabase Dashboard → Database → Indexes.

---

## 🔒 Security Summary

✅ **RLS enabled** on all tables with optimized policies  
✅ **Auth functions wrapped** in `(SELECT auth.uid())` for performance  
✅ **No duplicate policies** - Single policy per operation  
✅ **SECURITY INVOKER** used for views to enforce RLS  
⚠️ **Leaked Password Protection** - Needs manual enable in dashboard  
✅ **Admin-only routes** protected by ProtectedAdminRoute component  
✅ **Database indexes** optimized for query patterns
