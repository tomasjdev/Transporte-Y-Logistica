export default function Footer() {
  return (
    <footer className="landing-footer">
      <div className="text-center" style={{ marginBottom: '2rem' }}>
        <h2 style={{ 
          fontFamily: "'Anton', sans-serif",
          color: 'var(--primary)',
          fontSize: '2.5rem',
          margin: 0,
          lineHeight: 1,
          letterSpacing: '2px',
          background: 'rgba(255,255,255,0.8)',
          display: 'inline-block',
          padding: '0.5rem 1rem',
          borderRadius: '4px'
        }}>
          ALAG
        </h2>
        <p style={{
          fontFamily: "'Oswald', sans-serif",
          color: 'var(--secondary)',
          fontWeight: 600,
          fontSize: '1rem',
          textTransform: 'uppercase',
          marginTop: '0.5rem'
        }}>
          Traslados Nacionales de Carga
        </p>
      </div>
      <p className="text-muted" style={{ fontSize: '0.9rem' }}>
        © {new Date().getFullYear()} ALAG Transporte de Carga. Todos los derechos reservados.<br />
        Guadalajara, Jalisco.
      </p>
    </footer>
  )
}
