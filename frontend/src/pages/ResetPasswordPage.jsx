import { useState } from 'react'
import { useSearchParams, Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Lock, Eye, EyeOff, Loader2, CheckCircle, XCircle } from 'lucide-react'
import axios from 'axios'

export default function ResetPasswordPage() {
  const [searchParams]          = useSearchParams()
  const navigate                = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm]   = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading]   = useState(false)
  const [success, setSuccess]   = useState(false)
  const [error, setError]       = useState('')

  const token = searchParams.get('token')

  if (!token) {
    return (
      <div className="min-h-screen animated-bg font-space flex items-center justify-center px-4">
        <div className="glass-card rounded-2xl p-10 max-w-sm w-full text-center">
          <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-5">
            <XCircle size={30} className="text-red-400" />
          </div>
          <h1 className="text-xl font-black text-white mb-3">Invalid Link</h1>
          <p className="text-vybe-muted text-sm mb-6">This reset link is invalid or missing.</p>
          <Link to="/forgot-password" className="block w-full py-3.5 rounded-xl btn-purple text-white font-black text-sm text-center">
            Request New Link
          </Link>
        </div>
      </div>
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (password !== confirm) { setError('Passwords do not match'); return }
    if (password.length < 6)  { setError('Password must be at least 6 characters'); return }
    setLoading(true); setError('')
    try {
      await axios.post('/api/auth/reset-password', { token, password })
      setSuccess(true)
      setTimeout(() => navigate('/auth'), 3000)
    } catch (err) {
      setError(err.response?.data?.error || 'Reset failed. The link may have expired.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen animated-bg font-space flex items-center justify-center px-4">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[480px] h-[480px] bg-vybe-purple/10 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-[400px] relative z-10"
      >
        <div className="glass-card rounded-2xl p-8">
          {!success ? (
            <>
              <div className="w-12 h-12 rounded-2xl bg-vybe-purple/15 border border-vybe-purple/30 flex items-center justify-center mb-5">
                <Lock size={22} className="text-vybe-purple" />
              </div>
              <h1 className="text-2xl font-black text-white mb-2">Set New Password</h1>
              <p className="text-vybe-muted text-sm leading-relaxed mb-6">
                Choose a strong password for your Vybe account.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-vybe-muted uppercase tracking-widest mb-1.5">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPass ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min. 6 characters"
                      required
                      minLength={6}
                      className="w-full px-4 py-3 pr-11 bg-vybe-bg border border-vybe-border rounded-xl text-white placeholder-vybe-muted text-sm focus:border-vybe-purple focus:outline-none transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-vybe-muted hover:text-white transition-colors"
                    >
                      {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-vybe-muted uppercase tracking-widest mb-1.5">
                    Confirm Password
                  </label>
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="Repeat password"
                    required
                    className="w-full px-4 py-3 bg-vybe-bg border border-vybe-border rounded-xl text-white placeholder-vybe-muted text-sm focus:border-vybe-purple focus:outline-none transition-colors"
                  />
                </div>

                {error && (
                  <p className="text-red-400 text-[13px] bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-xl btn-purple text-white font-black text-sm flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? <><Loader2 size={15} className="animate-spin" /> Resetting…</> : 'Reset Password'}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-green-500/15 border border-green-500/30 flex items-center justify-center mx-auto mb-5">
                <CheckCircle size={30} className="text-green-400" />
              </div>
              <h1 className="text-2xl font-black text-white mb-3">Password Reset!</h1>
              <p className="text-vybe-muted text-sm mb-6">
                Your password has been updated. Redirecting to sign in…
              </p>
              <Link to="/auth" className="block w-full py-3.5 rounded-xl btn-purple text-white font-black text-sm text-center">
                Sign In Now
              </Link>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}
