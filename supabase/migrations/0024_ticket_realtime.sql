-- ────────────────────────────────────────────────────────────────────────────
-- Zeuservices — live ticket messages over Supabase Realtime (Postgres Changes)
--
-- Ticket threads had no live update: TicketThread only called router.refresh()
-- after YOU sent something, so a reply from the other side stayed invisible
-- until the page was reloaded. zeus.ticket_messages now streams to Realtime, so
-- both `/support/[id]` and `/admin/support/[id]` receive new messages as they
-- land.
--
-- WHY POSTGRES CHANGES AND NOT BROADCAST
--
-- Broadcast-from-database was the first attempt and it CANNOT WORK on these
-- projects right now. `realtime.messages` is partitioned, and the only
-- partitions that exist on live cover 2026-06-11 → 2026-06-17 (dev has none at
-- all). Every insert therefore falls outside every partition and fails — and
-- `realtime.send()` wraps its INSERT in `exception when others then raise
-- warning`, so the failure is SWALLOWED. A broadcast trigger looks like it
-- succeeds and silently delivers nothing. Creating partitions is blocked by the
-- July 2026 realtime-schema lockdown (`42501 permission denied for schema
-- realtime`), so it is not fixable from a migration.
--
-- Postgres Changes does not touch `realtime.messages` at all — it reads the WAL
-- through the `supabase_realtime` publication. It is also the safer option
-- here: Realtime evaluates the table's own RLS per subscriber, and
-- `ticket_messages_select` already restricts reads to the ticket owner and
-- staff. That means NO policy on `realtime.messages` is required, and the
-- documented `using (true)` starter policy — which would have exposed every
-- customer's support thread to every logged-in user — never comes into play.
-- ────────────────────────────────────────────────────────────────────────────

-- Undo the abandoned broadcast attempt. These exist only on dev, where 0024 was
-- first applied in its broadcast form; the guards make this a no-op on live.
drop trigger if exists broadcast_ticket_message_trigger on zeus.ticket_messages;
drop function if exists zeus.broadcast_ticket_message();
drop policy if exists "ticket participants receive ticket broadcasts" on realtime.messages;

-- Stream ticket messages to Realtime. Delivery is filtered per subscriber by
-- the existing RLS on this table, so a customer only ever receives messages on
-- their own tickets.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
     where pubname = 'supabase_realtime'
       and schemaname = 'zeus'
       and tablename = 'ticket_messages'
  ) then
    alter publication supabase_realtime add table zeus.ticket_messages;
  end if;
end $$;

-- The default replica identity (primary key) is enough: the client subscribes
-- to INSERT only, and an INSERT payload always carries the full new row.
