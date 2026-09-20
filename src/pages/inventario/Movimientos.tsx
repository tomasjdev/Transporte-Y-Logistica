import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchMovimientos } from '../../lib/inventario'
import type { Movimiento } from '../../types/inventario'

export default function Movimientos() {
  const [movimientos, setMovimientos] = useState<Movimiento[]>([])

  useEffect(() => { fetchMovimientos().then(setMovimientos) }, [])

  return (
    <div>
      <h1>Historial de movimientos</h1>
      <Link to="/inventario/movimientos/nuevo">+ Nuevo movimiento</Link>
      <table>
        <thead>
          <tr><th>Fecha</th><th>Tipo</th><th>Cantidad</th><th>Motivo</th></tr>
        </thead>
        <tbody>
          {movimientos.map((m) => (
            <tr key={m.id}>
              <td>{new Date(m.creado_en).toLocaleString()}</td>
              <td>{m.tipo_movimiento}</td>
              <td>{m.cantidad}</td>
              <td>{m.motivo}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
