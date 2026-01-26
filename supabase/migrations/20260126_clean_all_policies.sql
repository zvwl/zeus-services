-- Clean All Policies and Recreate Properly
-- This removes ALL existing policies and creates optimized ones

-- ===========================================
-- ORDERS TABLE - Clean and Recreate
-- ===========================================

-- Drop ALL existing order policies
DO $$ 
DECLARE
    pol record;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'orders'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.orders', pol.policyname);
    END LOOP;
END $$;

-- Create single optimized SELECT policy
CREATE POLICY "orders_select_policy"
  ON public.orders
  FOR SELECT
  TO authenticated
  USING (
    (SELECT auth.uid()) = user_id
    OR
    (SELECT auth.uid()) IN (
      SELECT user_id FROM public.admin_users WHERE active = true
    )
  );

-- Single UPDATE policy for admins
CREATE POLICY "orders_update_policy"
  ON public.orders
  FOR UPDATE
  TO authenticated
  USING (
    (SELECT auth.uid()) IN (
      SELECT user_id FROM public.admin_users WHERE active = true
    )
  )
  WITH CHECK (
    (SELECT auth.uid()) IN (
      SELECT user_id FROM public.admin_users WHERE active = true
    )
  );

-- Single INSERT policy
CREATE POLICY "orders_insert_policy"
  ON public.orders
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT auth.uid()) = user_id OR user_id IS NULL
  );

-- ===========================================
-- SESSIONS TABLE - Clean and Recreate
-- ===========================================

-- Drop ALL existing session policies
DO $$ 
DECLARE
    pol record;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'sessions'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.sessions', pol.policyname);
    END LOOP;
END $$;

-- Create optimized session policies
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
-- ADMIN_ACTIONS TABLE - Clean and Recreate
-- ===========================================

-- Drop ALL existing admin_actions policies
DO $$ 
DECLARE
    pol record;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'admin_actions'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.admin_actions', pol.policyname);
    END LOOP;
END $$;

-- Create optimized admin_actions policies
CREATE POLICY "admin_actions_select_policy"
  ON public.admin_actions
  FOR SELECT
  TO authenticated
  USING (
    (SELECT auth.uid()) IN (
      SELECT user_id FROM public.admin_users WHERE active = true
    )
  );

CREATE POLICY "admin_actions_insert_policy"
  ON public.admin_actions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT auth.uid()) IN (
      SELECT user_id FROM public.admin_users WHERE active = true
    )
    AND admin_user_id = (SELECT auth.uid())
  );

-- ===========================================
-- CUSTOMERS TABLE - Clean and Recreate
-- ===========================================

-- Drop ALL existing customer policies
DO $$ 
DECLARE
    pol record;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'customers'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.customers', pol.policyname);
    END LOOP;
END $$;

-- Create optimized customer policies
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
-- ADMIN_USERS TABLE - Clean and Recreate
-- ===========================================

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Drop ALL existing admin_users policies
DO $$ 
DECLARE
    pol record;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'admin_users'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.admin_users', pol.policyname);
    END LOOP;
END $$;

-- Authenticated users can check if someone is an admin (needed for isAdmin check)
CREATE POLICY "admin_users_select_policy"
  ON public.admin_users
  FOR SELECT
  TO authenticated
  USING (true);
