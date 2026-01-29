-- Remove UNIQUE constraint on display name to allow duplicates
ALTER TABLE public.customers DROP CONSTRAINT IF EXISTS customers_name_key;
