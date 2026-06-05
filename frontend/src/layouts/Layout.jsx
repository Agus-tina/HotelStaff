import { CalendarDays, LogOut, User } from 'lucide-react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function Layout() {
  const { user, logout } = useAuth()

  const adminLinks = [
    ['Turnos', '/admin'],
    ['Nuevo turno', '/admin/turnos/nuevo'],
  ]
  const empleadoLinks = [
    ['Oportunidades', '/empleado/turnos'],
    ['Mis postulaciones', '/empleado/mis-postulaciones'],
    ['Mis turnos', '/empleado/mis-turnos'],
    ['Perfil', '/empleado/perfil'],
  ]

  return (
    <div className="app-shell">
      <header className="topbar">
        <Link to="/" className="brand">
          <CalendarDays size={22} />
          Turnos Hotel Casino
        </Link>
        <nav>
          {(user?.rol === 'admin' ? adminLinks : empleadoLinks).map(([label, to]) => (
            <NavLink key={to} to={to}>{label}</NavLink>
          ))}
        </nav>
        <div className="session">
          <User size={18} />
          <span>{user?.nombre}</span>
          <button className="icon-button" onClick={logout} title="Cerrar sesion" aria-label="Cerrar sesion">
            <LogOut size={18} />
          </button>
        </div>
      </header>
      <Outlet />
    </div>
  )
}
