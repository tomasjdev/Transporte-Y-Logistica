-- supabase/migrations/20260920090931_restrict_handle_new_user_execute.sql

-- Restrict direct RPC invocation of the trigger function; it should only
-- run via the on_auth_user_created trigger, not be callable as a public API
-- (flagged by Supabase security advisors as a SECURITY DEFINER function
-- exposed to anon/authenticated via PostgREST RPC).
revoke execute on function public.handle_new_user() from public;
revoke execute on function public.handle_new_user() from anon;
revoke execute on function public.handle_new_user() from authenticated;
