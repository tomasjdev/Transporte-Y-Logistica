import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { fetchViajes } from '../../lib/bitacora'
import type { Viaje } from '../../types/bitacora'

export default function ListaViajes() {
  const { profile } = useAuth()
  const [viajes, setViajes] = useState<Viaje[]>([])
  const isManager = profile?.rol === 'admin' || profile?.rol === 'gerencia'

  useEffect(() => {
    if (!profile) return
    fetchViajes(isManager ? {} : { operadorId: profile.id }).then(setViajes)
  }, [profile, isManager])

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 style={{ margin: 0 }}>Viajes</h1>
        <Link to="/bitacora/viajes/nuevo" className="btn btn-primary">+ Nuevo viaje</Link>
      </div>
      <table>
        <thead>
          <tr>
            <th>Folio</th><th>Fecha</th><th>Estatus</th><th>Sueldo final</th><th></th>
          </tr>
        </thead>
        <tbody>
          {viajes.map((v) => (
            <tr key={v.id}>
              <td>{v.folio}</td>
              <td>{v.fecha}</td>
              <td>{v.estatus}</td>
              <td>${v.sueldo_final.toFixed(2)}</td>
              <td>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <Link to={`/bitacora/viajes/${v.id}`} className="btn btn-ghost" style={{ padding: '0.25rem 0.75rem', fontSize: '0.8rem' }}>Ver</Link>
                  <Link to={`/bitacora/boleta/${v.id}`} className="btn btn-ghost" style={{ padding: '0.25rem 0.75rem', fontSize: '0.8rem' }}>Boleta</Link>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
