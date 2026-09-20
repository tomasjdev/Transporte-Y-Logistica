-- supabase/migrations/20260920104200_restrict_inventario_productos_update.sql
--
-- Task 12 review found that the blanket
-- `grant update on public.inventario_productos to authenticated` (from
-- 20260920103500_inventario.sql) covers every column, including
-- stock_actual/estado. Combined with the inventario_productos_write_manager
-- RLS policy (row-level only, no column restriction), any gerencia/admin
-- user could run a plain UPDATE to directly overwrite stock_actual/estado,
-- bypassing recalcular_stock_producto() entirely and desyncing the
-- displayed stock from the real entrada/salida history in
-- inventario_movimientos.
--
-- The trigger function runs as SECURITY DEFINER under its owner, so it
-- does not need this client-facing grant to do its job. Replace the
-- blanket UPDATE grant with a column-restricted one that excludes
-- stock_actual and estado, leaving those writable only via the trigger.

revoke update on public.inventario_productos from authenticated;
grant update (codigo_interno, nombre, categoria, unidad_medida, stock_inicial, stock_minimo, activo) on public.inventario_productos to authenticated;
