import { Link } from 'react-router-dom'

export default function LandingHeader() {
  return (
    <nav className="landing-navbar">
      <a href="#" className="landing-navbar-logo">
        ALAG<span className="accent">.</span>
      </a>
      
      <div className="landing-nav-links">
        <a href="#inicio" className="landing-nav-link">Inicio</a>
        <a href="#nosotros" className="landing-nav-link">Nosotros</a>
        <a href="#servicios" className="landing-nav-link">Servicios</a>
        <a href="#unidades" className="landing-nav-link">Unidades</a>
        <a href="#contacto" className="landing-nav-link">Contacto</a>
        
        <Link to="/login" className="btn btn-primary">
          Iniciar Sesión
        </Link>
      </div>
    </nav>
  )
}
