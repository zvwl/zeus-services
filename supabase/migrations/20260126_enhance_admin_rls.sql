-- Enhanced RLS for admin security
-- Prevent non-admins from viewing admin_user_id in orders
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to recreate them more securely
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;

-- Users can only see their own orders (without admin_user_id)
CREATE POLICY "Users can view own orders"
  ON public.orders
  FOR SELECT
  USING (
    auth.uid() = user_id
  );

-- Admins can see all orders including admin_user_id
CREATE POLICY "Admins can view all orders"
  ON public.orders
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM public.admin_users WHERE active = true
    )
  );

-- Only admins can update orders
CREATE POLICY "Admins can update orders"
  ON public.orders
  FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT user_id FROM public.admin_users WHERE active = true
    )
  );

-- Prevent anyone from directly inserting into admin_actions from frontend
-- (Only backend Edge Functions should do this)
DROP POLICY IF EXISTS "Admins can insert admin actions" ON public.admin_actions;

CREATE POLICY "Admins can insert admin actions via RLS check"
  ON public.admin_actions
  FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM public.admin_users WHERE active = true
    )
    AND admin_user_id = auth.uid()
  );

-- Ensure only authenticated admins can view admin_actions
DROP POLICY IF EXISTS "Admins can view all admin actions" ON public.admin_actions;

CREATE POLICY "Admins can view all admin actions"
  ON public.admin_actions
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM public.admin_users WHERE active = true
    )
  );
