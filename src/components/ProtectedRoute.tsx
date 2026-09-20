import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth, type Profile } from '../contexts/AuthContext'

interface Props {
  children: ReactNode
  roles?: Profile['rol'][]
}

export default function ProtectedRoute({ children, roles }: Props) {
  const { session, profile, loading, authError } = useAuth()

  if (loading) return <p>Cargando…</p>
  if (!session) return <Navigate to="/login" replace />
  // Fix 7.5: a failed profile fetch (network blip, transient DB error)
  // looks identical to "no profile" unless authError is checked first —
  // without this, a network hiccup would render the same "no tienes
  // permiso" message as an actual permission denial.
  if (authError) return <p>No se pudo verificar tu sesión. Intenta recargar la página. ({authError})</p>
  if (roles && (!profile || !roles.includes(profile.rol))) {
    return <p>No tienes permiso para ver esta página.</p>
  }
  return <>{children}</>
}
