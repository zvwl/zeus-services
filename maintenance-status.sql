-- Add maintenance status message (set to inactive by default)
-- Enable it when you need to show maintenance warnings

insert into public.status_announcements (message, status, active)
values ('Website under maintenance. Some features may be temporarily unavailable.', 'maintenance', false);

-- To enable maintenance mode, update the row:
-- update public.status_announcements 
-- set active = true 
-- where status = 'maintenance';

-- To disable maintenance mode:
-- update public.status_announcements 
-- set active = false 
-- where status = 'maintenance';
