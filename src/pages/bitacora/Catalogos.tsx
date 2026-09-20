import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import type { Camion, Peso } from '../../types/bitacora'

export default function Catalogos() {
  const [camiones, setCamiones] = useState<Camion[]>([])
  const [pesos, setPesos] = useState<Peso[]>([])

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
    await supabase.from('bitacora_camiones').update({ placas }).eq('id', id)
    reload()
  }

  async function updateComision(id: string, comision_porcentaje: number) {
    await supabase.from('bitacora_pesos').update({ comision_porcentaje }).eq('id', id)
    reload()
  }

  return (
    <div>
      <h1>Catálogos</h1>
      <section>
        <h2>Camiones</h2>
        <table>
          <tbody>
            {camiones.map((c) => (
              <tr key={c.id}>
                <td>{c.numero}</td>
                <td>
                  <input defaultValue={c.placas ?? ''} onBlur={(e) => updatePlacas(c.id, e.target.value)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <section>
        <h2>Comisión por peso</h2>
        <table>
          <tbody>
            {pesos.map((p) => (
              <tr key={p.id}>
                <td>{p.categoria}</td>
                <td>
                  <input type="number" step="0.01" defaultValue={p.comision_porcentaje}
                    onBlur={(e) => updateComision(p.id, Number(e.target.value))} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  )
}
