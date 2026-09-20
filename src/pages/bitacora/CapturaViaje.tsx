import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { fetchCatalogos, fetchViaje, guardarViaje, previewLiquidacion } from '../../lib/bitacora'
import type { Camion, Componente, Estado, Peso, Liquidacion, ViajePayload } from '../../types/bitacora'

const CASETAS = Array.from({ length: 26 }, (_, i) => i + 1)

function emptyPayload(operadorId: string, componentes: Componente[]): ViajePayload {
  return {
    estatus: 'borrador',
    operador_id: operadorId,
    fecha: new Date().toISOString().slice(0, 10),
    camion_id: '',
    placas: '',
    peso_categoria: '',
    destino_estado: '',
    empresa_carga: '',
    tipo_viaje: 'Sencillo',
    tipo_combustible: 'Diesel',
    km_salida: 0,
    km_llegada: 0,
    gastos_depositados: 0,
    observaciones: '',
    fletes: [{ descripcion: '', monto: 0 }],
    recargas: [],
    casetas: CASETAS.map((numero) => ({ numero, monto: 0 })),
    gastos_extra: [],
    inventario_unidad: componentes.map((c) => ({ componente: c.nombre, estado: 'OK' as const })),
  }
}

export default function CapturaViaje() {
  const { id } = useParams()
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [camiones, setCamiones] = useState<Camion[]>([])
  const [pesos, setPesos] = useState<Peso[]>([])
  const [estados, setEstados] = useState<Estado[]>([])
  const [payload, setPayload] = useState<ViajePayload | null>(null)
  const [liquidacion, setLiquidacion] = useState<Liquidacion | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!profile) return
    fetchCatalogos().then(async (cat) => {
      setCamiones(cat.camiones)
      setPesos(cat.pesos)
      setEstados(cat.estados)
      if (id) {
        const existing = await fetchViaje(id)
        setPayload({
          id: existing.viaje.id,
          estatus: existing.viaje.estatus as 'borrador' | 'liquidado',
          operador_id: existing.viaje.operador_id,
          fecha: existing.viaje.fecha,
          camion_id: existing.viaje.camion_id,
          placas: existing.viaje.placas ?? '',
          peso_categoria: existing.viaje.peso_categoria,
          destino_estado: existing.viaje.destino_estado ?? '',
          empresa_carga: existing.viaje.empresa_carga ?? '',
          tipo_viaje: existing.viaje.tipo_viaje as 'Sencillo' | 'Redondo',
          tipo_combustible: existing.viaje.tipo_combustible as 'Gasolina' | 'Diesel',
          km_salida: existing.viaje.km_salida,
          km_llegada: existing.viaje.km_llegada,
          gastos_depositados: existing.viaje.gastos_depositados,
          observaciones: existing.viaje.observaciones ?? '',
          fletes: existing.fletes.map((f) => ({ descripcion: f.descripcion ?? '', monto: f.monto })),
          recargas: existing.recargas.map((r) => ({
            orden: r.orden, lugar: r.lugar ?? '', litros: r.litros, monto: r.monto, es_relleno_final: r.es_relleno_final,
          })),
          casetas: existing.casetas.map((c) => ({ numero: c.numero, monto: c.monto })),
          gastos_extra: existing.gastosExtra.map((g) => ({ concepto: g.concepto, monto: g.monto })),
          inventario_unidad: existing.inventarioUnidad.map((i) => ({
            componente: i.componente, estado: i.estado as 'OK' | 'Falta' | 'Malo',
          })),
        })
      } else {
        setPayload(emptyPayload(profile.id, cat.componentes))
      }
    })
  }, [id, profile])

  useEffect(() => {
    if (!payload || !payload.camion_id || !payload.peso_categoria) return
    previewLiquidacion(payload).then(setLiquidacion).catch(() => setLiquidacion(null))
  }, [payload])

  if (!payload) return <p>Cargando…</p>

  function update<K extends keyof ViajePayload>(key: K, value: ViajePayload[K]) {
    setPayload((prev) => (prev ? { ...prev, [key]: value } : prev))
  }

  async function handleSave(estatus: 'borrador' | 'liquidado') {
    if (!payload) return
    setSaving(true)
    setError(null)
    try {
      const savedId = await guardarViaje({ ...payload, estatus })
      navigate(`/bitacora/viajes/${savedId}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al guardar el viaje.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <h1>Captura de viaje</h1>

      <section>
        <h2>1. Datos generales</h2>
        <label>
          Camión
          <select value={payload.camion_id} onChange={(e) => {
            const camion = camiones.find((c) => c.id === e.target.value)
            update('camion_id', e.target.value)
            update('placas', camion?.placas ?? '')
          }}>
            <option value="">Selecciona…</option>
            {camiones.map((c) => (
              <option key={c.id} value={c.id}>{c.numero} — {c.placas ?? 'sin placas'}</option>
            ))}
          </select>
        </label>
        <label>
          Peso
          <select value={payload.peso_categoria} onChange={(e) => update('peso_categoria', e.target.value)}>
            <option value="">Selecciona…</option>
            {pesos.map((p) => <option key={p.id} value={p.categoria}>{p.categoria}</option>)}
          </select>
        </label>
        <label>
          Destino
          <select value={payload.destino_estado} onChange={(e) => update('destino_estado', e.target.value)}>
            <option value="">Selecciona…</option>
            {estados.map((s) => <option key={s.id} value={s.nombre}>{s.nombre}</option>)}
          </select>
        </label>
        <label>
          Empresa que carga
          <input type="text" value={payload.empresa_carga} onChange={(e) => update('empresa_carga', e.target.value)} />
        </label>
        <label>
          Tipo de viaje
          <select value={payload.tipo_viaje} onChange={(e) => update('tipo_viaje', e.target.value as 'Sencillo' | 'Redondo')}>
            <option value="Sencillo">Sencillo</option>
            <option value="Redondo">Redondo</option>
          </select>
        </label>
        <label>
          Combustible
          <select value={payload.tipo_combustible} onChange={(e) => update('tipo_combustible', e.target.value as 'Gasolina' | 'Diesel')}>
            <option value="Diesel">Diesel</option>
            <option value="Gasolina">Gasolina</option>
          </select>
        </label>
        <label>
          Fecha
          <input type="date" value={payload.fecha} onChange={(e) => update('fecha', e.target.value)} />
        </label>
        <label>
          Km salida
          <input type="number" value={payload.km_salida} onChange={(e) => update('km_salida', Number(e.target.value))} />
        </label>
        <label>
          Km llegada
          <input type="number" value={payload.km_llegada} onChange={(e) => update('km_llegada', Number(e.target.value))} />
        </label>
        <label>
          Gastos depositados
          <input type="number" value={payload.gastos_depositados} onChange={(e) => update('gastos_depositados', Number(e.target.value))} />
        </label>
        <label>
          Observaciones
          <textarea value={payload.observaciones} onChange={(e) => update('observaciones', e.target.value)} />
        </label>
      </section>

      <section>
        <h2>2. Fletes</h2>
        {payload.fletes.map((f, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <label>
              Descripción
              <input type="text" value={f.descripcion} onChange={(e) => {
                const fletes = [...payload.fletes]
                fletes[i] = { ...f, descripcion: e.target.value }
                update('fletes', fletes)
              }} />
            </label>
            <label>
              Monto
              <input type="number" value={f.monto} onChange={(e) => {
                const fletes = [...payload.fletes]
                fletes[i] = { ...f, monto: Number(e.target.value) }
                update('fletes', fletes)
              }} />
            </label>
            <button type="button" onClick={() => {
              const fletes = payload.fletes.filter((_, idx) => idx !== i)
              update('fletes', fletes)
            }}>Quitar</button>
          </div>
        ))}
        <button type="button" onClick={() => update('fletes', [...payload.fletes, { descripcion: '', monto: 0 }])}>
          + Agregar flete
        </button>
      </section>

      <section>
        <h2>3. Casetas (1 a 26)</h2>
        {payload.casetas.map((c, i) => (
          <label key={c.numero}>
            Caseta {c.numero}
            <input type="number" value={c.monto} onChange={(e) => {
              const casetas = [...payload.casetas]
              casetas[i] = { ...c, monto: Number(e.target.value) }
              update('casetas', casetas)
            }} />
          </label>
        ))}
      </section>

      <section>
        <h2>4. Recargas de combustible</h2>
        {payload.recargas.map((r, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <label>
              Orden
              <input type="number" value={r.orden} onChange={(e) => {
                const recargas = [...payload.recargas]
                recargas[i] = { ...r, orden: Number(e.target.value) }
                update('recargas', recargas)
              }} />
            </label>
            <label>
              Lugar
              <input type="text" value={r.lugar} onChange={(e) => {
                const recargas = [...payload.recargas]
                recargas[i] = { ...r, lugar: e.target.value }
                update('recargas', recargas)
              }} />
            </label>
            <label>
              Litros
              <input type="number" value={r.litros} onChange={(e) => {
                const recargas = [...payload.recargas]
                recargas[i] = { ...r, litros: Number(e.target.value) }
                update('recargas', recargas)
              }} />
            </label>
            <label>
              Monto
              <input type="number" value={r.monto} onChange={(e) => {
                const recargas = [...payload.recargas]
                recargas[i] = { ...r, monto: Number(e.target.value) }
                update('recargas', recargas)
              }} />
            </label>
            <label>
              Relleno final
              <input type="checkbox" checked={r.es_relleno_final} onChange={(e) => {
                const recargas = [...payload.recargas]
                recargas[i] = { ...r, es_relleno_final: e.target.checked }
                update('recargas', recargas)
              }} />
            </label>
            <button type="button" onClick={() => {
              const recargas = payload.recargas.filter((_, idx) => idx !== i)
              update('recargas', recargas)
            }}>Quitar</button>
          </div>
        ))}
        <button type="button" onClick={() => update('recargas', [
          ...payload.recargas,
          { orden: payload.recargas.length + 1, lugar: '', litros: 0, monto: 0, es_relleno_final: false },
        ])}>
          + Agregar recarga
        </button>
      </section>

      <section>
        <h2>5. Gastos extra</h2>
        {payload.gastos_extra.map((g, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <label>
              Concepto
              <input type="text" value={g.concepto} onChange={(e) => {
                const gastos = [...payload.gastos_extra]
                gastos[i] = { ...g, concepto: e.target.value }
                update('gastos_extra', gastos)
              }} />
            </label>
            <label>
              Monto
              <input type="number" value={g.monto} onChange={(e) => {
                const gastos = [...payload.gastos_extra]
                gastos[i] = { ...g, monto: Number(e.target.value) }
                update('gastos_extra', gastos)
              }} />
            </label>
            <button type="button" onClick={() => {
              const gastos = payload.gastos_extra.filter((_, idx) => idx !== i)
              update('gastos_extra', gastos)
            }}>Quitar</button>
          </div>
        ))}
        <button type="button" onClick={() => update('gastos_extra', [...payload.gastos_extra, { concepto: '', monto: 0 }])}>
          + Agregar gasto extra
        </button>
      </section>

      <section>
        <h2>6. Inventario de la unidad</h2>
        {payload.inventario_unidad.map((inv, i) => (
          <label key={inv.componente}>
            {inv.componente}
            <select value={inv.estado} onChange={(e) => {
              const inventario = [...payload.inventario_unidad]
              inventario[i] = { ...inv, estado: e.target.value as 'OK' | 'Falta' | 'Malo' }
              update('inventario_unidad', inventario)
            }}>
              <option value="OK">OK</option>
              <option value="Falta">Falta</option>
              <option value="Malo">Malo</option>
            </select>
          </label>
        ))}
      </section>

      {liquidacion && (
        <section>
          <h2>Liquidación (vista previa)</h2>
          <p>Km recorridos: {liquidacion.km_recorridos}</p>
          <p>Litros teóricos: {liquidacion.litros_teoricos.toFixed(2)}</p>
          <p>Litros devueltos: {liquidacion.litros_devueltos}</p>
          <p>Comisión: ${liquidacion.comision_monto.toFixed(2)}</p>
          <p>Balance efectivo (Sobró): ${liquidacion.balance_efectivo.toFixed(2)}</p>
          <p>Ajuste por rendimiento: ${liquidacion.ajuste_rendimiento.toFixed(2)}</p>
          <p><strong>Sueldo final: ${liquidacion.sueldo_final.toFixed(2)}</strong></p>
        </section>
      )}

      {error && <p style={{ color: 'crimson' }}>{error}</p>}

      <button disabled={saving} onClick={() => handleSave('borrador')}>Guardar borrador</button>
      {(profile?.rol === 'gerencia' || profile?.rol === 'admin') && (
        <button disabled={saving} onClick={() => handleSave('liquidado')}>Liquidar</button>
      )}
    </div>
  )
}
