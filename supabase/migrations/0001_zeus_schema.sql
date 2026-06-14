-- Zeus Services lives in its own `zeus` schema, isolated from any other
-- tables in the project. Applied to the linked Supabase project via MCP;
-- kept here for version control.

create schema if not exists zeus;

grant usage on schema zeus to anon, authenticated, service_role;
alter default privileges in schema zeus grant all on tables to anon, authenticated, service_role;
alter default privileges in schema zeus grant all on routines to anon, authenticated, service_role;
alter default privileges in schema zeus grant all on sequences to anon, authenticated, service_role;

-- Expose the schema through PostgREST (Supabase Data API) while keeping the
-- previously exposed schemas intact.
alter role authenticator set pgrst.db_schemas = 'public, storage, graphql_public, zeus';
notify pgrst, 'reload config';
