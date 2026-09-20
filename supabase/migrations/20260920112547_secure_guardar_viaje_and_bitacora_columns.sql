-- supabase/migrations/20260920112547_secure_guardar_viaje_and_bitacora_columns.sql
--
-- Final whole-branch review Fix 2 (CRITICAL): public.bitacora_viajes had a
-- blanket UPDATE grant to authenticated with no column restriction, so any
-- authenticated user could PATCH settlement columns (sueldo_final,
-- comision_monto, ajuste_rendimiento, balance_efectivo, etc.) directly,
-- bypassing calcular_liquidacion entirely. Same vulnerability class already
-- fixed for inventario_productos.stock_actual in
-- 20260920104016_restrict_inventario_productos_update.sql.
--
-- guardar_viaje is converted to SECURITY DEFINER so it can keep writing
-- these columns itself after the narrowed grant below removes client
-- write access to them. Since SECURITY DEFINER bypasses RLS, an explicit
-- authorization check replicating the old RLS policies is added at the top
-- of the function body.
--
-- Final whole-branch review Fix 3 (IMPORTANT): the freeze rule was keyed on
-- v_existing.estatus = 'liquidado', which a borrador round-trip could
-- defeat (reopen a liquidado trip to borrador, then the next save re-reads
-- fresh catalog values, silently discarding the freeze). Rekeyed on
-- v_existing.liquidado_en is not null: once a trip has ever been
-- liquidado, its frozen params apply to all future recalculations
-- regardless of current estatus. Design choice: gerencia/admin MAY reopen a
-- liquidado trip to borrador (sometimes needed to correct a mistake); the
-- liquidado_en-based freeze keeps old pricing frozen even after reopening,
-- and liquidado_en is never cleared on reopen so the audit trail still
-- shows when the trip was first liquidated.
--
-- Final whole-branch review Fix 12 (minor): v_estatus now defaults to
-- 'borrador' when p_viaje has no 'estatus' key, instead of raising a
-- not-null violation deeper in the function.
create or replace function public.guardar_viaje(p_viaje jsonb)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_id uuid;
  v_estatus text := coalesce(p_viaje ->> 'estatus', 'borrador');
  v_existing record;
  v_total_fletes numeric := 0;
  v_total_litros numeric := 0;
  v_total_combustible numeric := 0;
  v_total_casetas numeric := 0;
  v_total_gastos_extra numeric := 0;
  v_rendimiento_aplicado numeric;
  v_comision_porcentaje numeric;
  v_precio_litro_ahorro numeric;
  v_precio_penalizacion numeric;
  v_resultado record;
