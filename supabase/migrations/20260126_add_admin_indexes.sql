-- Add indexes to optimize admin_users lookups used in RLS policies
-- This fixes slow session/admin checks that were timing out

-- Index on user_id for fast admin lookups
CREATE INDEX IF NOT EXISTS idx_admin_users_user_id_active 
  ON public.admin_users(user_id, active) 
  WHERE active = true;

-- Index on active status alone for quick active admin count checks
CREATE INDEX IF NOT EXISTS idx_admin_users_active 
  ON public.admin_users(active) 
  WHERE active = true;
