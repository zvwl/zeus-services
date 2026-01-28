-- Make display names (name column) unique in customers table
-- This prevents users from having duplicate display names

-- First, check if there are any duplicate names and update them
UPDATE customers
SET name = name || '_' || SUBSTRING(user_id::text, 1, 4)
WHERE name IN (
  SELECT name 
  FROM customers 
  WHERE name IS NOT NULL
  GROUP BY name 
  HAVING COUNT(*) > 1
);

-- Add unique constraint to name column
ALTER TABLE public.customers ADD CONSTRAINT customers_name_key UNIQUE (name);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_customers_name ON public.customers(name);
