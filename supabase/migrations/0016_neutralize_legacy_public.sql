-- Neutralize the abandoned legacy application that lives in the `public` schema.
--
-- The production database still contains a full previous-generation app in
-- public.* (orders, customers, checkout_sessions, reviews, games, categories,
-- items, admin_users, admin_actions, sessions, ...). The current Next.js app
-- never touches it — every Supabase client pins db.schema = 'zeus' and every
-- RPC resolves to zeus.* — yet `public` was still exposed through the Data API,
-- leaving historical customer/order rows readable over an unauthenticated API
-- and producing the majority of the advisor's RLS lints.
--
-- We DO NOT drop the tables: they hold real historical business data. Instead we
-- take the schema off the API, revoke all anon/authenticated access, drop the
-- now-pointless RLS policies (clears the perf lints; RLS stays enabled so the
-- tables deny by default), and detach the dead signup triggers that were still
-- dual-writing to the legacy schema on every new account.
--
-- To permanently remove this data later, archive it (pg_dump --schema=public)
-- and then `drop schema public cascade`-style per-table drops in a follow-up.

-- 1) Detach the legacy auth triggers. The live signup path is
--    zeus_on_auth_user_created -> zeus.handle_new_user, which stays.
drop trigger if exists on_auth_user_created on auth.users;
drop trigger if exists on_discord_identity_created on auth.identities;
drop function if exists public.handle_new_user() cascade;
drop function if exists public.handle_discord_connection() cascade;

-- 2) Stop exposing the legacy schema through PostgREST. The app's default schema
--    becomes zeus (which it already sends explicitly on every request).
alter role authenticator set pgrst.db_schemas = 'zeus, storage, graphql_public';

-- 3) Revoke all anon/authenticated access to the legacy schema (belt & braces).
revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;
revoke all on all functions in schema public from anon, authenticated;
revoke usage on schema public from anon, authenticated;

-- 4) Drop every RLS policy still defined on the legacy public tables. With no
--    policies and RLS enabled, the tables deny by default; this also clears the
--    multiple_permissive_policies and auth_rls_initplan advisor warnings that
--    these dead tables were generating.
do $$
declare r record;
begin
  for r in
    select schemaname, tablename, policyname
    from pg_policies where schemaname = 'public'
  loop
    execute format('drop policy if exists %I on public.%I', r.policyname, r.tablename);
  end loop;
end $$;

notify pgrst, 'reload config';
