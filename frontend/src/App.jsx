import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './context/AuthContext.jsx'
import Layout from './layouts/Layout.jsx'
import AdminDashboard from './pages/AdminDashboard.jsx'
import CrearTurno from './pages/CrearTurno.jsx'
import Login from './pages/Login.jsx'
import MisPostulaciones from './pages/MisPostulaciones.jsx'
import MisTurnos from './pages/MisTurnos.jsx'
import PerfilEmpleado from './pages/PerfilEmpleado.jsx'
import PostuladosTurno from './pages/PostuladosTurno.jsx'
import Registro from './pages/Registro.jsx'
import TurnosDisponibles from './pages/TurnosDisponibles.jsx'

function ProtectedRoute({ role, children }) {
  const { user, loading } = useAuth()
  if (loading) return <main className="center">Cargando...</main>
  if (!user) return <Navigate to="/login" replace />
  if (role && user.rol !== role) return <Navigate to="/" replace />
  return children
}

function HomeRedirect() {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  return <Navigate to={user.rol === 'admin' ? '/admin' : '/empleado/turnos'} replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/registro" element={<Registro />} />
      <Route path="/" element={<HomeRedirect />} />

      <Route element={<Layout />}>
        <Route
          path="/admin"
          element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>}
        />
        <Route
          path="/admin/turnos/nuevo"
          element={<ProtectedRoute role="admin"><CrearTurno /></ProtectedRoute>}
        />
        <Route
          path="/admin/turnos/:id/postulados"
          element={<ProtectedRoute role="admin"><PostuladosTurno /></ProtectedRoute>}
        />
        <Route
          path="/empleado/turnos"
          element={<ProtectedRoute role="empleado"><TurnosDisponibles /></ProtectedRoute>}
        />
        <Route
          path="/empleado/mis-postulaciones"
          element={<ProtectedRoute role="empleado"><MisPostulaciones /></ProtectedRoute>}
        />
        <Route
          path="/empleado/mis-turnos"
          element={<ProtectedRoute role="empleado"><MisTurnos /></ProtectedRoute>}
        />
        <Route
          path="/empleado/perfil"
          element={<ProtectedRoute role="empleado"><PerfilEmpleado /></ProtectedRoute>}
        />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
