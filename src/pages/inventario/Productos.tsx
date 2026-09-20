import { useEffect, useState, type FormEvent } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { crearProducto, fetchProductos } from '../../lib/inventario'
import type { Producto } from '../../types/inventario'

export default function Productos() {
  const { profile } = useAuth()
  const [productos, setProductos] = useState<Producto[]>([])
  const [form, setForm] = useState({ codigo_interno: '', nombre: '', categoria: '', unidad_medida: '', stock_inicial: 0, stock_minimo: 0 })
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
      setForm({ codigo_interno: '', nombre: '', categoria: '', unidad_medida: '', stock_inicial: 0, stock_minimo: 0 })
      reload()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al crear el producto.')
    }
  }

  return (
    <div>
      <h1>Inventario — Productos</h1>
      <table>
        <thead>
          <tr><th>Código</th><th>Nombre</th><th>Stock actual</th><th>Mínimo</th><th>Estado</th></tr>
        </thead>
        <tbody>
          {productos.map((p) => (
            <tr key={p.id} style={{ color: p.estado === 'Agotado' ? 'crimson' : p.estado === 'Bajo' ? 'darkorange' : 'inherit' }}>
              <td>{p.codigo_interno}</td>
              <td>{p.nombre}</td>
              <td>{p.stock_actual}</td>
              <td>{p.stock_minimo}</td>
              <td>{p.estado}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {puedeCrear && (
        <form onSubmit={handleSubmit}>
          <h2>Nuevo producto</h2>
          <input placeholder="Código interno" required value={form.codigo_interno}
            onChange={(e) => setForm({ ...form, codigo_interno: e.target.value })} />
          <input placeholder="Nombre" required value={form.nombre}
            onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
          <input placeholder="Categoría" value={form.categoria}
            onChange={(e) => setForm({ ...form, categoria: e.target.value })} />
          <input placeholder="Unidad de medida" required value={form.unidad_medida}
            onChange={(e) => setForm({ ...form, unidad_medida: e.target.value })} />
          <input type="number" placeholder="Stock inicial" value={form.stock_inicial}
            onChange={(e) => setForm({ ...form, stock_inicial: Number(e.target.value) })} />
          <input type="number" placeholder="Stock mínimo" value={form.stock_minimo}
            onChange={(e) => setForm({ ...form, stock_minimo: Number(e.target.value) })} />
          {error && <p style={{ color: 'crimson' }}>{error}</p>}
          <button type="submit">Crear producto</button>
        </form>
      )}
    </div>
  )
}
