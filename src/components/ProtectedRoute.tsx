import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth, type Profile } from '../contexts/AuthContext'

interface Props {
  children: ReactNode
  roles?: Profile['rol'][]
}

export default function ProtectedRoute({ children, roles }: Props) {
  const { session, profile, loading } = useAuth()

  if (loading) return <p>Cargando…</p>
  if (!session) return <Navigate to="/login" replace />
  if (roles && (!profile || !roles.includes(profile.rol))) {
    return <p>No tienes permiso para ver esta página.</p>
  }
  return <>{children}</>
}
