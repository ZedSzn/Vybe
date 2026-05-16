import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { SocketProvider, useSocket } from './context/SocketContext'
import { LangProvider } from './context/LangContext'
import { useState, useEffect, lazy, Suspense, Component } from 'react'
import axios from 'axios'
import { useAuth } from './context/AuthContext'

class ErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { error: null } }
  static getDerivedStateFromError(err) { return { error: err } }
  componentDidCatch(err, info) { console.error('[Vybe] Uncaught error:', err, info) }
  render() {
    if (!this.state.error) return this.props.children
    return (
      <div style={{ minHeight: '100vh', background: '#07090f', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32, fontFamily: 'Space Grotesk, sans-serif' }}>
        <div style={{ maxWidth: 480, width: '100%', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 20, padding: 32 }}>
          <p style={{ color: '#f87171', fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>App Error</p>
          <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 14, lineHeight: 1.6, marginBottom: 20 }}>{this.state.error?.message || 'An unexpected error occurred.'}</p>
          <pre style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, lineHeight: 1.5, overflow: 'auto', marginBottom: 24, maxHeight: 160 }}>{this.state.error?.stack}</pre>
          <button onClick={() => { localStorage.clear(); window.location.reload() }} style={{ background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.4)', color: '#f87171', borderRadius: 12, padding: '10px 20px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
            Clear Cache &amp; Reload
          </button>
        </div>
      </div>
    )
  }
}

// Eager — only the landing page and auth need to render immediately
import MainPage  from './pages/MainPage'
import AuthPage  from './pages/AuthPage'

// Chat is heavy (SimplePeer, socket.io, WebRTC) — lazy-split it
const ChatPage = lazy(() => import('./pages/ChatPage'))

// Lazy — heavy pages split into separate chunks
const AdminPage            = lazy(() => import('./pages/AdminPage'))
const AdminLoginPage       = lazy(() => import('./pages/AdminLoginPage'))
const AdminDashboard       = lazy(() => import('./pages/AdminDashboard'))
const TermsPage            = lazy(() => import('./pages/TermsPage'))
const GuidelinesPage       = lazy(() => import('./pages/GuidelinesPage'))
const PrivacyPage          = lazy(() => import('./pages/PrivacyPage'))
const SquadJoinPage        = lazy(() => import('./pages/SquadJoinPage'))
const UnbanSuccessPage     = lazy(() => import('./pages/UnbanSuccessPage'))
const VerifyEmailPage      = lazy(() => import('./pages/VerifyEmailPage'))
const ForgotPasswordPage   = lazy(() => import('./pages/ForgotPasswordPage'))
const ResetPasswordPage    = lazy(() => import('./pages/ResetPasswordPage'))
const ProfilePage          = lazy(() => import('./pages/ProfilePage'))
const SettingsPage         = lazy(() => import('./pages/SettingsPage'))
const WalletPage           = lazy(() => import('./pages/WalletPage'))
const CoinsPage            = lazy(() => import('./pages/CoinsPage'))
const SubscriptionPage     = lazy(() => import('./pages/SubscriptionPage'))
const FriendsPage          = lazy(() => import('./pages/FriendsPage'))
const EarnPage             = lazy(() => import('./pages/EarnPage'))

import ScrollToTop from './components/ScrollToTop'

function PageLoader() {
  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: '#07090f' }}
    >
      <div className="flex flex-col items-center gap-4">
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center"
          style={{ background: 'rgba(0,212,255,0.12)', border: '1px solid rgba(124,58,237,0.3)' }}
        >
          <svg
            width="24" height="24" viewBox="0 0 24 24" fill="none"
            stroke="rgba(167,139,250,0.9)" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round"
            style={{ animation: 'spin 1s linear infinite' }}
          >
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </svg>
        </div>
        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13, fontWeight: 600 }}>Loading…</p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

