import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const navigate = useNavigate()

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
    setSubmitting(false)
    if (signInError) {
      setError('Correo o contraseña incorrectos.')
      return
    }
    navigate('/dashboard', { replace: true })
  }

  return (
    <div className="login-page-bg">
      <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '400px', padding: '2.5rem' }}>
        <div className="text-center" style={{ marginBottom: '2rem' }}>
          <h1 style={{
            fontFamily: "'Anton', sans-serif",
            color: 'var(--text-main)',
            fontSize: '3rem',
            margin: 0,
            lineHeight: 1,
            letterSpacing: '2px',
            textShadow: '0 2px 12px rgba(0, 0, 0, 0.6)'
          }}>
            ALAG
          </h1>
          <p style={{
            fontFamily: "'Oswald', sans-serif",
            color: 'var(--secondary)',
            fontWeight: 600,
            fontSize: '1rem',
            textTransform: 'uppercase',
            marginBottom: '1rem'
          }}>
            Traslados Nacionales de Carga
          </p>
          <p className="text-muted">Accede a tu plataforma de gestión</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="form-group">
            <label>Correo Electrónico</label>
            <input 
              type="email" 
              className="input"
              required 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              placeholder="tu@correo.com"
            />
          </div>
          <div className="form-group">
            <label>Contraseña</label>
            <input 
              type="password" 
              className="input"
              required 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              placeholder="••••••••"
            />
          </div>
          
          {error && (
            <div style={{ padding: '0.75rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '6px', color: '#f87171', fontSize: '0.875rem' }}>
              {error}
            </div>
          )}
          
          <button type="submit" className="btn btn-primary" disabled={submitting} style={{ marginTop: '1rem' }}>
            {submitting ? 'Verificando...' : 'Iniciar Sesión'}
          </button>
        </form>
      </div>
    </div>
  )
}
