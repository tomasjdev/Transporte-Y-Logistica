import { describe, it, expect } from 'vitest'
import { totalesDePayload } from './bitacora'
import type { ViajePayload } from '../types/bitacora'

function buildPayload(overrides: Partial<ViajePayload> = {}): ViajePayload {
  return {
    estatus: 'borrador',
    operador_id: 'op-1',
    fecha: '2026-09-20',
    camion_id: 'camion-1',
    placas: 'ABC-123',
    peso_categoria: 'Pesado',
    destino_estado: 'Jalisco',
    empresa_carga: 'Acme',
    tipo_viaje: 'Redondo',
    tipo_combustible: 'Diesel',
    km_salida: 1000,
    km_llegada: 1500,
    gastos_depositados: 5000,
    observaciones: '',
    fletes: [
      { descripcion: 'Carga A', monto: 3000 },
      { descripcion: 'Carga B', monto: 1500 },
    ],
    recargas: [
      { orden: 1, lugar: 'Gasolinera 1', litros: 100, monto: 2000, es_relleno_final: false },
      { orden: 2, lugar: 'Gasolinera 2', litros: 50, monto: 1000, es_relleno_final: true },
    ],
    casetas: [
      { numero: 1, monto: 120 },
      { numero: 2, monto: 80 },
      { numero: 3, monto: 0 },
    ],
    gastos_extra: [
      { concepto: 'Llanta', monto: 500 },
    ],
    inventario_unidad: [],
    ...overrides,
  }
}

describe('totalesDePayload (aggregation used before calling calcular_liquidacion)', () => {
  it('sums each of the four totals independently from a realistic multi-item payload', () => {
    const payload = buildPayload()
    const totales = totalesDePayload(payload)

    expect(totales.totalFletes).toBe(4500) // 3000 + 1500
    expect(totales.totalLitros).toBe(150) // 100 + 50
    expect(totales.totalCasetas).toBe(200) // 120 + 80 + 0
    expect(totales.totalGastosExtra).toBe(500)
  })

  it('returns zero for every total when the payload has empty lists', () => {
    const payload = buildPayload({ fletes: [], recargas: [], casetas: [], gastos_extra: [] })
    const totales = totalesDePayload(payload)

    expect(totales).toEqual({
      totalFletes: 0,
      totalLitros: 0,
      totalCasetas: 0,
      totalGastosExtra: 0,
    })
  })
})
