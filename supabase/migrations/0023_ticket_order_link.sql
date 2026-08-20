-- ────────────────────────────────────────────────────────────────────────────
-- Zeuservices — link a support ticket to the order it is about
--
-- Staff can now open a thread WITH a customer from the order page (see
-- contactCustomerAboutOrder in src/app/admin/actions.ts). Until now the ticket
-- system was one-directional: only a customer could start a thread, and staff
-- could only reply to one that already existed.
--
-- order_id is nullable because customer-opened tickets from /support have no
-- order, and ON DELETE SET NULL so removing an order orphans the ticket rather
-- than cascading the whole conversation away with it.
--
-- Two access notes, both deliberate:
--
--  1. The column is NOT added to the authenticated UPDATE grant from migration
--     0022 (which is still `grant update (status, updated_at)`), so a customer
--     cannot re-point an existing ticket at somebody else's order.
--
--  2. INSERT is still a table-wide grant, and tickets_insert_own only checked
--     `user_id = auth.uid()`. That would have let a customer create their own
--     ticket carrying a stranger's order_id via direct PostgREST — invisible to
--     them, but it would surface their thread under another customer's order in
--     the admin panel. The policy below now also requires that any order_id
--     they supply is an order they own. Staff inserts go through the service
--     role, which bypasses RLS entirely and is unaffected.
-- ────────────────────────────────────────────────────────────────────────────

alter table zeus.support_tickets
  add column if not exists order_id uuid
    references zeus.orders(id) on delete set null;

-- Backs both the ON DELETE SET NULL fan-out and the "tickets about this order"
-- lookup on the admin order page.
create index if not exists support_tickets_order_idx
  on zeus.support_tickets (order_id);

drop policy if exists "tickets_insert_own" on zeus.support_tickets;
create policy "tickets_insert_own" on zeus.support_tickets for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and (
      order_id is null
      or exists (
        select 1 from zeus.orders o
        where o.id = order_id
          and o.user_id = (select auth.uid())
      )
    )
  );
