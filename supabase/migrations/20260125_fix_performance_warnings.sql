-- Fix performance issues: combine multiple permissive policies and remove unused indexes

-- 1. Combine the two SELECT policies on orders into one for better performance
DROP POLICY IF EXISTS "Admins can read all orders" ON public.orders;
DROP POLICY IF EXISTS "Users can read own orders" ON public.orders;

CREATE POLICY "Users and admins can read orders"
ON public.orders FOR SELECT
TO authenticated
USING (
  -- Users can read their own orders OR user is an admin
  user_id = (SELECT auth.uid()) 
  OR 
  (SELECT auth.uid()) IN (SELECT user_id FROM public.admin_users WHERE active = true)
);

-- 2. Remove unused indexes
DROP INDEX IF EXISTS public.idx_admin_users_user_id;
DROP INDEX IF EXISTS public.idx_sessions_created_at;
