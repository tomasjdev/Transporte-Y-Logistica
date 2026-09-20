-- supabase/migrations/20260920112554_enforce_profiles_activo_in_role_check.sql
--
-- Final whole-branch review Fix 9 (IMPORTANT): profiles.activo existed but
-- was enforced nowhere, so a deactivated user retained full permissions.
-- Wire it into the one chokepoint every RLS policy already calls: an
-- inactive user's role lookup now returns NULL (matches no role check),
-- which fails closed on every '= admin' / 'in (gerencia, admin)' check in
-- every policy without any other policy needing to change.
create or replace function private.current_user_role()
returns public.app_role
language sql
security definer
stable
set search_path = public
as $$
  select rol from public.profiles where id = auth.uid() and activo = true
$$;
