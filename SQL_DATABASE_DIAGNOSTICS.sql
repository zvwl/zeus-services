-- ========================================
-- DATABASE DIAGNOSTICS FOR DISPLAY NAMES
-- ========================================

-- 1. CHECK IF RPC FUNCTION EXISTS
SELECT routine_name, routine_definition 
FROM information_schema.routines 
WHERE routine_name = 'is_display_name_available'
AND routine_schema = 'public';

-- 2. CHECK CUSTOMERS TABLE STRUCTURE
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'customers'
ORDER BY ordinal_position;

-- 3. CHECK IF UNIQUE CONSTRAINT EXISTS ON NAME
SELECT constraint_name, constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'customers'
AND constraint_type IN ('UNIQUE', 'PRIMARY KEY')
ORDER BY constraint_name;

-- 4. CHECK THE ACTUAL UNIQUE CONSTRAINT COLUMNS
SELECT constraint_name, column_name
FROM information_schema.key_column_usage
WHERE table_name = 'customers'
AND constraint_name LIKE 'customers_%'
ORDER BY constraint_name, ordinal_position;

-- 5. LIST ALL INDEXES ON CUSTOMERS TABLE
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'customers';

-- 6. CHECK RLS POLICIES ON CUSTOMERS TABLE
SELECT * FROM pg_policies 
WHERE tablename = 'customers';

-- 7. CHECK IF VALIDATION FUNCTION EXISTS
SELECT routine_name, routine_definition 
FROM information_schema.routines 
WHERE routine_name LIKE '%display_name%'
AND routine_schema = 'public';

-- 8. COUNT EXISTING DISPLAY NAMES IN DATABASE
SELECT COUNT(*) as total_names, 
       COUNT(DISTINCT LOWER(name)) as unique_names_lower
FROM public.customers 
WHERE name IS NOT NULL;

-- 9. CHECK FOR DUPLICATE NAMES (should be 0)
SELECT name, COUNT(*) as count
FROM public.customers
WHERE name IS NOT NULL
GROUP BY name
HAVING COUNT(*) > 1;

-- 10. CHECK FOR DUPLICATE NAMES (case-insensitive)
SELECT LOWER(name) as name_lower, COUNT(*) as count
FROM public.customers
WHERE name IS NOT NULL
GROUP BY LOWER(name)
HAVING COUNT(*) > 1;

-- 11. TEST THE RPC FUNCTION DIRECTLY
SELECT is_display_name_available('testuser123');

-- 12. TEST WITH RESERVED NAME
SELECT is_display_name_available('admin');

-- 13. TEST WITH EXISTING NAME (choose one from your database)
SELECT name, is_display_name_available(name) as available
FROM public.customers
WHERE name IS NOT NULL
LIMIT 5;

-- 14. CHECK IF TRIGGER EXISTS
SELECT trigger_name, event_object_table, action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
AND event_object_table = 'customers';

-- 15. CHECK THE HANDLE_NEW_USER TRIGGER FUNCTION
SELECT routine_name, routine_definition
FROM information_schema.routines
WHERE routine_name = 'handle_new_user'
AND routine_schema = 'public';

-- 16. CHECK AUTH.USERS TABLE
SELECT COUNT(*) as auth_users_count FROM auth.users;

-- 17. CHECK IF CUSTOMERS TABLE IS EMPTY
SELECT COUNT(*) as customers_count FROM public.customers;

-- 18. CHECK SEARCH_PATH (important for permissions)
SHOW search_path;

-- 19. TEST ANON USER PERMISSIONS - Can anon call the function?
-- Run this as ANON user (in separate session with anon key):
-- SELECT is_display_name_available('testuser123');
