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
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ marginBottom: '0.25rem' }}>Dashboard</h1>
        <p className="text-muted">Resumen de operaciones y alertas</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <section className="card animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <h2 style={{ fontSize: '1.25rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
            Viajes recientes
          </h2>
          {viajes.length === 0 ? (
            <p className="text-muted">No hay viajes recientes.</p>
          ) : (
            <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {viajes.map((v) => (
                <li key={v.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: '6px' }}>
                  <div>
                    <div style={{ fontWeight: 500 }}>Folio {v.folio}</div>
                    <div className="text-muted" style={{ fontSize: '0.875rem' }}>{v.fecha}</div>
                  </div>
                  <span className={`badge ${v.estatus === 'liquidado' ? 'badge-success' : 'badge-warning'}`}>
                    {v.estatus}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {isManager && (
          <section className="card animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <h2 style={{ fontSize: '1.25rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
              Alertas de stock
            </h2>
            {stockBajo.length === 0 ? (
              <p className="text-muted" style={{ padding: '1rem', background: 'rgba(16, 185, 129, 0.05)', borderRadius: '6px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>Todo el inventario está en niveles óptimos.</p>
            ) : (
              <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {stockBajo.map((p) => (
                  <li key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'rgba(239, 68, 68, 0.05)', borderRadius: '6px', border: '1px solid rgba(239, 68, 68, 0.1)' }}>
                    <div>
                      <div style={{ fontWeight: 500 }}>{p.nombre}</div>
                      <div className="text-muted" style={{ fontSize: '0.875rem' }}>Stock actual: {p.stock_actual}</div>
                    </div>
                    <span className="badge badge-danger">
                      {p.estado}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
      </div>
    </div>
  )
}
