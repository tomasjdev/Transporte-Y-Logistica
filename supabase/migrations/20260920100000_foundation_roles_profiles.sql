-- supabase/migrations/20260920100000_foundation_roles_profiles.sql

create schema if not exists private;

create type public.app_role as enum ('operador', 'gerencia', 'admin');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nombre text not null,
  rol public.app_role not null default 'operador',
  activo boolean not null default true,
  creado_en timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Security definer helper: reads the caller's role without recursing into
-- profiles' own RLS (that recursion is why this lives outside a normal
-- policy subquery and is marked security definer).
create function private.current_user_role()
returns public.app_role
language sql
security definer
stable
set search_path = public
as $$
  select rol from public.profiles where id = auth.uid()
$$;

-- Every authenticated user can read their own profile.
create policy "profiles_select_own"
  on public.profiles for select
  to authenticated
  using (id = auth.uid());

-- Admins can read every profile.
create policy "profiles_select_admin"
  on public.profiles for select
  to authenticated
  using (private.current_user_role() = 'admin');

-- Admins can update any profile (role changes, activo toggle).
create policy "profiles_update_admin"
  on public.profiles for update
  to authenticated
  using (private.current_user_role() = 'admin');

-- New auth.users rows get a profile automatically. Default role is
-- 'operador'; an admin promotes people afterwards via UserManagement.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, nombre, rol)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'nombre', new.email),
    coalesce((new.raw_user_meta_data ->> 'rol')::public.app_role, 'operador')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Restrict direct RPC invocation of the trigger function; it should only
-- run via the on_auth_user_created trigger, not be callable as a public API
-- (flagged by Supabase security advisors as a SECURITY DEFINER function
-- exposed to anon/authenticated via PostgREST RPC).
revoke execute on function public.handle_new_user() from public;
revoke execute on function public.handle_new_user() from anon;
revoke execute on function public.handle_new_user() from authenticated;
