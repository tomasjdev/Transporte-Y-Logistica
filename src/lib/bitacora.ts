import { supabase } from './supabaseClient'
import type { Json } from '../types/database'
import type {
  Camion,
  Caseta,
  Catalogos,
  Componente,
  Estado,
  Flete,
  GastoExtra,
  InventarioUnidad,
  Liquidacion,
  Peso,
  Recarga,
  Viaje,
  ViajePayload,
} from '../types/bitacora'

export async function fetchCatalogos(): Promise<Catalogos> {
  const [camiones, pesos, estados, componentes] = await Promise.all([
    supabase.from('bitacora_camiones').select('*').eq('activo', true).order('numero'),
    supabase.from('bitacora_pesos').select('*').order('orden'),
    supabase.from('bitacora_estados').select('*').order('nombre'),
    supabase.from('bitacora_componentes').select('*').order('orden'),
  ])
  if (camiones.error) throw camiones.error
  if (pesos.error) throw pesos.error
  if (estados.error) throw estados.error
  if (componentes.error) throw componentes.error
  return {
    camiones: camiones.data as Camion[],
    pesos: pesos.data as Peso[],
    estados: estados.data as Estado[],
    componentes: componentes.data as Componente[],
  }
}

export async function fetchViajes(filtros: { operadorId?: string; estatus?: string } = {}): Promise<Viaje[]> {
  let query = supabase.from('bitacora_viajes').select('*').order('creado_en', { ascending: false })
  if (filtros.operadorId) query = query.eq('operador_id', filtros.operadorId)
  if (filtros.estatus) query = query.eq('estatus', filtros.estatus)
  const { data, error } = await query
  if (error) throw error
  return data as Viaje[]
}

export interface ViajeDetalle {
  viaje: Viaje
  fletes: Flete[]
  recargas: Recarga[]
  casetas: Caseta[]
  gastosExtra: GastoExtra[]
  inventarioUnidad: InventarioUnidad[]
}

export async function fetchViaje(id: string): Promise<ViajeDetalle> {
  const [viaje, fletes, recargas, casetas, gastosExtra, inventarioUnidad] = await Promise.all([
    supabase.from('bitacora_viajes').select('*').eq('id', id).single(),
    supabase.from('bitacora_fletes').select('*').eq('viaje_id', id),
    supabase.from('bitacora_recargas').select('*').eq('viaje_id', id).order('orden'),
    supabase.from('bitacora_casetas').select('*').eq('viaje_id', id).order('numero'),
    supabase.from('bitacora_gastos_extra').select('*').eq('viaje_id', id),
    supabase.from('bitacora_inventario_unidad').select('*').eq('viaje_id', id),
  ])
  if (viaje.error) throw viaje.error
  if (fletes.error) throw fletes.error
  if (recargas.error) throw recargas.error
  if (casetas.error) throw casetas.error
  if (gastosExtra.error) throw gastosExtra.error
  if (inventarioUnidad.error) throw inventarioUnidad.error
  return {
    viaje: viaje.data as Viaje,
    fletes: (fletes.data ?? []) as Flete[],
    recargas: (recargas.data ?? []) as Recarga[],
    casetas: (casetas.data ?? []) as Caseta[],
    gastosExtra: (gastosExtra.data ?? []) as GastoExtra[],
    inventarioUnidad: (inventarioUnidad.data ?? []) as InventarioUnidad[],
  }
}

export async function previewLiquidacion(payload: ViajePayload): Promise<Liquidacion> {
  const totalFletes = payload.fletes.reduce((sum, f) => sum + f.monto, 0)
  const totalLitros = payload.recargas.reduce((sum, r) => sum + r.litros, 0)
  const totalCasetas = payload.casetas.reduce((sum, c) => sum + c.monto, 0)
  const totalGastosExtra = payload.gastos_extra.reduce((sum, g) => sum + g.monto, 0)

  const { data: params, error: paramsError } = await supabase
    .rpc('obtener_parametros_liquidacion', {
      p_peso_categoria: payload.peso_categoria,
      p_tipo_viaje: payload.tipo_viaje,
      p_tipo_combustible: payload.tipo_combustible,
    })
    .single()
  if (paramsError) throw paramsError

  const { data, error } = await supabase
    .rpc('calcular_liquidacion', {
      p_km_salida: payload.km_salida,
      p_km_llegada: payload.km_llegada,
      p_total_litros: totalLitros,
      p_total_casetas: totalCasetas,
      p_total_gastos_extra: totalGastosExtra,
      p_total_fletes: totalFletes,
      p_gastos_depositados: payload.gastos_depositados,
      p_rendimiento_aplicado: params.rendimiento_aplicado,
      p_comision_porcentaje: params.comision_porcentaje,
      p_precio_litro_ahorro: params.precio_litro_ahorro,
      p_precio_penalizacion: params.precio_penalizacion,
    })
    .single()
  if (error) throw error
  return data as Liquidacion
}

export async function guardarViaje(payload: ViajePayload): Promise<string> {
  const { data, error } = await supabase.rpc('guardar_viaje', {
    p_viaje: payload as unknown as Json,
  })
  if (error) throw error
  return data
}