begin
  v_id := coalesce((p_viaje ->> 'id')::uuid, gen_random_uuid());

  select * into v_existing from public.bitacora_viajes where id = v_id;

  -- Authorization check (Fix 2): this function is now SECURITY DEFINER and
  -- bypasses RLS, so it must replicate what row-level security used to
  -- enforce for non-manager callers before doing any writes.
  if private.current_user_role() not in ('gerencia', 'admin') then
    if (p_viaje ->> 'operador_id')::uuid != auth.uid() then
      raise exception 'No autorizado: operador_id no coincide con el usuario autenticado';
    end if;
    if v_existing.estatus = 'liquidado' then
      raise exception 'No autorizado: el viaje ya está liquidado';
    end if;
    if v_estatus = 'liquidado' then
      raise exception 'No autorizado: un operador no puede liquidar un viaje';
    end if;
  end if;

  -- Freeze rule (Fix 3): once a trip has ever been liquidado
  -- (liquidado_en is not null), it keeps the parameters it was liquidado
  -- with for all future recalculations, even if gerencia/admin later
  -- reopens it to 'borrador' to correct a mistake, and even if catalogs
  -- change later. Reopening does NOT clear liquidado_en (see the insert's
  -- liquidado_en expression below), so both the freeze and the original
  -- liquidation audit trail survive a reopen/edit/re-liquidate cycle. Only
  -- a trip that has never been liquidado uses live catalog values.
  if v_existing.liquidado_en is not null then
    v_rendimiento_aplicado := v_existing.rendimiento_aplicado;
    v_comision_porcentaje := v_existing.comision_porcentaje;
    v_precio_litro_ahorro := v_existing.precio_litro_ahorro;
    v_precio_penalizacion := v_existing.precio_penalizacion;
  else
    select rendimiento_aplicado, comision_porcentaje, precio_litro_ahorro, precio_penalizacion
      into v_rendimiento_aplicado, v_comision_porcentaje, v_precio_litro_ahorro, v_precio_penalizacion
      from public.obtener_parametros_liquidacion(
        p_viaje ->> 'peso_categoria', p_viaje ->> 'tipo_viaje', p_viaje ->> 'tipo_combustible'
      );
  end if;

  select coalesce(sum((f ->> 'monto')::numeric), 0) into v_total_fletes
    from jsonb_array_elements(coalesce(p_viaje -> 'fletes', '[]'::jsonb)) f;
  select coalesce(sum((r ->> 'litros')::numeric), 0), coalesce(sum((r ->> 'monto')::numeric), 0)
    into v_total_litros, v_total_combustible
    from jsonb_array_elements(coalesce(p_viaje -> 'recargas', '[]'::jsonb)) r;
  select coalesce(sum((c ->> 'monto')::numeric), 0) into v_total_casetas
    from jsonb_array_elements(coalesce(p_viaje -> 'casetas', '[]'::jsonb)) c;
  select coalesce(sum((g ->> 'monto')::numeric), 0) into v_total_gastos_extra
    from jsonb_array_elements(coalesce(p_viaje -> 'gastos_extra', '[]'::jsonb)) g;

  select * into v_resultado from public.calcular_liquidacion(
    (p_viaje ->> 'km_salida')::integer,
    (p_viaje ->> 'km_llegada')::integer,
    v_total_litros, v_total_casetas, v_total_gastos_extra, v_total_fletes,
    (p_viaje ->> 'gastos_depositados')::numeric,
    v_rendimiento_aplicado, v_comision_porcentaje,
    v_precio_litro_ahorro, v_precio_penalizacion
  );

  insert into public.bitacora_viajes as t (
    id, estatus, operador_id, fecha, camion_id, placas, peso_categoria, destino_estado,
    empresa_carga, tipo_viaje, tipo_combustible, km_salida, km_llegada, gastos_depositados,
    observaciones, rendimiento_aplicado, comision_porcentaje, precio_litro_ahorro, precio_penalizacion,
    km_recorridos, total_litros, total_combustible, total_casetas, total_gastos_extra,
    efectivo_gastado, litros_teoricos, litros_devueltos, rendimiento_real, total_fletes,
    comision_monto, balance_efectivo, ajuste_rendimiento, sueldo_final,
    creado_por, liquidado_en
  ) values (
    v_id, v_estatus, (p_viaje ->> 'operador_id')::uuid, (p_viaje ->> 'fecha')::date,
    (p_viaje ->> 'camion_id')::uuid, p_viaje ->> 'placas', p_viaje ->> 'peso_categoria',
    p_viaje ->> 'destino_estado', p_viaje ->> 'empresa_carga', p_viaje ->> 'tipo_viaje',
    p_viaje ->> 'tipo_combustible', (p_viaje ->> 'km_salida')::integer, (p_viaje ->> 'km_llegada')::integer,
    (p_viaje ->> 'gastos_depositados')::numeric, p_viaje ->> 'observaciones',
    v_rendimiento_aplicado, v_comision_porcentaje, v_precio_litro_ahorro, v_precio_penalizacion,
    v_resultado.km_recorridos, v_total_litros, v_total_combustible, v_total_casetas, v_total_gastos_extra,
    v_resultado.efectivo_gastado, v_resultado.litros_teoricos, v_resultado.litros_devueltos, v_resultado.rendimiento_real,
    v_total_fletes, v_resultado.comision_monto, v_resultado.balance_efectivo, v_resultado.ajuste_rendimiento, v_resultado.sueldo_final,
    auth.uid(), case when v_estatus = 'liquidado' and v_existing.liquidado_en is null then now() else v_existing.liquidado_en end
  )
  on conflict (id) do update set
    estatus = excluded.estatus, fecha = excluded.fecha, camion_id = excluded.camion_id, placas = excluded.placas,
    peso_categoria = excluded.peso_categoria, destino_estado = excluded.destino_estado, empresa_carga = excluded.empresa_carga,
    tipo_viaje = excluded.tipo_viaje, tipo_combustible = excluded.tipo_combustible, km_salida = excluded.km_salida,
    km_llegada = excluded.km_llegada, gastos_depositados = excluded.gastos_depositados, observaciones = excluded.observaciones,
    rendimiento_aplicado = excluded.rendimiento_aplicado, comision_porcentaje = excluded.comision_porcentaje,
    precio_litro_ahorro = excluded.precio_litro_ahorro, precio_penalizacion = excluded.precio_penalizacion,
    km_recorridos = excluded.km_recorridos, total_litros = excluded.total_litros, total_combustible = excluded.total_combustible,
    total_casetas = excluded.total_casetas, total_gastos_extra = excluded.total_gastos_extra, efectivo_gastado = excluded.efectivo_gastado,
    litros_teoricos = excluded.litros_teoricos, litros_devueltos = excluded.litros_devueltos, rendimiento_real = excluded.rendimiento_real,
    total_fletes = excluded.total_fletes, comision_monto = excluded.comision_monto, balance_efectivo = excluded.balance_efectivo,
    ajuste_rendimiento = excluded.ajuste_rendimiento, sueldo_final = excluded.sueldo_final, liquidado_en = excluded.liquidado_en;

  delete from public.bitacora_fletes where viaje_id = v_id;
  delete from public.bitacora_recargas where viaje_id = v_id;
  delete from public.bitacora_casetas where viaje_id = v_id;
  delete from public.bitacora_gastos_extra where viaje_id = v_id;
  delete from public.bitacora_inventario_unidad where viaje_id = v_id;

  insert into public.bitacora_fletes (viaje_id, descripcion, monto)
    select v_id, f ->> 'descripcion', (f ->> 'monto')::numeric
    from jsonb_array_elements(coalesce(p_viaje -> 'fletes', '[]'::jsonb)) f;

  insert into public.bitacora_recargas (viaje_id, orden, lugar, litros, monto, es_relleno_final)
    select v_id, (r ->> 'orden')::integer, r ->> 'lugar', (r ->> 'litros')::numeric, (r ->> 'monto')::numeric,
      coalesce((r ->> 'es_relleno_final')::boolean, false)
    from jsonb_array_elements(coalesce(p_viaje -> 'recargas', '[]'::jsonb)) r;

  insert into public.bitacora_casetas (viaje_id, numero, monto)
    select v_id, (c ->> 'numero')::integer, (c ->> 'monto')::numeric
    from jsonb_array_elements(coalesce(p_viaje -> 'casetas', '[]'::jsonb)) c;

  insert into public.bitacora_gastos_extra (viaje_id, concepto, monto)
    select v_id, g ->> 'concepto', (g ->> 'monto')::numeric
    from jsonb_array_elements(coalesce(p_viaje -> 'gastos_extra', '[]'::jsonb)) g;

  insert into public.bitacora_inventario_unidad (viaje_id, componente, estado)
    select v_id, i ->> 'componente', i ->> 'estado'
    from jsonb_array_elements(coalesce(p_viaje -> 'inventario_unidad', '[]'::jsonb)) i;

  return v_id;
