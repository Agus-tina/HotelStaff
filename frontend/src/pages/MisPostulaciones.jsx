import { BriefcaseBusiness, MapPin, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import api from '../api/api.js'
import { formatDate } from '../utils/format.js'

export default function MisPostulaciones() {
  const [postulaciones, setPostulaciones] = useState([])

  async function load() {
    const res = await api.get('/postulaciones/mias')
    setPostulaciones(res.data.data)
  }

  useEffect(() => { load() }, [])

  async function cancelar(id) {
    await api.delete(`/postulaciones/${id}`)
    load()
  }

  const pendientes = postulaciones.filter((p) => p.estado_postulacion === 'pendiente').length

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
            <span className={p.estado_postulacion === 'pendiente' ? 'badge warning' : 'badge'}>{p.estado_postulacion}</span>
            <div className="row-actions">
              <button className="icon-button" disabled={p.estado_postulacion !== 'pendiente'} onClick={() => cancelar(p.postulacion_id)} title="Cancelar" aria-label="Cancelar postulacion">
                <X size={18} />
              </button>
            </div>
          </article>
        ))}
      </section>
    </main>
  )
}
