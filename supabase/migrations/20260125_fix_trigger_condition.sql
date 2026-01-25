-- Fix the trigger to only fire when status='processing' (after successful payment)
-- This prevents random emails for test orders, failed payments, etc.

DROP TRIGGER IF EXISTS trigger_notify_admins ON public.orders;

-- Recreate the trigger with the condition
CREATE TRIGGER trigger_notify_admins
AFTER INSERT ON public.orders
FOR EACH ROW
WHEN (NEW.status = 'processing')
EXECUTE FUNCTION public.notify_admins_on_new_order();
