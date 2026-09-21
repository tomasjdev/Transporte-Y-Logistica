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

export async function fetchMovimientos(filtros: { productoId?: string; marcaVehiculo?: string } = {}) {
  let query = supabase.from('inventario_movimientos').select('*').order('creado_en', { ascending: false })
  if (filtros.productoId) query = query.eq('producto_id', filtros.productoId)
  if (filtros.marcaVehiculo) query = query.eq('marca_vehiculo', filtros.marcaVehiculo)
  const { data, error } = await query
  if (error) throw error
  return data as Movimiento[]
}

export async function crearMovimiento(input: NuevoMovimiento) {
  const { data, error } = await supabase.from('inventario_movimientos').insert(input).select().single()
  if (error) throw error
  return data as Movimiento
}
