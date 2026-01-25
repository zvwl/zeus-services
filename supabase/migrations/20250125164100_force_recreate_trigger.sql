-- Drop and recreate the trigger and function
DROP TRIGGER IF EXISTS trigger_notify_admins ON public.orders;
DROP FUNCTION IF EXISTS public.notify_admins_on_new_order();

-- Create the function with net schema
CREATE FUNCTION public.notify_admins_on_new_order()
RETURNS trigger AS $$
BEGIN
  PERFORM
    net.http_post(
      url := concat(
        current_setting('app.supabase_url'),
        '/functions/v1/notify-order-admins'
      ),
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.supabase_anon_key')
      ),
      body := jsonb_build_object(
        'order_id', new.id,
        'customer_email', new.customer_email,
        'customer_name', new.customer_name,
        'total_amount', new.total_amount,
        'currency', new.currency,
        'items', new.items,
        'payment_method', new.payment_method,
        'created_at', new.created_at
      ),
      timeout_milliseconds := 5000
    );
  RETURN new;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger
CREATE TRIGGER trigger_notify_admins
AFTER INSERT ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.notify_admins_on_new_order();
