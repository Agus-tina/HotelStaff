import { CheckCircle, Mail, Phone, UserCheck } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import api from '../api/api.js'

export default function PostuladosTurno() {
  const { id } = useParams()
  const [postulados, setPostulados] = useState([])
  const [selected, setSelected] = useState([])

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
    await api.post(`/turnos/${id}/asignar`, { postulacionesIds: selected })
    setSelected([])
    load()
  }

  const pendientes = postulados.filter((p) => p.estado_postulacion === 'pendiente').length

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
          <strong>{selected.length}</strong>
        </div>
      </section>

      <section className="table-list">
        {!postulados.length && (
          <div className="empty-state">Todavia no hay postulados para este turno.</div>
        )}
        {postulados.map((p) => (
          <article className="row-card selectable-row" key={p.postulacion_id}>
            <input type="checkbox" disabled={p.estado_postulacion !== 'pendiente'} checked={selected.includes(p.postulacion_id)} onChange={() => toggle(p.postulacion_id)} aria-label={`Seleccionar a ${p.nombre} ${p.apellido}`} />
            <div>
              <h3>{p.nombre} {p.apellido}</h3>
              <div className="row-meta">
                <span className="meta-item"><Mail size={16} /> {p.email}</span>
                <span className="meta-item"><Phone size={16} /> {p.telefono || 'Sin telefono'}</span>
              </div>
            </div>
            <span className={p.estado_postulacion === 'pendiente' ? 'badge warning' : 'badge'}><UserCheck size={14} /> {p.estado_postulacion}</span>
          </article>
        ))}
      </section>
    </main>
  )
}
