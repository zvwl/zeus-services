-- Add encrypted note storage columns
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS notes_ciphertext text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS notes_iv text;
