-- Fix security warnings for checkout_sessions table
-- Run this to fix the security warnings after initial migration

-- Fix 1: Drop the overly permissive RLS policy
DROP POLICY IF EXISTS "Anyone can insert checkout sessions" ON public.checkout_sessions;

-- Create more restrictive policy
-- Users can insert their own checkout sessions, or guest checkout sessions (user_id IS NULL)
CREATE POLICY "Users can insert own or guest checkout sessions"
  ON public.checkout_sessions
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id OR user_id IS NULL
  );

-- Fix 2: Add fixed search_path to cleanup function
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

-- Verify the fixes
-- Run these queries to confirm:
-- SELECT policyname, permissive, roles, cmd, qual, with_check 
-- FROM pg_policies 
-- WHERE tablename = 'checkout_sessions';
--
-- SELECT proname, prosecdef, proconfig 
-- FROM pg_proc 
-- WHERE proname = 'cleanup_expired_checkout_sessions';
