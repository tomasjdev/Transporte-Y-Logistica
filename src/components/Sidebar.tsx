import { NavLink } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function Sidebar() {
  const { profile, signOut } = useAuth()

  return (
    <nav className="sidebar">
      <div className="sidebar-header">
        <h2 className="sidebar-title">Trans&Logis</h2>
        <p className="sidebar-user">{profile?.nombre}</p>
      </div>

      <div className="nav-links">
        <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} end>
          Dashboard
        </NavLink>
        <NavLink to="/bitacora" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          Bitácora
        </NavLink>
        <NavLink to="/inventario" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} end>
          Inventario
        </NavLink>

        {profile?.rol === 'admin' && (
          <>
            <NavLink to="/usuarios" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              Usuarios
            </NavLink>
            <NavLink to="/bitacora/catalogos" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              Catálogos
            </NavLink>
          </>
        )}
      </div>

      <button onClick={signOut} className="btn btn-ghost" style={{ marginTop: 'auto', width: '100%' }}>
        Cerrar sesión
      </button>
    </nav>
  )
}
