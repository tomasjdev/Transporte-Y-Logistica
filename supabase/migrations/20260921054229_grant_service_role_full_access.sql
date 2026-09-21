-- supabase/migrations/20260921054229_grant_service_role_full_access.sql
--
-- service_role had never been granted base table privileges on any table
-- in this project (only the automatic TRUNCATE/REFERENCES/TRIGGER that
-- Postgres grants to every role by default) — RLS bypass (rolbypassrls)
-- only skips policy evaluation, it does not substitute for the base ACL
-- grant system, so service_role still needs explicit SELECT/INSERT/
-- UPDATE/DELETE to do anything. This silently broke the create-user edge
-- function's profiles update (returned "permission denied for table
-- profiles"), discovered via a real reproduction with response-body
-- logging. service_role is Supabase's trusted server-side/admin role, so
-- granting it full access on every table (plus default privileges for
-- future tables) is the standard, correct fix — not a narrower grant.
grant all on all tables in schema public to service_role;
alter default privileges in schema public grant all on tables to service_role;
