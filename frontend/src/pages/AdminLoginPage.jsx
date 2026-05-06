import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Shield, Eye, EyeOff, Loader2, Lock } from 'lucide-react'
import axios from 'axios'

export default function AdminLoginPage() {
  const navigate                       = useNavigate()
  const [username,  setUsername]       = useState('')
  const [password,  setPassword]       = useState('')
  const [showPass,  setShowPass]       = useState(false)
  const [loading,   setLoading]        = useState(false)
  const [error,     setError]          = useState('')

  // Redirect if already logged in
  useEffect(() => {
    const token = localStorage.getItem('vybe_admin_token')
    if (!token) return
    axios.get('/api/admin-auth/verify', { headers: { 'x-admin-token': token } })
      .then(() => navigate('/admin-vybe-2024/dashboard', { replace: true }))
      .catch(() => localStorage.removeItem('vybe_admin_token'))
  }, []) // eslint-disable-line

  const handleLogin = async (e) => {
    e.preventDefault()
    if (!username || !password) { setError('All fields required'); return }
    setLoading(true); setError('')
    try {
      const { data } = await axios.post('/api/admin-auth/login', { username, password })
      localStorage.setItem('vybe_admin_token', data.token)
      localStorage.setItem('vybe_admin_activity', Date.now().toString())
      navigate('/admin-vybe-2024/dashboard', { replace: true })
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-vybe-bg font-space flex items-center justify-center px-4">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-vybe-purple/8 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-[360px] relative z-10"
      >
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-vybe-purple/15 border border-vybe-purple/30 flex items-center justify-center mx-auto mb-4">
            <Shield size={26} className="text-vybe-purple" />
          </div>
          <h1 className="text-2xl font-black text-white">Vybe Admin</h1>
          <p className="text-vybe-muted text-sm mt-1">Restricted access</p>
        </div>

        <div className="bg-vybe-card border border-vybe-border rounded-2xl p-6">
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-vybe-muted uppercase tracking-wider mb-1.5">Username</label>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                className="w-full px-4 py-3 bg-vybe-bg border border-vybe-border rounded-xl text-white text-sm placeholder-vybe-muted focus:border-vybe-purple focus:outline-none transition-colors"
                placeholder="Admin username"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-vybe-muted uppercase tracking-wider mb-1.5">Password</label>
              <div className="relative">
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type={showPass ? 'text' : 'password'}
                  autoComplete="current-password"
                  className="w-full px-4 py-3 pr-11 bg-vybe-bg border border-vybe-border rounded-xl text-white text-sm placeholder-vybe-muted focus:border-vybe-purple focus:outline-none transition-colors"
                  placeholder="Admin password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-vybe-muted hover:text-white transition-colors"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-start gap-2">
                <Lock size={14} className="mt-0.5 flex-shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl btn-purple text-white font-black text-sm flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? <><Loader2 size={15} className="animate-spin" /> Authenticating…</> : 'Access Dashboard'}
            </button>
          </form>

          <p className="text-center text-vybe-muted text-[11px] mt-5">
            3 failed attempts = 30 min lockout
          </p>
        </div>
      </motion.div>
    </div>
  )
}
