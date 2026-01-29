-- Allow anon users to query orders by session_id for payment confirmation
-- The get-order-by-session function uses service_role but we'll add this for direct access too

CREATE POLICY "allow_order_lookup_public" ON public.orders
  FOR SELECT
  TO anon
  USING (true);
