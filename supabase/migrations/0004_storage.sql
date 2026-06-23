-- ─────────────────────────────────────────────────────────────────────────
-- Zeuservices — storage buckets
--   zeus-assets  : product/game/blog/giveaway images (admin write)
--   zeus-avatars : user avatars (each user writes to their own folder)
-- ─────────────────────────────────────────────────────────────────────────

insert into storage.buckets (id, name, public)
values ('zeus-assets', 'zeus-assets', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('zeus-avatars', 'zeus-avatars', true)
on conflict (id) do nothing;

-- Note: no SELECT policies — public buckets serve objects via their public
-- URL already, and omitting them prevents listing bucket contents via API.

drop policy if exists "zeus_assets_insert" on storage.objects;
create policy "zeus_assets_insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'zeus-assets' and zeus.is_admin());

drop policy if exists "zeus_assets_update" on storage.objects;
create policy "zeus_assets_update" on storage.objects for update to authenticated
  using (bucket_id = 'zeus-assets' and zeus.is_admin())
  with check (bucket_id = 'zeus-assets' and zeus.is_admin());

drop policy if exists "zeus_assets_delete" on storage.objects;
create policy "zeus_assets_delete" on storage.objects for delete to authenticated
  using (bucket_id = 'zeus-assets' and zeus.is_admin());

drop policy if exists "zeus_avatars_insert" on storage.objects;
create policy "zeus_avatars_insert" on storage.objects for insert to authenticated
  with check (
    bucket_id = 'zeus-avatars'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

drop policy if exists "zeus_avatars_update" on storage.objects;
create policy "zeus_avatars_update" on storage.objects for update to authenticated
  using (
    bucket_id = 'zeus-avatars'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  )
  with check (
    bucket_id = 'zeus-avatars'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

drop policy if exists "zeus_avatars_delete" on storage.objects;
create policy "zeus_avatars_delete" on storage.objects for delete to authenticated
  using (
    bucket_id = 'zeus-avatars'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );
