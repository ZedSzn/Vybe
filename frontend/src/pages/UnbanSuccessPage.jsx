import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { CheckCircle, Loader2, AlertCircle } from 'lucide-react'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'

export default function UnbanSuccessPage() {
  const [searchParams]            = useSearchParams()
  const navigate                  = useNavigate()
  const { user, updateUser }      = useAuth()
  const [status, setStatus]       = useState('verifying') // 'verifying' | 'success' | 'error'
  const [errorMsg, setErrorMsg]   = useState('')

  useEffect(() => {
    const sessionId = searchParams.get('session_id')
    if (!sessionId) { setStatus('error'); setErrorMsg('Missing payment session.'); return }
    const token = localStorage.getItem('vybe_token')
    if (!token)     { setStatus('error'); setErrorMsg('You must be logged in to verify payment.'); return }

    axios.get(`/api/unban/verify?session_id=${sessionId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(({ data }) => {
        if (data.success) {
          if (typeof updateUser === 'function') updateUser(data.user)
          setStatus('success')
        } else {
          setStatus('error')
          setErrorMsg('Could not verify payment.')
        }
      })
      .catch((err) => {
        setStatus('error')
        setErrorMsg(err.response?.data?.error || 'Verification failed. Please contact support.')
      })
  }, []) // eslint-disable-line

  return (
    <div className="min-h-screen animated-bg font-space flex items-center justify-center px-4">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[480px] h-[480px] bg-vybe-purple/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-sm relative z-10 text-center">
        {status === 'verifying' && (
          <>
            <Loader2 size={48} className="text-vybe-purple animate-spin mx-auto mb-6" />
            <h1 className="text-2xl font-black text-white mb-2">Verifying Payment…</h1>
            <p className="text-vybe-muted text-sm">Please wait while we confirm your payment.</p>
          </>
        )}

        {status === 'success' && (
          <div className="glass-card rounded-2xl p-8">
            <div className="w-16 h-16 rounded-full bg-green-500/15 border border-green-500/30 flex items-center justify-center mx-auto mb-6">
              <CheckCircle size={32} className="text-green-400" />
            </div>
            <h1 className="text-2xl font-black text-white mb-3">Ban Removed!</h1>
            <p className="text-vybe-muted text-sm leading-relaxed mb-8">
              Your ban has been removed. Welcome back to Vybe — please follow our community guidelines to avoid future bans.
            </p>
            <button
              onClick={() => navigate('/')}
              className="w-full py-3.5 rounded-xl btn-purple text-white font-black text-sm"
            >
              Start Vybing
            </button>
          </div>
        )}

        {status === 'error' && (
          <div className="glass-card rounded-2xl p-8">
            <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-6">
              <AlertCircle size={32} className="text-red-400" />
            </div>
            <h1 className="text-2xl font-black text-white mb-3">Verification Failed</h1>
            <p className="text-vybe-muted text-sm leading-relaxed mb-2">{errorMsg}</p>
            <p className="text-vybe-muted text-xs mb-8">
              If you were charged, contact{' '}
              <span className="text-vybe-purple-light">support@vybelivechat.com</span>{' '}
              with your session ID.
            </p>
            <Link to="/" className="block w-full py-3.5 rounded-xl btn-purple text-white font-black text-sm text-center">
              Back to Home
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
