# Sessions & CAPTCHA Diagnosis

## Run these SQL commands in Supabase SQL Editor to diagnose the issues:

### 1. Check Sessions Table RLS Policies
```sql
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'sessions'
ORDER BY policyname;
```

### 2. Check if Sessions Table Has RLS Enabled
```sql
SELECT 
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename = 'sessions';
```

### 3. Check Your Current Sessions
```sql
SELECT 
  id,
  user_id,
  ip_address,
  user_agent,
  last_activity,
  created_at
FROM public.sessions
LIMIT 10;
```

### 4. Check if Users Can Insert Sessions
```sql
-- This simulates what the app tries to do
INSERT INTO public.sessions (user_id, user_agent, ip_address)
VALUES (auth.uid(), 'Test User Agent', '127.0.0.1')
ON CONFLICT DO NOTHING;
```

### 5. Check Customers Table Records
```sql
SELECT 
  user_id,
  email,
  name,
  created_at
FROM public.customers
LIMIT 5;
```

## IF You See Errors:

### If Sessions Table Shows No RLS Enabled:
```sql
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
```

### Create Proper Sessions Policies:
```sql
-- Users can create their own sessions
CREATE POLICY "users_create_sessions"
  ON public.sessions
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users can view their own sessions
CREATE POLICY "users_view_sessions"
  ON public.sessions
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Users can update their own sessions
CREATE POLICY "users_update_sessions"
  ON public.sessions
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Users can delete their own sessions
CREATE POLICY "users_delete_sessions"
  ON public.sessions
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());
```

## About the CAPTCHA Error

The `captcha_failed` error during login means:
1. The hCaptcha token you sent to Supabase is invalid or expired
2. OR Supabase's captcha verification is failing

**This is NOT related to sessions directly.** 

The real issue is that after CAPTCHA fails, the user's session state gets confused because:
- The auth token is being rejected
- The app can't create a proper session record
- When trying again, the CAPTCHA token might be stale

## The Fix We Already Applied:
We reset the CAPTCHA immediately after each attempt, so it should work now.

## Next Steps:
1. Run the SQL diagnostics above
2. If sessions policies are missing, run the CREATE POLICY commands
3. Try logging in again - the CAPTCHA should work fresh now
4. Check browser console for any new errors
5. Check Supabase logs for server-side errors during login
