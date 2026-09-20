-- supabase/migrations/20260920100400_bitacora_calculo.sql

create function public.obtener_parametros_liquidacion(
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
set search_path = public
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

-- Pure: takes every input as a parameter, touches no table. This is the
-- single place the settlement math is written; both the live preview RPC
-- and the persist trigger call it so the screen can never disagree with
-- what gets saved.
create function public.calcular_liquidacion(
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
