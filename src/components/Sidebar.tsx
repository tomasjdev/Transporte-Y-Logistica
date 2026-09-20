import { NavLink } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function Sidebar() {
  const { profile, signOut } = useAuth()
  const isManager = profile?.rol === 'admin' || profile?.rol === 'gerencia'

  return (
    <nav style={{ width: 220, padding: 16, background: '#1f2430', color: 'white', minHeight: '100vh' }}>
      <p>{profile?.nombre}</p>
      <NavLink to="/">Dashboard</NavLink>
      <NavLink to="/bitacora">Bitácora</NavLink>
      <NavLink to="/inventario">Inventario</NavLink>
      <NavLink to="/inventario/movimientos">Movimientos</NavLink>
      {profile?.rol === 'admin' && <NavLink to="/usuarios">Usuarios</NavLink>}
      {isManager && <NavLink to="/bitacora/catalogos">Catálogos</NavLink>}
      <button onClick={signOut}>Cerrar sesión</button>
    </nav>
  )
}
