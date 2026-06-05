import { BriefcaseBusiness, Eye, MapPin, Plus, Trash2, Users } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/api.js'
import { formatShiftDateTime } from '../utils/format.js'

export default function AdminDashboard() {
  const [turnos, setTurnos] = useState([])

  async function load() {
    const res = await api.get('/turnos')
    setTurnos(res.data.data)
  }

  useEffect(() => { load() }, [])

  async function cancelar(id) {
    await api.delete(`/turnos/${id}`)
    load()
  }

  const vacantes = turnos.reduce((total, turno) => total + Number(turno.cantidad_empleados || 0), 0)
  const asignados = turnos.reduce((total, turno) => total + Number(turno.empleados_asignados || 0), 0)

  return (
    <main className="page">
      <div className="page-head">
        <div>
          <div className="page-kicker">Administracion</div>
          <h1>Turnos publicados</h1>
          <p>Gestion de ofertas, postulados y asignaciones.</p>
        </div>
        <Link className="button" to="/admin/turnos/nuevo"><Plus size={18} /> Nuevo</Link>
      </div>

      <section className="metric-strip" aria-label="Resumen de turnos">
        <div className="metric">
          <span>Publicados</span>
          <strong>{turnos.length}</strong>
        </div>
        <div className="metric">
          <span>Vacantes totales</span>
          <strong>{vacantes}</strong>
        </div>
        <div className="metric">
          <span>Asignados</span>
          <strong>{asignados}</strong>
        </div>
      </section>

      <section className="table-list">
        {!turnos.length && (
          <div className="empty-state">Todavia no hay turnos publicados.</div>
        )}
        {turnos.map((turno) => (
          <article className="row-card" key={turno.id}>
            <div>
              <h3>{turno.titulo}</h3>
              <div className="row-meta">
                <span className="meta-item"><BriefcaseBusiness size={16} /> {formatShiftDateTime(turno)}</span>
                <span className="meta-item"><MapPin size={16} /> {turno.lugar} &middot; {turno.direccion}</span>
              </div>
            </div>
            <span className="badge">{turno.estado}</span>
            <span className="meta-item"><Users size={16} /> {turno.empleados_asignados}/{turno.cantidad_empleados}</span>
            <div className="row-actions">
              <Link className="icon-button" to={`/admin/turnos/${turno.id}/postulados`} title="Ver postulados" aria-label="Ver postulados">
                <Eye size={18} />
              </Link>
              <button className="icon-button danger" onClick={() => cancelar(turno.id)} title="Cancelar" aria-label="Cancelar turno">
                <Trash2 size={18} />
              </button>
            </div>
          </article>
        ))}
      </section>
    </main>
  )
}
