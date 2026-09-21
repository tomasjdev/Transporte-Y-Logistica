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

// Soft delete: inventario_movimientos.producto_id references this row, so a
// real DELETE would either be blocked by the FK or silently erase movement
// history. Setting activo=false hides it from fetchProductos (which already
// filters on activo=true) while keeping every past movimiento intact.
export async function eliminarProducto(id: string) {
  const { error } = await supabase.from('inventario_productos').update({ activo: false }).eq('id', id)
  if (error) throw error
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

// Real delete (RLS restricts this to gerencia/admin) — the stock-recalc
// trigger also fires on DELETE, so the affected product's stock_actual/
// estado update automatically once this resolves.
export async function eliminarMovimiento(id: string) {
  const { error } = await supabase.from('inventario_movimientos').delete().eq('id', id)
  if (error) throw error
}
