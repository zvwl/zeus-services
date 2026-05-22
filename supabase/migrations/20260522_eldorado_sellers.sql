-- Eldorado seller accounts for API management
CREATE TABLE IF NOT EXISTS public.eldorado_sellers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  display_name TEXT NOT NULL,
  eldorado_email TEXT NOT NULL,
  encrypted_password TEXT,
  password_iv TEXT,
  cached_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.eldorado_sellers ENABLE ROW LEVEL SECURITY;

-- Only active admins can read/write
CREATE POLICY "eldorado_sellers_admin_only"
  ON public.eldorado_sellers
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE user_id = auth.uid() AND active = true
    )
  );

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_eldorado_sellers_timestamp()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_eldorado_sellers_updated_at
  BEFORE UPDATE ON public.eldorado_sellers
  FOR EACH ROW EXECUTE FUNCTION update_eldorado_sellers_timestamp();
