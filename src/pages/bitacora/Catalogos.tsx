import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import type { Camion, Peso } from '../../types/bitacora'

export default function Catalogos() {
  const [camiones, setCamiones] = useState<Camion[]>([])
  const [pesos, setPesos] = useState<Peso[]>([])
  const [error, setError] = useState<string | null>(null)

  async function reload() {
    const [c, p] = await Promise.all([
      supabase.from('bitacora_camiones').select('*').order('numero'),
      supabase.from('bitacora_pesos').select('*').order('orden'),
    ])
    setCamiones((c.data ?? []) as Camion[])
    setPesos((p.data ?? []) as Peso[])
  }

  useEffect(() => { reload() }, [])

  async function updatePlacas(id: string, placas: string) {
    setError(null)
    const { error } = await supabase.from('bitacora_camiones').update({ placas }).eq('id', id)
    if (error) {
      setError(`No se pudieron guardar las placas: ${error.message}`)
      return
    }
    reload()
  }

  async function updateComision(id: string, comision_porcentaje: number) {
    setError(null)
    const { error } = await supabase.from('bitacora_pesos').update({ comision_porcentaje }).eq('id', id)
    if (error) {
      setError(`No se pudo guardar la comisión: ${error.message}`)
      return
    }
    reload()
  }

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ marginBottom: '0.25rem' }}>Catálogos</h1>
        <p className="text-muted">Placas de camiones y comisión por categoría de peso</p>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="grid md:grid-cols-2 gap-6">
        <section className="card">
          <h2 className="form-section-title">Camiones</h2>
          <table>
            <thead>
              <tr><th>#</th><th>Placas</th></tr>
            </thead>
            <tbody>
              {camiones.map((c) => (
                <tr key={c.id}>
                  <td style={{ fontWeight: 500 }}>{c.numero}</td>
                  <td>
                    <input
                      className="input"
                      defaultValue={c.placas ?? ''}
                      placeholder="Sin placas"
                      onBlur={(e) => updatePlacas(c.id, e.target.value)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="card">
          <h2 className="form-section-title">Comisión por peso</h2>
          <table>
            <thead>
              <tr><th>Categoría</th><th>Comisión</th></tr>
            </thead>
            <tbody>
              {pesos.map((p) => (
                <tr key={p.id}>
                  <td style={{ fontWeight: 500 }}>{p.categoria}</td>
                  <td>
                    <input
                      className="input"
                      type="number"
                      step="0.01"
                      defaultValue={p.comision_porcentaje}
                      onBlur={(e) => updateComision(p.id, Number(e.target.value))}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  )
}
