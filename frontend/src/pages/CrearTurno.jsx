import { Save } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/api.js'

export default function CrearTurno() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    titulo: '',
    fecha: '',
    horaInicio: '',
    horaFin: '',
    lugar: '',
    direccion: '',
    area: '',
    puesto: '',
    descripcion: '',
    cantidadEmpleados: 1,
  })

  async function handleSubmit(e) {
    e.preventDefault()
    await api.post('/turnos', form)
    navigate('/admin')
  }

  return (
    <main className="page narrow">
      <div className="page-head">
        <div>
          <div className="page-kicker">Nuevo turno</div>
          <h1>Publicar oportunidad</h1>
          <p>Completa los datos operativos para abrir una convocatoria.</p>
        </div>
      </div>

      <form className="panel form-grid" onSubmit={handleSubmit}>
        {[
          ['titulo', 'Titulo'],
          ['fecha', 'Fecha', 'date'],
          ['horaInicio', 'Hora inicio', 'time'],
          ['horaFin', 'Hora fin', 'time'],
          ['lugar', 'Lugar'],
          ['direccion', 'Direccion'],
          ['area', 'Area'],
          ['puesto', 'Puesto'],
          ['cantidadEmpleados', 'Cantidad de empleados', 'number'],
        ].map(([name, label, type = 'text']) => (
          <label key={name}>
            {label}
            <input type={type} min="1" value={form[name]} onChange={(e) => setForm({ ...form, [name]: e.target.value })} />
          </label>
        ))}
        <label className="full">
          Descripcion
          <textarea value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} />
        </label>
        <div className="form-actions full">
          <button><Save size={18} /> Guardar turno</button>
        </div>
      </form>
    </main>
  )
}
