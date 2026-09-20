import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { fetchCatalogos } from '../../lib/bitacora'
import { crearMovimiento, fetchProductos } from '../../lib/inventario'
import type { Camion } from '../../types/bitacora'
import type { Producto } from '../../types/inventario'

export default function RegistroMovimiento() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [productos, setProductos] = useState<Producto[]>([])
  const [camiones, setCamiones] = useState<Camion[]>([])
  const esOperador = profile?.rol === 'operador'
  const [form, setForm] = useState({
    producto_id: '', unidad_vehiculo_id: '', tipo_movimiento: esOperador ? 'salida' : 'entrada', cantidad: 0, motivo: '', observaciones: '',
  })
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchProductos().then(setProductos)
    fetchCatalogos().then((c) => setCamiones(c.camiones))
  }, [])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!profile) return
    setError(null)
    setSaving(true)
    try {
      await crearMovimiento({
        producto_id: form.producto_id,
        unidad_vehiculo_id: form.unidad_vehiculo_id || null,
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
    <form onSubmit={handleSubmit}>
      <h1>Registrar movimiento</h1>
      <label>
        Producto
        <select required value={form.producto_id} onChange={(e) => setForm({ ...form, producto_id: e.target.value })}>
          <option value="">Selecciona…</option>
          {productos.map((p) => <option key={p.id} value={p.id}>{p.codigo_interno} — {p.nombre}</option>)}
        </select>
      </label>
      <label>
        Unidad / Vehículo
        <select value={form.unidad_vehiculo_id} onChange={(e) => setForm({ ...form, unidad_vehiculo_id: e.target.value })}>
          <option value="">N/A</option>
          {camiones.map((c) => <option key={c.id} value={c.id}>{c.numero} — {c.placas}</option>)}
        </select>
      </label>
      {!esOperador && (
        <label>
          Tipo
          <select value={form.tipo_movimiento} onChange={(e) => setForm({ ...form, tipo_movimiento: e.target.value })}>
            <option value="entrada">Entrada</option>
            <option value="salida">Salida</option>
          </select>
        </label>
      )}
      <label>
        Cantidad
        <input type="number" required min={0.01} step="0.01" value={form.cantidad}
          onChange={(e) => setForm({ ...form, cantidad: Number(e.target.value) })} />
      </label>
      <label>
        Motivo
        <input value={form.motivo} onChange={(e) => setForm({ ...form, motivo: e.target.value })} />
      </label>
      <label>
        Observaciones
        <textarea value={form.observaciones} onChange={(e) => setForm({ ...form, observaciones: e.target.value })} />
      </label>
      {error && <p style={{ color: 'crimson' }}>{error}</p>}
      <button type="submit" disabled={saving}>Guardar</button>
    </form>
  )
}
