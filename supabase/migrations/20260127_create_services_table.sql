-- Create services table for admin management
CREATE TABLE IF NOT EXISTS public.services (
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
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

-- Anyone can read services
DROP POLICY IF EXISTS "services_select_policy" ON public.services;
CREATE POLICY "services_select_policy"
  ON public.services
  FOR SELECT
  TO authenticated
  USING (true);

-- Only admins can insert
DROP POLICY IF EXISTS "services_insert_policy" ON public.services;
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
DROP POLICY IF EXISTS "services_update_policy" ON public.services;
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
DROP POLICY IF EXISTS "services_delete_policy" ON public.services;
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
-- Seed initial services
INSERT INTO public.services (name, price, description, icon, platforms, versions, details, active)
VALUES
(
  '🚗 50 Modded Cars',
  3.00,
  'Get 50 fully customized modded vehicles added to your account. Delivered manually within 30 minutes to 12 hours.',
  '🚗',
  '["Steam", "Epic Games", "Xbox App", "Rockstar Launcher"]'::jsonb,
  '["Legacy","Enhanced"]'::jsonb,
  '[
    "📌 You must already own GTA V / GTA Online before purchasing",
    "💥 What''s Included:",
    "  🚗 50 Modded Cars of your choice",
    "⏱️ Delivery:",
    "  ✅ Completed within 30 minutes to 12 hours",
    "  🔑 Login access required",
    "  💬 We''ll contact you via Discord with full instructions",
    "⚠️ Important:",
    "  By purchasing this service, you take full responsibility for your account. If your account receives a ban, we''ll provide a free service once to restore your account, but we cannot purchase a game key for you and refunds are not available. See our Terms & Conditions for more details."
  ]'::jsonb,
  true
),
(
  '👕 20 Modded Outfits',
  3.00,
  'Get 20 premium modded outfits to make your character stand out. Delivered manually within 30 minutes to 12 hours.',
  '👕',
  '["Steam", "Epic Games", "Xbox App", "Rockstar Launcher"]'::jsonb,
  '["Legacy","Enhanced"]'::jsonb,
  '[
    "📌 You must already own GTA V / GTA Online before purchasing",
    "💥 What''s Included:",
    "  👕 20 Premium Modded Outfits",
    "⏱️ Delivery:",
    "  ✅ Completed within 30 minutes to 12 hours",
    "  🔑 Login access required",
    "  💬 We''ll contact you via Discord with full instructions",
    "⚠️ Important:",
    "  By purchasing this service, you take full responsibility for your account. If your account receives a ban, we''ll provide a free service once to restore your account, but we cannot purchase a game key for you and refunds are not available. See our Terms & Conditions for more details."
  ]'::jsonb,
  true
),
(
  '💸 Custom Cash',
  3.00,
  'Add any amount of custom cash to your account (30m–50m recommended per 24 hours for safety). Delivered manually within 30 minutes to 12 hours.',
  '💸',
  '["Steam", "Epic Games", "Xbox App", "Rockstar Launcher"]'::jsonb,
  '["Legacy","Enhanced"]'::jsonb,
  '[
    "📌 You must already own GTA V / GTA Online before purchasing",
    "💥 What''s Included:",
    "  💰 Any amount of custom cash (30m–50m recommended per 24 hours, your choice)",
    "⏱️ Delivery:",
    "  ✅ Completed within 30 minutes to 12 hours",
    "  🔑 Login access required",
    "  💬 We''ll contact you via Discord with full instructions",
    "⚠️ Important:",
    "  By purchasing this service, you take full responsibility for your account. If your account receives a ban, we''ll provide a free service once to restore your account, but we cannot purchase a game key for you and refunds are not available. See our Terms & Conditions for more details."
  ]'::jsonb,
  true
),
(
  '💸 Ultimate GTA Package',
  6.00,
  'The complete GTA Online transformation! Custom cash, max level, all unlocks, fast run, premium outfits, modded cars, and all properties. Delivered manually within 1–24 hours.',
  '⚡',
  '["Steam", "Epic Games", "Xbox App", "Rockstar Launcher"]'::jsonb,
  '["Legacy","Enhanced"]'::jsonb,
  '[
    "📌 You must already own GTA V / GTA Online before purchasing",
    "💥 What''s Included:",
    "  💰 Custom cash amount (50m recommended per 24 hours, your choice)",
    "  📈 Level 1–8000 of your choice",
    "  🔥 All stats maxed out",
    "  🔓 All content unlocked + all achievements",
    "  🏃 Fast run enabled",
    "  🎯 Customizable K/D ratio, account creation date & playtime",
    "  👕 Premium modded outfits",
    "  🚗 Any vehicles of your choice",
    "  🏡 All businesses & properties purchased",
    "⏱️ Delivery:",
    "  ✅ Completed within 1–24 hours",
    "  🔑 Login access required",
    "  💬 We''ll contact you via Discord with full instructions",
    "⚠️ Important:",
    "  By purchasing this service, you take full responsibility for your account. If your account receives a ban, we''ll provide a free service once to restore your account, but we cannot purchase a game key for you and refunds are not available. See our Terms & Conditions for more details."
  ]'::jsonb,
  true
);
