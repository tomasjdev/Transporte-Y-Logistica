import type { Database } from './database'

export type Producto = Database['public']['Tables']['inventario_productos']['Row']
export type Movimiento = Database['public']['Tables']['inventario_movimientos']['Row']

export interface NuevoProducto {
  codigo_interno: string
  nombre: string
  categoria: string
  unidad_medida: string
  stock_inicial: number
  stock_minimo: number
}

export interface NuevoMovimiento {
  producto_id: string
  unidad_vehiculo_id: string | null
  responsable_id: string
  tipo_movimiento: 'entrada' | 'salida'
  cantidad: number
  motivo: string
  observaciones: string
}
