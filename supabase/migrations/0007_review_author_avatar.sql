-- ─────────────────────────────────────────────────────────────────────────
-- Zeuservices — snapshot the reviewer's avatar onto the review
-- profiles RLS only lets a user read their OWN profile, so the avatar can't be
-- joined in on public pages. Snapshot it on the review (like author_name) so it
-- renders for everyone.
-- ─────────────────────────────────────────────────────────────────────────

alter table zeus.reviews add column if not exists author_avatar text;

update zeus.reviews r
set author_avatar = p.avatar_url
from zeus.profiles p
where r.user_id = p.id and r.author_avatar is null and p.avatar_url is not null;
