-- Add stock management to items table
-- Run this in Supabase SQL Editor

-- Step 1: Add stock columns to items table
ALTER TABLE public.items
ADD COLUMN IF NOT EXISTS stock_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS stock_quantity INTEGER DEFAULT NULL,
ADD COLUMN IF NOT EXISTS stock_unlimited BOOLEAN DEFAULT false;

-- Step 2: Add comments for documentation
COMMENT ON COLUMN public.items.stock_enabled IS 'Whether this item tracks stock/inventory';
COMMENT ON COLUMN public.items.stock_quantity IS 'Current stock count. NULL if stock_enabled=false or stock_unlimited=true';
COMMENT ON COLUMN public.items.stock_unlimited IS 'If true, item never runs out of stock';

-- Step 3: Add index for faster stock queries
CREATE INDEX IF NOT EXISTS idx_items_stock_enabled ON public.items(stock_enabled) WHERE stock_enabled = true;

-- Step 4: Update items_with_details view to include stock info
DROP VIEW IF EXISTS public.items_with_details CASCADE;

CREATE OR REPLACE VIEW public.items_with_details
WITH (security_invoker = true) AS
SELECT 
  i.id,
  i.game_id,
  i.category_id,
  i.name,
  i.slug,
  i.price,
  i.description,
  i.icon,
  i.platforms,
  i.versions,
  i.details,
  i.active,
  i.featured,
  i.stock_enabled,
  i.stock_quantity,
  i.stock_unlimited,
  i.created_at,
  i.updated_at,
  i.legacy_type,
  i.legacy_id,
  g.name as game_name,
  g.slug as game_slug,
  g.icon_url as game_icon_url,
  c.name as category_name,
  c.slug as category_slug
FROM public.items i
LEFT JOIN public.games g ON i.game_id = g.id
LEFT JOIN public.categories c ON i.category_id = c.id;

-- Step 5: Grant permissions
GRANT SELECT ON public.items_with_details TO anon, authenticated;

-- Step 6: Create function to check stock availability
CREATE OR REPLACE FUNCTION public.is_item_in_stock(item_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  item_record RECORD;
BEGIN
  SELECT stock_enabled, stock_quantity, stock_unlimited
  INTO item_record
  FROM public.items
  WHERE id = item_id;

  -- If stock not enabled, always in stock
  IF NOT item_record.stock_enabled THEN
    RETURN true;
  END IF;

  -- If unlimited stock, always in stock
  IF item_record.stock_unlimited THEN
    RETURN true;
  END IF;

  -- Check if stock quantity > 0
  RETURN COALESCE(item_record.stock_quantity, 0) > 0;
END;
$$;

COMMENT ON FUNCTION public.is_item_in_stock IS 'Check if an item is currently in stock';

-- Step 7: Create function to decrease stock on purchase
CREATE OR REPLACE FUNCTION public.decrease_item_stock(item_id UUID, quantity INTEGER DEFAULT 1)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  item_record RECORD;
  new_stock INTEGER;
BEGIN
  -- Get current item stock info with row lock
  SELECT stock_enabled, stock_quantity, stock_unlimited
  INTO item_record
  FROM public.items
  WHERE id = item_id
  FOR UPDATE;

  -- If stock not enabled or unlimited, do nothing
  IF NOT item_record.stock_enabled OR item_record.stock_unlimited THEN
    RETURN true;
  END IF;

  -- Check if enough stock
  IF COALESCE(item_record.stock_quantity, 0) < quantity THEN
    RAISE EXCEPTION 'Insufficient stock for item %', item_id;
  END IF;

  -- Decrease stock
  new_stock := item_record.stock_quantity - quantity;
  
  UPDATE public.items
  SET 
    stock_quantity = new_stock,
    updated_at = NOW()
  WHERE id = item_id;

  RETURN true;
END;
$$;

COMMENT ON FUNCTION public.decrease_item_stock IS 'Decrease stock quantity when an item is purchased';

-- Step 8: Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION public.is_item_in_stock TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.decrease_item_stock TO authenticated;
