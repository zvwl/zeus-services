-- Deploy Services Table to Supabase
-- Copy and paste this entire SQL into the Supabase SQL Editor
-- Project > SQL Editor > New Query
-- Then Execute the query

-- Create services table for admin management
CREATE TABLE IF NOT EXISTS public.services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  price numeric(10, 2) NOT NULL,
  description text,
  icon text,
  platforms jsonb DEFAULT '[]'::jsonb,
  details jsonb DEFAULT '[]'::jsonb,
  active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for re-deployment)
DROP POLICY IF EXISTS "services_select_policy" ON public.services;
DROP POLICY IF EXISTS "services_insert_policy" ON public.services;
DROP POLICY IF EXISTS "services_update_policy" ON public.services;
DROP POLICY IF EXISTS "services_delete_policy" ON public.services;

-- Anyone can read services
CREATE POLICY "services_select_policy"
  ON public.services
  FOR SELECT
  TO authenticated
  USING (true);

-- Only admins can insert
CREATE POLICY "services_insert_policy"
  ON public.services
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT auth.uid()) IN (
      SELECT user_id FROM public.admin_users WHERE active = true
    )
  );

-- Only admins can update
CREATE POLICY "services_update_policy"
  ON public.services
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
CREATE POLICY "services_delete_policy"
  ON public.services
  FOR DELETE
  TO authenticated
  USING (
    (SELECT auth.uid()) IN (
      SELECT user_id FROM public.admin_users WHERE active = true
    )
  );

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_services_active ON public.services(active);

-- Test: Verify table exists
SELECT tablename FROM pg_tables WHERE tablename = 'services' AND schemaname = 'public';
