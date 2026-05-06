import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Mail, Loader2, CheckCircle } from 'lucide-react'
import axios from 'axios'

export default function ForgotPasswordPage() {
  const [email, setEmail]   = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent]     = useState(false)
  const [error, setError]   = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email) { setError('Email is required'); return }
    setLoading(true); setError('')
    try {
      await axios.post('/api/auth/forgot-password', { email })
      setSent(true)
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong.')
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
        <Link
          to="/auth"
          className="inline-flex items-center gap-2 text-vybe-muted hover:text-white transition-colors mb-8 text-sm font-medium"
        >
          <ArrowLeft size={15} /> Back to Sign In
        </Link>

        <div className="glass-card rounded-2xl p-8">
          {!sent ? (
            <>
              <div className="w-12 h-12 rounded-2xl bg-vybe-purple/15 border border-vybe-purple/30 flex items-center justify-center mb-5">
                <Mail size={22} className="text-vybe-purple" />
              </div>
              <h1 className="text-2xl font-black text-white mb-2">Forgot Password?</h1>
              <p className="text-vybe-muted text-sm leading-relaxed mb-6">
                Enter your email address and we'll send you a link to reset your password.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-vybe-muted uppercase tracking-widest mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
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
                  {loading ? <><Loader2 size={15} className="animate-spin" /> Sending…</> : 'Send Reset Link'}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-green-500/15 border border-green-500/30 flex items-center justify-center mx-auto mb-5">
                <CheckCircle size={30} className="text-green-400" />
              </div>
              <h1 className="text-2xl font-black text-white mb-3">Check Your Email</h1>
              <p className="text-vybe-muted text-sm leading-relaxed mb-2">
                If an account exists for <span className="text-white font-semibold">{email}</span>, you'll receive a password reset link shortly.
              </p>
              <p className="text-vybe-muted text-xs mb-8">The link expires in 1 hour.</p>
              <Link
                to="/auth"
                className="block w-full py-3.5 rounded-xl btn-purple text-white font-black text-sm text-center"
              >
                Back to Sign In
              </Link>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}
