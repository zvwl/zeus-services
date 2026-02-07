-- Database trigger to automatically ping sitemap when content changes
-- Run this SQL in your Supabase SQL Editor

-- STEP 1: Enable pg_net extension
-- Run this first if you haven't already:
-- CREATE EXTENSION IF NOT EXISTS pg_net;

-- Function to ping Google and Bing when content changes
CREATE OR REPLACE FUNCTION ping_sitemap_on_change()
RETURNS TRIGGER AS $$
DECLARE
  sitemap_url TEXT := 'https://zeuservices.com/sitemap.xml';
  google_ping_url TEXT;
  bing_ping_url TEXT;
BEGIN
  -- Build ping URLs
  google_ping_url := 'https://www.google.com/ping?sitemap=' || sitemap_url;
  bing_ping_url := 'https://www.bing.com/ping?sitemap=' || sitemap_url;
  
  -- Ping Google (asynchronous, won't block the transaction)
  PERFORM net.http_get(
    url := google_ping_url
  );
  
  -- Ping Bing (asynchronous)
  PERFORM net.http_get(
    url := bing_ping_url
  );
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- If ping fails, don't block the actual insert/update
    RAISE WARNING 'Failed to ping sitemap: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

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

