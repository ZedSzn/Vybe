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
        navigate('/')
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = {
    width: '100%', padding: '12px 16px', borderRadius: 12,
    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
    color: 'white', fontSize: 14, fontWeight: 500, outline: 'none',
    transition: 'border-color 0.2s',
  }
  const labelStyle = {
    display: 'block', fontSize: 10, fontWeight: 500,
    letterSpacing: '0.12em', textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.62)', marginBottom: 6,
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', display: 'flex', flexDirection: 'column', fontFamily: 'inherit' }}>

      {/* Ambient cyan glow */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 0 }}>
        <div style={{
          position: 'absolute', top: '20%', left: '50%', transform: 'translate(-50%,-50%)',
          width: 600, height: 600, borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(0,212,255,0.07) 0%, transparent 70%)',
        }} />
        <div style={{
          position: 'absolute', bottom: '10%', right: '15%',
          width: 320, height: 320, borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(0,184,224,0.05) 0%, transparent 70%)',
        }} />
      </div>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 16px', position: 'relative', zIndex: 1 }}>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
          style={{ width: '100%', maxWidth: 420 }}
        >
          {/* Back link */}
          <Link
            to="/"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: 'rgba(255,255,255,0.35)', fontSize: 13, fontWeight: 600, textDecoration: 'none', marginBottom: 32, transition: 'color 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.color = 'white'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.35)'}
          >
            <ArrowLeft size={15} />
            Back to Vybe
          </Link>

          {/* Verify banner */}
          {verifyBanner && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                background: 'rgba(20,22,32,0.92)',
                border: '1px solid rgba(0,212,255,0.25)', borderRadius: 20,
                padding: 28, marginBottom: 20, textAlign: 'center',
              }}
            >
              <div style={{
                width: 48, height: 48, borderRadius: '50%', margin: '0 auto 16px',
                background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Mail size={22} style={{ color: '#00D4FF' }} />
              </div>
              <h2 style={{ color: 'white', fontWeight: 900, fontSize: 18, marginBottom: 8 }}>Check your email!</h2>
              <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13, lineHeight: 1.6 }}>
                We sent a verification link to <span style={{ color: 'white', fontWeight: 600 }}>{email}</span>.
                Please verify your email to start Vybing.
              </p>
              <button
                onClick={() => navigate('/')}
                style={{
                  marginTop: 20, width: '100%', padding: '13px 0', borderRadius: 14, border: 'none',
                  background: 'linear-gradient(135deg, #00B8E0 0%, #00D4FF 50%, #00B8E0 100%)',
                  boxShadow: '0 4px 24px rgba(0,212,255,0.35)',
                  color: 'white', fontWeight: 800, fontSize: 14, cursor: 'pointer',
                }}
              >
                Got it — Go to Vybe
              </button>
            </motion.div>
          )}

          {/* Main card */}
          {!verifyBanner && (
            <div style={{
              background: '#12141e',
              border: '1px solid rgba(255,255,255,0.08)', borderRadius: 24,
              overflow: 'hidden',
              boxShadow: '0 24px 64px rgba(0,0,0,0.5), 0 0 0 1px rgba(0,212,255,0.04) inset',
            }}>
              <div style={{ padding: '28px 28px 0' }}>
                {/* Brand */}
                <div style={{ textAlign: 'center', marginBottom: 24 }}>
                  <div style={{ fontSize: 30, fontWeight: 900, letterSpacing: '0.2em', marginBottom: 4 }}>
                    <span style={{ background: 'linear-gradient(120deg,#00D4FF 0%,#00B8E0 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>VY</span>
                    <span style={{ color: 'white' }}>BE</span>
                  </div>
                  <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>Meet your next Vybe.</p>
                </div>

                {/* Tab toggle */}
                <div style={{ display: 'flex', background: 'rgba(255,255,255,0.04)', borderRadius: 14, padding: 4, marginBottom: 24 }}>
                  {['login', 'signup'].map((t) => (
                    <button
                      key={t}
                      onClick={() => { setTab(t); setError('') }}
                      style={{
                        flex: 1, padding: '10px 0', borderRadius: 10, fontSize: 13, fontWeight: 700, letterSpacing: '0.02em',
                        border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                        ...(tab === t
                          ? { background: '#00D4FF', color: '#0a0a0f', boxShadow: '0 2px 12px rgba(0,212,255,0.4)' }
                          : { background: 'transparent', color: 'rgba(255,255,255,0.35)' }),
                      }}
                    >
                      {t === 'login' ? 'Sign In' : 'Sign Up'}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ padding: '0 28px 28px' }}>
                <AnimatePresence mode="wait">
                  <motion.form
                    key={tab}
                    initial={{ opacity: 0, x: tab === 'login' ? -16 : 16 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: tab === 'login' ? 16 : -16 }}
                    transition={{ duration: 0.2 }}
                    onSubmit={handleSubmit}
                    style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
                  >
                    {tab === 'signup' && (
                      <>
                        <div>
                          <label style={labelStyle}>Username</label>
                          <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="cooluser123"
                            required
                            style={inputStyle}
                            onFocus={e => e.target.style.borderColor = 'rgba(0,212,255,0.5)'}
                            onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
                          />
                        </div>
                        <div>
                          <label style={labelStyle}>I am a <span style={{ color: '#f87171' }}>*</span></label>
                          <div style={{ display: 'flex', gap: 10 }}>
                            {[{ value: 'male', label: 'Male' }, { value: 'female', label: 'Female' }].map(({ value, label }) => (
                              <button
                                key={value}
                                type="button"
                                onClick={() => setGender(value)}
                                style={{
                                  flex: 1, padding: '10px 0', borderRadius: 12, fontSize: 13, fontWeight: 700, letterSpacing: '0.02em',
                                  border: '1px solid', cursor: 'pointer', transition: 'all 0.2s',
                                  ...(gender === value
                                    ? { background: 'rgba(0,212,255,0.15)', borderColor: 'rgba(0,212,255,0.5)', color: '#00D4FF' }
                                    : { background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)' }),
                                }}
                              >
                                {label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </>
                    )}

                    <div>
                      <label style={labelStyle}>Email</label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        required
                        style={inputStyle}
                        onFocus={e => e.target.style.borderColor = 'rgba(0,212,255,0.5)'}
                        onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
                      />
                    </div>

                    <div style={{ position: 'relative' }}>
                      <label style={labelStyle}>Password</label>
                      <input
                        type={showPass ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        minLength={6}
                        style={{ ...inputStyle, paddingRight: 44 }}
                        onFocus={e => e.target.style.borderColor = 'rgba(0,212,255,0.5)'}
                        onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPass(!showPass)}
                        style={{ position: 'absolute', right: 14, bottom: 13, color: 'rgba(255,255,255,0.3)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
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
                          style={{ color: '#f87171', fontSize: 13, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 12, padding: '12px 16px', margin: 0 }}
                        >
                          {error}
                        </motion.p>
                      )}
                    </AnimatePresence>

                    <motion.button
                      type="submit"
                      disabled={loading}
                      whileHover={{ scale: loading ? 1 : 1.012 }}
                      whileTap={{ scale: loading ? 1 : 0.985 }}
                      style={{
                        width: '100%', padding: '14px 0', borderRadius: 14, border: 'none',
                        background: 'linear-gradient(135deg, #00B8E0 0%, #00D4FF 50%, #00B8E0 100%)',
                        boxShadow: '0 4px 24px rgba(0,212,255,0.35), 0 1px 0 rgba(255,255,255,0.12) inset',
                        color: '#0a0a0f', fontWeight: 600, fontSize: 14, letterSpacing: '0.02em', cursor: loading ? 'not-allowed' : 'pointer',
                        opacity: loading ? 0.65 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      }}
                    >
                      {loading ? (
                        <><Loader2 size={15} className="animate-spin" />{tab === 'login' ? 'Signing in…' : 'Creating account…'}</>
                      ) : tab === 'login' ? 'Sign In' : 'Create Account'}
                    </motion.button>

                    {tab === 'login' && (
                      <p style={{ textAlign: 'center', fontSize: 12, margin: 0 }}>
                        <Link to="/forgot-password" style={{ color: 'rgba(0,212,255,0.7)', textDecoration: 'none' }}
                          onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                          onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
                        >
                          Forgot password?
                        </Link>
                      </p>
                    )}

                    {/* Divider — two line segments either side of "or", no mask */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '2px 0' }}>
                      <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.07)' }} />
                      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>or</span>
                      <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.07)' }} />
                    </div>

                    <button
                      type="button"
                      onClick={() => navigate('/chat', { state: { mode: 'solo', filterGender: null, filterCountry: '' } })}
                      style={{
                        width: '100%', padding: '13px 0', borderRadius: 14, fontSize: 13, fontWeight: 600, letterSpacing: '0.02em', cursor: 'pointer',
                        background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                        color: 'rgba(255,255,255,0.4)', transition: 'all 0.2s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(0,212,255,0.25)'; e.currentTarget.style.color = 'rgba(255,255,255,0.7)' }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = 'rgba(255,255,255,0.4)' }}
                    >
                      Continue as Guest
                    </button>
                  </motion.form>
                </AnimatePresence>

                <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.22)', fontSize: 11, marginTop: 20, lineHeight: 1.6 }}>
                  By continuing you agree to our{' '}
                  <Link to="/terms" style={{ color: 'rgba(0,212,255,0.6)', textDecoration: 'none' }}>Terms</Link> and{' '}
                  <Link to="/privacy" style={{ color: 'rgba(0,212,255,0.6)', textDecoration: 'none' }}>Privacy Policy</Link>.
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
