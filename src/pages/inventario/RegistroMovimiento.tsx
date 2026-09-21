import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { crearMovimiento, fetchProductos } from '../../lib/inventario'
import { MARCAS_VEHICULO, type MarcaVehiculo, type Producto } from '../../types/inventario'

export default function RegistroMovimiento() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [productos, setProductos] = useState<Producto[]>([])
  const esOperador = profile?.rol === 'operador'
  const [form, setForm] = useState({
    producto_id: '', marca_vehiculo: '', tipo_movimiento: esOperador ? 'salida' : 'entrada', cantidad: 0, motivo: '', observaciones: '',
  })
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchProductos().then(setProductos)
  }, [])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!profile) return
    setError(null)
    setSaving(true)
    try {
      await crearMovimiento({
        producto_id: form.producto_id,
        marca_vehiculo: (form.marca_vehiculo || null) as MarcaVehiculo | null,
        responsable_id: profile.id,
        tipo_movimiento: form.tipo_movimiento as 'entrada' | 'salida',
        cantidad: form.cantidad,
        motivo: form.motivo,
        observaciones: form.observaciones,
      })
      navigate('/inventario/movimientos')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al registrar el movimiento.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="animate-fade-in" style={{ maxWidth: 640 }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ marginBottom: '0.25rem' }}>Registrar movimiento</h1>
        <p className="text-muted">Entrada o salida de material del inventario</p>
      </div>

      <form onSubmit={handleSubmit} className="card">
        <div className="field-grid">
          <div className="field">
            <label>Producto</label>
            <select className="input" required value={form.producto_id} onChange={(e) => setForm({ ...form, producto_id: e.target.value })}>
              <option value="">Selecciona…</option>
              {productos.map((p) => <option key={p.id} value={p.id}>{p.codigo_interno} — {p.nombre}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Marca de vehículo</label>
            <select className="input" value={form.marca_vehiculo} onChange={(e) => setForm({ ...form, marca_vehiculo: e.target.value })}>
              <option value="">N/A</option>
              {MARCAS_VEHICULO.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          {!esOperador && (
            <div className="field">
              <label>Tipo</label>
              <select className="input" value={form.tipo_movimiento} onChange={(e) => setForm({ ...form, tipo_movimiento: e.target.value })}>
                <option value="entrada">Entrada</option>
                <option value="salida">Salida</option>
              </select>
            </div>
          )}
          <div className="field">
            <label>Cantidad</label>
            <input className="input" type="number" required min={0.01} step="0.01" value={form.cantidad}
              onChange={(e) => setForm({ ...form, cantidad: Number(e.target.value) })} />
          </div>
          <div className="field">
            <label>Motivo</label>
            <input className="input" value={form.motivo} onChange={(e) => setForm({ ...form, motivo: e.target.value })} />
          </div>
        </div>

        <div className="field" style={{ marginTop: '1rem' }}>
          <label>Observaciones</label>
          <textarea className="input" value={form.observaciones} onChange={(e) => setForm({ ...form, observaciones: e.target.value })} />
        </div>

        {error && <div className="error-banner" style={{ marginTop: '1rem' }}>{error}</div>}

        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </form>
    </div>
  )
}
