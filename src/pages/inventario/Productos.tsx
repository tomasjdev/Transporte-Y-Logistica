import { useEffect, useState, type FormEvent } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { crearMovimiento, crearProducto, eliminarMovimiento, eliminarProducto, fetchMovimientos, fetchProductos } from '../../lib/inventario'
import { MARCAS_VEHICULO, type MarcaVehiculo, type Movimiento, type Producto } from '../../types/inventario'

function badgeClass(estado: Producto['estado']) {
  if (estado === 'Agotado') return 'badge badge-danger'
  if (estado === 'Bajo') return 'badge badge-warning'
  return 'badge badge-success'
}

export default function Productos() {
  const { profile } = useAuth()
  const [productos, setProductos] = useState<Producto[]>([])
  const [movimientos, setMovimientos] = useState<Movimiento[]>([])
  const puedeCrear = profile?.rol === 'admin' || profile?.rol === 'gerencia'
  const esOperador = profile?.rol === 'operador'

  const [productoForm, setProductoForm] = useState({
    codigo_interno: '', nombre: '', categoria: '', marca_vehiculo: MARCAS_VEHICULO[0] as MarcaVehiculo, stock_inicial: 0, stock_minimo: 0,
  })
  const [productoError, setProductoError] = useState<string | null>(null)

  const [movimientoForm, setMovimientoForm] = useState({
    producto_id: '', marca_vehiculo: '', tipo_movimiento: esOperador ? 'salida' : 'entrada', cantidad: 0, motivo: '', observaciones: '',
  })
  const [movimientoError, setMovimientoError] = useState<string | null>(null)
  const [savingMovimiento, setSavingMovimiento] = useState(false)
  const [listaError, setListaError] = useState<string | null>(null)

  function reloadProductos() {
    fetchProductos().then(setProductos)
  }

  function reloadMovimientos() {
    fetchMovimientos().then(setMovimientos)
  }

  useEffect(() => {
    reloadProductos()
    reloadMovimientos()
  }, [])

  async function handleCrearProducto(e: FormEvent) {
    e.preventDefault()
    setProductoError(null)
    try {
      await crearProducto(productoForm)
      setProductoForm({ codigo_interno: '', nombre: '', categoria: '', marca_vehiculo: MARCAS_VEHICULO[0], stock_inicial: 0, stock_minimo: 0 })
      reloadProductos()
    } catch (e) {
      setProductoError(e instanceof Error ? e.message : 'Error al crear el producto.')
    }
  }

  async function handleCrearMovimiento(e: FormEvent) {
    e.preventDefault()
    if (!profile) return
    setMovimientoError(null)
    setSavingMovimiento(true)
    try {
      await crearMovimiento({
        producto_id: movimientoForm.producto_id,
        marca_vehiculo: (movimientoForm.marca_vehiculo || null) as MarcaVehiculo | null,
        responsable_id: profile.id,
        tipo_movimiento: movimientoForm.tipo_movimiento as 'entrada' | 'salida',
        cantidad: movimientoForm.cantidad,
        motivo: movimientoForm.motivo,
        observaciones: movimientoForm.observaciones,
      })
      setMovimientoForm({
        producto_id: '', marca_vehiculo: '', tipo_movimiento: esOperador ? 'salida' : 'entrada', cantidad: 0, motivo: '', observaciones: '',
      })
      reloadProductos()
      reloadMovimientos()
    } catch (e) {
      setMovimientoError(e instanceof Error ? e.message : 'Error al registrar el movimiento.')
    } finally {
      setSavingMovimiento(false)
    }
  }

  async function handleEliminarProducto(p: Producto) {
    setListaError(null)
    const confirmed = window.confirm(`¿Eliminar "${p.nombre}" (${p.codigo_interno}) del inventario? Su historial de movimientos se conserva.`)
    if (!confirmed) return
    try {
      await eliminarProducto(p.id)
      reloadProductos()
    } catch (e) {
      setListaError(e instanceof Error ? e.message : 'Error al eliminar el producto.')
    }
  }

  async function handleEliminarMovimiento(m: Movimiento) {
    setListaError(null)
    const confirmed = window.confirm('¿Eliminar este movimiento? El stock del producto se recalculará automáticamente.')
    if (!confirmed) return
    try {
      await eliminarMovimiento(m.id)
      reloadProductos()
      reloadMovimientos()
    } catch (e) {
      setListaError(e instanceof Error ? e.message : 'Error al eliminar el movimiento.')
    }
  }

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ marginBottom: '0.25rem' }}>Inventario</h1>
        <p className="text-muted">Productos, existencias y movimientos de entrada / salida</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6" style={{ marginBottom: '1.5rem' }}>
        {puedeCrear && (
          <section className="card form-section">
            <h2 className="form-section-title">Nuevo producto</h2>
            <form onSubmit={handleCrearProducto}>
              <div className="field-grid">
                <div className="field">
                  <label>Código interno</label>
                  <input className="input" required value={productoForm.codigo_interno}
                    onChange={(e) => setProductoForm({ ...productoForm, codigo_interno: e.target.value })} />
                </div>
                <div className="field">
                  <label>Nombre</label>
                  <input className="input" required value={productoForm.nombre}
                    onChange={(e) => setProductoForm({ ...productoForm, nombre: e.target.value })} />
                </div>
                <div className="field">
                  <label>Categoría</label>
                  <input className="input" value={productoForm.categoria}
                    onChange={(e) => setProductoForm({ ...productoForm, categoria: e.target.value })} />
                </div>
                <div className="field">
                  <label>Marca de vehículo</label>
                  <select className="input" value={productoForm.marca_vehiculo}
                    onChange={(e) => setProductoForm({ ...productoForm, marca_vehiculo: e.target.value as MarcaVehiculo })}>
                    {MARCAS_VEHICULO.map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label>Stock inicial</label>
                  <input className="input" type="number" value={productoForm.stock_inicial}
                    onChange={(e) => setProductoForm({ ...productoForm, stock_inicial: Number(e.target.value) })} />
                </div>
                <div className="field">
                  <label>Stock mínimo</label>
                  <input className="input" type="number" value={productoForm.stock_minimo}
                    onChange={(e) => setProductoForm({ ...productoForm, stock_minimo: Number(e.target.value) })} />
                </div>
              </div>

              {productoError && <div className="error-banner" style={{ marginTop: '1rem' }}>{productoError}</div>}

              <div className="form-actions">
                <button type="submit" className="btn btn-primary">Crear producto</button>
              </div>
            </form>
          </section>
        )}

        <section className="card form-section">
          <h2 className="form-section-title">Registrar movimiento</h2>
          <form onSubmit={handleCrearMovimiento}>
            <div className="field-grid">
              <div className="field">
                <label>Producto</label>
                <select className="input" required value={movimientoForm.producto_id}
                  onChange={(e) => setMovimientoForm({ ...movimientoForm, producto_id: e.target.value })}>
                  <option value="">Selecciona…</option>
                  {productos.map((p) => <option key={p.id} value={p.id}>{p.codigo_interno} — {p.nombre}</option>)}
                </select>
              </div>
              <div className="field">
                <label>Marca de vehículo</label>
                <select className="input" value={movimientoForm.marca_vehiculo}
                  onChange={(e) => setMovimientoForm({ ...movimientoForm, marca_vehiculo: e.target.value })}>
                  <option value="">N/A</option>
                  {MARCAS_VEHICULO.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              {!esOperador && (
                <div className="field">
                  <label>Tipo</label>
                  <select className="input" value={movimientoForm.tipo_movimiento}
                    onChange={(e) => setMovimientoForm({ ...movimientoForm, tipo_movimiento: e.target.value })}>
                    <option value="entrada">Entrada</option>
                    <option value="salida">Salida</option>
                  </select>
                </div>
              )}
              <div className="field">
                <label>Cantidad</label>
                <input className="input" type="number" required min={0.01} step="0.01" value={movimientoForm.cantidad}
                  onChange={(e) => setMovimientoForm({ ...movimientoForm, cantidad: Number(e.target.value) })} />
              </div>
              <div className="field">
                <label>Motivo</label>
                <input className="input" value={movimientoForm.motivo}
                  onChange={(e) => setMovimientoForm({ ...movimientoForm, motivo: e.target.value })} />
              </div>
            </div>

            <div className="field" style={{ marginTop: '1rem' }}>
              <label>Observaciones</label>
              <textarea className="input" value={movimientoForm.observaciones}
                onChange={(e) => setMovimientoForm({ ...movimientoForm, observaciones: e.target.value })} />
            </div>

            {movimientoError && <div className="error-banner" style={{ marginTop: '1rem' }}>{movimientoError}</div>}

            <div className="form-actions">
              <button type="submit" className="btn btn-primary" disabled={savingMovimiento}>
                {savingMovimiento ? 'Guardando…' : 'Guardar'}
              </button>
            </div>
          </form>
        </section>
      </div>

      {listaError && <div className="error-banner">{listaError}</div>}

      <section className="card" style={{ marginBottom: '1.5rem' }}>
        <h2 className="form-section-title">Productos</h2>
        <table>
          <thead>
            <tr><th>Código</th><th>Nombre</th><th>Marca</th><th>Stock actual</th><th>Mínimo</th><th>Estado</th>{puedeCrear && <th></th>}</tr>
          </thead>
          <tbody>
            {productos.length === 0 ? (
              <tr><td colSpan={puedeCrear ? 7 : 6} className="text-muted">No hay productos registrados todavía.</td></tr>
            ) : (
              productos.map((p) => (
                <tr key={p.id}>
                  <td>{p.codigo_interno}</td>
                  <td>{p.nombre}</td>
                  <td>{p.marca_vehiculo}</td>
                  <td>{p.stock_actual}</td>
                  <td>{p.stock_minimo}</td>
                  <td><span className={badgeClass(p.estado)}>{p.estado}</span></td>
                  {puedeCrear && (
                    <td>
                      <button type="button" className="btn btn-danger-ghost btn-sm" onClick={() => handleEliminarProducto(p)}>
                        Eliminar
                      </button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>

      <section className="card">
        <h2 className="form-section-title">Historial de movimientos</h2>
        <table>
          <thead>
            <tr><th>Fecha</th><th>Tipo</th><th>Marca</th><th>Cantidad</th><th>Motivo</th>{puedeCrear && <th></th>}</tr>
          </thead>
          <tbody>
            {movimientos.length === 0 ? (
              <tr><td colSpan={puedeCrear ? 6 : 5} className="text-muted">No hay movimientos registrados todavía.</td></tr>
            ) : (
              movimientos.map((m) => (
                <tr key={m.id}>
                  <td>{new Date(m.creado_en).toLocaleString()}</td>
                  <td>{m.tipo_movimiento}</td>
                  <td>{m.marca_vehiculo ?? 'N/A'}</td>
                  <td>{m.cantidad}</td>
                  <td>{m.motivo}</td>
                  {puedeCrear && (
                    <td>
                      <button type="button" className="btn btn-danger-ghost btn-sm" onClick={() => handleEliminarMovimiento(m)}>
                        Eliminar
                      </button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>
    </div>
  )
}
