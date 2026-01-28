-- Create reviews table
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT NOT NULL CHECK (char_length(comment) >= 10 AND char_length(comment) <= 2000),
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(order_id) -- One review per order
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON public.reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_order_id ON public.reviews(order_id);
CREATE INDEX IF NOT EXISTS idx_reviews_status ON public.reviews(status);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON public.reviews(created_at DESC);

-- Enable RLS
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view approved reviews" ON public.reviews;
DROP POLICY IF EXISTS "Users can view their own reviews" ON public.reviews;
DROP POLICY IF EXISTS "Users can insert reviews for completed orders" ON public.reviews;
DROP POLICY IF EXISTS "Users can update their own pending reviews" ON public.reviews;
DROP POLICY IF EXISTS "Admins can view all reviews" ON public.reviews;
DROP POLICY IF EXISTS "Admins can update reviews" ON public.reviews;
DROP POLICY IF EXISTS "Admins can delete reviews" ON public.reviews;

-- Users can view approved reviews
CREATE POLICY "Anyone can view approved reviews"
  ON public.reviews
  FOR SELECT
  USING (status = 'approved');

-- Users can view their own reviews regardless of status
CREATE POLICY "Users can view their own reviews"
  ON public.reviews
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert reviews for their own completed orders
CREATE POLICY "Users can insert reviews for completed orders"
  ON public.reviews
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_id
        AND orders.user_id = auth.uid()
        AND orders.status = 'completed'
    )
  );

-- Users can update their own pending reviews
CREATE POLICY "Users can update their own pending reviews"
  ON public.reviews
  FOR UPDATE
  USING (auth.uid() = user_id AND status = 'pending')
  WITH CHECK (auth.uid() = user_id AND status = 'pending');

-- Admins can view all reviews
CREATE POLICY "Admins can view all reviews"
  ON public.reviews
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM public.admin_users WHERE active = true
    )
  );

-- Admins can update reviews (approve/reject)
CREATE POLICY "Admins can update reviews"
  ON public.reviews
  FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT user_id FROM public.admin_users WHERE active = true
    )
  );

-- Admins can delete reviews
CREATE POLICY "Admins can delete reviews"
  ON public.reviews
  FOR DELETE
  USING (
    auth.uid() IN (
      SELECT user_id FROM public.admin_users WHERE active = true
    )
  );

-- Add review_eligible flag to orders table
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS review_eligible BOOLEAN DEFAULT false;

-- Create index for review_eligible
CREATE INDEX IF NOT EXISTS idx_orders_review_eligible ON public.orders(review_eligible) WHERE review_eligible = true;

-- Function to automatically set review_eligible when order is completed
CREATE OR REPLACE FUNCTION set_review_eligible()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    NEW.review_eligible := true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to set review_eligible
DROP TRIGGER IF EXISTS trigger_set_review_eligible ON public.orders;
CREATE TRIGGER trigger_set_review_eligible
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION set_review_eligible();

-- Update existing completed orders to be review eligible
UPDATE public.orders
SET review_eligible = true
WHERE status = 'completed' AND review_eligible = false;

-- Update admin_actions table to support review moderation
-- Modify the action_type constraint to include review actions
ALTER TABLE public.admin_actions DROP CONSTRAINT IF EXISTS admin_actions_action_type_check;
ALTER TABLE public.admin_actions ADD CONSTRAINT admin_actions_action_type_check 
  CHECK (action_type IN ('complete', 'cancel', 'refund', 'status_change', 'review_approve', 'review_reject', 'review_delete', 'review_pending'));

-- Add review_id column to admin_actions for tracking review moderation
ALTER TABLE public.admin_actions ADD COLUMN IF NOT EXISTS review_id UUID REFERENCES public.reviews(id) ON DELETE CASCADE;

-- Create index for review_id for faster queries
CREATE INDEX IF NOT EXISTS idx_admin_actions_review_id ON public.admin_actions(review_id);
