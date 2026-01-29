-- Fix handle_new_user trigger - don't raise exceptions, just log errors
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  display_name TEXT;
BEGIN
  -- Extract display_name from user metadata
  display_name := NEW.raw_user_meta_data->>'display_name';
  
  -- If display_name is empty/null, use email as fallback (user can change it later)
  IF display_name IS NULL OR display_name = '' THEN
    display_name := NEW.email;
  END IF;
  
  -- Insert customer record with display_name
  -- The UNIQUE constraint on name column will prevent duplicates at DB level
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
    -- Display name already taken - log it but don't block signup
    -- Frontend validation should have prevented this
    RAISE WARNING 'Display name % is already taken for user %', display_name, NEW.id;
    RETURN NEW;
  WHEN others THEN
    -- Other errors - log and continue
    RAISE WARNING 'Failed to create customer record for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
