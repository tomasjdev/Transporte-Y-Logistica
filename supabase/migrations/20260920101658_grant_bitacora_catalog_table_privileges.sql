-- supabase/migrations/20260920101658_grant_bitacora_catalog_table_privileges.sql
--
-- Task 8's fetchCatalogos() (src/lib/bitacora.ts) reads public.bitacora_camiones,
-- bitacora_pesos, bitacora_estados, and bitacora_componentes directly via the
-- REST API as an authenticated user. Task 5's migration created these catalog
-- tables with RLS policies but, like public.profiles (fixed in
-- 20260920092353_grant_profiles_table_privileges.sql) and the viaje/child
-- tables (fixed in 20260920100600_grant_bitacora_table_privileges.sql), never
-- granted table-level SELECT to authenticated — this project's environment
-- auto-revokes default privileges on every new table, so RLS is never even
-- reached without an explicit GRANT. Discovered via Task 9 browser
-- verification: fetchCatalogos() returned 403 for all four catalog tables,
-- leaving CapturaViaje stuck on "Cargando…" forever. bitacora_config and
-- bitacora_rendimientos are included too since they have the same gap and are
-- read by calcular_liquidacion/obtener_parametros_liquidacion callers.

grant select on public.bitacora_camiones to authenticated;
grant select on public.bitacora_pesos to authenticated;
grant select on public.bitacora_estados to authenticated;
grant select on public.bitacora_componentes to authenticated;
grant select on public.bitacora_config to authenticated;
grant select on public.bitacora_rendimientos to authenticated;

-- bitacora_viajes.folio defaults from this sequence; INSERT (via guardar_viaje,
-- security invoker) needs USAGE on it or every insert fails with
-- "permission denied for sequence bitacora_viajes_folio_seq" (discovered the
-- same way, via Task 9 "Guardar borrador" verification returning 403).
grant usage on sequence public.bitacora_viajes_folio_seq to authenticated;
