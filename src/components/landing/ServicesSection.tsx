export default function ServicesSection() {
  const services = [
    "Transporte de carga en general en toda la República Mexicana",
    "Servicio en unidades tipo plataforma",
    "Traslados locales y foráneos",
    "Disponibilidad de unidades con diferentes capacidades",
    "Opción de asegurar la mercancía durante el traslado",
    "Servicio adaptado a las necesidades del cliente",
    "Emisión de facturación por cada servicio realizado"
  ]

  return (
    <section id="servicios" className="section">
      <h2 className="section-title">Nuestros Servicios</h2>
      <div className="services-list">
        {services.map((service, index) => (
          <div key={index} className="service-item">
            <svg className="service-icon" style={{ width: '24px', height: '24px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>{service}</span>
          </div>
        ))}
      </div>
      
      <div className="glass-panel" style={{ marginTop: '3rem', padding: '2rem', textAlign: 'center', background: 'rgba(245, 197, 24, 0.1)', borderColor: 'rgba(245, 197, 24, 0.3)' }}>
        <h3 style={{ color: 'var(--secondary)', fontSize: '1.5rem', marginBottom: '1rem' }}>Condiciones del Servicio</h3>
        <p className="text-muted" style={{ fontSize: '1.1rem', maxWidth: '800px', margin: '0 auto' }}>
          Para garantizar la disponibilidad de las unidades, se recomienda realizar la solicitud del servicio con anticipación. Esto permite una adecuada programación y asegura un servicio eficiente y puntual.
        </p>
      </div>
    </section>
  )
}
