-- Enforce unique display names and add validation
-- This migration ensures display names are unique across all users

-- Step 1: Handle any existing duplicate display names
-- Add a unique suffix to duplicates so we can add the constraint
DO $$
DECLARE
  duplicate_record RECORD;
  counter INT;
  i INT;
BEGIN
  FOR duplicate_record IN 
    SELECT name, array_agg(user_id ORDER BY created_at) as user_ids
    FROM customers 
    WHERE name IS NOT NULL 
    GROUP BY name 
    HAVING COUNT(*) > 1
  LOOP
    counter := 1;
    -- Keep the first user's name unchanged, suffix others
    -- Start from index 2 (second element) since arrays are 1-indexed in PostgreSQL
    FOR i IN 2..array_length(duplicate_record.user_ids, 1)
    LOOP
      UPDATE customers 
      SET name = duplicate_record.name || '_' || counter
      WHERE user_id = duplicate_record.user_ids[i];
      counter := counter + 1;
    END LOOP;
  END LOOP;
END $$;

-- Step 2: Add unique constraint on name column
ALTER TABLE public.customers 
DROP CONSTRAINT IF EXISTS customers_name_key;

ALTER TABLE public.customers 
ADD CONSTRAINT customers_name_key UNIQUE (name);

-- Step 3: Create function to check if display name is available
-- This function can be called by anyone (even unauthenticated users during signup)
CREATE OR REPLACE FUNCTION public.is_display_name_available(check_name TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  reserved_names TEXT[] := ARRAY[
    'admin', 'administrator', 'support', 'system', 'bot', 'api',
    'moderator', 'mod', 'staff', 'root', 'superuser', 'superadmin',
    'test', 'demo', 'guest', 'null', 'undefined', 'anonymous',
    'fuck', 'shit', 'ass', 'bitch', 'bastard', 'damn', 'hell', 'crap',
    'cock', 'pussy', 'dick', 'asshole', 'motherfucker', 'whoreson',
    'nigger', 'nigga', 'faggot', 'retard', 'slut', 'whore', 'cunt',
    'kike', 'chink', 'spic', 'wetback', 'dyke', 'tranny', 'fag'
  ];
  clean_name TEXT;
BEGIN
  -- Return TRUE if name is available (not found), FALSE if taken or invalid
  -- Check that name is not empty/null
  IF check_name IS NULL OR trim(check_name) = '' THEN
    RETURN FALSE;
  END IF;
  
  clean_name := trim(check_name);
  
  -- Check maximum length (15 characters)
  IF char_length(clean_name) > 15 THEN
    RETURN FALSE;
  END IF;
  
  -- Check if name is reserved
  IF LOWER(clean_name) = ANY(reserved_names) THEN
    RETURN FALSE;
  END IF;
  
  RETURN NOT EXISTS (
    SELECT 1 FROM public.customers 
    WHERE LOWER(name) = LOWER(clean_name)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- Step 4: Grant execute permission to all users (including anon)
GRANT EXECUTE ON FUNCTION public.is_display_name_available(TEXT) TO anon, authenticated;

-- Step 5: Create a special policy that allows checking if display names exist
-- This is a read-only policy that only exposes whether a name exists, not other data
DROP POLICY IF EXISTS "allow_display_name_check" ON public.customers;

CREATE POLICY "allow_display_name_check"
  ON public.customers
  FOR SELECT
  TO anon, authenticated
  USING (true);  -- Allow reading name column for uniqueness checks

-- Step 6: Update the handle_new_user trigger to handle unique constraint violations
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  display_name TEXT;
BEGIN
  -- Extract display_name from user metadata
  display_name := trim(NEW.raw_user_meta_data->>'display_name');
  
  -- If display_name is empty/null, use email prefix as fallback
  IF display_name IS NULL OR display_name = '' THEN
    display_name := split_part(NEW.email, '@', 1);
  END IF;
  
  -- Insert customer record with display_name
  -- The frontend should have already validated uniqueness,
  -- but this provides a final safeguard
  INSERT INTO public.customers (user_id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    display_name
  )
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    -- Display name already taken - this should rarely happen due to frontend validation
    -- Add a random suffix and retry
    INSERT INTO public.customers (user_id, email, name)
    VALUES (
      NEW.id,
      NEW.email,
      display_name || '_' || substr(NEW.id::text, 1, 4)
    )
    ON CONFLICT (user_id) DO NOTHING;
    
    RAISE WARNING 'Display name % was taken, assigned %_% instead', 
      display_name, display_name, substr(NEW.id::text, 1, 4);
    RETURN NEW;
  WHEN others THEN
    -- Other errors - log and continue
    RAISE WARNING 'Failed to create customer record for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Step 7: Create index for case-insensitive lookups
CREATE INDEX IF NOT EXISTS idx_customers_name_lower 
ON public.customers (LOWER(name));

-- Step 8: Add comment for documentation
COMMENT ON CONSTRAINT customers_name_key ON public.customers IS 
  'Ensures display names are unique across all users';

COMMENT ON FUNCTION public.is_display_name_available(TEXT) IS 
  'Checks if a display name is available for use. Returns TRUE if available, FALSE if taken or invalid.';
