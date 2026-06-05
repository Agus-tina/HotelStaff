import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import api from '../api/api.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('user')
    return stored ? JSON.parse(stored) : null
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) return

    setLoading(true)
    api.get('/auth/me')
      .then((res) => {
        setUser(res.data.usuario)
        localStorage.setItem('user', JSON.stringify(res.data.usuario))
      })
      .catch(() => logout())
      .finally(() => setLoading(false))
  }, [])

  async function login(identifier, password) {
    const res = await api.post('/auth/login', { identifier, password })
    localStorage.setItem('token', res.data.token)
    localStorage.setItem('user', JSON.stringify(res.data.usuario))
    setUser(res.data.usuario)
    return res.data.usuario
  }

  function logout() {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
  }

  const value = useMemo(() => ({ user, loading, login, logout }), [user, loading])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
