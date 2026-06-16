-- ─────────────────────────────────────────────────────────────────────────
-- Zeus Services — public order reference
-- A random, non-sequential code (e.g. ZS-7K3F9A) shown to customers instead
-- of the internal sequential order_number, so it can't be guessed or used to
-- estimate sales volume. order_number is kept for sorting/internal use.
-- ─────────────────────────────────────────────────────────────────────────

alter table zeus.orders add column if not exists reference text;

-- Backfill existing rows with a stable, unique code derived from their id.
update zeus.orders
set reference = 'ZS-' || upper(substr(md5(id::text || order_number::text), 1, 6))
where reference is null;

create unique index if not exists orders_reference_key on zeus.orders (reference);
