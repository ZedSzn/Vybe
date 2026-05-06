import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { SocketProvider } from './context/SocketContext'
import { LangProvider } from './context/LangContext'
import { useState, useEffect } from 'react'
import axios from 'axios'
import MainPage           from './pages/MainPage'
import AuthPage           from './pages/AuthPage'
import ChatPage           from './pages/ChatPage'
import AdminPage          from './pages/AdminPage'
import AdminLoginPage     from './pages/AdminLoginPage'
import AdminDashboard     from './pages/AdminDashboard'
import TermsPage          from './pages/TermsPage'
import GuidelinesPage     from './pages/GuidelinesPage'
import SquadJoinPage      from './pages/SquadJoinPage'
import PrivacyPage        from './pages/PrivacyPage'
import UnbanSuccessPage   from './pages/UnbanSuccessPage'
import VerifyEmailPage    from './pages/VerifyEmailPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage  from './pages/ResetPasswordPage'
import ProfilePage        from './pages/ProfilePage'
import SettingsPage       from './pages/SettingsPage'
import WalletPage         from './pages/WalletPage'
import CoinsPage          from './pages/CoinsPage'
import SubscriptionPage   from './pages/SubscriptionPage'
import FriendsPage           from './pages/FriendsPage'
import PrivateRoomJoinPage   from './pages/PrivateRoomJoinPage'
import EarnPage              from './pages/EarnPage'
import ScrollToTop           from './components/ScrollToTop'

function MaintenancePage({ message }) {
  return (
    <div style={{ background: '#0a0a0f', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Space Grotesk, sans-serif', padding: '24px' }}>
      <div style={{ textAlign: 'center', maxWidth: 400 }}>
        <div style={{
          width: 72, height: 72, borderRadius: 20, margin: '0 auto 24px',
          background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgba(167,139,250,0.9)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
          </svg>
        </div>
        <h1 style={{ color: '#fff', fontSize: 24, fontWeight: 900, margin: '0 0 12px' }}>Down for maintenance</h1>
        <p style={{ color: '#6b7280', fontSize: 14, lineHeight: 1.6, margin: '0 0 32px' }}>
          {message || "We're making Vybe better. Check back shortly."}
        </p>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 999, background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.25)' }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#a78bfa', display: 'inline-block', animation: 'pulse 2s infinite' }} />
          <span style={{ color: 'rgba(167,139,250,0.8)', fontSize: 13, fontWeight: 600 }}>Back soon</span>
        </div>
        <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }`}</style>
      </div>
    </div>
  )
}

// Admin paths bypass maintenance so you can always get back in
const ADMIN_PATHS = ['/admin-vybe-2024', '/admin-vybe-2024/dashboard']

function AppRoutes() {
  const location = useLocation()
  const [maintenance, setMaintenance]   = useState(false)
  const [maintMessage, setMaintMessage] = useState('')

  useEffect(() => {
    const adminToken = localStorage.getItem('vybe_admin_token') || ''
    axios.get(`/api/settings`, { headers: adminToken ? { 'x-admin-token': adminToken } : {} })
      .then(({ data }) => {
        setMaintenance(data.maintenanceMode || false)
        setMaintMessage(data.maintenanceMessage || '')
      })
      .catch(() => {})
  }, [location.pathname])

  const isAdminPath = ADMIN_PATHS.some(p => location.pathname.startsWith(p))
  if (maintenance && !isAdminPath) {
    return <MaintenancePage message={maintMessage} />
  }

  return (
    <>
    <ScrollToTop />
    <Routes>
      <Route path="/"                           element={<MainPage />} />
      <Route path="/auth"                       element={<AuthPage />} />
      <Route path="/chat"                       element={<ChatPage />} />
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
      <Route path="/settings"                   element={<SettingsPage />} />
      <Route path="/wallet"                     element={<WalletPage />} />
      <Route path="/coins"                      element={<CoinsPage />} />
      <Route path="/subscription"               element={<SubscriptionPage />} />
      <Route path="/friends"                    element={<FriendsPage />} />
      <Route path="/private/:code"              element={<PrivateRoomJoinPage />} />
      <Route path="/earn"                       element={<EarnPage />} />
    </Routes>
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <LangProvider>
      <AuthProvider>
        <SocketProvider>
          <AppRoutes />
        </SocketProvider>
      </AuthProvider>
      </LangProvider>
    </BrowserRouter>
  )
}
