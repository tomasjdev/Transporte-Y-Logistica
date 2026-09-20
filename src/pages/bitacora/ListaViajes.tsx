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
    <div>
      <h1>Viajes</h1>
      <Link to="/bitacora/viajes/nuevo">Nuevo viaje</Link>
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
                <Link to={`/bitacora/viajes/${v.id}`}>Ver</Link>
                {' · '}
                <Link to={`/bitacora/boleta/${v.id}`}>Boleta</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
