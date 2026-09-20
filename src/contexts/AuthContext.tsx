import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabaseClient'
import type { Database } from '../types/database'

export type Profile = Database['public']['Tables']['profiles']['Row']

interface AuthState {
  session: Session | null
  profile: Profile | null
  loading: boolean
  authError: string | null
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthState | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      if (!data.session) setLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
      if (!newSession) {
        setProfile(null)
        setLoading(false)
      }
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!session) return
    setLoading(true)
    setAuthError(null)
    supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single()
      .then(({ data, error }) => {
        if (error) {
          // Fix 7.5: distinguish a transient network/DB failure from a real
          // "no profile" case, so ProtectedRoute doesn't render a
          // misleading "No tienes permiso" for what's actually a network
          // blip. profile stays null either way (ProtectedRoute needs
          // that), but authError lets a caller tell the two apart.
          console.error('No se pudo cargar el perfil del usuario:', error)
          setAuthError(error.message)
          setProfile(null)
          setLoading(false)
          return
        }
        setProfile(data)
        setLoading(false)
      })
  }, [session])

  async function signOut() {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ session, profile, loading, authError, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}
