import { createContext, useContext, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/auth/me')
      .then(res => setUser(res.data))
      .catch(() => setUser(null))
      .finally(() => setLoading(false))
  }, [])

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password })
    const me  = await api.get('/auth/me')
    setUser(me.data)

    // Check profile completion for students and redirect accordingly
    if (me.data.role === 'student') {
      try {
        const profile = await api.get('/students/profile')
        if (profile.data?.profile_completed) {
          window.location.href = '/dashboard'
        } else {
          window.location.href = '/setup'
        }
      } catch {
        // 404 = no profile yet → go to setup
        window.location.href = '/setup'
      }
    } else {
      window.location.href = '/faculty'
    }

    // Return the login response so callers receive role info
    return { ...res.data, role: me.data.role }
  }

  const logout = async () => {
    try {
      await api.post('/auth/logout')
    } catch (err) {
      console.error('Logout error:', err)
    }
    setUser(null)
    localStorage.clear()
    window.location.href = '/login'
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)