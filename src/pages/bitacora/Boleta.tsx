import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import { fetchViaje } from '../../lib/bitacora'
import type { Viaje } from '../../types/bitacora'

function money(n: number) {
  return `$${n.toFixed(2)}`
}

export default function Boleta() {
  const { id } = useParams()
  const [viaje, setViaje] = useState<Viaje | null>(null)
  const [operadorNombre, setOperadorNombre] = useState('')
  const [camionNumero, setCamionNumero] = useState<number | null>(null)

  useEffect(() => {
    if (!id) return
    fetchViaje(id).then(async (data) => {
      setViaje(data.viaje)
      const [{ data: profile }, { data: camion }] = await Promise.all([
        supabase.from('profiles').select('nombre').eq('id', data.viaje.operador_id).single(),
        supabase.from('bitacora_camiones').select('numero').eq('id', data.viaje.camion_id).single(),
      ])
      setOperadorNombre(profile?.nombre ?? '')
      setCamionNumero(camion?.numero ?? null)
    })
  }, [id])

  if (!viaje) return <p className="text-muted">Cargando…</p>

  const fechaEmision = (viaje.liquidado_en ?? viaje.creado_en).slice(0, 10)

  return (
    <div className="animate-fade-in">
      <div className="boleta-sheet">
        <div className="boleta-header">
          <h1>Transporte Nacional de Carga</h1>
          <p>Boleta Oficial de Viaje — Liquidación de Bitácora</p>
        </div>

        <div className="boleta-section-bar">Datos generales del viaje</div>
        <div className="boleta-grid">
          <div className="boleta-field"><span className="boleta-label">Operador:</span><span className="boleta-value">{operadorNombre}</span></div>
          <div className="boleta-field"><span className="boleta-label">Fecha Emisión:</span><span className="boleta-value">{fechaEmision}</span></div>
          <div className="boleta-field"><span className="boleta-label">Camión / Unidad:</span><span className="boleta-value">{camionNumero ?? '—'}</span></div>
          <div className="boleta-field"><span className="boleta-label">Placas:</span><span className="boleta-value">{viaje.placas || '—'}</span></div>
          <div className="boleta-field"><span className="boleta-label">Peso de Carga:</span><span className="boleta-value">{viaje.peso_categoria}</span></div>
          <div className="boleta-field"><span className="boleta-label">Destino:</span><span className="boleta-value">{viaje.destino_estado || '—'}</span></div>
          <div className="boleta-field"><span className="boleta-label">Empresa Cargadora:</span><span className="boleta-value">{viaje.empresa_carga || '—'}</span></div>
          <div className="boleta-field"><span className="boleta-label">Tipo de Viaje:</span><span className="boleta-value">{viaje.tipo_viaje}</span></div>
        </div>

        <div className="boleta-section-bar">Control de kilometraje y desempeño de combustible</div>
        <div className="boleta-grid">
          <div className="boleta-field"><span className="boleta-label">Kilometraje Salida:</span><span className="boleta-value">{viaje.km_salida}</span></div>
          <div className="boleta-field"><span className="boleta-label">Litros Reales Gastados:</span><span className="boleta-value">{viaje.total_litros.toFixed(1)}</span></div>
          <div className="boleta-field"><span className="boleta-label">Kilometraje Llegada:</span><span className="boleta-value">{viaje.km_llegada}</span></div>
          <div className="boleta-field"><span className="boleta-label">Litros Teóricos (Norma):</span><span className="boleta-value">{viaje.litros_teoricos.toFixed(1)}</span></div>
          <div className="boleta-field"><span className="boleta-label">Kilómetros Recorridos:</span><span className="boleta-value">{viaje.km_recorridos}</span></div>
          <div className="boleta-field"><span className="boleta-label">Litros Devueltos / Ahorro:</span><span className="boleta-value">{viaje.litros_devueltos.toFixed(1)}</span></div>
        </div>

        <div className="boleta-section-bar">Resumen económico y liquidación financiera</div>
        <div className="boleta-grid">
          <div className="boleta-field"><span className="boleta-label">Monto Total Flete:</span><span className="boleta-value">{money(viaje.total_fletes)}</span></div>
          <div className="boleta-field"><span className="boleta-label">Total Combustible ($):</span><span className="boleta-value">{money(viaje.total_combustible)}</span></div>
          <div className="boleta-field"><span className="boleta-label">Gastos Recibidos (Viáticos):</span><span className="boleta-value">{money(viaje.gastos_depositados)}</span></div>
          <div className="boleta-field"><span className="boleta-label">Total Casetas / Peajes ($):</span><span className="boleta-value">{money(viaje.total_casetas)}</span></div>
          <div className="boleta-field"><span className="boleta-label">Comisión Ganada por Flete:</span><span className="boleta-value">{money(viaje.comision_monto)}</span></div>
          <div className="boleta-field"><span className="boleta-label">Total Gastos Extra ($):</span><span className="boleta-value">{money(viaje.total_gastos_extra)}</span></div>
          <div className="boleta-field"><span className="boleta-label">Balance Efectivo (Sobró):</span><span className="boleta-value">{money(viaje.balance_efectivo)}</span></div>
          <div className="boleta-field"><span className="boleta-label">Ajuste por Rendimiento ($):</span><span className="boleta-value">{money(viaje.ajuste_rendimiento)}</span></div>
        </div>

        <div className="boleta-total-banner">
          <span className="boleta-label">Monto total neto a liquidar al operador:</span>
          <span className="boleta-value">{money(viaje.sueldo_final)}</span>
        </div>

        <div className="boleta-signatures">
          <div className="boleta-signature-line">Firma del Operador</div>
          <div className="boleta-signature-line">Firma de Control / Empresa</div>
        </div>
      </div>

      <div className="boleta-actions">
        <button className="btn btn-primary" onClick={() => window.print()}>Imprimir</button>
      </div>
    </div>
  )
}
