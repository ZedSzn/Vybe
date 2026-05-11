import { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CheckCircle, XCircle, Loader2, Mail } from 'lucide-react'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams()
  const [status, setStatus] = useState('verifying') // verifying | success | error | no-token
  const [error, setError]   = useState('')
  const { refreshUser, user } = useAuth()

  useEffect(() => {
    const token = searchParams.get('token')
    if (!token) { setStatus('no-token'); return }

    axios.get(`/api/auth/verify-email?token=${token}`)
      .then(() => {
        setStatus('success')
        refreshUser().catch(() => {})
      })
      .catch((err) => {
        setStatus('error')
        setError(err.response?.data?.error || 'Verification failed.')
      })
  }, []) // eslint-disable-line

  return (
    <div className="min-h-screen animated-bg font-space flex items-center justify-center px-4">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[480px] h-[480px] bg-vybe-purple/10 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm relative z-10 text-center"
      >
        {status === 'verifying' && (
          <div className="glass-card rounded-2xl p-10">
            <Loader2 size={48} className="text-vybe-purple animate-spin mx-auto mb-5" />
            <h1 className="text-2xl font-black text-white mb-2">Verifying…</h1>
            <p className="text-vybe-muted text-sm">Confirming your email address.</p>
          </div>
        )}

        {status === 'success' && (
          <div className="glass-card rounded-2xl p-10">
            <div className="w-16 h-16 rounded-full bg-green-500/15 border border-green-500/30 flex items-center justify-center mx-auto mb-6">
              <CheckCircle size={32} className="text-green-400" />
            </div>
            <h1 className="text-2xl font-black text-white mb-3">Email Verified!</h1>
            <p className="text-vybe-muted text-sm leading-relaxed mb-8">
              Your email has been confirmed. You can now start Vybing!
            </p>
            <Link
              to={user ? '/' : '/auth'}
              className="block w-full py-3.5 rounded-xl btn-purple text-white font-black text-sm text-center"
            >
              {user ? 'Go to Vybe' : 'Sign In'}
            </Link>
          </div>
        )}

        {(status === 'error' || status === 'no-token') && (
          <div className="glass-card rounded-2xl p-10">
            <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-6">
              <XCircle size={32} className="text-red-400" />
            </div>
            <h1 className="text-2xl font-black text-white mb-3">
              {status === 'no-token' ? 'No Token Found' : 'Verification Failed'}
            </h1>
            <p className="text-vybe-muted text-sm leading-relaxed mb-8">
              {status === 'no-token'
                ? 'This link is invalid. Check your email for the correct verification link.'
                : error}
            </p>
            <div className="space-y-3">
              <Link
                to="/auth"
                className="block w-full py-3.5 rounded-xl btn-purple text-white font-black text-sm text-center"
              >
                Back to Sign In
              </Link>
              <ResendButton />
            </div>
          </div>
        )}
      </motion.div>
    </div>
  )
}

function ResendButton() {
  const [email, setEmail]     = useState('')
  const [sent, setSent]       = useState(false)
  const [loading, setLoading] = useState(false)
  const [show, setShow]       = useState(false)

  const handleResend = async () => {
    if (!email) return
    setLoading(true)
    try {
      await axios.post('/api/auth/resend-verification', { email })
      setSent(true)
    } catch {}
    setLoading(false)
  }

  if (sent) return (
    <p className="text-green-400 text-sm flex items-center justify-center gap-2">
      <Mail size={14} /> Verification email sent!
    </p>
  )

  if (!show) return (
    <button
      onClick={() => setShow(true)}
      className="w-full py-3 rounded-xl border border-vybe-border text-vybe-muted hover:text-white hover:border-vybe-purple/40 transition-all text-sm"
    >
      Resend verification email
    </button>
  )

  return (
    <div className="space-y-2">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="your@email.com"
        className="w-full px-4 py-3 bg-vybe-bg border border-vybe-border rounded-xl text-white text-sm placeholder-vybe-muted focus:border-vybe-purple focus:outline-none"
      />
      <button
        onClick={handleResend}
        disabled={loading || !email}
        className="w-full py-3 rounded-xl border border-vybe-purple/40 text-vybe-purple hover:bg-vybe-purple/10 transition-all text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {loading ? <><Loader2 size={14} className="animate-spin" /> Sending…</> : 'Send Link'}
      </button>
    </div>
  )
}
