import type { Database } from './database'

export type Viaje = Database['public']['Tables']['bitacora_viajes']['Row']
export type Camion = Database['public']['Tables']['bitacora_camiones']['Row']
export type Peso = Database['public']['Tables']['bitacora_pesos']['Row']
export type Estado = Database['public']['Tables']['bitacora_estados']['Row']
export type Componente = Database['public']['Tables']['bitacora_componentes']['Row']

export type Flete = Database['public']['Tables']['bitacora_fletes']['Row']
export type Recarga = Database['public']['Tables']['bitacora_recargas']['Row']
export type Caseta = Database['public']['Tables']['bitacora_casetas']['Row']
export type GastoExtra = Database['public']['Tables']['bitacora_gastos_extra']['Row']
export type InventarioUnidad = Database['public']['Tables']['bitacora_inventario_unidad']['Row']

export interface FleteInput {
  descripcion: string
  monto: number
}

export interface RecargaInput {
  orden: number
  lugar: string
  litros: number
  monto: number
  es_relleno_final: boolean
}

export interface CasetaInput {
  numero: number
  monto: number
}

export interface GastoExtraInput {
  concepto: string
  monto: number
}

export interface InventarioUnidadInput {
  componente: string
  estado: 'OK' | 'Falta' | 'Malo'
}

/**
 * Shape of the `p_viaje` JSONB argument consumed by the `guardar_viaje` RPC
 * (supabase/migrations/20260920100500_bitacora_guardar_viaje.sql, patched by
 * 20260920100700_fix_guardar_viaje_freeze_params.sql). Every field here is
 * read out of the JSONB body with `->>`/`::type` casts inside that function,
 * so the field names and primitive shapes below must match exactly.
 */
export interface ViajePayload {
  id?: string
  estatus: 'borrador' | 'liquidado'
  operador_id: string
  fecha: string
  camion_id: string
  placas: string
  peso_categoria: string
  destino_estado: string
  empresa_carga: string
  tipo_viaje: 'Sencillo' | 'Redondo'
  tipo_combustible: 'Gasolina' | 'Diesel'
  km_salida: number
  km_llegada: number
  gastos_depositados: number
  observaciones: string
  fletes: FleteInput[]
  recargas: RecargaInput[]
  casetas: CasetaInput[]
  gastos_extra: GastoExtraInput[]
  inventario_unidad: InventarioUnidadInput[]
}

/**
 * Return shape of `calcular_liquidacion` (see
 * supabase/migrations/20260920100400_bitacora_calculo.sql). Both the live
 * preview RPC and the persist trigger run this exact function, so this type
 * describes what `previewLiquidacion()` resolves to.
 */
export interface Liquidacion {
  km_recorridos: number
  efectivo_gastado: number
  litros_teoricos: number
  litros_devueltos: number
  rendimiento_real: number
  comision_monto: number
  balance_efectivo: number
  ajuste_rendimiento: number
  sueldo_final: number
}

export interface Catalogos {
  camiones: Camion[]
  pesos: Peso[]
  estados: Estado[]
  componentes: Componente[]
}
