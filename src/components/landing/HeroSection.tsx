export default function HeroSection() {
  return (
    <section id="inicio" className="hero-section">
      <div className="animate-fade-in">
        <h1 className="hero-title">
          Traslados Nacionales<br />
          <span style={{ color: 'var(--secondary)' }}>de Carga</span>
        </h1>
        <p className="hero-subtitle">
          Soluciones eficientes, seguras y confiables con más de 25 años de experiencia. Flotilla propia de 1 a 35 toneladas para toda la República Mexicana.
        </p>
        <a href="#contacto" className="btn btn-primary" style={{ fontSize: '1.1rem', padding: '1rem 2.5rem' }}>
          Cotizar Servicio
        </a>
      </div>
    </section>
  )
}
