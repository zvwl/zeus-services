-- Database trigger to automatically ping sitemap when content changes
-- Run this SQL in your Supabase SQL Editor

-- Function to call the ping-sitemap edge function
CREATE OR REPLACE FUNCTION ping_sitemap_on_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Make HTTP request to ping-sitemap function
  PERFORM
    net.http_post(
      url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/ping-sitemap',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer YOUR_ANON_KEY'
      ),
      body := jsonb_build_object('timestamp', NOW())
    );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for products table
DROP TRIGGER IF EXISTS products_sitemap_ping ON products;
CREATE TRIGGER products_sitemap_ping
  AFTER INSERT OR UPDATE OR DELETE ON products
  FOR EACH STATEMENT
  EXECUTE FUNCTION ping_sitemap_on_change();

-- Trigger for services table
DROP TRIGGER IF EXISTS services_sitemap_ping ON services;
CREATE TRIGGER services_sitemap_ping
  AFTER INSERT OR UPDATE OR DELETE ON services
  FOR EACH STATEMENT
  EXECUTE FUNCTION ping_sitemap_on_change();

-- Note: Make sure to enable the pg_net extension first
-- Run: CREATE EXTENSION IF NOT EXISTS pg_net;
