-- supabase/migrations/20260920100500_bitacora_guardar_viaje.sql

create function public.guardar_viaje(p_viaje jsonb)
returns uuid
language plpgsql
security invoker
as $$
declare
  v_id uuid;
  v_estatus text := p_viaje ->> 'estatus';
  v_existing record;
  v_total_fletes numeric := 0;
  v_total_litros numeric := 0;
  v_total_combustible numeric := 0;
  v_total_casetas numeric := 0;
  v_total_gastos_extra numeric := 0;
  v_params record;
  v_resultado record;
begin
  v_id := coalesce((p_viaje ->> 'id')::uuid, gen_random_uuid());

  select * into v_existing from public.bitacora_viajes where id = v_id;

  -- Freeze rule: a trip already liquidado keeps the parameters it was
  -- liquidated with, even if catalogs change later or gerencia edits it
  -- again. A borrador (or a first-time liquidación) always uses current
  -- catalog values.
  if v_existing.estatus = 'liquidado' then
    v_params := row(
      v_existing.rendimiento_aplicado,
      v_existing.comision_porcentaje,
      v_existing.precio_litro_ahorro,
      v_existing.precio_penalizacion
    );
  else
    select * into v_params from public.obtener_parametros_liquidacion(
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
    v_params.rendimiento_aplicado, v_params.comision_porcentaje,
    v_params.precio_litro_ahorro, v_params.precio_penalizacion
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
    v_params.rendimiento_aplicado, v_params.comision_porcentaje, v_params.precio_litro_ahorro, v_params.precio_penalizacion,
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
