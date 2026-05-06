import { Link, useNavigate, useLocation } from 'react-router-dom'
import { LogOut, Bell, User, Settings, ChevronDown, Trash2, Wallet, Globe, Users, Crown, Zap, Flame, UserPlus, Medal, AlertTriangle, Megaphone, DollarSign } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../context/LangContext'
import { useState, useEffect, useRef, useCallback } from 'react'
import axios from 'axios'
import { VybeCoin } from './VybeCoin'

const NAV_LINK_DEFS = [
  { key: 'nav_home',      path: '/' },
  { key: 'nav_community', path: '/guidelines' },
  { key: 'nav_safety',    path: '/terms' },
  { key: 'nav_premium',   path: '/subscription' },
  { key: 'nav_faq',       faq: true },
]

const LANGUAGES = [
  { code: 'en', label: 'English',    flag: '🇺🇸' },
  { code: 'es', label: 'Español',    flag: '🇪🇸' },
  { code: 'fr', label: 'Français',   flag: '🇫🇷' },
  { code: 'de', label: 'Deutsch',    flag: '🇩🇪' },
  { code: 'pt', label: 'Português',  flag: '🇧🇷' },
  { code: 'ar', label: 'العربية',    flag: '🇸🇦' },
  { code: 'ko', label: '한국어',      flag: '🇰🇷' },
  { code: 'ja', label: '日本語',      flag: '🇯🇵' },
  { code: 'zh', label: '中文',        flag: '🇨🇳' },
  { code: 'ru', label: 'Русский',    flag: '🇷🇺' },
]

