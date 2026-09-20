import { supabase } from './supabaseClient'
import type { Movimiento, NuevoMovimiento, NuevoProducto, Producto } from '../types/inventario'

export async function fetchProductos() {
  const { data, error } = await supabase.from('inventario_productos').select('*').eq('activo', true).order('nombre')
  if (error) throw error
  return data as Producto[]
}

export async function crearProducto(input: NuevoProducto) {
  const { data, error } = await supabase.from('inventario_productos').insert(input).select().single()
  if (error) throw error
  return data as Producto
}

export async function fetchMovimientos(filtros: { productoId?: string; unidadId?: string } = {}) {
  let query = supabase.from('inventario_movimientos').select('*').order('creado_en', { ascending: false })
  if (filtros.productoId) query = query.eq('producto_id', filtros.productoId)
  if (filtros.unidadId) query = query.eq('unidad_vehiculo_id', filtros.unidadId)
  const { data, error } = await query
  if (error) throw error
  return data as Movimiento[]
}

export async function crearMovimiento(input: NuevoMovimiento) {
  const { data, error } = await supabase.from('inventario_movimientos').insert(input).select().single()
  if (error) throw error
  return data as Movimiento
}
