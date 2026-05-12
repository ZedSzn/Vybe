import { useState } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Eye, EyeOff, ArrowLeft, Loader2, Mail } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import Footer from '../components/Footer'

export default function AuthPage() {
  const [searchParams]              = useSearchParams()
  const [tab, setTab]               = useState(searchParams.get('tab') === 'signup' ? 'signup' : 'login')
  const [email, setEmail]           = useState('')
  const [password, setPassword]     = useState('')
  const [username, setUsername]     = useState('')
  const [showPass, setShowPass]     = useState(false)
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState('')
  const [verifyBanner, setVerifyBanner] = useState(false)
  const [gender, setGender]             = useState('')
  // Pre-fill referral code from URL (?ref=CODE)
  const refCode = searchParams.get('ref') || ''

  const { login, register } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (tab === 'login') {
        await login(email, password)
        navigate('/')
      } else {
        if (!username.trim()) { setError('Username is required'); setLoading(false); return }
        if (!gender) { setError('Please select your gender'); setLoading(false); return }
        await register(username, email, password, refCode, gender)
        // Navigate immediately — verification is optional (soft)
        navigate('/')
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen animated-bg font-space flex flex-col">
      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[480px] h-[480px] bg-vybe-purple/12 rounded-full blur-3xl" />
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-10">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="w-full max-w-[420px] relative z-10"
      >
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-vybe-muted hover:text-white transition-colors mb-8 text-sm font-medium"
        >
          <ArrowLeft size={15} />
          Back to Vybe
        </Link>

        {verifyBanner && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card rounded-2xl p-6 mb-5 border border-green-500/30 text-center"
          >
            <div className="w-12 h-12 rounded-full bg-green-500/15 border border-green-500/30 flex items-center justify-center mx-auto mb-4">
              <Mail size={22} className="text-green-400" />
            </div>
            <h2 className="text-white font-black text-lg mb-2">Check your email!</h2>
            <p className="text-vybe-muted text-sm leading-relaxed">
              We sent a verification link to <span className="text-white font-semibold">{email}</span>.
              Please verify your email to start Vybing.
            </p>
            <button
              onClick={() => navigate('/')}
              className="mt-5 w-full py-3 rounded-xl btn-purple text-white font-black text-sm"
            >
              Got it — Go to Vybe
            </button>
          </motion.div>
        )}

        {!verifyBanner && (
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="p-7 pb-0">
            {/* Brand */}
            <div className="text-center mb-7">
              <div className="text-3xl font-black tracking-widest mb-1">
                <span className="text-purple-gradient">VY</span>
                <span className="text-white">BE</span>
              </div>
              <p className="text-vybe-muted text-[13px]">Meet your next Vybe.</p>
            </div>

            {/* Tab toggle */}
            <div className="flex bg-vybe-card2 rounded-xl p-1 mb-6">
              {['login', 'signup'].map((t) => (
                <button
                  key={t}
                  onClick={() => { setTab(t); setError('') }}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                    tab === t
                      ? 'bg-vybe-purple text-white shadow-purple-sm'
                      : 'text-vybe-muted hover:text-white'
                  }`}
                >
                  {t === 'login' ? 'Sign In' : 'Sign Up'}
                </button>
              ))}
            </div>
          </div>

          <div className="p-7 pt-0">
            <AnimatePresence mode="wait">
              <motion.form
                key={tab}
                initial={{ opacity: 0, x: tab === 'login' ? -16 : 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: tab === 'login' ? 16 : -16 }}
                transition={{ duration: 0.2 }}
                onSubmit={handleSubmit}
                className="space-y-4"
              >
                {tab === 'signup' && (
                  <>
                    <div>
                      <label className="block text-[10px] font-bold text-vybe-muted uppercase tracking-widest mb-1.5">
                        Username
                      </label>
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="cooluser123"
                        required
                        className="w-full px-4 py-3 bg-vybe-card2 border border-vybe-border rounded-xl text-white placeholder-vybe-muted text-sm focus:border-vybe-purple focus:shadow-purple-sm transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-vybe-muted uppercase tracking-widest mb-1.5">
                        I am a <span className="text-red-400">*</span>
                      </label>
                      <div className="flex gap-3">
                        {[{ value: 'male', label: '♂ Male' }, { value: 'female', label: '♀ Female' }].map(({ value, label }) => (
                          <button
                            key={value}
                            type="button"
                            onClick={() => setGender(value)}
                            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all border ${
                              gender === value
                                ? 'bg-vybe-purple text-white border-vybe-purple'
                                : 'bg-vybe-card2 text-vybe-muted border-vybe-border hover:text-white'
                            }`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-[10px] font-bold text-vybe-muted uppercase tracking-widest mb-1.5">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="w-full px-4 py-3 bg-vybe-card2 border border-vybe-border rounded-xl text-white placeholder-vybe-muted text-sm focus:border-vybe-purple focus:shadow-purple-sm transition-all"
                  />
                </div>

                <div className="relative">
                  <label className="block text-[10px] font-bold text-vybe-muted uppercase tracking-widest mb-1.5">
                    Password
                  </label>
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                    className="w-full px-4 py-3 pr-11 bg-vybe-card2 border border-vybe-border rounded-xl text-white placeholder-vybe-muted text-sm focus:border-vybe-purple focus:shadow-purple-sm transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 bottom-3 text-vybe-muted hover:text-white transition-colors"
                  >
                    {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>

                <AnimatePresence>
                  {error && (
                    <motion.p
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="text-red-400 text-[13px] bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3"
                    >
                      {error}
                    </motion.p>
                  )}
                </AnimatePresence>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-xl btn-purple text-white font-bold text-sm mt-1 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      {tab === 'login' ? 'Signing in…' : 'Creating account…'}
                    </>
                  ) : tab === 'login' ? (
                    'Sign In'
                  ) : (
                    'Create Account'
                  )}
                </button>

                {tab === 'login' && (
                  <p className="text-center text-vybe-muted text-[12px]">
                    <Link to="/forgot-password" className="text-vybe-purple-light hover:underline">
                      Forgot password?
                    </Link>
                  </p>
                )}

                {/* Divider */}
                <div className="relative my-1">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-vybe-border" />
                  </div>
                  <div className="relative flex justify-center">
                    <span className="px-3 text-[11px] text-vybe-muted" style={{ background: 'rgba(13,13,24,0.85)' }}>
                      or
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => navigate('/chat', { state: { mode: 'solo', filterGender: null, filterCountry: '' } })}
                  className="w-full py-3 rounded-xl border border-vybe-border text-vybe-muted hover:text-white hover:border-vybe-purple/40 transition-all text-sm font-medium"
                >
                  Continue as Guest
                </button>
              </motion.form>
            </AnimatePresence>

            <p className="text-center text-vybe-muted text-[11px] mt-5 leading-relaxed">
              By continuing you agree to our{' '}
              <Link to="/terms" className="text-vybe-purple-light hover:underline">Terms</Link> and{' '}
              <Link to="/privacy" className="text-vybe-purple-light hover:underline">Privacy Policy</Link>.
              Must be 18+ to use Vybe.
            </p>
          </div>
        </div>
        )}
      </motion.div>
      </div>
      <Footer />
    </div>
  )
}
