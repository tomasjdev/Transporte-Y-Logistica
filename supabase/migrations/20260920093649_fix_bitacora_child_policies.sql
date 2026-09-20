-- supabase/migrations/20260920093649_fix_bitacora_child_policies.sql
--
-- Fixes a critical bug in the Task 5 child-table RLS policies. The original
-- "for all" policies applied USING (ownership only, no estatus gate) to
-- SELECT/UPDATE(old row)/DELETE, and WITH CHECK (ownership + borrador gate)
-- only to INSERT/UPDATE(new row). Postgres never consults WITH CHECK for
-- DELETE, so an operador could delete their own trip's child rows
-- (fletes/recargas/casetas/gastos_extra/inventario_unidad) even after the
-- parent trip was liquidado, even though they could no longer UPDATE them.
--
-- This replaces each single "for all" policy with four per-command policies,
-- mirroring the parent bitacora_viajes pattern:
--   - SELECT: operador can always read their own trip's children (any
--     estatus), gerencia/admin unrestricted.
--   - INSERT/UPDATE/DELETE: operador only while the parent trip is
--     'borrador', gerencia/admin unrestricted.

-- bitacora_fletes
drop policy "fletes_all_follows_viaje" on public.bitacora_fletes;

create policy "fletes_select_follows_viaje" on public.bitacora_fletes for select to authenticated
  using (exists (
    select 1 from public.bitacora_viajes v where v.id = viaje_id
      and (v.operador_id = auth.uid() or private.current_user_role() in ('gerencia','admin'))
  ));

create policy "fletes_insert_follows_viaje" on public.bitacora_fletes for insert to authenticated
  with check (exists (
    select 1 from public.bitacora_viajes v where v.id = viaje_id
      and ((v.operador_id = auth.uid() and v.estatus = 'borrador') or private.current_user_role() in ('gerencia','admin'))
  ));

create policy "fletes_update_follows_viaje" on public.bitacora_fletes for update to authenticated
  using (exists (
    select 1 from public.bitacora_viajes v where v.id = viaje_id
      and ((v.operador_id = auth.uid() and v.estatus = 'borrador') or private.current_user_role() in ('gerencia','admin'))
  ))
  with check (exists (
    select 1 from public.bitacora_viajes v where v.id = viaje_id
      and ((v.operador_id = auth.uid() and v.estatus = 'borrador') or private.current_user_role() in ('gerencia','admin'))
  ));

create policy "fletes_delete_follows_viaje" on public.bitacora_fletes for delete to authenticated
  using (exists (
    select 1 from public.bitacora_viajes v where v.id = viaje_id
      and ((v.operador_id = auth.uid() and v.estatus = 'borrador') or private.current_user_role() in ('gerencia','admin'))
  ));

-- bitacora_recargas
drop policy "recargas_all_follows_viaje" on public.bitacora_recargas;

create policy "recargas_select_follows_viaje" on public.bitacora_recargas for select to authenticated
  using (exists (
    select 1 from public.bitacora_viajes v where v.id = viaje_id
      and (v.operador_id = auth.uid() or private.current_user_role() in ('gerencia','admin'))
  ));

create policy "recargas_insert_follows_viaje" on public.bitacora_recargas for insert to authenticated
  with check (exists (
    select 1 from public.bitacora_viajes v where v.id = viaje_id
      and ((v.operador_id = auth.uid() and v.estatus = 'borrador') or private.current_user_role() in ('gerencia','admin'))
  ));

create policy "recargas_update_follows_viaje" on public.bitacora_recargas for update to authenticated
  using (exists (
    select 1 from public.bitacora_viajes v where v.id = viaje_id
      and ((v.operador_id = auth.uid() and v.estatus = 'borrador') or private.current_user_role() in ('gerencia','admin'))
  ))
  with check (exists (
    select 1 from public.bitacora_viajes v where v.id = viaje_id
      and ((v.operador_id = auth.uid() and v.estatus = 'borrador') or private.current_user_role() in ('gerencia','admin'))
  ));

create policy "recargas_delete_follows_viaje" on public.bitacora_recargas for delete to authenticated
  using (exists (
    select 1 from public.bitacora_viajes v where v.id = viaje_id
      and ((v.operador_id = auth.uid() and v.estatus = 'borrador') or private.current_user_role() in ('gerencia','admin'))
  ));

-- bitacora_casetas
drop policy "casetas_all_follows_viaje" on public.bitacora_casetas;

create policy "casetas_select_follows_viaje" on public.bitacora_casetas for select to authenticated
  using (exists (
    select 1 from public.bitacora_viajes v where v.id = viaje_id
      and (v.operador_id = auth.uid() or private.current_user_role() in ('gerencia','admin'))
  ));