function MaintenancePage({ message }) {
  return (
    <div style={{ background: '#0a0a0f', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Space Grotesk, sans-serif', padding: '24px' }}>
      <div style={{ textAlign: 'center', maxWidth: 400 }}>
        <div style={{
          width: 72, height: 72, borderRadius: 20, margin: '0 auto 24px',
          background: 'rgba(0,212,255,0.12)', border: '1px solid rgba(124,58,237,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgba(167,139,250,0.9)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
          </svg>
        </div>
        <h1 style={{ color: '#fff', fontSize: 24, fontWeight: 900, margin: '0 0 12px' }}>Down for maintenance</h1>
        <p style={{ color: '#888899', fontSize: 14, lineHeight: 1.6, margin: '0 0 32px' }}>
          {message || "We're making Vybe better. Check back shortly."}
        </p>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 999, background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(124,58,237,0.25)' }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#a78bfa', display: 'inline-block', animation: 'pulse 2s infinite' }} />
          <span style={{ color: 'rgba(167,139,250,0.8)', fontSize: 13, fontWeight: 600 }}>Back soon</span>
        </div>
        <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }`}</style>
      </div>
    </div>
  )
}

const ADMIN_PATHS = ['/admin-vybe-2024', '/admin-vybe-2024/dashboard']

// ─── Global overlays ──────────────────────────────────────────────────────────
function WarningModal({ message, onDismiss }) {
  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center px-4" style={{ background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(6px)' }}>
      <div className="w-full max-w-sm rounded-2xl p-6 text-center" style={{ background: 'rgba(20,10,10,0.98)', border: '1px solid rgba(239,68,68,0.35)', boxShadow: '0 0 48px rgba(239,68,68,0.18)' }}>
        <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
        </div>
        <p className="text-red-400 text-xs font-black uppercase tracking-widest mb-2">Admin Warning</p>
        <p className="text-white text-sm leading-relaxed mb-6">{message}</p>
        <button onClick={onDismiss} className="w-full py-3 rounded-xl text-white font-black text-sm" style={{ background: 'linear-gradient(135deg,#dc2626,#ef4444)' }}>I Understand</button>
      </div>
    </div>
  )
}

function BanModal({ info, onDismiss }) {
  const expires = info.banExpiresAt ? new Date(info.banExpiresAt).toLocaleString() : null
  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center px-4" style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}>
      <div className="w-full max-w-sm rounded-2xl p-6 text-center" style={{ background: 'rgba(10,0,0,0.98)', border: '1px solid rgba(239,68,68,0.4)', boxShadow: '0 0 60px rgba(239,68,68,0.2)' }}>
        <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.35)' }}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
        </div>
        <p className="text-red-400 text-xs font-black uppercase tracking-widest mb-2">Account Suspended</p>
        <p className="text-white text-sm leading-relaxed mb-2">{info.reason}</p>
        {expires && <p className="text-red-400/60 text-xs mb-5">Expires: {expires}</p>}
        {!expires && info.banType === 'permanent' && <p className="text-red-400/60 text-xs mb-5">This ban is permanent.</p>}
        <button onClick={onDismiss} className="w-full py-3 rounded-xl text-white font-black text-sm" style={{ background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.4)' }}>OK</button>
      </div>
    </div>
  )
}

function AnnouncementToast({ message, onDismiss }) {
  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[998] max-w-md w-full px-4">
      <div className="flex items-start gap-3 px-4 py-3 rounded-2xl shadow-2xl" style={{ background: 'rgba(124,58,237,0.18)', border: '1px solid rgba(124,58,237,0.35)', backdropFilter: 'blur(12px)' }}>
        <svg className="flex-shrink-0 mt-0.5" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 17H2a3 3 0 0 0 3-3V9a7 7 0 0 1 14 0v5a3 3 0 0 0 3 3zm-8.27 4a2 2 0 0 1-3.46 0"/></svg>
        <p className="flex-1 text-white/90 text-sm leading-snug">{message}</p>
        <button onClick={onDismiss} className="text-white/40 hover:text-white/80 transition-colors flex-shrink-0">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
    </div>
  )
}

function OwnProfileRedirect() {
  const { user, loading } = useAuth()
  if (loading) return null
  if (!user) return <Navigate to="/auth" replace />
  return <Navigate to={`/profile/${user.id || user._id}`} replace />
}

function AppRoutes() {
  const location  = useLocation()
  const navigate  = useNavigate()
  const { logout } = useAuth()
  const [maintenance,    setMaintenance]    = useState(false)
  const [maintMessage,   setMaintMessage]   = useState('')
  const [announcement,   setAnnouncement]   = useState('')
  const [announcActive,  setAnnouncActive]  = useState(false)
  const [announcDismissed, setAnnouncDismissed] = useState(false)
  const { socket, pendingWarnings, dismissWarning, pendingAnnouncements, dismissAnnouncement, bannedInfo, clearBanned } = useSocket()

  const checkSettings = () => {
    const adminToken = localStorage.getItem('vybe_admin_token') || ''
    axios.get('/api/settings', { headers: adminToken ? { 'x-admin-token': adminToken } : {} })
      .then(({ data }) => {
        setMaintenance(data.maintenanceMode || false)
        setMaintMessage(data.maintenanceMessage || '')
        setAnnouncement(data.announcement || '')
        setAnnouncActive(data.announcementActive || false)
      })
      .catch(() => {})
  }

  useEffect(() => {
    checkSettings()
    const interval = setInterval(checkSettings, 30000)
    return () => clearInterval(interval)
  }, []) // eslint-disable-line

  // Re-check on every page navigation — catches it within 1 click for active users
  useEffect(() => {
    const adminToken = localStorage.getItem('vybe_admin_token') || ''
    if (adminToken) return
    axios.get('/api/settings')
      .then(({ data }) => {
        setMaintenance(data.maintenanceMode || false)
        setMaintMessage(data.maintenanceMessage || '')
      })
      .catch(() => {})
  }, [location.pathname]) // eslint-disable-line

  // Instant maintenance mode via socket — fires immediately for all connected users
  useEffect(() => {
    if (!socket) return
    const handler = ({ active, message }) => {
      if (localStorage.getItem('vybe_admin_token')) return
      setMaintenance(active)
      if (message) setMaintMessage(message)
    }
    socket.on('maintenance-mode', handler)
    return () => socket.off('maintenance-mode', handler)
  }, [socket])

  // When banned globally, log out and redirect after modal dismissed
  const handleBanDismiss = () => {
    clearBanned()
    logout()
    navigate('/auth', { replace: true })
  }

  const isAdminPath = ADMIN_PATHS.some(p => location.pathname.startsWith(p))
  if (maintenance && !isAdminPath) {
    return <MaintenancePage message={maintMessage} />
  }

  const showStaticBanner = announcActive && announcement && !announcDismissed && !isAdminPath

  return (
    <>
      <ScrollToTop />

      {/* Static announcement banner (from saved settings) */}
      {showStaticBanner && (
        <div className="fixed top-0 left-0 right-0 z-[60] flex items-center justify-between gap-3 px-4 py-2.5 text-sm font-semibold" style={{ background: 'linear-gradient(90deg,rgba(124,58,237,0.92),rgba(0,212,255,0.92))', backdropFilter: 'blur(8px)' }}>
          <span className="text-white/90 text-center flex-1 text-xs">{announcement}</span>
          <button onClick={() => setAnnouncDismissed(true)} className="text-white/50 hover:text-white transition-colors flex-shrink-0">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      )}

      {/* Live broadcast toast (one at a time) */}
      {pendingAnnouncements.length > 0 && (
        <AnnouncementToast message={pendingAnnouncements[0]} onDismiss={dismissAnnouncement} />
      )}

      {/* Admin warning modal */}
      {pendingWarnings.length > 0 && (
        <WarningModal message={pendingWarnings[0]} onDismiss={dismissWarning} />
      )}

      {/* Ban modal — shown on any page when admin bans the user live */}
      {bannedInfo && (
        <BanModal info={bannedInfo} onDismiss={handleBanDismiss} />
      )}

      <Suspense fallback={null}>
        <Routes>
          {/* Eager routes */}
          <Route path="/"     element={<MainPage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/chat" element={<ChatPage />} />

          {/* Lazy routes */}
          <Route path="/admin"                      element={<AdminPage />} />
          <Route path="/admin-vybe-2024"            element={<AdminLoginPage />} />
          <Route path="/admin-vybe-2024/dashboard"  element={<AdminDashboard />} />
          <Route path="/terms"                      element={<TermsPage />} />
          <Route path="/guidelines"                 element={<GuidelinesPage />} />
          <Route path="/privacy"                    element={<PrivacyPage />} />
          <Route path="/duo/:code"                  element={<SquadJoinPage />} />
          <Route path="/unban/success"              element={<UnbanSuccessPage />} />
          <Route path="/verify-email"               element={<VerifyEmailPage />} />
          <Route path="/forgot-password"            element={<ForgotPasswordPage />} />
          <Route path="/reset-password"             element={<ResetPasswordPage />} />
          <Route path="/profile/:id"                element={<ProfilePage />} />
          <Route path="/profile" element={<OwnProfileRedirect />} />
          <Route path="/settings"                   element={<SettingsPage />} />
          <Route path="/wallet"                     element={<WalletPage />} />
          <Route path="/coins"                      element={<CoinsPage />} />
          <Route path="/subscription"               element={<SubscriptionPage />} />
          <Route path="/friends"                    element={<FriendsPage />} />
          <Route path="/earn"                       element={<EarnPage />} />
          <Route path="*" element={<MainPage />} />
        </Routes>
      </Suspense>
    </>
  )
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <LangProvider>
          <AuthProvider>
            <SocketProvider>
              <AppRoutes />
            </SocketProvider>
          </AuthProvider>
        </LangProvider>
      </BrowserRouter>
    </ErrorBoundary>
  )
}