end;
$$;

-- Fix 2: mutable search_path WARNs on calcular_liquidacion and
-- obtener_parametros_liquidacion (cheap to fix while already editing this
-- area). calcular_liquidacion touches no tables so it was never
-- exploitable, but pinning search_path is the established pattern here.
create or replace function public.obtener_parametros_liquidacion(
  p_peso_categoria text,
  p_tipo_viaje text,
  p_tipo_combustible text
)
returns table (
  rendimiento_aplicado numeric,
  comision_porcentaje numeric,
  precio_litro_ahorro numeric,
  precio_penalizacion numeric
)
language sql
security invoker
stable
set search_path = public, pg_temp
as $$
  select
    (select km_por_litro from public.bitacora_rendimientos
      where peso_categoria = p_peso_categoria
        and tipo_viaje = case when p_tipo_viaje = 'Sencillo' then 'Sencillo' else 'Redondo' end
    ) as rendimiento_aplicado,
    (select comision_porcentaje from public.bitacora_pesos where categoria = p_peso_categoria) as comision_porcentaje,
    (select valor from public.bitacora_config where clave = 'precio_litro_ahorro') as precio_litro_ahorro,
    (select valor from public.bitacora_config
      where clave = case when p_tipo_combustible = 'Gasolina' then 'penalizacion_gasolina' else 'penalizacion_diesel' end
    ) as precio_penalizacion
