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

  // Supabase's client silently refreshes the access token whenever the tab
  // regains focus/visibility, which fires onAuthStateChange with a new
  // (but same-user) session object. That used to re-run the profile-fetch
  // effect below on every session change, flip `loading` back to true, and
  // make ProtectedRoute unmount/remount every page — including any form
  // the user had open — wiping out whatever they'd typed. Keying the
  // effect on the user id (not the whole session object) and skipping the
  // refetch when we already have that user's profile means a token
  // refresh no longer touches `loading` or `profile` at all.
  const userId = session?.user.id

  useEffect(() => {
    if (!userId) return
    if (profile?.id === userId) return
    setLoading(true)
    setAuthError(null)
    supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
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
  }, [userId, profile])

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
