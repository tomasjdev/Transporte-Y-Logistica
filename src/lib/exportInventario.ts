import * as XLSX from 'xlsx'
import type { Movimiento, Producto } from '../types/inventario'

export function exportarInventarioXlsx(productos: Producto[], movimientos: Movimiento[]) {
  const productosSheet = XLSX.utils.json_to_sheet(
    productos.map((p) => ({
      'Código': p.codigo_interno,
      'Nombre': p.nombre,
      'Categoría': p.categoria ?? '',
      'Marca': p.marca_vehiculo,
      'Stock actual': p.stock_actual,
      'Mínimo': p.stock_minimo,
      'Estado': p.estado,
    }))
  )

  const productoNombrePorId = new Map(productos.map((p) => [p.id, `${p.codigo_interno} — ${p.nombre}`]))
  const movimientosSheet = XLSX.utils.json_to_sheet(
    movimientos.map((m) => ({
      'Fecha': new Date(m.creado_en).toLocaleString(),
      'Tipo': m.tipo_movimiento,
      'Producto': productoNombrePorId.get(m.producto_id) ?? m.producto_id,
      'Marca': m.marca_vehiculo ?? 'N/A',
      'Cantidad': m.cantidad,
      'Motivo': m.motivo ?? '',
      'Observaciones': m.observaciones ?? '',
    }))
  )

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, productosSheet, 'Productos')
  XLSX.utils.book_append_sheet(workbook, movimientosSheet, 'Movimientos')

  const fecha = new Date().toISOString().slice(0, 10)
  XLSX.writeFile(workbook, `inventario_${fecha}.xlsx`)
}
