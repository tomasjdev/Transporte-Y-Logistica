// Only these two Unsplash photo IDs are confirmed to actually load a real
// truck (the other three Antigravity picked either 404'd or resolved to
// unrelated stock photos — a hammer, a coffee cup). Reused across all five
// cards as a placeholder until real fleet photos replace them.
const TRUCK_PHOTO_A = 'https://images.unsplash.com/photo-1519003722824-194d4455a60c?q=80&w=2075&auto=format&fit=crop'
const TRUCK_PHOTO_B = 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?q=80&w=2070&auto=format&fit=crop'

export default function FleetSection() {
  const units = [
    {
      title: "Hasta 1 Tonelada",
      type: "Plataforma sencilla",
      capacity: "1 tonelada",
      measures: "1.90 ancho - 2.70 largo",
      config: "Con redilas y/o lona",
      image: TRUCK_PHOTO_A
    },
    {
      title: "Hasta 3.5 Toneladas",
      type: "Plataforma sencilla",
      capacity: "3.5 toneladas",
      measures: "2.50 ancho - 6.30 largo",
      config: "Con redilas y/o lona",
      image: TRUCK_PHOTO_B
    },
    {
      title: "Hasta 5 Toneladas",
      type: "Plataforma sencilla",
      capacity: "5 toneladas",
      measures: "2.50 ancho - 6.30 largo",
      config: "Con redilas y/o lona",
      image: TRUCK_PHOTO_A
    },
    {
      title: "Hasta 10 Toneladas",
      type: "Plataforma sencilla",
      capacity: "10 toneladas",
      measures: "2.50 ancho - 7.50 largo",
      config: "Con redilas y/o lona",
      image: TRUCK_PHOTO_B
    },
    {
      title: "Hasta 35 Toneladas",
      type: "Tráiler plataforma",
      capacity: "35 toneladas",
      measures: "2.44 ancho - 12.00 largo",
      config: "Plataforma sencilla (sin redilas)",
      image: TRUCK_PHOTO_A
    }
  ]

  return (
    <section id="unidades" className="section" style={{ background: 'var(--bg-gradient)' }}>
      <h2 className="section-title">Catálogo de Unidades</h2>
      <div className="fleet-grid">
        {units.map((unit, idx) => (
          <div key={idx} className="fleet-card">
            <img src={unit.image} alt={unit.title} className="fleet-card-img" />
            <div className="fleet-card-content">
              <h3 className="fleet-card-title">{unit.title}</h3>
              <div className="fleet-features">
                <div className="fleet-feature">
                  <strong>Tipo:</strong> {unit.type}
                </div>
                <div className="fleet-feature">
                  <strong>Capacidad:</strong> {unit.capacity}
                </div>
                <div className="fleet-feature">
                  <strong>Medidas:</strong> {unit.measures}
                </div>
                <div className="fleet-feature">
                  <strong>Configuración:</strong> {unit.config}
                </div>
                <div className="fleet-feature">
                  <strong>Rastreo:</strong> GPS con monitoreo en tiempo real
                </div>
                <div className="fleet-feature">
                  <strong>Seguro:</strong> Disponible bajo solicitud
                </div>
                <div className="fleet-feature">
                  <strong>Disponibilidad:</strong> Sujeta a programación previa
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
