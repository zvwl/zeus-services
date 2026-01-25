-- Create net schema and enable pg_net extension
CREATE SCHEMA IF NOT EXISTS net;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA net;

-- Recreate the function with correct schema reference
CREATE OR REPLACE FUNCTION public.notify_admins_on_new_order()
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
