-- Update admin_actions_with_names view to include review_id and handle review actions
CREATE OR REPLACE VIEW public.admin_actions_with_names 
WITH (security_invoker = true) AS
SELECT 
  aa.id,
  aa.admin_user_id,
  COALESCE(
    c.name,
    c.email,
    public.get_user_email(aa.admin_user_id),
    'Unknown'
  ) as admin_name,
  aa.action_type,
  aa.order_id,
  aa.review_id,
  aa.old_status,
  aa.new_status,
  aa.notes,
  aa.created_at,
  aa.updated_at
FROM public.admin_actions aa
LEFT JOIN public.customers c ON aa.admin_user_id = c.user_id;
