-- supabase/migrations/20260920100500_grant_profiles_table_privileges.sql

-- The foundation migration created RLS policies on public.profiles but never
-- granted the baseline table-level privileges to the authenticated role (this
-- project's default-privilege setup revokes all table grants from
-- authenticated/anon by default). Without these grants, PostgREST returns 403
-- for every request regardless of what the RLS policies would otherwise
-- allow. Discovered while verifying the login flow in Task 3.
grant select, update on public.profiles to authenticated;
