-- supabase/migrations/20260921053425_replace_unidad_con_marca_vehiculo.sql
--
-- Business decision: this company tracks inventory parts by which vehicle
-- brand they fit, not by a generic unit of measure. Replaces
-- inventario_productos.unidad_medida with marca_vehiculo (Nissan/Kenworth/
-- Freightliner), and replaces inventario_movimientos.unidad_vehiculo_id
-- (a FK to a specific truck in bitacora_camiones) with the same
-- marca_vehiculo classification, since movements are now tied to a brand
-- rather than one specific unit.

alter table public.inventario_productos
  add column marca_vehiculo text;

update public.inventario_productos set marca_vehiculo = 'Nissan' where marca_vehiculo is null;

alter table public.inventario_productos
  alter column marca_vehiculo set not null,
  add constraint inventario_productos_marca_vehiculo_check
    check (marca_vehiculo in ('Nissan', 'Kenworth', 'Freightliner')),
  drop column unidad_medida;

alter table public.inventario_movimientos
  add column marca_vehiculo text,
  add constraint inventario_movimientos_marca_vehiculo_check
    check (marca_vehiculo is null or marca_vehiculo in ('Nissan', 'Kenworth', 'Freightliner')),
  drop column unidad_vehiculo_id;

-- Keep the column-restricted UPDATE grant (20260920104200) in sync: it
-- named unidad_medida explicitly, so it must be re-issued to name
-- marca_vehiculo instead. stock_actual/estado remain excluded (trigger-
-- derived only).
revoke update on public.inventario_productos from authenticated;
grant update (codigo_interno, nombre, categoria, marca_vehiculo, stock_inicial, stock_minimo, activo)
  on public.inventario_productos to authenticated;
