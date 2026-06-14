import { LogIn } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import GoogleIdentityButton from '../components/GoogleIdentityButton.jsx'
import { useAuth } from '../context/AuthContext.jsx'

export default function Login() {
  const { login, loginWithGoogle } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ identifier: '', password: '' })
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    try {
      const user = await login(form.identifier, form.password)
      navigate(user.rol === 'admin' ? '/admin' : '/empleado/turnos')
    } catch (err) {
      const errors = err.response?.data?.errors
      setError(errors?.join('. ') || err.response?.data?.message || 'No se pudo iniciar sesion')
    }
  }

  async function handleGoogleCredential(credential) {
    setError('')

    try {
      const user = await loginWithGoogle(credential)
      navigate(user.rol === 'admin' ? '/admin' : '/empleado/turnos')
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo ingresar con Google')
    }
  }

  return (
    <main className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <div>
          <div className="page-kicker">Acceso</div>
          <h1>Iniciar sesion</h1>
        </div>
        <label htmlFor="identifier">Email o usuario</label>
        <input id="identifier" value={form.identifier} onChange={(e) => setForm({ ...form, identifier: e.target.value })} required />
        <label htmlFor="password">Contrasena</label>
        <input id="password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
        {error && <p className="error">{error}</p>}
        <button><LogIn size={18} /> Entrar</button>
        <div className="auth-divider"><span>o</span></div>
        <GoogleIdentityButton
          onCredential={handleGoogleCredential}
          onError={setError}
        />
        <Link to="/registro">Crear cuenta</Link>
      </form>
    </main>
  )
}
