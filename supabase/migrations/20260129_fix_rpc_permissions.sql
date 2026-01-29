-- Fix RLS permissions for is_display_name_available function
-- The function needs to be SECURITY DEFINER to allow anon users to call it

-- 1. Drop the existing function
DROP FUNCTION IF EXISTS public.is_display_name_available(text) CASCADE;

-- 2. Recreate with SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.is_display_name_available(check_name text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  reserved_names text[] := ARRAY[
    'admin', 'administrator', 'support', 'system', 'bot', 'api', 'moderator', 'mod', 'staff', 'root', 'superuser', 'superadmin', 'test', 'demo', 'guest', 'null', 'undefined', 'anonymous',
    'fuck', 'shit', 'ass', 'bitch', 'bastard', 'damn', 'hell', 'crap', 'cock', 'pussy', 'dick', 'asshole', 'motherfucker', 'whoreson', 'nigger', 'nigga', 'faggot', 'retard', 'slut', 'whore', 'cunt', 'kike', 'chink', 'spic', 'wetback', 'dyke', 'tranny', 'fag', 'zeus'
  ];
  name_lower text;
BEGIN
  -- Trim and lowercase the input
  name_lower := LOWER(TRIM(check_name));
  
  -- Check length
  IF LENGTH(name_lower) < 3 OR LENGTH(name_lower) > 15 THEN
    RETURN false;
  END IF;
  
  -- Check for reserved names
  IF name_lower = ANY(reserved_names) THEN
    RETURN false;
  END IF;
  
  -- Check if name already exists (case-insensitive)
  IF EXISTS(SELECT 1 FROM customers WHERE LOWER(name) = name_lower) THEN
    RETURN false;
  END IF;
  
  -- Name is available
  RETURN true;
END;
$$;

-- 3. Grant execute permission to anon role
GRANT EXECUTE ON FUNCTION public.is_display_name_available(text) TO anon;

-- 4. Test it
SELECT is_display_name_available('testuser123') as test1,
       is_display_name_available('admin') as test2,
       is_display_name_available('Erasenoobs') as test3;
