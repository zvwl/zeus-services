-- ────────────────────────────────────────────────────────────────────────────
-- Zeuservices — typing indicators on ticket threads
--
-- Authorizes a private Realtime channel per ticket, `ticket:<uuid>`, used ONLY
-- for ephemeral "is typing" broadcasts between the customer and staff.
--
-- WHY THIS WORKS WHEN BROADCAST-FROM-DATABASE DOES NOT
--
-- Migration 0024 documents that `realtime.messages` has no partition covering
-- the current date, so anything that INSERTS into it fails silently. Client
-- broadcast never inserts: to authorize a channel join or send, Realtime runs a
-- query against `realtime.messages` and then ROLLS IT BACK. The policies below
-- are evaluated as a permission check and nothing is ever written, so the
-- partition problem does not apply. Typing state is ephemeral by nature and
-- should never be persisted anyway.
--
-- NEVER CAST THE TOPIC — this was found the hard way
--
-- The obvious way to write this is to guard with a UUID regex and then compare
-- `t.id = substring(realtime.topic() from 8)::uuid`, with the guard in a CASE
-- so it runs first. **That does not work.** Postgres hoists the sub-SELECT out
-- of the CASE and evaluates the cast regardless of the branch, so a client
-- joining `ticket:not-a-uuid` raised `22P02 invalid input syntax for type uuid`
-- instead of being cleanly denied. Verified by probe on 2026-08-20.
--
-- CASE only orders evaluation for simple scalar expressions; it gives no such
-- guarantee once a subquery is involved. So the comparison below goes the other
-- way: the trusted COLUMN is cast to text and compared against the topic
-- string. There is no cast of untrusted input anywhere, so the predicate cannot
-- raise no matter what topic a client asks for.
--
-- SECURITY SHAPE
--
-- This is the first time clients may broadcast at all, so both policies are
-- scoped rather than granted broadly:
--   * `extension = 'broadcast'` — presence and postgres_changes are unaffected.
--   * the topic must start with `ticket:`.
--   * the caller must be staff, or the owner of that exact ticket.
--
-- Note what is NOT here: no policy grants access to ticket *content*. Message
-- history still comes from zeus.ticket_messages under its own RLS. The worst a
-- wrongly-authorized client could learn from this channel is that somebody is
-- typing.
-- ────────────────────────────────────────────────────────────────────────────

drop policy if exists "ticket participants receive typing" on realtime.messages;
create policy "ticket participants receive typing"
on realtime.messages
for select
to authenticated
using (
  extension = 'broadcast'
  and realtime.topic() like 'ticket:%'
  and (
    zeus.is_staff()
    or exists (
      select 1 from zeus.support_tickets t
      where t.user_id = (select auth.uid())
        and 'ticket:' || t.id::text = realtime.topic()
    )
  )
);

drop policy if exists "ticket participants send typing" on realtime.messages;
create policy "ticket participants send typing"
on realtime.messages
for insert
to authenticated
with check (
  extension = 'broadcast'
  and realtime.topic() like 'ticket:%'
  and (
    zeus.is_staff()
    or exists (
      select 1 from zeus.support_tickets t
      where t.user_id = (select auth.uid())
        and 'ticket:' || t.id::text = realtime.topic()
    )
  )
);
