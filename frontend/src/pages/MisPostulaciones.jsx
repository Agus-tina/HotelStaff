import { BriefcaseBusiness, MapPin, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import api from '../api/api.js'
import { formatDate } from '../utils/format.js'
import { POSTULACION_STATUS, statusBadgeClass, statusLabel } from '../utils/status.js'

export default function MisPostulaciones() {
  const [postulaciones, setPostulaciones] = useState([])
  const [error, setError] = useState('')

  async function load() {
    const res = await api.get('/postulaciones/mias')
    setPostulaciones(res.data.data)
  }

  useEffect(() => { load() }, [])

  async function cancelar(id) {
    setError('')

    try {
      await api.delete(`/postulaciones/${id}`)
      load()
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo cancelar la postulacion.')
    }
  }

  const pendientes = postulaciones.filter((p) => p.estado_postulacion === 'pendiente').length

  function puedeCancelar(postulacion) {
    if (postulacion.estado_postulacion === 'pendiente') return true
    return postulacion.estado_postulacion === 'seleccionado'
      && postulacion.estado_asignacion === 'asignado'
  }

  return (
    <main className="page">
      <div className="page-head">
        <div>
          <div className="page-kicker">Seguimiento</div>
          <h1>Mis postulaciones</h1>
          <p>Estado de las oportunidades a las que te postulaste.</p>
        </div>
      </div>

      <section className="metric-strip" aria-label="Resumen de postulaciones">
        <div className="metric">
          <span>Total</span>
          <strong>{postulaciones.length}</strong>
        </div>
        <div className="metric">
          <span>Pendientes</span>
          <strong>{pendientes}</strong>
        </div>
        <div className="metric">
          <span>Resueltas</span>
          <strong>{postulaciones.length - pendientes}</strong>
        </div>
      </section>

      <section className="table-list">
        {error && <p className="error">{error}</p>}
        {!postulaciones.length && (
          <div className="empty-state">Todavia no realizaste postulaciones.</div>
        )}
        {postulaciones.map((p) => (
          <article className="row-card" key={p.postulacion_id}>
            <div>
              <h3>{p.titulo}</h3>
              <div className="row-meta">
                <span className="meta-item"><BriefcaseBusiness size={16} /> {formatDate(p.fecha)}</span>
                <span className="meta-item"><MapPin size={16} /> {p.lugar}</span>
              </div>
            </div>
            <span className={statusBadgeClass(p.estado_postulacion, POSTULACION_STATUS)}>
              {statusLabel(p.estado_postulacion, POSTULACION_STATUS)}
            </span>
            <div className="row-actions">
              <button className="icon-button" disabled={!puedeCancelar(p)} onClick={() => cancelar(p.postulacion_id)} title="Cancelar" aria-label="Cancelar postulacion">
                <X size={18} />
              </button>
            </div>
          </article>
        ))}
      </section>
    </main>
  )
}
