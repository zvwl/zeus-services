-- Create table to store cart items temporarily before checkout
-- This avoids Stripe's 500-character metadata limit

CREATE TABLE IF NOT EXISTS public.checkout_sessions (
  id TEXT PRIMARY KEY, -- Stripe session ID (generated before creating session)
  user_id UUID NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  items JSONB NOT NULL,
  total_amount NUMERIC(10, 2) NOT NULL,
  currency TEXT NOT NULL,
  customer_email TEXT NULL,
  customer_name TEXT NULL,
  notes TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '24 hours')
);

-- Enable RLS
ALTER TABLE public.checkout_sessions ENABLE ROW LEVEL SECURITY;

-- Users can only see their own checkout sessions
CREATE POLICY "Users can view own checkout sessions"
  ON public.checkout_sessions
  FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

-- Users can insert their own checkout sessions, or guest checkout sessions (user_id IS NULL)
CREATE POLICY "Users can insert own or guest checkout sessions"
  ON public.checkout_sessions
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id OR user_id IS NULL
  );

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_checkout_sessions_user_id ON public.checkout_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_checkout_sessions_expires_at ON public.checkout_sessions(expires_at);

-- Function to clean up expired sessions (run daily via cron)
CREATE OR REPLACE FUNCTION cleanup_expired_checkout_sessions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  DELETE FROM public.checkout_sessions
  WHERE expires_at < NOW();
END;
$$;

-- Comment for documentation
COMMENT ON TABLE public.checkout_sessions IS 'Temporary storage for cart items before Stripe checkout to avoid 500-char metadata limit';
