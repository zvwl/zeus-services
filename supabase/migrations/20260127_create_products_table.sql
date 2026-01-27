-- Create products table for admin management
CREATE TABLE IF NOT EXISTS public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  price numeric(10, 2) NOT NULL,
  description text,
  icon text,
  platforms jsonb DEFAULT '[]'::jsonb,
  versions jsonb DEFAULT '["Legacy","Enhanced"]'::jsonb,
  details jsonb DEFAULT '[]'::jsonb,
  active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Ensure versions column exists for reruns
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS versions jsonb DEFAULT '["Legacy","Enhanced"]'::jsonb;

-- Drop existing policies for clean reruns
DROP POLICY IF EXISTS "products_select_policy" ON public.products;
DROP POLICY IF EXISTS "products_select_anon_policy" ON public.products;
DROP POLICY IF EXISTS "products_insert_policy" ON public.products;
DROP POLICY IF EXISTS "products_update_policy" ON public.products;
DROP POLICY IF EXISTS "products_delete_policy" ON public.products;

-- Allow authenticated users to read active products
CREATE POLICY "products_select_policy"
  ON public.products
  FOR SELECT
  TO authenticated
  USING (active = true);

-- Allow anonymous users (public browsing) to read active products
CREATE POLICY "products_select_anon_policy"
  ON public.products
  FOR SELECT
  TO anon
  USING (active = true);

-- Only admins can insert
CREATE POLICY "products_insert_policy"
  ON public.products
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT auth.uid()) IN (
      SELECT user_id FROM public.admin_users WHERE active = true
    )
  );

-- Only admins can update
CREATE POLICY "products_update_policy"
  ON public.products
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

-- Only admins can delete
CREATE POLICY "products_delete_policy"
  ON public.products
  FOR DELETE
  TO authenticated
  USING (
    (SELECT auth.uid()) IN (
      SELECT user_id FROM public.admin_users WHERE active = true
    )
  );

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_products_active ON public.products(active);