create policy "casetas_insert_follows_viaje" on public.bitacora_casetas for insert to authenticated
  with check (exists (
    select 1 from public.bitacora_viajes v where v.id = viaje_id
      and ((v.operador_id = auth.uid() and v.estatus = 'borrador') or private.current_user_role() in ('gerencia','admin'))
  ));

create policy "casetas_update_follows_viaje" on public.bitacora_casetas for update to authenticated
  using (exists (
    select 1 from public.bitacora_viajes v where v.id = viaje_id
      and ((v.operador_id = auth.uid() and v.estatus = 'borrador') or private.current_user_role() in ('gerencia','admin'))
  ))
  with check (exists (
    select 1 from public.bitacora_viajes v where v.id = viaje_id
      and ((v.operador_id = auth.uid() and v.estatus = 'borrador') or private.current_user_role() in ('gerencia','admin'))
  ));

create policy "casetas_delete_follows_viaje" on public.bitacora_casetas for delete to authenticated
  using (exists (
    select 1 from public.bitacora_viajes v where v.id = viaje_id
      and ((v.operador_id = auth.uid() and v.estatus = 'borrador') or private.current_user_role() in ('gerencia','admin'))
  ));

-- bitacora_gastos_extra
drop policy "gastos_extra_all_follows_viaje" on public.bitacora_gastos_extra;

create policy "gastos_extra_select_follows_viaje" on public.bitacora_gastos_extra for select to authenticated
  using (exists (
    select 1 from public.bitacora_viajes v where v.id = viaje_id
      and (v.operador_id = auth.uid() or private.current_user_role() in ('gerencia','admin'))
  ));

create policy "gastos_extra_insert_follows_viaje" on public.bitacora_gastos_extra for insert to authenticated
  with check (exists (
    select 1 from public.bitacora_viajes v where v.id = viaje_id
      and ((v.operador_id = auth.uid() and v.estatus = 'borrador') or private.current_user_role() in ('gerencia','admin'))
  ));

create policy "gastos_extra_update_follows_viaje" on public.bitacora_gastos_extra for update to authenticated
  using (exists (
    select 1 from public.bitacora_viajes v where v.id = viaje_id
      and ((v.operador_id = auth.uid() and v.estatus = 'borrador') or private.current_user_role() in ('gerencia','admin'))
  ))
  with check (exists (
    select 1 from public.bitacora_viajes v where v.id = viaje_id
      and ((v.operador_id = auth.uid() and v.estatus = 'borrador') or private.current_user_role() in ('gerencia','admin'))
  ));

create policy "gastos_extra_delete_follows_viaje" on public.bitacora_gastos_extra for delete to authenticated
  using (exists (
    select 1 from public.bitacora_viajes v where v.id = viaje_id
      and ((v.operador_id = auth.uid() and v.estatus = 'borrador') or private.current_user_role() in ('gerencia','admin'))
  ));

-- bitacora_inventario_unidad
drop policy "inventario_unidad_all_follows_viaje" on public.bitacora_inventario_unidad;

create policy "inventario_unidad_select_follows_viaje" on public.bitacora_inventario_unidad for select to authenticated
  using (exists (
    select 1 from public.bitacora_viajes v where v.id = viaje_id
      and (v.operador_id = auth.uid() or private.current_user_role() in ('gerencia','admin'))
  ));

create policy "inventario_unidad_insert_follows_viaje" on public.bitacora_inventario_unidad for insert to authenticated
  with check (exists (
    select 1 from public.bitacora_viajes v where v.id = viaje_id
      and ((v.operador_id = auth.uid() and v.estatus = 'borrador') or private.current_user_role() in ('gerencia','admin'))
  ));

create policy "inventario_unidad_update_follows_viaje" on public.bitacora_inventario_unidad for update to authenticated
  using (exists (
    select 1 from public.bitacora_viajes v where v.id = viaje_id
      and ((v.operador_id = auth.uid() and v.estatus = 'borrador') or private.current_user_role() in ('gerencia','admin'))
  ))
  with check (exists (
    select 1 from public.bitacora_viajes v where v.id = viaje_id
      and ((v.operador_id = auth.uid() and v.estatus = 'borrador') or private.current_user_role() in ('gerencia','admin'))
  ));

create policy "inventario_unidad_delete_follows_viaje" on public.bitacora_inventario_unidad for delete to authenticated
  using (exists (
    select 1 from public.bitacora_viajes v where v.id = viaje_id
      and ((v.operador_id = auth.uid() and v.estatus = 'borrador') or private.current_user_role() in ('gerencia','admin'))
  ));
