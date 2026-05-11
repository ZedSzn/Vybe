import { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null)
  const [token,   setToken]   = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const storedUser  = localStorage.getItem('vybe_user')
    const storedToken = localStorage.getItem('vybe_token')
    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser))
      setToken(storedToken)
      axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`
    }
    setLoading(false)
  }, [])

  const _storeSession = (userData, tok) => {
    setUser(userData)
    setToken(tok)
    localStorage.setItem('vybe_token', tok)
    localStorage.setItem('vybe_user', JSON.stringify(userData))
    axios.defaults.headers.common['Authorization'] = `Bearer ${tok}`
  }

  const login = async (email, password) => {
    const { data } = await axios.post('/api/auth/login', { email, password })
    _storeSession(data.user, data.token)
    return data.user
  }

  const register = async (username, email, password, referralCode = '', gender = '') => {
    const { data } = await axios.post('/api/auth/register', { username, email, password, referralCode, gender })
    _storeSession(data.user, data.token)
    return data
  }

  const updateUser = (updatedUser) => {
    setUser(updatedUser)
    localStorage.setItem('vybe_user', JSON.stringify(updatedUser))
  }

  const refreshUser = async () => {
    try {
      const { data } = await axios.get('/api/user/me')
      setUser(data.user)
      localStorage.setItem('vybe_user', JSON.stringify(data.user))
    } catch {}
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('vybe_token')
    localStorage.removeItem('vybe_user')
    delete axios.defaults.headers.common['Authorization']
  }

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, updateUser, refreshUser, loading, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
