-- Optimize RLS policies to avoid re-evaluating auth functions for each row
-- This significantly improves query performance at scale

-- Drop and recreate admin policies with optimized auth checks

-- Orders table: Admins can read all orders
DROP POLICY IF EXISTS "Admins can read all orders" ON public.orders;
CREATE POLICY "Admins can read all orders"
ON public.orders FOR SELECT
TO authenticated
USING ((SELECT auth.uid()) IN (SELECT user_id FROM public.admin_users WHERE active = true));

-- Orders table: Admins can update all orders
DROP POLICY IF EXISTS "Admins can update all orders" ON public.orders;
CREATE POLICY "Admins can update all orders"
ON public.orders FOR UPDATE
TO authenticated
USING ((SELECT auth.uid()) IN (SELECT user_id FROM public.admin_users WHERE active = true));

-- Orders table: Users can read own orders (optimize this too)
DROP POLICY IF EXISTS "Users can read own orders" ON public.orders;
CREATE POLICY "Users can read own orders"
ON public.orders FOR SELECT
TO authenticated
USING (user_id = (SELECT auth.uid()));

-- Orders table: Users can insert own orders (optimize this too)
DROP POLICY IF EXISTS "Users can insert own orders" ON public.orders;
CREATE POLICY "Users can insert own orders"
ON public.orders FOR INSERT
TO authenticated
WITH CHECK (user_id = (SELECT auth.uid()));

-- Customers table: Users can view own customer record
DROP POLICY IF EXISTS "Users can view own customer record" ON public.customers;
CREATE POLICY "Users can view own customer record"
ON public.customers FOR SELECT
TO authenticated
USING (user_id = (SELECT auth.uid()));

-- Customers table: Users can update own customer record
DROP POLICY IF EXISTS "Users can update own customer record" ON public.customers;
CREATE POLICY "Users can update own customer record"
ON public.customers FOR UPDATE
TO authenticated
USING (user_id = (SELECT auth.uid()));

-- Sessions table: Users can read own sessions
DROP POLICY IF EXISTS "Users can read own sessions" ON public.sessions;
CREATE POLICY "Users can read own sessions"
ON public.sessions FOR SELECT
TO authenticated
USING (user_id = (SELECT auth.uid()));

-- Sessions table: Users can insert own sessions
DROP POLICY IF EXISTS "Users can insert own sessions" ON public.sessions;
CREATE POLICY "Users can insert own sessions"
ON public.sessions FOR INSERT
TO authenticated
WITH CHECK (user_id = (SELECT auth.uid()));

-- Sessions table: Users can delete own sessions
DROP POLICY IF EXISTS "Users can delete own sessions" ON public.sessions;
CREATE POLICY "Users can delete own sessions"
ON public.sessions FOR DELETE
TO authenticated
USING (user_id = (SELECT auth.uid()));
