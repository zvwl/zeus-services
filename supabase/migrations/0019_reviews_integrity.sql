-- Zeuservices — review integrity enforced at the database, not just in app code.
--
-- Before this, the "must have a paid order" and "one review per product" rules
-- lived only in the submitReview server action. Because the zeus schema is
-- exposed through PostgREST and any signed-up user holds a valid JWT, a user
-- could POST directly to /rest/v1/reviews and forge unlimited unapproved reviews
-- for products they never bought (moderation-queue flooding), and nothing at the
-- DB level stopped duplicates from ever being approved.

-- 1) De-duplicate existing rows (keep the newest per user/product pair).
delete from zeus.reviews a using zeus.reviews b
 where a.user_id is not null and a.user_id = b.user_id
   and a.product_id is not distinct from b.product_id
   and (a.created_at, a.id) < (b.created_at, b.id);

-- 2) Enforce one review per (user, product) and one general review per user.
--    Partial so admin-imported rows (null user_id) are unaffected.
create unique index if not exists reviews_one_per_product
  on zeus.reviews (user_id, product_id) where user_id is not null and product_id is not null;
create unique index if not exists reviews_one_general
  on zeus.reviews (user_id) where user_id is not null and product_id is null;

-- 3) Rebuild the INSERT policy with a real purchase gate and a ban check.
--    The EXISTS subqueries run as the invoking user; orders_select and
--    order_items_select already let a user read their own rows, so these work
--    under RLS. Product-specific reviews require having bought THAT product.
drop policy if exists reviews_insert_own on zeus.reviews;
create policy reviews_insert_own on zeus.reviews for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and is_approved = false
    and is_featured = false
    and admin_reply is null
    and not exists (
      select 1 from zeus.profiles p
      where p.id = (select auth.uid()) and p.is_banned
    )
    and (
      (product_id is not null and exists (
        select 1 from zeus.order_items oi
        join zeus.orders o on o.id = oi.order_id
        where oi.product_id = reviews.product_id
          and o.user_id = (select auth.uid())
          and o.status in ('paid','processing','completed')
      ))
      or
      (product_id is null and exists (
        select 1 from zeus.orders o
        where o.user_id = (select auth.uid())
          and o.status in ('paid','processing','completed')
      ))
    )
  );

-- 4) Reviews are self-contained (author_name/author_avatar are snapshotted), so
--    an account deletion should NOT wipe the store's public social proof. Switch
--    the FK from CASCADE to SET NULL, matching blog_posts.author_id / orders.user_id.
alter table zeus.reviews drop constraint if exists reviews_user_id_fkey;
alter table zeus.reviews
  add constraint reviews_user_id_fkey
  foreign key (user_id) references zeus.profiles(id) on delete set null;

notify pgrst, 'reload config';
