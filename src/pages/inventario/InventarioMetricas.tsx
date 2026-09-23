import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { Movimiento, Producto } from '../../types/inventario'

interface Props {
  productos: Producto[]
  movimientos: Movimiento[]
}

const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

function ultimosSeisMeses() {
  const hoy = new Date()
  const meses: { key: string; label: string }[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1)
    meses.push({ key: `${d.getFullYear()}-${d.getMonth()}`, label: `${MESES[d.getMonth()]} ${d.getFullYear()}` })
  }
  return meses
}

export default function InventarioMetricas({ productos, movimientos }: Props) {
  const totalProductos = productos.length
  const totalBajo = productos.filter((p) => p.estado === 'Bajo').length
  const totalAgotado = productos.filter((p) => p.estado === 'Agotado').length

  const meses = ultimosSeisMeses()
  const movimientosPorMes = meses.map(({ key, label }) => {
    const [anio, mes] = key.split('-').map(Number)
    const enElMes = movimientos.filter((m) => {
      const d = new Date(m.creado_en)
      return d.getFullYear() === anio && d.getMonth() === mes
    })
    return {
      mes: label,
      Entradas: enElMes.filter((m) => m.tipo_movimiento === 'entrada').reduce((sum, m) => sum + m.cantidad, 0),
      Salidas: enElMes.filter((m) => m.tipo_movimiento === 'salida').reduce((sum, m) => sum + m.cantidad, 0),
    }
  })

  const movimientosPorProducto = new Map<string, number>()
  for (const m of movimientos) {
    movimientosPorProducto.set(m.producto_id, (movimientosPorProducto.get(m.producto_id) ?? 0) + 1)
  }
  const productoPorId = new Map(productos.map((p) => [p.id, p]))
  const topProductos = [...movimientosPorProducto.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([productoId, count]) => ({ producto: productoPorId.get(productoId), count }))
    .filter((entry) => entry.producto)

  const porMarca = new Map<string, number>()
  for (const p of productos) {
    porMarca.set(p.marca_vehiculo, (porMarca.get(p.marca_vehiculo) ?? 0) + 1)
  }

  return (
    <div className="animate-fade-in">
      <div className="grid md:grid-cols-3 gap-4" style={{ marginBottom: '1.5rem' }}>
        <div className="card" style={{ textAlign: 'center' }}>
          <p className="text-muted" style={{ marginBottom: '0.5rem' }}>Total de productos</p>
          <p style={{ fontSize: '2rem', fontWeight: 700 }}>{totalProductos}</p>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <p className="text-muted" style={{ marginBottom: '0.5rem' }}>Stock bajo</p>
          <p style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--warning)' }}>{totalBajo}</p>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <p className="text-muted" style={{ marginBottom: '0.5rem' }}>Agotados</p>
          <p style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--danger)' }}>{totalAgotado}</p>
        </div>
      </div>

      <section className="card" style={{ marginBottom: '1.5rem' }}>
        <h2 className="form-section-title">Entradas vs. salidas (últimos 6 meses)</h2>
        <div style={{ width: '100%', height: 280 }}>
          <ResponsiveContainer>
            <BarChart data={movimientosPorMes}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="mes" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="Entradas" fill="#22c55e" />
              <Bar dataKey="Salidas" fill="#ef4444" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <div className="grid md:grid-cols-2 gap-6">
        <section className="card">
          <h2 className="form-section-title">Top 5 productos con más movimiento</h2>
          {topProductos.length === 0 ? (
            <p className="text-muted">No hay movimientos registrados todavía.</p>
          ) : (
            <table>
              <thead>
                <tr><th>Producto</th><th>Movimientos</th></tr>
              </thead>
              <tbody>
                {topProductos.map((entry) => (
                  <tr key={entry.producto!.id}>
                    <td>{entry.producto!.codigo_interno} — {entry.producto!.nombre}</td>
                    <td>{entry.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section className="card">
          <h2 className="form-section-title">Productos por marca de vehículo</h2>
          {porMarca.size === 0 ? (
            <p className="text-muted">No hay productos registrados todavía.</p>
          ) : (
            <table>
              <thead>
                <tr><th>Marca</th><th>Productos</th></tr>
              </thead>
              <tbody>
                {[...porMarca.entries()].map(([marca, count]) => (
                  <tr key={marca}>
                    <td>{marca}</td>
                    <td>{count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>
    </div>
  )
}
