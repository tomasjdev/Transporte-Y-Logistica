-- supabase/migrations/20260920100600_grant_bitacora_table_privileges.sql
--
-- Task 5 created public.bitacora_viajes and its 5 child tables with RLS
-- policies, but this project's default-privilege setup revokes all table
-- grants from authenticated/anon by default (the same issue the
-- 20260920092353_grant_profiles_table_privileges.sql migration fixed for
-- public.profiles). Without an explicit GRANT, RLS never even gets
-- evaluated for a real authenticated caller — Postgres rejects the query
-- at the privilege check before RLS is consulted. This meant
-- public.guardar_viaje (security invoker, Task 7) could not actually be
-- called by any real operador/gerencia/admin user, only by a superuser
-- role that bypasses grants entirely. This migration grants the base
-- table privileges RLS is meant to further restrict.

grant select, insert, update, delete on public.bitacora_viajes to authenticated;
grant select, insert, update, delete on public.bitacora_fletes to authenticated;
grant select, insert, update, delete on public.bitacora_recargas to authenticated;
grant select, insert, update, delete on public.bitacora_casetas to authenticated;
grant select, insert, update, delete on public.bitacora_gastos_extra to authenticated;
grant select, insert, update, delete on public.bitacora_inventario_unidad to authenticated;
