-- Check if any orders exist
SELECT id, user_id, customer_email, payment_status, status, created_at 
FROM orders 
ORDER BY created_at DESC 
LIMIT 10;

-- Count total orders
SELECT COUNT(*) as total_orders FROM orders;

-- Check order creation timeline
SELECT 
  DATE(created_at) as date,
  COUNT(*) as count,
  payment_status,
  status
FROM orders 
GROUP BY DATE(created_at), payment_status, status
ORDER BY DATE(created_at) DESC;

--