-- Fix RLS policy for services table to allow admins to update all fields
-- Run this in Supabase SQL Editor

-- Drop the existing update policy
DROP POLICY IF EXISTS "services_update_policy" ON public.services;

-- Recreate with simpler check - only verify admin status in USING clause
CREATE POLICY "services_update_policy"
  ON public.services
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users 
      WHERE user_id = auth.uid() AND active = true
    )
  );

-- Allow admins to see ALL services (not just active ones)
DROP POLICY IF EXISTS "services_admin_select_policy" ON public.services;
CREATE POLICY "services_admin_select_policy"
  ON public.services
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users 
      WHERE user_id = auth.uid() AND active = true
    )
  );

-- Fix RLS policy for products table
DROP POLICY IF EXISTS "products_update_policy" ON public.products;

CREATE POLICY "products_update_policy"
  ON public.products
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users 
      WHERE user_id = auth.uid() AND active = true
    )
  );

-- Allow admins to see ALL products (not just active ones)
DROP POLICY IF EXISTS "products_admin_select_policy" ON public.products;
CREATE POLICY "products_admin_select_policy"
  ON public.products
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users 
      WHERE user_id = auth.uid() AND active = true
    )
  );
