import { describe, it, expect } from 'vitest'

function sumMonto(items: { monto: number }[]) {
  return items.reduce((sum, i) => sum + i.monto, 0)
}

describe('aggregation helpers used before calling calcular_liquidacion', () => {
  it('sums montos correctly, including an empty list', () => {
    expect(sumMonto([{ monto: 10 }, { monto: 20 }])).toBe(30)
    expect(sumMonto([])).toBe(0)
  })
})
