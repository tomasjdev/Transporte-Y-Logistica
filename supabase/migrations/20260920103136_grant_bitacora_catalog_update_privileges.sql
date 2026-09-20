-- supabase/migrations/20260920103136_grant_bitacora_catalog_update_privileges.sql
--
-- Task 11's Catálogos admin page updates bitacora_camiones.placas and
-- bitacora_pesos.comision_porcentaje directly via the REST API. RLS already
-- restricts these writes to admin (see bitacora_camiones_write_admin /
-- bitacora_pesos_write_admin in 20260920092739_bitacora_catalogos.sql), but
-- like every other table in this project, the base table-level grant was
-- never issued to `authenticated` — RLS is unreachable without it. Discovered
-- via Task 11 browser verification: PATCH to bitacora_camiones/bitacora_pesos
-- returned 403 "permission denied for table" even for the admin user.

grant update on public.bitacora_camiones to authenticated;
grant update on public.bitacora_pesos to authenticated;
