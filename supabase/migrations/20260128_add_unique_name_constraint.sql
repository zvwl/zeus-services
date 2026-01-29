-- Re-add UNIQUE constraint on display name to prevent duplicates
-- This prevents users from registering with the same display name

-- First, we need to handle duplicates in existing data
-- For any duplicate names, keep only the most recent one
WITH ranked_customers AS (
  SELECT 
    user_id,
    name,
    created_at,
    ROW_NUMBER() OVER (PARTITION BY name ORDER BY created_at DESC) as rn
  FROM public.customers
  WHERE name IS NOT NULL
)
DELETE FROM public.customers
WHERE user_id IN (
  SELECT user_id FROM ranked_customers WHERE rn > 1
);

-- Now add the UNIQUE constraint
ALTER TABLE public.customers
ADD CONSTRAINT customers_name_key UNIQUE (name);

-- Verify the constraint exists
SELECT constraint_name 
FROM information_schema.table_constraints 
WHERE table_name = 'customers' 
AND constraint_type = 'UNIQUE' 
AND constraint_name = 'customers_name_key';