export default function Navbar({ onPremiumClick }) {
  const { user, logout, isAuthenticated } = useAuth()
  const { lang, switchLang, t } = useLang()
  const navigate  = useNavigate()
  const location  = useLocation()

  const [showUserMenu,    setShowUserMenu]    = useState(false)
  const [showNotifs,      setShowNotifs]      = useState(false)
  const [showLangMenu,    setShowLangMenu]    = useState(false)
  const [notifications,   setNotifications]   = useState([])
  const [unreadCount,     setUnreadCount]     = useState(0)
  const [coins,           setCoins]           = useState(user?.coins ?? 0)
  const [pendingRequests, setPendingRequests] = useState(0)

  const selectedLang = LANGUAGES.find(l => l.code === lang) || LANGUAGES[0]

  const userMenuRef = useRef(null)
  const notifsRef   = useRef(null)
  const langMenuRef = useRef(null)

  useEffect(() => { if (user?.coins !== undefined) setCoins(user.coins) }, [user?.coins])

  const fetchNotifs = useCallback(async () => {
    if (!isAuthenticated) return
    try {
      const { data } = await axios.get('/api/notifications')
      setNotifications(data.notifications || [])
      setUnreadCount(data.unreadCount || 0)
    } catch {}
  }, [isAuthenticated])

  const fetchPendingRequests = useCallback(async () => {
    if (!isAuthenticated) return
    try {
      const { data } = await axios.get('/api/friends/requests')
      setPendingRequests((data.requests || []).length)
    } catch {}
  }, [isAuthenticated])

  useEffect(() => {
    fetchNotifs()
    fetchPendingRequests()
    const id = setInterval(() => { fetchNotifs(); fetchPendingRequests() }, 30000)
    return () => clearInterval(id)
  }, [fetchNotifs, fetchPendingRequests])

  useEffect(() => {
    const handler = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setShowUserMenu(false)
      if (notifsRef.current  && !notifsRef.current.contains(e.target))   setShowNotifs(false)
      if (langMenuRef.current && !langMenuRef.current.contains(e.target)) setShowLangMenu(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleMarkAllRead = async () => {
    try {
      await axios.post('/api/notifications/read-all')
      setNotifications((n) => n.map((x) => ({ ...x, read: true })))
      setUnreadCount(0)
    } catch {}
  }

  const handleClearAll = async () => {
    try {
      await axios.delete('/api/notifications')
      setNotifications([])
      setUnreadCount(0)
    } catch {}
  }

  const handleMarkOne = async (id) => {
    try {
      await axios.post(`/api/notifications/${id}/read`)
      setNotifications((n) => n.map((x) => x._id === id ? { ...x, read: true } : x))
      setUnreadCount((c) => Math.max(0, c - 1))
    } catch {}
  }

  const CoinIcon = () => <VybeCoin size={14} />

  const notifIcon = (type) => {
    const map = { friend_request: <UserPlus size={13} />, coin_reward: <Medal size={13} />, streak: <Flame size={13} />, warning: <AlertTriangle size={13} />, system: <Megaphone size={13} /> }
    return <span className="text-vybe-purple-light">{map[type] || <Bell size={13} />}</span>
  }
  const tier = user?.isVip
    ? <span className="flex items-center gap-1"><Crown size={11} /> VIP</span>
    : user?.isPremium
    ? <span className="flex items-center gap-1"><Zap size={11} /> Premium</span>
    : null

  const isActive = (path) => path && location.pathname === path

  const handleNavClick = (link) => {
    setShowUserMenu(false)
    setShowNotifs(false)
    setShowLangMenu(false)
    if (link.faq) {
      if (location.pathname !== '/') {
        navigate('/', { state: { scrollToFaq: true } })
      } else {
        document.getElementById('faq')?.scrollIntoView({ behavior: 'instant' })
      }
      return
    }
    if (link.modal === 'premium') { navigate('/subscription'); return }
    navigate(link.path)
  }

  const LangSelector = () => (
    <div ref={langMenuRef} className="relative">
      <button
        onClick={() => { setShowLangMenu((v) => !v); setShowUserMenu(false); setShowNotifs(false) }}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 text-sm font-medium transition-colors"
      >
        <Globe size={14} />
        <span className="hidden lg:inline">{selectedLang.label}</span>
        <ChevronDown size={11} className={`transition-transform duration-200 ${showLangMenu ? 'rotate-180' : ''}`} />
      </button>
      {showLangMenu && (
        <div className="absolute right-0 top-full mt-2 w-44 rounded-xl overflow-hidden shadow-float animate-fade-in z-50"
          style={{ background: '#101020', border: '1px solid rgba(255,255,255,0.08)' }}>
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => { switchLang(lang.code); setShowLangMenu(false) }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors ${
                selectedLang.code === lang.code
                  ? 'text-white bg-vybe-purple/15'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <span>{lang.flag}</span>
              <span>{lang.label}</span>
              {selectedLang.code === lang.code && (
                <span className="ml-auto text-vybe-purple-light text-xs">✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 h-16 flex items-center px-4 sm:px-6 font-space"
      style={{
        background: 'rgba(8, 8, 22, 0.97)',
        backdropFilter: 'blur(36px) saturate(1.8)',
        borderBottom: '1px solid rgba(255,255,255,0.12)',
        boxShadow: '0 1px 32px rgba(0,0,0,0.6)',
      }}
    >
      {/* Logo */}
      <div className="flex-none">
        <Link to="/" className="inline-flex items-baseline gap-0 hover:opacity-80 transition-opacity">
          <span
            className="text-[27px] font-extrabold tracking-[0.1em]"
            style={{
              background: 'linear-gradient(135deg, #60a5fa 0%, #818cf8 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >VY</span>
          <span className="text-[27px] font-extrabold tracking-[0.1em] text-white">BE</span>
        </Link>
      </div>

      {/* Center nav links — desktop only */}
      <div className="hidden lg:flex items-center gap-1 absolute left-1/2 -translate-x-1/2">
        {NAV_LINK_DEFS.map((link) => {
          const active = isActive(link.path)
          return (
            <button
              key={link.key}
              onClick={() => handleNavClick(link)}
              className={`relative px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
                active ? 'text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {t(link.key)}
              {active && (
                <span
                  className="absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 rounded-full"
                  style={{ width: '70%', background: 'linear-gradient(90deg,#3b82f6,#a855f7)' }}
                />
              )}
            </button>
          )
        })}
      </div>

      {/* Right section */}
      <div className="flex-1 flex items-center justify-end gap-2 sm:gap-2.5">
        {isAuthenticated ? (
          <>
            {/* Coin balance — desktop only */}
            <Link
              to="/wallet"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-yellow-500/10 border border-yellow-500/25 hover:bg-yellow-500/20 transition-colors"
            >
              <CoinIcon />
              <span className="text-yellow-300 text-xs font-black">{coins.toLocaleString()}</span>
            </Link>

            {/* Buy Coins — desktop only */}
            <Link
              to="/wallet?tab=buy"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-extrabold text-white transition-all"
              style={{ background: 'linear-gradient(135deg,#1b62f5,#4b88f7)', boxShadow: '0 0 14px rgba(27,98,245,0.35)' }}
            >
              {t('buy_coins')}
            </Link>

            {/* Cash Out — always visible */}
            <Link
              to="/wallet?tab=cashout"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all"
              style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.28)', color: 'rgb(52,211,153)' }}
            >
              <DollarSign size={13} /> Cash Out
            </Link>

            {/* Language selector */}
            <LangSelector />

            {/* Notification bell */}
            <div ref={notifsRef} className="relative">
              <button
                onClick={() => { setShowNotifs((v) => !v); setShowUserMenu(false) }}
                className="relative w-9 h-9 flex items-center justify-center rounded-xl text-gray-500 hover:text-white hover:bg-white/5 transition-all"
              >
                <Bell size={17} />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 bg-vybe-purple rounded-full text-[9px] flex items-center justify-center font-black text-white px-0.5">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {showNotifs && (
                <div className="absolute right-0 top-full mt-2 w-80 rounded-2xl overflow-hidden shadow-card animate-fade-in z-50"
                  style={{ background: '#101020', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
                    <h3 className="text-sm font-black text-white">Notifications</h3>
                    <div className="flex items-center gap-3">
                      {unreadCount > 0 && (
                        <button onClick={handleMarkAllRead} className="text-[10px] text-vybe-purple-light hover:underline font-semibold">
                          Mark all read
                        </button>
                      )}
                      {notifications.length > 0 && (
                        <button onClick={handleClearAll} className="text-gray-600 hover:text-red-400 transition-colors">
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="py-10 text-center">
                        <Bell size={24} className="text-gray-600 mx-auto mb-2 opacity-40" />
                        <p className="text-gray-600 text-xs">No notifications yet</p>
                      </div>
                    ) : notifications.map((n) => (
                      <div key={n._id} onClick={() => !n.read && handleMarkOne(n._id)}
                        className={`flex items-start gap-3 px-4 py-3 border-b border-white/[0.04] last:border-0 cursor-pointer hover:bg-white/3 transition-colors ${!n.read ? 'bg-vybe-purple/5' : ''}`}>
                        <span className="text-base flex-shrink-0 mt-0.5">{notifIcon(n.type)}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-xs font-bold">{n.title}</p>
                          <p className="text-gray-600 text-[11px] leading-relaxed mt-0.5 line-clamp-2">{n.message}</p>
                          <p className="text-gray-700 text-[10px] mt-1">{new Date(n.createdAt).toLocaleDateString()}</p>
                        </div>
                        {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-vybe-purple flex-shrink-0 mt-1.5" />}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Avatar + dropdown */}
            <div ref={userMenuRef} className="relative">
              <button
                onClick={() => { setShowUserMenu((v) => !v); setShowNotifs(false) }}
                className="flex items-center gap-1.5 hover:opacity-80 transition-opacity"
              >
                {user?.avatar ? (
                  <img src={user.avatar} alt="" className="w-8 h-8 rounded-full object-cover border border-vybe-purple/40" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-vybe-purple to-blue-900 flex items-center justify-center text-white text-sm font-black border border-vybe-purple/40">
                    {user?.username?.[0]?.toUpperCase() || 'U'}
                  </div>
                )}
                <ChevronDown size={11} className={`text-gray-600 transition-transform hidden sm:block ${showUserMenu ? 'rotate-180' : ''}`} />
              </button>

              {showUserMenu && (
                <div className="absolute right-0 top-full mt-2 w-52 rounded-2xl overflow-hidden shadow-card animate-fade-in z-50"
                  style={{ background: '#101020', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div className="px-4 py-3 border-b border-white/5 space-y-2">
                    <div className="flex items-center gap-2.5">
                      {user?.avatar ? (
                        <img src={user.avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-vybe-purple to-blue-900 flex items-center justify-center text-white text-sm font-black">
                          {user?.username?.[0]?.toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-white truncate">{user?.username}</p>
                        <p className="text-[10px] text-gray-600">{tier || 'Free'}</p>
                      </div>
                    </div>
                    <Link to="/wallet" onClick={() => setShowUserMenu(false)}
                      className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-yellow-500/10 border border-yellow-500/20 hover:bg-yellow-500/20 transition-colors">
                      <div className="flex items-center gap-1.5">
                        <CoinIcon />
                        <span className="text-yellow-300 text-xs font-black">{coins.toLocaleString()} {t('coins')}</span>
                      </div>
                      <span className="text-yellow-400/50 text-[10px] ml-2">Wallet →</span>
                    </Link>
                    {(user?.loginStreak ?? 0) > 0 && (
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-orange-500/10 border border-orange-500/20">
                        <Flame size={13} className="text-orange-400" />
                        <span className="text-orange-300 text-[11px] font-bold">{user.loginStreak}-day streak</span>
                      </div>
                    )}
                  </div>

                  <Link to={`/profile/${user?.id || user?._id}`} onClick={() => setShowUserMenu(false)}
                    className="w-full px-4 py-2.5 text-sm text-gray-500 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-2">
                    <User size={13} /> {t('profile')}
                  </Link>
                  <Link to="/friends" onClick={() => setShowUserMenu(false)}
                    className="w-full px-4 py-2.5 text-sm text-gray-500 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-2">
                    <Users size={13} />
                    Friends
                    {pendingRequests > 0 && (
                      <span className="ml-auto min-w-[18px] h-[18px] px-1 rounded-full bg-purple-600 text-[9px] font-black flex items-center justify-center text-white">
                        {pendingRequests > 9 ? '9+' : pendingRequests}
                      </span>
                    )}
                  </Link>
                  <Link to="/wallet" onClick={() => setShowUserMenu(false)}
                    className="w-full px-4 py-2.5 text-sm text-gray-500 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-2">
                    <Wallet size={13} /> {t('wallet')}
                  </Link>
                  <Link to="/settings" onClick={() => setShowUserMenu(false)}
                    className="w-full px-4 py-2.5 text-sm text-gray-500 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-2">
                    <Settings size={13} /> {t('settings')}
                  </Link>
                  {/* Mobile-only nav links — hidden on desktop where they appear in the top nav */}
                  <div className="lg:hidden border-t border-white/5">
                    {NAV_LINK_DEFS.map((link) => (
                      <button
                        key={link.key}
                        onClick={() => handleNavClick(link)}
                        className="w-full px-4 py-2.5 text-left text-sm text-gray-500 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-2"
                      >
                        {t(link.key)}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => { logout(); navigate('/'); setShowUserMenu(false) }}
                    className="w-full px-4 py-2.5 text-left text-sm text-red-400/70 hover:text-red-400 hover:bg-red-500/5 transition-colors flex items-center gap-2 border-t border-white/5"
                  >
                    <LogOut size={13} /> {t('logout')}
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            {/* Language selector */}
            <LangSelector />

            {/* Auth buttons */}
            <Link to="/auth"
              className="px-4 py-1.5 rounded-lg text-gray-300 border border-white/10 hover:text-white hover:border-white/20 text-sm font-semibold transition-all">
              {t('login')}
            </Link>
            <Link to="/auth?tab=signup"
              className="px-4 py-1.5 rounded-lg text-white text-sm font-black transition-all hover:opacity-90"
              style={{ background: 'linear-gradient(135deg,#2065f5,#7c3aed)', boxShadow: '0 0 16px rgba(124,58,237,0.35)' }}>
              {t('signup')}
            </Link>
          </>
        )}
      </div>
    </nav>
  )
}
