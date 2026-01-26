-- Add admin_user_id to orders table to track which admin handled the order
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS admin_user_id UUID REFERENCES public.admin_users(user_id) ON DELETE SET NULL;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_orders_admin_user_id ON public.orders(admin_user_id);

-- Create admin_actions table to track admin activities
CREATE TABLE IF NOT EXISTS public.admin_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL REFERENCES public.admin_users(user_id) ON DELETE CASCADE,
  action_type VARCHAR(50) NOT NULL CHECK (action_type IN ('complete', 'cancel', 'refund', 'status_change')),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  old_status VARCHAR(50),
  new_status VARCHAR(50),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_admin_actions_admin_user_id ON public.admin_actions(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_actions_created_at ON public.admin_actions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_actions_action_type ON public.admin_actions(action_type);
CREATE INDEX IF NOT EXISTS idx_admin_actions_order_id ON public.admin_actions(order_id);

-- Enable RLS
ALTER TABLE public.admin_actions ENABLE ROW LEVEL SECURITY;

-- Only admins can view admin actions
CREATE POLICY "Admins can view all admin actions"
  ON public.admin_actions
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM public.admin_users WHERE active = true
    )
  );

-- Only admins can insert admin actions
CREATE POLICY "Admins can insert admin actions"
  ON public.admin_actions
  FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM public.admin_users WHERE active = true
    )
  );
