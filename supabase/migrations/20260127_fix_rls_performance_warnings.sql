-- Fix RLS Performance Warnings - wrap auth.uid() in SELECT to evaluate once per query, not per row

-- ===========================================
-- ORDERS TABLE
-- ===========================================
DROP POLICY IF EXISTS "orders_select_policy" ON public.orders;
DROP POLICY IF EXISTS "orders_update_policy" ON public.orders;
DROP POLICY IF EXISTS "orders_insert_policy" ON public.orders;

CREATE POLICY "orders_select_policy"
  ON public.orders
  FOR SELECT
  TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    OR
    EXISTS (
      SELECT 1 FROM public.admin_users 
      WHERE user_id = (SELECT auth.uid()) AND active = true
    )
  );

CREATE POLICY "orders_update_policy"
  ON public.orders
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users 
      WHERE user_id = (SELECT auth.uid()) AND active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admin_users 
      WHERE user_id = (SELECT auth.uid()) AND active = true
    )
  );

CREATE POLICY "orders_insert_policy"
  ON public.orders
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT auth.uid()) = user_id OR user_id IS NULL
  );

-- ===========================================
-- SESSIONS TABLE
-- ===========================================
DROP POLICY IF EXISTS "sessions_select_policy" ON public.sessions;
DROP POLICY IF EXISTS "sessions_insert_policy" ON public.sessions;
DROP POLICY IF EXISTS "sessions_update_policy" ON public.sessions;
DROP POLICY IF EXISTS "sessions_delete_policy" ON public.sessions;

CREATE POLICY "sessions_select_policy"
  ON public.sessions
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "sessions_insert_policy"
  ON public.sessions
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "sessions_update_policy"
  ON public.sessions
  FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "sessions_delete_policy"
  ON public.sessions
  FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- ===========================================
-- ADMIN_ACTIONS TABLE
-- ===========================================
DROP POLICY IF EXISTS "admin_actions_select_policy" ON public.admin_actions;
DROP POLICY IF EXISTS "admin_actions_insert_policy" ON public.admin_actions;

CREATE POLICY "admin_actions_select_policy"
  ON public.admin_actions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users 
      WHERE user_id = (SELECT auth.uid()) AND active = true
    )
  );

CREATE POLICY "admin_actions_insert_policy"
  ON public.admin_actions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admin_users 
      WHERE user_id = (SELECT auth.uid()) AND active = true
    )
    AND admin_user_id = (SELECT auth.uid())
  );

-- ===========================================
-- CUSTOMERS TABLE
-- ===========================================
DROP POLICY IF EXISTS "customers_select_policy" ON public.customers;
DROP POLICY IF EXISTS "customers_insert_policy" ON public.customers;
DROP POLICY IF EXISTS "customers_update_policy" ON public.customers;

CREATE POLICY "customers_select_policy"
  ON public.customers
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "customers_insert_policy"
  ON public.customers
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "customers_update_policy"
  ON public.customers
  FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- ===========================================
-- ADMIN_USERS TABLE
-- ===========================================
DROP POLICY IF EXISTS "admin_users_select_policy" ON public.admin_users;

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_users_select_policy"
  ON public.admin_users
  FOR SELECT
  TO authenticated
  USING (true);
