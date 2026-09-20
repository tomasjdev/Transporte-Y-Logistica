import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { fetchViaje } from '../../lib/bitacora'
import type { Viaje } from '../../types/bitacora'

export default function Boleta() {
  const { id } = useParams()
  const [viaje, setViaje] = useState<Viaje | null>(null)

  useEffect(() => {
    if (!id) return
    fetchViaje(id).then((data) => setViaje(data.viaje))
  }, [id])

  if (!viaje) return <p>Cargando…</p>

  return (
    <div>
      <h1>Boleta oficial de viaje — Liquidación de bitácora</h1>
      <p>Folio: {viaje.folio}</p>
      <p>Fecha: {viaje.fecha}</p>
      <p>Placas: {viaje.placas}</p>
      <p>Kilómetros recorridos: {viaje.km_recorridos}</p>
      <p>Litros reales gastados: {viaje.total_litros}</p>
      <p>Litros teóricos (norma): {viaje.litros_teoricos}</p>
      <p>Litros devueltos / ahorro: {viaje.litros_devueltos}</p>
      <p>Total efectivo gastado: ${viaje.efectivo_gastado.toFixed(2)}</p>
      <p>Comisión por flete: ${viaje.comision_monto.toFixed(2)}</p>
      <p>Balance efectivo (sobró): ${viaje.balance_efectivo.toFixed(2)}</p>
      <p>Ajuste financiero por rendimiento: ${viaje.ajuste_rendimiento.toFixed(2)}</p>
      <p><strong>Sueldo final liquidado: ${viaje.sueldo_final.toFixed(2)}</strong></p>
      <button onClick={() => window.print()}>Imprimir</button>
    </div>
  )
}
