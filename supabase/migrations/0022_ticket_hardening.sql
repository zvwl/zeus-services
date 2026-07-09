-- 0022: Support-ticket hardening (July 2026 security review).
--
-- 1. zeus.is_staff() now returns false for banned accounts — a banned staff
--    member instantly loses staff powers across every RLS policy.
-- 2. Ticket owners can no longer update arbitrary columns via direct
--    PostgREST (self-escalating priority, reopening closed tickets,
--    rewriting subjects): owner updates may only set status = 'closed', and
--    column privileges restrict anon-key updates to status/updated_at.
--    Staff meta edits and the app's reply status flips use the service role,
--    which bypasses both layers.
-- 3. Message inserts: sender pinned to auth.uid() for staff too, banned
--    users blocked, customers can't post into closed tickets, and content
--    length is capped at the DB (the app caps at 4000 chars; direct REST
--    previously had no ceiling).

create or replace function zeus.is_staff() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from zeus.profiles
    where id = auth.uid()
      and role in ('support','admin','super_admin')
      and not is_banned
  );
$$;

-- Owner ticket updates: close-only.
drop policy if exists "tickets_update" on zeus.support_tickets;
drop policy if exists "tickets_update_staff" on zeus.support_tickets;
drop policy if exists "tickets_update_owner_close" on zeus.support_tickets;
create policy "tickets_update_staff" on zeus.support_tickets for update to authenticated
  using (zeus.is_staff())
  with check (zeus.is_staff());
create policy "tickets_update_owner_close" on zeus.support_tickets for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()) and status = 'closed');

revoke update on zeus.support_tickets from anon, authenticated;
grant update (status, updated_at) on zeus.support_tickets to authenticated;

-- Messages: pinned sender, closed-ticket and banned-user posts blocked at the
-- DB, sane length ceiling.
alter table zeus.ticket_messages
  drop constraint if exists ticket_messages_len;
alter table zeus.ticket_messages
  add constraint ticket_messages_len check (char_length(message) <= 8000);

drop policy if exists "ticket_messages_insert" on zeus.ticket_messages;
create policy "ticket_messages_insert" on zeus.ticket_messages for insert to authenticated
  with check (
    sender_id = (select auth.uid())
    and (
      (zeus.is_staff() and is_staff = true)
      or (
        is_staff = false
        and not exists (
          select 1 from zeus.profiles p
          where p.id = (select auth.uid()) and p.is_banned
        )
        and exists (
          select 1 from zeus.support_tickets t
          where t.id = ticket_id
            and t.user_id = (select auth.uid())
            and t.status <> 'closed'
        )
      )
    )
  );
