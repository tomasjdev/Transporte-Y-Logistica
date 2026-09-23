export default function FacilitiesSection() {
  return (
    <section className="section">
      <div className="facilities-content glass-panel" style={{ padding: '3rem' }}>
        <div>
          <h2 className="section-title" style={{ textAlign: 'left', marginBottom: '1.5rem' }}>Nuestras Instalaciones</h2>
          <p className="text-muted" style={{ fontSize: '1.1rem', lineHeight: 1.6 }}>
            Contamos con las instalaciones adecuadas para el resguardo y servicio de las unidades, así como equipo y personal capacitado para su mantenimiento.
          </p>
        </div>
        <div>
          <img 
            src="https://images.unsplash.com/photo-1587293852726-70cdb56c2866?q=80&w=2072&auto=format&fit=crop" 
            alt="Instalaciones ALAG" 
            style={{ width: '100%', borderRadius: 'var(--border-radius-md)', border: '1px solid var(--glass-border)' }}
          />
        </div>
      </div>
    </section>
  )
}
