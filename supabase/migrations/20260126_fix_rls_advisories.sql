-- Fix Supabase RLS Advisories
-- This migration consolidates policies and adds missing ones

-- ===========================================
-- ORDERS TABLE - Consolidate Policies
-- ===========================================

-- Drop all existing order policies to recreate them properly
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can update orders" ON public.orders;
DROP POLICY IF EXISTS "Allow authenticated users to read own orders" ON public.orders;
DROP POLICY IF EXISTS "Service role can manage sessions" ON public.orders;
DROP POLICY IF EXISTS "Users and admins can view orders" ON public.orders;
DROP POLICY IF EXISTS "Authenticated users can create orders" ON public.orders;

-- Single comprehensive SELECT policy (combines user + admin access)
CREATE POLICY "Users and admins can view orders"
  ON public.orders
  FOR SELECT
  TO authenticated
  USING (
    -- Users can see their own orders
    (SELECT auth.uid()) = user_id
    OR
    -- Admins can see all orders
    (SELECT auth.uid()) IN (
      SELECT user_id FROM public.admin_users WHERE active = true
    )
  );

-- Only admins can update orders
CREATE POLICY "Admins can update orders"
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

-- Allow order creation (for checkout)
CREATE POLICY "Authenticated users can create orders"
  ON public.orders
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT auth.uid()) = user_id OR user_id IS NULL
  );

-- ===========================================
-- ADMIN_ACTIONS TABLE - Add Missing Policies
-- ===========================================

-- Drop existing policies
DROP POLICY IF EXISTS "Admins can insert admin actions via RLS check" ON public.admin_actions;
DROP POLICY IF EXISTS "Admins can view all admin actions" ON public.admin_actions;
DROP POLICY IF EXISTS "Admins can view admin actions" ON public.admin_actions;
DROP POLICY IF EXISTS "Admins can insert admin actions" ON public.admin_actions;

-- Admins can view all actions
CREATE POLICY "Admins can view admin actions"
  ON public.admin_actions
  FOR SELECT
  TO authenticated
  USING (
    (SELECT auth.uid()) IN (
      SELECT user_id FROM public.admin_users WHERE active = true
    )
  );

-- Admins can insert actions (with verification)
CREATE POLICY "Admins can insert admin actions"
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
-- SESSIONS TABLE - Add RLS Policies
-- ===========================================

ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies
DROP POLICY IF EXISTS "Users can view own sessions" ON public.sessions;
DROP POLICY IF EXISTS "Users can delete own sessions" ON public.sessions;
DROP POLICY IF EXISTS "Users can create own sessions" ON public.sessions;
DROP POLICY IF EXISTS "Users can update own sessions" ON public.sessions;

-- Users can view their own sessions
CREATE POLICY "Users can view own sessions"
  ON public.sessions
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- Users can insert their own sessions
CREATE POLICY "Users can create own sessions"
  ON public.sessions
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- Users can update their own sessions
CREATE POLICY "Users can update own sessions"
  ON public.sessions
  FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- Users can delete their own sessions
CREATE POLICY "Users can delete own sessions"
  ON public.sessions
  FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- ===========================================
-- CUSTOMERS TABLE - Ensure RLS
-- ===========================================

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own customer record" ON public.customers;
DROP POLICY IF EXISTS "Users can update own customer record" ON public.customers;
DROP POLICY IF EXISTS "Users can insert own customer record" ON public.customers;

-- Users can view their own customer record
CREATE POLICY "Users can view own customer record"
  ON public.customers
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- Users can insert their own customer record
CREATE POLICY "Users can insert own customer record"
  ON public.customers
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- Users can update their own customer record
CREATE POLICY "Users can update own customer record"
  ON public.customers
  FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);
