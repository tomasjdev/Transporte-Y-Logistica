export default function AboutSection() {
  return (
    <section id="nosotros" className="section" style={{ background: 'var(--bg-gradient)' }}>
      <h2 className="section-title">Quiénes Somos</h2>
      
      <div className="about-grid">
        <div className="card">
          <h3 style={{ color: 'var(--secondary)', fontSize: '1.75rem' }}>Misión</h3>
          <p className="text-muted" style={{ fontSize: '1.1rem', lineHeight: 1.6 }}>
            Brindar servicios de transporte de carga en toda la República Mexicana, ofreciendo soluciones eficientes, seguras y confiables mediante el uso de unidades propias en óptimas condiciones. Nos comprometemos a cumplir con cada traslado en tiempo y forma, adaptándonos a las necesidades de nuestros clientes y garantizando la integridad de su mercancía a través de un servicio profesional, responsable y de alta calidad.
          </p>
        </div>
        
        <div className="card">
          <h3 style={{ color: 'var(--secondary)', fontSize: '1.75rem' }}>Visión</h3>
          <p className="text-muted" style={{ fontSize: '1.1rem', lineHeight: 1.6 }}>
            Ser una empresa líder en el transporte de carga a nivel nacional, reconocida por la confiabilidad de nuestras unidades, la puntualidad en nuestros servicios y la calidad en la atención a nuestros clientes. Buscamos consolidarnos como una empresa sólida dentro del sector, destacando por nuestro compromiso, crecimiento constante y excelencia operativa en cada traslado realizado en la República Mexicana.
          </p>
        </div>
      </div>
      
      <div style={{ marginTop: '4rem' }}>
        <h2 className="section-title">Nuestros Valores</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
          {[
            { title: 'Responsabilidad', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
            { title: 'Compromiso', icon: 'M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1' },
            { title: 'Seguridad', icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z' },
            { title: 'Puntualidad', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
            { title: 'Honestidad', icon: 'M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5' }
          ].map((val, idx) => (
            <div key={idx} className="value-card glass-panel">
              <svg className="value-icon mx-auto" style={{ width: '40px', height: '40px', display: 'block' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={val.icon} />
              </svg>
              <h4 style={{ fontSize: '1.25rem', margin: 0 }}>{val.title}</h4>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
