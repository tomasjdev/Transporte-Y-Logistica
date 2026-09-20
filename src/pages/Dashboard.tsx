import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { fetchViajes } from '../lib/bitacora'
import { fetchProductos } from '../lib/inventario'
import type { Viaje } from '../types/bitacora'
import type { Producto } from '../types/inventario'

export default function Dashboard() {
  const { profile } = useAuth()
  const [viajes, setViajes] = useState<Viaje[]>([])
  const [productos, setProductos] = useState<Producto[]>([])
  const isManager = profile?.rol === 'admin' || profile?.rol === 'gerencia'

  useEffect(() => {
    if (!profile) return
    fetchViajes(isManager ? {} : { operadorId: profile.id }).then((v) => setViajes(v.slice(0, 5)))
    fetchProductos().then(setProductos)
  }, [profile, isManager])

  const stockBajo = productos.filter((p) => p.estado !== 'OK')

  return (
    <div>
      <h1>Dashboard</h1>
      <section>
        <h2>Viajes recientes</h2>
        <ul>
          {viajes.map((v) => <li key={v.id}>Folio {v.folio} — {v.fecha} — {v.estatus}</li>)}
        </ul>
      </section>
      {isManager && (
        <section>
          <h2>Alertas de stock</h2>
          <ul>
            {stockBajo.map((p) => <li key={p.id}>{p.nombre}: {p.stock_actual} ({p.estado})</li>)}
          </ul>
        </section>
      )}
    </div>
  )
}
