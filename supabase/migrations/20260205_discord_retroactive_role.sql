-- Trigger to assign Discord role when user connects Discord account (if they have existing orders)
-- This handles the case where someone purchases first, then connects Discord later

CREATE OR REPLACE FUNCTION public.handle_discord_connection()
RETURNS trigger
SET search_path = public
AS $$
DECLARE
  has_orders BOOLEAN;
  order_count INT;
BEGIN
  -- Only proceed if this is a Discord identity being added
  IF NEW.provider = 'discord' THEN
    -- Check if user has any paid orders
    SELECT COUNT(*) INTO order_count
    FROM public.orders
    WHERE user_id = NEW.user_id
    AND payment_status = 'paid';
    
    has_orders := order_count > 0;
    
    IF has_orders THEN
      -- Log that we're triggering role assignment
      RAISE NOTICE 'User % connected Discord and has % existing orders - triggering role assignment', NEW.user_id, order_count;
      
      -- Call the assign-discord-role edge function via pg_net
      -- This is async so it won't block the identity creation
      PERFORM net.http_post(
        url := current_setting('app.supabase_url') || '/functions/v1/assign-discord-role',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || current_setting('app.supabase_service_role_key')
        ),
        body := jsonb_build_object(
          'userId', NEW.user_id::text,
          'orderId', NULL,
          'retroactive', true
        )
      );
    ELSE
      RAISE NOTICE 'User % connected Discord but has no existing orders - no role assignment needed', NEW.user_id;
    END IF;
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN others THEN
    -- Don't block identity creation if role assignment fails
    RAISE WARNING 'Failed to trigger Discord role assignment for user %: %', NEW.user_id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on auth.identities (fires when new identity is added)
DROP TRIGGER IF EXISTS on_discord_identity_created ON auth.identities;
CREATE TRIGGER on_discord_identity_created
  AFTER INSERT ON auth.identities
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_discord_connection();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.handle_discord_connection() TO service_role;

-- Set the configuration variables (these need to be set in Supabase dashboard or via ALTER DATABASE)
-- Run these commands in Supabase SQL Editor:
-- ALTER DATABASE postgres SET app.supabase_url = 'https://xdvbhungoadwlmeddelt.supabase.co';
-- ALTER DATABASE postgres SET app.supabase_service_role_key = 'your_service_role_key_here';

-- Note: The trigger will automatically assign the Discord role when:
-- 1. A user connects their Discord account (INSERT into auth.identities)
-- 2. AND they have at least one paid order in the orders table
