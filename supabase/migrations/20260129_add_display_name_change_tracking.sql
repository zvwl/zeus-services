-- Add display_name_changed_at column to customers table to track when user last changed their display name
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS display_name_changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_customers_display_name_changed_at ON public.customers(display_name_changed_at);