$$;

create or replace function public.calcular_liquidacion(
  p_km_salida integer,
  p_km_llegada integer,
  p_total_litros numeric,
  p_total_casetas numeric,
  p_total_gastos_extra numeric,
  p_total_fletes numeric,
  p_gastos_depositados numeric,
  p_rendimiento_aplicado numeric,
  p_comision_porcentaje numeric,
  p_precio_litro_ahorro numeric,
  p_precio_penalizacion numeric
)
returns table (
  km_recorridos integer,
  efectivo_gastado numeric,
  litros_teoricos numeric,
  litros_devueltos numeric,
  rendimiento_real numeric,
  comision_monto numeric,
  balance_efectivo numeric,
  ajuste_rendimiento numeric,
  sueldo_final numeric
)
language sql
immutable
set search_path = public, pg_temp
as $$
  with base as (
    select
      (p_km_llegada - p_km_salida) as km_recorridos,
      (p_total_casetas + p_total_gastos_extra) as efectivo_gastado
  ),
  derivados as (
    select
      base.km_recorridos,
      base.efectivo_gastado,
      case when p_rendimiento_aplicado > 0
        then base.km_recorridos::numeric / p_rendimiento_aplicado
        else 0 end as litros_teoricos,
      case when p_total_litros > 0
        then base.km_recorridos::numeric / p_total_litros
        else 0 end as rendimiento_real
    from base
  )
  select
    d.km_recorridos,
    d.efectivo_gastado,
    d.litros_teoricos,
    case when (d.litros_teoricos - p_total_litros) > 0
      then floor(d.litros_teoricos - p_total_litros) else 0 end as litros_devueltos,
    d.rendimiento_real,
    (p_total_fletes * p_comision_porcentaje) as comision_monto,
    (p_gastos_depositados - d.efectivo_gastado) as balance_efectivo,
    case
      when (d.litros_teoricos - p_total_litros) > 0
        then floor(d.litros_teoricos - p_total_litros) * p_precio_litro_ahorro
      when (d.litros_teoricos - p_total_litros) < 0
        then -floor(abs(d.litros_teoricos - p_total_litros)) * p_precio_penalizacion
      else 0
    end as ajuste_rendimiento,
    (
      (p_total_fletes * p_comision_porcentaje)
      - (p_gastos_depositados - d.efectivo_gastado)
      + case
          when (d.litros_teoricos - p_total_litros) > 0
            then floor(d.litros_teoricos - p_total_litros) * p_precio_litro_ahorro
          when (d.litros_teoricos - p_total_litros) < 0
            then -floor(abs(d.litros_teoricos - p_total_litros)) * p_precio_penalizacion
          else 0
        end
    ) as sueldo_final
  from derivados d;
$$;

-- Narrow the blanket UPDATE grant on bitacora_viajes: settlement/computed
-- columns (sueldo_final, comision_monto, balance_efectivo,
-- ajuste_rendimiento, rendimiento_aplicado, etc.) are writable only via
-- guardar_viaje (now SECURITY DEFINER), never by a direct client PATCH.
revoke update on public.bitacora_viajes from authenticated;
grant update (estatus, fecha, camion_id, placas, peso_categoria, destino_estado, empresa_carga, tipo_viaje, tipo_combustible, km_salida, km_llegada, gastos_depositados, observaciones) on public.bitacora_viajes to authenticated;

-- guardar_viaje (SECURITY DEFINER) is now the sole legitimate write path
-- for the five bitacora child tables; revoke direct client writes but keep
-- SELECT since fetchViaje (src/lib/bitacora.ts) reads them directly.
revoke insert, update, delete on public.bitacora_fletes from authenticated;
revoke insert, update, delete on public.bitacora_recargas from authenticated;
revoke insert, update, delete on public.bitacora_casetas from authenticated;
revoke insert, update, delete on public.bitacora_gastos_extra from authenticated;
revoke insert, update, delete on public.bitacora_inventario_unidad from authenticated;
