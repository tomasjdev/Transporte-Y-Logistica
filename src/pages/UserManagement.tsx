import { useEffect, useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../contexts/AuthContext'
import type { Database } from '../types/database'

type Profile = Database['public']['Tables']['profiles']['Row']

export default function UserManagement() {
  const { profile: currentProfile } = useAuth()
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [form, setForm] = useState({ email: '', password: '', nombre: '', rol: 'operador' })
  const [error, setError] = useState<string | null>(null)
  const [rowError, setRowError] = useState<string | null>(null)

  async function reload() {
    const { data } = await supabase.from('profiles').select('*').order('nombre')
    setProfiles(data ?? [])
    return data ?? []
  }

  useEffect(() => { reload() }, [])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    const { data: fnData, error: fnError } = await supabase.functions.invoke('create-user', { body: form })
    if (fnError) {
      setError('No se pudo crear el usuario. Verifica los datos.')
      return
    }
    setForm({ email: '', password: '', nombre: '', rol: 'operador' })

    // The new profile is created inline by handle_new_user() and then
    // patched with the chosen rol before the edge function responds, so it
    // should already be visible here — but poll briefly (a few hundred ms)
    // in case of any propagation lag, instead of leaving the admin staring
    // at a list that looks like the creation silently did nothing.
    const newId = (fnData as { id?: string } | null)?.id
    for (let attempt = 0; attempt < 5; attempt++) {
      const current = await reload()
      if (!newId || current.some((p) => p.id === newId)) break
      await new Promise((resolve) => setTimeout(resolve, 400))
    }
  }

  async function updateRol(id: string, rol: Profile['rol']) {
    setRowError(null)
    // Fix 14: guard against an admin self-demoting with no way back in if
    // they're the only admin — a plain confirm() is enough here, no need
    // for a custom modal.
    if (id === currentProfile?.id && rol !== 'admin') {
      const confirmed = window.confirm(
        'Estás a punto de quitarte a ti mismo el rol de administrador. Si eres el único admin, podrías quedar sin acceso a esta página. ¿Continuar?'
      )
      if (!confirmed) return
    }
    const { error } = await supabase.from('profiles').update({ rol }).eq('id', id)
    if (error) {
      setRowError(`No se pudo actualizar el rol: ${error.message}`)
      return
    }
    reload()
  }

  async function updateActivo(id: string, activo: boolean) {
    setRowError(null)
    const { error } = await supabase.from('profiles').update({ activo }).eq('id', id)
    if (error) {
      setRowError(`No se pudo actualizar el estado: ${error.message}`)
      return
    }
    reload()
  }

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ marginBottom: '0.25rem' }}>Usuarios</h1>
        <p className="text-muted">Roles y acceso de cada persona en la plataforma</p>
      </div>

      {rowError && <div className="error-banner">{rowError}</div>}

      <section className="card" style={{ marginBottom: '1.5rem' }}>
        <table>
          <thead>
            <tr><th>Nombre</th><th>Rol</th><th>Activo</th></tr>
          </thead>
          <tbody>
            {profiles.map((p) => (
              <tr key={p.id}>
                <td>{p.nombre}</td>
                <td>
                  <select className="input" value={p.rol} onChange={(e) => updateRol(p.id, e.target.value as Profile['rol'])}>
                    <option value="operador">Operador</option>
                    <option value="gerencia">Gerencia</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>
                <td>
                  <label className="checkbox-field">
                    <input
                      type="checkbox"
                      checked={p.activo}
                      onChange={(e) => updateActivo(p.id, e.target.checked)}
                      aria-label={`Activo — ${p.nombre}`}
                    />
                    {p.activo ? 'Activo' : 'Inactivo'}
                  </label>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="card form-section" style={{ maxWidth: 640 }}>
        <h2 className="form-section-title">Nuevo usuario</h2>
        <form onSubmit={handleSubmit}>
          <div className="field-grid">
            <div className="field">
              <label>Correo</label>
              <input className="input" type="email" required value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="field">
              <label>Contraseña temporal</label>
              <input className="input" type="password" required value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })} />
            </div>
            <div className="field">
              <label>Nombre</label>
              <input className="input" required value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
            </div>
            <div className="field">
              <label>Rol</label>
              <select className="input" value={form.rol} onChange={(e) => setForm({ ...form, rol: e.target.value })}>
                <option value="operador">Operador</option>
                <option value="gerencia">Gerencia</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>

          {error && <div className="error-banner" style={{ marginTop: '1rem' }}>{error}</div>}

          <div className="form-actions">
            <button type="submit" className="btn btn-primary">Crear usuario</button>
          </div>
        </form>
      </section>
    </div>
  )
}
