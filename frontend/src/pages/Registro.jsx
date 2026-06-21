import { UserPlus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../api/api.js'
import GoogleIdentityButton from '../components/GoogleIdentityButton.jsx'
import { useAuth } from '../context/AuthContext.jsx'

const tiposEmpleadoDefault = [
  { id: 1, nombre: 'Mozo' },
  { id: 2, nombre: 'Barra' },
  { id: 3, nombre: 'Recepcion' },
  { id: 4, nombre: 'Limpieza' },
  { id: 5, nombre: 'Seguridad' },
  { id: 6, nombre: 'Casino' },
  { id: 7, nombre: 'Hotel' },
  { id: 8, nombre: 'Cocina' },
]

export default function Registro() {
  const navigate = useNavigate()
  const { loginWithGoogle } = useAuth()
  const [tipos, setTipos] = useState([])
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    nombre: '',
    apellido: '',
    email: '',
    usuario: '',
    password: '',
    confirmPassword: '',
    telefono: '',
    tiposEmpleado: [],
  })

  useEffect(() => {
    api
      .get('/auth/tipos-empleado')
      .then((res) => setTipos(res.data.data || tiposEmpleadoDefault))
      .catch(() => setTipos(tiposEmpleadoDefault))
  }, [])

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function toggleTipo(id) {
    setForm((prev) => ({
      ...prev,
      tiposEmpleado: prev.tiposEmpleado.includes(id)
        ? prev.tiposEmpleado.filter((tipoId) => tipoId !== id)
        : [...prev.tiposEmpleado, id],
    }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (form.password !== form.confirmPassword) {
      setError('Las contrasenas no coinciden')
      return
    }

    try {
      const { confirmPassword, ...payload } = form
      await api.post('/auth/register', payload)
      navigate('/login')
    } catch (err) {
      const errors = err.response?.data?.errors
      setError(errors?.join('. ') || err.response?.data?.message || 'No se pudo crear la cuenta')
    }
  }

  async function handleGoogleCredential(credential) {
    setError('')

    try {
      const user = await loginWithGoogle(credential)
      navigate(user.rol === 'admin' ? '/admin' : '/empleado/turnos')
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo crear la cuenta con Google')
    }
  }

  return (
    <main className="auth-page">
      <form className="auth-card wide" onSubmit={handleSubmit}>
        <div>
          <div className="page-kicker">Alta de empleado</div>
          <h1>Crear cuenta</h1>
        </div>
        <div className="grid two">
          <label htmlFor="nombre">
            Nombre
            <input id="nombre" value={form.nombre} onChange={(e) => updateField('nombre', e.target.value)} required />
          </label>
          <label htmlFor="apellido">
            Apellido
            <input id="apellido" value={form.apellido} onChange={(e) => updateField('apellido', e.target.value)} required />
          </label>
          <label htmlFor="email">
            Email
            <input id="email" type="email" value={form.email} onChange={(e) => updateField('email', e.target.value)} required />
          </label>
          <label htmlFor="usuario">
            Usuario
            <input id="usuario" minLength="4" maxLength="30" value={form.usuario} onChange={(e) => updateField('usuario', e.target.value)} required />
          </label>
          <label htmlFor="telefono">
            Telefono
            <input id="telefono" maxLength="30" value={form.telefono} onChange={(e) => updateField('telefono', e.target.value)} />
          </label>
          <label htmlFor="password">
            Contrasena
            <input id="password" type="password" value={form.password} onChange={(e) => updateField('password', e.target.value)} required />
          </label>
          <label htmlFor="confirmPassword">
            Confirmar contrasena
            <input id="confirmPassword" type="password" value={form.confirmPassword} onChange={(e) => updateField('confirmPassword', e.target.value)} required />
          </label>
        </div>
        <div>
          <h3>Conocimientos</h3>
          <div className="chips">
            {tipos.map((tipo) => (
              <button
                type="button"
                className={form.tiposEmpleado.includes(tipo.id) ? 'chip selected' : 'chip'}
                key={tipo.id}
                onClick={() => toggleTipo(tipo.id)}
              >
                {tipo.nombre}
              </button>
            ))}
          </div>
        </div>
        {error && <p className="error">{error}</p>}
        <button><UserPlus size={18} /> Registrarme</button>
        <div className="auth-divider"><span>o</span></div>
        <GoogleIdentityButton
          text="signup_with"
          onCredential={handleGoogleCredential}
          onError={setError}
        />
        <Link to="/login">Ya tengo cuenta</Link>
      </form>
    </main>
  )
}
