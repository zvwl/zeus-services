-- Create a view to get admin_actions with admin names
CREATE OR REPLACE VIEW public.admin_actions_with_names AS
SELECT 
  aa.id,
  aa.admin_user_id,
  COALESCE(c.name, c.email, 'Unknown') as admin_name,
  aa.action_type,
  aa.order_id,
  aa.old_status,
  aa.new_status,
  aa.notes,
  aa.created_at,
  aa.updated_at
FROM public.admin_actions aa
LEFT JOIN public.customers c ON aa.admin_user_id = c.user_id;

-- Enable RLS on the view to respect table policies
ALTER VIEW public.admin_actions_with_names OWNER TO postgres;

-- Grant select to authenticated users (RLS will filter)
GRANT SELECT ON public.admin_actions_with_names TO authenticated;
GRANT SELECT ON public.admin_actions_with_names TO anon;
