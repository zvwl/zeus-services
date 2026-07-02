-- ─────────────────────────────────────────────────────────────────────────
-- Zeuservices — remove emoji category icons.
-- The category "icon" was an emoji glyph rendered on category cards. That
-- feature has been removed from the app (cards now show the category's initial,
-- and the admin form no longer has an icon field), so clear the stored values.
-- Idempotent. Applies to every environment when migrations are run.
-- ─────────────────────────────────────────────────────────────────────────

update zeus.categories set icon = null where icon is not null;
