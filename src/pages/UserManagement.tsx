import { useEffect, useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabaseClient'
import type { Database } from '../types/database'

type Profile = Database['public']['Tables']['profiles']['Row']

export default function UserManagement() {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [form, setForm] = useState({ email: '', password: '', nombre: '', rol: 'operador' })
  const [error, setError] = useState<string | null>(null)

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
    await supabase.from('profiles').update({ rol }).eq('id', id)
    reload()
  }

  return (
    <div>
      <h1>Usuarios</h1>
      <table>
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
