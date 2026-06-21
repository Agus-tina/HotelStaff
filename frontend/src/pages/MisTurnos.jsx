import { BriefcaseBusiness, CheckCircle, MapPin } from 'lucide-react'
import { useEffect, useState } from 'react'
import api from '../api/api.js'
import { formatShiftDateTime } from '../utils/format.js'
import { ASIGNACION_STATUS, statusBadgeClass, statusLabel } from '../utils/status.js'

export default function MisTurnos() {
  const [turnos, setTurnos] = useState([])

  async function load() {
    const res = await api.get('/postulaciones/mis-turnos')
    setTurnos(res.data.data)
  }

  useEffect(() => { load() }, [])

  async function confirmar(id) {
    await api.post(`/postulaciones/asignaciones/${id}/confirmar`)
    load()
  }

  const turnosActivos = turnos.filter((turno) => turno.estado_asignacion !== 'cancelado')
  const confirmados = turnos.filter((turno) => turno.estado_asignacion === 'confirmado_asistencia').length
  const porConfirmar = turnos.filter((turno) => turno.estado_asignacion === 'asignado').length

  return (
    <main className="page">
      <div className="page-head">
        <div>
          <div className="page-kicker">Agenda</div>
          <h1>Mis turnos asignados</h1>
          <p>Turnos confirmados por administracion para tu asistencia.</p>
        </div>
      </div>

      <section className="metric-strip" aria-label="Resumen de asignaciones">
        <div className="metric">
          <span>Asignados</span>
          <strong>{turnosActivos.length}</strong>
        </div>
        <div className="metric">
          <span>Confirmados</span>
          <strong>{confirmados}</strong>
        </div>
        <div className="metric">
          <span>Por confirmar</span>
          <strong>{porConfirmar}</strong>
        </div>
      </section>

      <section className="table-list">
        {!turnos.length && (
          <div className="empty-state">Todavia no tenes turnos asignados.</div>
        )}
        {turnos.map((turno) => (
          <article className="row-card" key={turno.asignacion_id}>
            <div>
              <h3>{turno.titulo}</h3>
              <div className="row-meta">
                <span className="meta-item"><BriefcaseBusiness size={16} /> {formatShiftDateTime(turno)}</span>
                <span className="meta-item"><MapPin size={16} /> {turno.lugar} &middot; {turno.direccion}</span>
              </div>
            </div>
            <span className={statusBadgeClass(turno.estado_asignacion, ASIGNACION_STATUS)}>
              {statusLabel(turno.estado_asignacion, ASIGNACION_STATUS)}
            </span>
            <button disabled={turno.estado_asignacion !== 'asignado'} onClick={() => confirmar(turno.asignacion_id)}>
              <CheckCircle size={18} /> Confirmar asistencia
            </button>
          </article>
        ))}
      </section>
    </main>
  )
}
