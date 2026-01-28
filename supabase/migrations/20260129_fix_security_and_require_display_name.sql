-- Fix security advisory: set search_path for set_review_eligible function
CREATE OR REPLACE FUNCTION public.set_review_eligible()
RETURNS trigger AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    NEW.review_eligible := true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Update handle_new_user trigger to allow NULL display name at signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.customers (user_id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    NULL  -- Don't set display name at signup, user sets it later in Settings
  );
  
  RETURN NEW;
EXCEPTION
  WHEN others THEN
    -- Log errors but don't block user creation
    RAISE WARNING 'Failed to create customer record for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
