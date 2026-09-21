import type { Database } from './database'

export type Producto = Database['public']['Tables']['inventario_productos']['Row']
export type Movimiento = Database['public']['Tables']['inventario_movimientos']['Row']

export const MARCAS_VEHICULO = ['Nissan', 'Kenworth', 'Freightliner'] as const
export type MarcaVehiculo = (typeof MARCAS_VEHICULO)[number]

export interface NuevoProducto {
  codigo_interno: string
  nombre: string
  categoria: string
  marca_vehiculo: MarcaVehiculo
  stock_inicial: number
  stock_minimo: number
}

export interface NuevoMovimiento {
  producto_id: string
  marca_vehiculo: MarcaVehiculo | null
  responsable_id: string
  tipo_movimiento: 'entrada' | 'salida'
  cantidad: number
  motivo: string
  observaciones: string
}
