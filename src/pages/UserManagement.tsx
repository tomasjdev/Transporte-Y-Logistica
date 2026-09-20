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

  function reload() {
    supabase.from('profiles').select('*').order('nombre').then(({ data }) => setProfiles(data ?? []))
  }

  useEffect(reload, [])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    const { error: fnError } = await supabase.functions.invoke('create-user', { body: form })
    if (fnError) {
      setError('No se pudo crear el usuario. Verifica los datos.')
      return
    }
    setForm({ email: '', password: '', nombre: '', rol: 'operador' })
    reload()
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
    <div>
      <h1>Usuarios</h1>
      {rowError && <p style={{ color: 'crimson' }}>{rowError}</p>}
      <table>
        <thead>
          <tr><th>Nombre</th><th>Rol</th><th>Activo</th></tr>
        </thead>
        <tbody>
          {profiles.map((p) => (
            <tr key={p.id}>
              <td>{p.nombre}</td>
              <td>
                <select value={p.rol} onChange={(e) => updateRol(p.id, e.target.value as Profile['rol'])}>
                  <option value="operador">Operador</option>
                  <option value="gerencia">Gerencia</option>
                  <option value="admin">Admin</option>
                </select>
              </td>
              <td>
                <input
                  type="checkbox"
                  checked={p.activo}
                  onChange={(e) => updateActivo(p.id, e.target.checked)}
                  aria-label={`Activo — ${p.nombre}`}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <form onSubmit={handleSubmit}>
        <h2>Nuevo usuario</h2>
        <input type="email" placeholder="Correo" required value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <input type="password" placeholder="Contraseña temporal" required value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })} />
        <input placeholder="Nombre" required value={form.nombre}
          onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
        <select value={form.rol} onChange={(e) => setForm({ ...form, rol: e.target.value })}>
          <option value="operador">Operador</option>
          <option value="gerencia">Gerencia</option>
          <option value="admin">Admin</option>
        </select>
        {error && <p style={{ color: 'crimson' }}>{error}</p>}
        <button type="submit">Crear usuario</button>
      </form>
    </div>
  )
}
