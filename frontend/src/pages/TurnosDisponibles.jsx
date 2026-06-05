import { BriefcaseBusiness, Building2, MapPin, Send, Users } from 'lucide-react'
import { useEffect, useState } from 'react'
import api from '../api/api.js'
import { formatShiftDateTime } from '../utils/format.js'

export default function TurnosDisponibles() {
  const [turnos, setTurnos] = useState([])

  async function load() {
    const res = await api.get('/turnos/disponibles')
    setTurnos(res.data.data)
  }

  useEffect(() => { load() }, [])

  async function postular(turnoId) {
    await api.post('/postulaciones', { turnoId })
    load()
  }

  const postulados = turnos.filter((turno) => turno.postulado).length

  return (
    <main className="page">
      <div className="page-head">
        <div>
          <div className="page-kicker">Empleado</div>
          <h1>Oportunidades disponibles</h1>
          <p>Turnos abiertos segun tu perfil y disponibilidad operativa.</p>
        </div>
      </div>

      <section className="metric-strip" aria-label="Resumen de oportunidades">
        <div className="metric">
          <span>Disponibles</span>
          <strong>{turnos.length}</strong>
        </div>
        <div className="metric">
          <span>Ya postuladas</span>
          <strong>{postulados}</strong>
        </div>
        <div className="metric">
          <span>Vacantes visibles</span>
          <strong>{turnos.reduce((total, turno) => total + Number(turno.cantidad_empleados || 0), 0)}</strong>
        </div>
      </section>

      <section className="cards-grid">
        {!turnos.length && (
          <div className="empty-state full">No hay oportunidades disponibles por el momento.</div>
        )}
        {turnos.map((turno) => (
          <article className="panel" key={turno.id}>
            <div className="card-top">
              <h3>{turno.titulo}</h3>
              {turno.postulado && <span className="badge neutral">Postulado</span>}
            </div>
            <div className="card-meta">
              <span className="meta-item"><BriefcaseBusiness size={16} /> {formatShiftDateTime(turno)}</span>
              <span className="meta-item"><MapPin size={16} /> {turno.lugar} &middot; {turno.direccion}</span>
              <span className="meta-item"><Building2 size={16} /> {turno.puesto} &middot; {turno.area}</span>
              <span className="meta-item"><Users size={16} /> {turno.cantidad_empleados} vacantes</span>
            </div>
            {turno.descripcion && <p className="card-description">{turno.descripcion}</p>}
            <button disabled={Boolean(turno.postulado)} onClick={() => postular(turno.id)}>
              <Send size={18} />
              {turno.postulado ? 'Postulado' : 'Postularme'}
            </button>
          </article>
        ))}
      </section>
    </main>
  )
}
