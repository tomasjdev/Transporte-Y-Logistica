-- supabase/migrations/20260920112458_fix_open_signup_privilege_escalation.sql
--
-- Final whole-branch review Fix 1 (CRITICAL): raw_user_meta_data is
-- attacker-controlled on the public signup endpoint. handle_new_user()
-- previously trusted a client-supplied 'rol' field
-- (coalesce((new.raw_user_meta_data ->> 'rol')::public.app_role,
-- 'operador')), letting any self-registered user grant themselves
-- gerencia/admin by POSTing {"data": {"rol": "admin"}} to
-- supabase.auth.signUp(). Always insert 'operador' regardless of metadata;
-- the create-user edge function (supabase/functions/create-user/index.ts)
-- is the only supported way to set a different role at creation time — it
-- now does so afterward via its already-instantiated service-role client.
--
-- Final whole-branch review Fix 8 (IMPORTANT): recalcular_stock_producto/
-- inicializar_stock_producto are SECURITY DEFINER trigger functions flagged
-- by security advisors as callable via PostgREST RPC. Not actually
-- exploitable (Postgres refuses to invoke a trigger-type function
-- directly), but this project's established pattern (see
-- 20260920090931_restrict_handle_new_user_execute.sql) is to revoke
-- EXECUTE on every such function for consistency.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, nombre, rol)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'nombre', new.email), 'operador');
  return new;
end;
$$;

revoke execute on function public.recalcular_stock_producto() from public, anon, authenticated;
revoke execute on function public.inicializar_stock_producto() from public, anon, authenticated;
