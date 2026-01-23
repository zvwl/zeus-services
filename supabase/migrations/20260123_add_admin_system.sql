-- Add admin_users table for managing admin access
create table if not exists public.admin_users (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  email text not null,
  role text not null default 'admin',
  notification_enabled boolean not null default true,
  created_at timestamp with time zone not null default now(),
  constraint admin_users_user_id_fkey foreign key (user_id) references auth.users (id) on delete cascade,
  constraint admin_users_email_key unique (email),
  constraint admin_users_user_id_key unique (user_id),
  constraint admin_users_role_check check (role in ('admin', 'staff'))
);

-- Enable RLS
alter table public.admin_users enable row level security;

-- Only admins can view admin_users table
create policy "Admins can view admin users"
  on public.admin_users
  for select
  to authenticated
  using (
    exists (
      select 1 from public.admin_users
      where user_id = auth.uid()
    )
  );

-- Only admins can insert/update/delete admin users
create policy "Admins can manage admin users"
  on public.admin_users
  for all
  to authenticated
  using (
    exists (
      select 1 from public.admin_users
      where user_id = auth.uid()
    )
  );

-- Update orders policies to allow admins to view all orders
create policy "Admins can view all orders"
  on public.orders
  for select
  to authenticated
  using (
    exists (
      select 1 from public.admin_users
      where user_id = auth.uid()
    )
  );

-- Allow admins to update order status
create policy "Admins can update orders"
  on public.orders
  for update
  to authenticated
  using (
    exists (
      select 1 from public.admin_users
      where user_id = auth.uid()
    )
  );

-- Create function to check if user is admin
create or replace function public.is_admin(user_id uuid)
returns boolean
language sql
security definer
as $$
  select exists (
    select 1 from public.admin_users
    where admin_users.user_id = $1
  );
$$;

-- Grant execute permission
grant execute on function public.is_admin(uuid) to authenticated;

-- Add comments
comment on table public.admin_users is 'Stores admin and staff user IDs for order management';
comment on function public.is_admin is 'Check if a user has admin privileges';
