import { useEffect, useState, type FormEvent } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { crearProducto, fetchProductos } from '../../lib/inventario'
import { MARCAS_VEHICULO, type MarcaVehiculo, type Producto } from '../../types/inventario'

function badgeClass(estado: Producto['estado']) {
  if (estado === 'Agotado') return 'badge badge-danger'
  if (estado === 'Bajo') return 'badge badge-warning'
  return 'badge badge-success'
}

export default function Productos() {
  const { profile } = useAuth()
  const [productos, setProductos] = useState<Producto[]>([])
  const [form, setForm] = useState({
    codigo_interno: '', nombre: '', categoria: '', marca_vehiculo: MARCAS_VEHICULO[0] as MarcaVehiculo, stock_inicial: 0, stock_minimo: 0,
  })
  const [error, setError] = useState<string | null>(null)
  const puedeCrear = profile?.rol === 'admin' || profile?.rol === 'gerencia'

  function reload() {
    fetchProductos().then(setProductos)
  }

  useEffect(reload, [])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      await crearProducto(form)
      setForm({ codigo_interno: '', nombre: '', categoria: '', marca_vehiculo: MARCAS_VEHICULO[0], stock_inicial: 0, stock_minimo: 0 })
      reload()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al crear el producto.')
    }
  }

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ marginBottom: '0.25rem' }}>Inventario — Productos</h1>
        <p className="text-muted">Existencias y estado de stock de cada producto</p>
      </div>

      <section className="card" style={{ marginBottom: '1.5rem' }}>
        <table>
          <thead>
            <tr><th>Código</th><th>Nombre</th><th>Marca</th><th>Stock actual</th><th>Mínimo</th><th>Estado</th></tr>
          </thead>
          <tbody>
            {productos.length === 0 ? (
              <tr><td colSpan={6} className="text-muted">No hay productos registrados todavía.</td></tr>
            ) : (
              productos.map((p) => (
                <tr key={p.id}>
                  <td>{p.codigo_interno}</td>
                  <td>{p.nombre}</td>
                  <td>{p.marca_vehiculo}</td>
                  <td>{p.stock_actual}</td>
                  <td>{p.stock_minimo}</td>
                  <td><span className={badgeClass(p.estado)}>{p.estado}</span></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>

      {puedeCrear && (
        <section className="card form-section" style={{ maxWidth: 640 }}>
          <h2 className="form-section-title">Nuevo producto</h2>
          <form onSubmit={handleSubmit}>
            <div className="field-grid">
              <div className="field">
                <label>Código interno</label>
                <input className="input" required value={form.codigo_interno}
                  onChange={(e) => setForm({ ...form, codigo_interno: e.target.value })} />
              </div>
              <div className="field">
                <label>Nombre</label>
                <input className="input" required value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
              </div>
              <div className="field">
                <label>Categoría</label>
                <input className="input" value={form.categoria}
                  onChange={(e) => setForm({ ...form, categoria: e.target.value })} />
              </div>
              <div className="field">
                <label>Marca de vehículo</label>
                <select className="input" value={form.marca_vehiculo}
                  onChange={(e) => setForm({ ...form, marca_vehiculo: e.target.value as MarcaVehiculo })}>
                  {MARCAS_VEHICULO.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div className="field">
                <label>Stock inicial</label>
                <input className="input" type="number" value={form.stock_inicial}
                  onChange={(e) => setForm({ ...form, stock_inicial: Number(e.target.value) })} />
              </div>
              <div className="field">
                <label>Stock mínimo</label>
                <input className="input" type="number" value={form.stock_minimo}
                  onChange={(e) => setForm({ ...form, stock_minimo: Number(e.target.value) })} />
              </div>
            </div>

            {error && <div className="error-banner" style={{ marginTop: '1rem' }}>{error}</div>}

            <div className="form-actions">
              <button type="submit" className="btn btn-primary">Crear producto</button>
            </div>
          </form>
        </section>
      )}
    </div>
  )
}
