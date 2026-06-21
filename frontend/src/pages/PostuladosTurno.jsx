import { Brain, CheckCircle, Mail, Phone, UserCheck, UserMinus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import api from '../api/api.js'
import { ASIGNACION_STATUS, POSTULACION_STATUS, statusBadgeClass, statusLabel } from '../utils/status.js'

export default function PostuladosTurno() {
  const { id } = useParams()
  const [postulados, setPostulados] = useState([])
  const [selected, setSelected] = useState([])
  const [error, setError] = useState('')
  const [cancellingId, setCancellingId] = useState(null)

  async function load() {
    const res = await api.get(`/turnos/${id}/postulados`)
    setPostulados(res.data.data)
  }

  useEffect(() => { load() }, [id])

  function toggle(postulacionId) {
    setSelected((prev) => prev.includes(postulacionId)
      ? prev.filter((item) => item !== postulacionId)
      : [...prev, postulacionId])
  }

  async function asignar() {
    setError('')

    try {
      await api.post(`/turnos/${id}/asignar`, { postulacionesIds: selected })
      setSelected([])
      load()
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudieron asignar los empleados.')
    }
  }

  async function cancelarSeleccionado(postulacionId) {
    setError('')
    setCancellingId(postulacionId)

    try {
      await api.put(`/turnos/${id}/postulaciones/${postulacionId}/baja`)
      setSelected((prev) => prev.filter((item) => item !== postulacionId))
      load()
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo quitar al empleado del turno.')
    } finally {
      setCancellingId(null)
    }
  }

  const pendientes = postulados.filter((p) => p.estado_postulacion === 'pendiente').length
  const seleccionados = postulados.filter((p) =>
    p.estado_postulacion === 'seleccionado'
    && p.estado_asignacion !== 'cancelado'
  ).length
  const canCancelSelected = (postulacion) =>
    postulacion.estado_postulacion === 'seleccionado'
    && ['asignado', 'confirmado_asistencia'].includes(postulacion.estado_asignacion)

  return (
    <main className="page">
      <div className="page-head">
        <div>
          <div className="page-kicker">Seleccion</div>
          <h1>Postulados</h1>
          <p>Elegir empleados para cubrir el turno publicado.</p>
        </div>
        <button disabled={!selected.length} onClick={asignar}><CheckCircle size={18} /> Asignar seleccionados</button>
      </div>

      <section className="metric-strip" aria-label="Resumen de postulados">
        <div className="metric">
          <span>Postulados</span>
          <strong>{postulados.length}</strong>
        </div>
        <div className="metric">
          <span>Pendientes</span>
          <strong>{pendientes}</strong>
        </div>
        <div className="metric">
          <span>Seleccionados</span>
          <strong>{seleccionados}</strong>
        </div>
        <div className="metric">
          <span>Marcados para asignar</span>
          <strong>{selected.length}</strong>
        </div>
      </section>

      <section className="table-list">
        {error && <p className="error">{error}</p>}
        {!postulados.length && (
          <div className="empty-state">Todavia no hay postulados para este turno.</div>
        )}
        {postulados.map((p) => (
          <article className="row-card postulados-row" key={p.postulacion_id}>
            <input type="checkbox" disabled={p.estado_postulacion !== 'pendiente'} checked={selected.includes(p.postulacion_id)} onChange={() => toggle(p.postulacion_id)} aria-label={`Seleccionar a ${p.nombre} ${p.apellido}`} />
            <div>
              <h3>{p.nombre} {p.apellido}</h3>
              <div className="row-meta">
                <span className="meta-item"><Mail size={16} /> {p.email}</span>
                <span className="meta-item"><Phone size={16} /> {p.telefono || 'Sin telefono'}</span>
                <span className="meta-item"><Brain size={16} /> {p.conocimientos || 'Sin conocimientos cargados'}</span>
              </div>
            </div>
            <span className={statusBadgeClass(p.estado_postulacion, POSTULACION_STATUS)}>
              <UserCheck size={14} /> {statusLabel(p.estado_postulacion, POSTULACION_STATUS)}
            </span>
            {p.estado_asignacion && (
              <span className={statusBadgeClass(p.estado_asignacion, ASIGNACION_STATUS)}>
                {statusLabel(p.estado_asignacion, ASIGNACION_STATUS)}
              </span>
            )}
            <div className="row-actions">
              <button
                type="button"
                className="danger"
                disabled={!canCancelSelected(p) || cancellingId === p.postulacion_id}
                onClick={() => cancelarSeleccionado(p.postulacion_id)}
              >
                <UserMinus size={18} /> Quitar del turno
              </button>
            </div>
          </article>
        ))}
      </section>
    </main>
  )
}
