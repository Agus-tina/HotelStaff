import { CalendarCheck, CalendarPlus, Save, Unlink } from 'lucide-react'
import { useEffect, useState } from 'react'
import api from '../api/api.js'

export default function PerfilEmpleado() {
  const [tipos, setTipos] = useState([])
  const [form, setForm] = useState(null)
  const [googleLinked, setGoogleLinked] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const googleResult = params.get('google')

    if (googleResult === 'ok') setMessage('Google Calendar vinculado correctamente.')
    if (googleResult === 'error') setMessage('No se pudo vincular Google Calendar.')
    if (googleResult === 'missing') setMessage('Google no devolvio los datos necesarios.')

    Promise.all([
      api.get('/empleados/perfil'),
      api.get('/auth/tipos-empleado'),
      api.get('/google/status'),
    ]).then(([perfil, tiposRes, googleStatus]) => {
      const data = perfil.data.data
      setForm({
        ...data,
        tiposEmpleado: data.tiposEmpleado.map((tipo) => tipo.id),
      })
      setTipos(tiposRes.data.data)
      setGoogleLinked(googleStatus.data.linked)
    })
  }, [])

  if (!form) return <main className="page">Cargando...</main>

  function toggleTipo(id) {
    setForm((prev) => ({
      ...prev,
      tiposEmpleado: prev.tiposEmpleado.includes(id)
        ? prev.tiposEmpleado.filter((tipoId) => tipoId !== id)
        : [...prev.tiposEmpleado, id],
    }))
  }

  async function save(e) {
    e.preventDefault()
    await api.put('/empleados/perfil', form)
    setMessage('Perfil actualizado correctamente.')
  }

  async function linkGoogle() {
    const res = await api.get('/google/auth-url')
    window.location.href = res.data.url
  }

  async function unlinkGoogle() {
    await api.delete('/google/unlink')
    setGoogleLinked(false)
    setMessage('Google Calendar desvinculado.')
  }

  const labels = {
    nombre: 'Nombre',
    apellido: 'Apellido',
    email: 'Email',
    usuario: 'Usuario',
    telefono: 'Telefono',
  }

  return (
    <main className="page narrow">
      <div className="page-head">
        <div>
          <div className="page-kicker">Perfil</div>
          <h1>Mi perfil</h1>
          <p>Datos personales, conocimientos y sincronizacion de calendario.</p>
        </div>
      </div>

      <form className="panel form-grid" onSubmit={save}>
        {Object.entries(labels).map(([name, label]) => (
          <label key={name}>
            {label}
            <input value={form[name] || ''} onChange={(e) => setForm({ ...form, [name]: e.target.value })} />
          </label>
        ))}
        <label>
          Estado
          <select value={form.estado} onChange={(e) => setForm({ ...form, estado: e.target.value })}>
            <option value="activo">Activo</option>
            <option value="inactivo">Inactivo</option>
          </select>
        </label>
        <div className="full">
          <h3>Conocimientos</h3>
          <div className="chips">
            {tipos.map((tipo) => (
              <button type="button" key={tipo.id} className={form.tiposEmpleado.includes(tipo.id) ? 'chip selected' : 'chip'} onClick={() => toggleTipo(tipo.id)}>
                {tipo.nombre}
              </button>
            ))}
          </div>
        </div>
        {message && <p className="full success">{message}</p>}
        {googleLinked && <p className="full success"><CalendarCheck size={18} /> Google Calendar vinculado.</p>}
        <div className="form-actions full">
          <button><Save size={18} /> Guardar cambios</button>
          {googleLinked ? (
            <button type="button" className="secondary" onClick={unlinkGoogle}>
              <Unlink size={18} /> Desvincular Google Calendar
            </button>
          ) : (
            <button type="button" className="secondary" onClick={linkGoogle}>
              <CalendarPlus size={18} /> Vincular Google Calendar
            </button>
          )}
        </div>
      </form>
    </main>
  )
}
