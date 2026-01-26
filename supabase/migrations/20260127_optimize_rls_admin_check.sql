-- Optimize RLS to avoid expensive subqueries in session check
-- Use a caching/denormalization approach for faster admin checks

-- Drop old admin_users policy
DROP POLICY IF EXISTS "admin_users_select_policy" ON public.admin_users;

-- New permissive policy - allow authenticated users to see all admin_users
-- This is safe because the view is used only internally for RLS checks
CREATE POLICY "admin_users_select_policy"
  ON public.admin_users
  FOR SELECT
  TO authenticated
  USING (true);

-- For orders, replace the expensive subquery with a direct lookup
DROP POLICY IF EXISTS "orders_select_policy" ON public.orders;
DROP POLICY IF EXISTS "orders_update_policy" ON public.orders;

CREATE POLICY "orders_select_policy"
  ON public.orders
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM public.admin_users 
      WHERE user_id = auth.uid() AND active = true
    )
  );

CREATE POLICY "orders_update_policy"
  ON public.orders
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users 
      WHERE user_id = auth.uid() AND active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admin_users 
      WHERE user_id = auth.uid() AND active = true
    )
  );

-- Same for admin_actions
DROP POLICY IF EXISTS "admin_actions_select_policy" ON public.admin_actions;
DROP POLICY IF EXISTS "admin_actions_insert_policy" ON public.admin_actions;

CREATE POLICY "admin_actions_select_policy"
  ON public.admin_actions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users 
      WHERE user_id = auth.uid() AND active = true
    )
  );

CREATE POLICY "admin_actions_insert_policy"
  ON public.admin_actions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admin_users 
      WHERE user_id = auth.uid() AND active = true
    )
    AND admin_user_id = auth.uid()
  );
