import { useState, type FormEvent } from 'react'

export default function ContactSection() {
  const [sent, setSent] = useState(false)

  // Not wired to any backend yet — this only confirms receipt to the
  // visitor client-side. How submitted leads should reach the admin panel
  // (a table, an email, etc.) is still being decided.
  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSent(true)
  }

  return (
    <section id="contacto" className="section" style={{ background: 'var(--bg-gradient)' }}>
      <h2 className="section-title">Contacto</h2>
      
      <div className="contact-grid">
        <div className="contact-info">
          <div className="contact-item glass-panel" style={{ padding: '1.5rem', borderRadius: 'var(--border-radius-md)' }}>
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ width: '28px', height: '28px', flexShrink: 0 }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            <div>
              <strong style={{ display: 'block', color: 'var(--text-main)' }}>Teléfonos de Oficina:</strong>
              <span className="text-muted">33-3860-0113 / 33-3334-9270</span>
            </div>
          </div>
          
          <div className="contact-item glass-panel" style={{ padding: '1.5rem', borderRadius: 'var(--border-radius-md)' }}>
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ width: '28px', height: '28px', flexShrink: 0 }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            <div>
              <strong style={{ display: 'block', color: 'var(--text-main)' }}>WhatsApp:</strong>
              <span className="text-muted">33-1689-4728 / 33-1210-3114</span>
            </div>
          </div>
          
          <div className="contact-item glass-panel" style={{ padding: '1.5rem', borderRadius: 'var(--border-radius-md)' }}>
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ width: '28px', height: '28px', flexShrink: 0 }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <div>
              <strong style={{ display: 'block', color: 'var(--text-main)' }}>Correo:</strong>
              <a href="mailto:ventasalag@gmail.com" className="text-muted">ventasalag@gmail.com</a>
            </div>
          </div>
          
          <div className="contact-item glass-panel" style={{ padding: '1.5rem', borderRadius: 'var(--border-radius-md)' }}>
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ width: '28px', height: '28px', flexShrink: 0 }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <div>
              <strong style={{ display: 'block', color: 'var(--text-main)' }}>Ubicación:</strong>
              <span className="text-muted">Guadalajara, Jalisco</span>
            </div>
          </div>
        </div>
        
        <div className="glass-panel" style={{ padding: '2.5rem', borderRadius: 'var(--border-radius-md)' }}>
          <h3 style={{ color: 'var(--secondary)', marginBottom: '1.5rem', fontSize: '1.5rem' }}>Envíanos un mensaje</h3>
          {sent ? (
            <p style={{ color: 'var(--secondary)', fontSize: '1.05rem' }}>
              ¡Gracias! Recibimos tu mensaje y te contactaremos pronto.
            </p>
          ) : (
            <form className="grid gap-4" onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Nombre completo</label>
                <input type="text" className="input" placeholder="Tu nombre" required />
              </div>
              <div className="form-group">
                <label>Correo electrónico</label>
                <input type="email" className="input" placeholder="tu@correo.com" required />
              </div>
              <div className="form-group">
                <label>Teléfono</label>
                <input type="tel" className="input" placeholder="Tu teléfono" />
              </div>
              <div className="form-group">
                <label>Mensaje o Cotización</label>
                <textarea className="input" placeholder="Detalles de tu carga..." required></textarea>
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '1rem', marginTop: '1rem' }}>
                Enviar Mensaje
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  )
}
