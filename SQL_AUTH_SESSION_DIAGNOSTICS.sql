-- ========================================
-- AUTH & SESSION DIAGNOSTICS
-- ========================================

-- 1. CHECK AUTH.USERS TABLE STRUCTURE
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'auth' 
AND table_name = 'users'
ORDER BY ordinal_position;

-- 2. COUNT USERS IN AUTH
SELECT COUNT(*) as total_auth_users FROM auth.users;

-- 3. CHECK A SPECIFIC USER (example: daniel.holecek50@gmail.com)
SELECT id, email, email_confirmed_at, created_at, last_sign_in_at
FROM auth.users
WHERE email LIKE '%daniel%'
LIMIT 5;

-- 4. CHECK SESSIONS TABLE
SELECT COUNT(*) as total_sessions FROM public.sessions;

-- 5. CHECK RECENT SESSIONS
SELECT id, user_id, ip_address, last_activity, created_at
FROM public.sessions
ORDER BY created_at DESC
LIMIT 5;

-- 6. CHECK CUSTOMERS TABLE AGAIN
SELECT user_id, email, name, created_at
FROM public.customers
ORDER BY created_at DESC
LIMIT 5;

-- 7. CHECK ORDERS TABLE (recent)
SELECT id, user_id, customer_email, status, payment_status, created_at
FROM public.orders
ORDER BY created_at DESC
LIMIT 5;

-- 8. CHECK IF AUTH.USERS FOREIGN KEY WORKS
SELECT c.user_id, c.email, c.name, 
       CASE WHEN a.id IS NOT NULL THEN 'EXISTS' ELSE 'MISSING' END as user_exists
FROM public.customers c
LEFT JOIN auth.users a ON c.user_id = a.id
ORDER BY c.created_at DESC
LIMIT 10;

-- 9. CHECK RLS POLICIES ON SESSIONS TABLE
SELECT * FROM pg_policies 
WHERE tablename = 'sessions';

-- 10. CHECK RLS POLICIES ON CUSTOMERS TABLE
SELECT * FROM pg_policies 
WHERE tablename = 'customers';

-- 11. CHECK RLS POLICIES ON ORDERS TABLE
SELECT * FROM pg_policies 
WHERE tablename = 'orders';

-- 12. TEST: Can authenticated user select from sessions?
-- This should show if RLS policies are blocking access
SELECT id, user_id, last_activity FROM public.sessions LIMIT 1;

-- 13. CHECK IF ORDERS WITH NULL USER_ID EXIST
SELECT COUNT(*) as orders_with_null_user_id,
       COUNT(DISTINCT user_id) as distinct_user_ids
FROM public.orders
WHERE user_id IS NULL;

-- 14. SHOW ORDERS WITH NULL USER_ID
SELECT id, checkout_session_id, customer_email, status, payment_status, created_at
FROM public.orders
WHERE user_id IS NULL
ORDER BY created_at DESC
LIMIT 10;

-- 15. CHECK IF THERE ARE ORPHANED SESSIONS (sessions without auth user)
SELECT s.id, s.user_id, s.created_at,
       CASE WHEN a.id IS NOT NULL THEN 'User exists' ELSE 'User missing!' END as status
FROM public.sessions s
LEFT JOIN auth.users a ON s.user_id = a.id
LIMIT 10;

-- 16. CHECK ADMIN_USERS TABLE
SELECT COUNT(*) as admin_count FROM public.admin_users;
SELECT user_id, created_at, active FROM public.admin_users LIMIT 5;

-- 17. TEST RPC WITH ANON USER PERMISSIONS
-- Check if anon can execute functions
SELECT has_function_privilege('anon', 'public.is_display_name_available(text)', 'execute') as anon_can_execute;

-- 18. CHECK SEARCH_PATH
SHOW search_path;

-- 19. CHECK ALL POSTGRES ROLES
SELECT rolname, rolcanlogin FROM pg_roles ORDER BY rolname;

-- 20. CHECK ROLE PERMISSIONS ON CUSTOMERS TABLE
SELECT grantee, privilege_type
FROM information_schema.table_privileges
WHERE table_name = 'customers'
ORDER BY grantee, privilege_type;
