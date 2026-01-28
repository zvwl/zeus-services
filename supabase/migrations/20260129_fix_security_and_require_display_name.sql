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

-- Remove UNIQUE constraint on display name to allow flexibility
ALTER TABLE public.customers DROP CONSTRAINT IF EXISTS customers_name_key;

-- Update handle_new_user trigger to insert customer with provided display name
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.customers (user_id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'display_name'  -- Get display_name from signup metadata
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

-- Fix broken customers policies
DROP POLICY IF EXISTS "customers_select_policy" ON public.customers;
DROP POLICY IF EXISTS "customers_insert_policy" ON public.customers;
DROP POLICY IF EXISTS "customers_update_policy" ON public.customers;
DROP POLICY IF EXISTS "customers_delete_policy" ON public.customers;

CREATE POLICY "customers_select_policy"
  ON public.customers
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "customers_insert_policy"
  ON public.customers
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "customers_update_policy"
  ON public.customers
  FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "customers_delete_policy"
  ON public.customers
  FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);
