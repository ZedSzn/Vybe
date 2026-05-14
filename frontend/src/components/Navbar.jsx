import { Link, useNavigate, useLocation } from 'react-router-dom'
import { LogOut, Bell, User, Settings, ChevronDown, Trash2, Wallet, Users, Crown, Zap, UserPlus, Medal, AlertTriangle, Megaphone, DollarSign, Flame } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useSocket } from '../context/SocketContext'
import { useLang } from '../context/LangContext' // t() still used for auth button labels
import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios'
import { VybeCoin } from './VybeCoin'
import EmptyStateIllustration from './EmptyStateIllustration'

const NAV_LINK_DEFS = [
  { key: 'nav_home',      path: '/' },
  { key: 'nav_community', path: '/guidelines' },
  { key: 'nav_safety',    path: '/terms' },
  { key: 'nav_premium',   path: '/subscription' },
  { key: 'nav_faq',       faq: true },
]


export default function Navbar({ onPremiumClick }) {
  const { user, logout, isAuthenticated } = useAuth()
  const { onlineCount } = useSocket()
  const { t } = useLang()
  const navigate  = useNavigate()
  const location  = useLocation()

  const [showUserMenu,    setShowUserMenu]    = useState(false)
  const [showNotifs,      setShowNotifs]      = useState(false)
  const [notifications,   setNotifications]   = useState([])
  const [unreadCount,     setUnreadCount]     = useState(0)
  const [coins,           setCoins]           = useState(user?.coins ?? 0)
  const [pendingRequests, setPendingRequests] = useState(0)

  const userMenuRef = useRef(null)
  const notifsRef   = useRef(null)

  useEffect(() => { if (user?.coins !== undefined) setCoins(user.coins) }, [user?.coins])

  const fetchCoins = useCallback(async () => {
    if (!isAuthenticated) return
    try {
      const { data } = await axios.get('/api/me/balance')
      if (data.coins !== undefined) setCoins(data.coins)
    } catch {}
  }, [isAuthenticated])

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
    fetchCoins()
    const id = setInterval(() => { fetchNotifs(); fetchPendingRequests(); fetchCoins() }, 15000)
    return () => clearInterval(id)
  }, [fetchNotifs, fetchPendingRequests, fetchCoins])

  useEffect(() => {
    const handler = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setShowUserMenu(false)
      if (notifsRef.current  && !notifsRef.current.contains(e.target))   setShowNotifs(false)
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
    return <span className="text-cyan-400-light">{map[type] || <Bell size={13} />}</span>
  }
  const tier = user?.isVip
    ? <span className="flex items-center gap-1"><Crown size={11} /> VIP</span>
    : user?.isPremium
    ? <span className="flex items-center gap-1"><Zap size={11} /> Membership</span>
    : null

  const isActive = (path) => path && location.pathname === path

  const handleNavClick = (link) => {
    setShowUserMenu(false)
    setShowNotifs(false)
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

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 h-16 flex items-center px-4 sm:px-6 font-space"
      style={{
        background: '#0a0a0f',
        backdropFilter: 'blur(20px) saturate(1.6)',
        borderBottom: '1px solid rgba(0,212,255,0.07)',
      }}
    >
      {/* Logo */}
      <div className="flex-none">
        <Link to="/" className="inline-flex items-baseline gap-0 hover:opacity-80 transition-opacity">
          <span
            className="text-[32px] font-extrabold tracking-[0.08em]"
            style={{
              background: 'linear-gradient(135deg, #00B8E0 0%, #7C3AED 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >VY</span>
          <span className="text-[32px] font-extrabold tracking-[0.06em] text-white">BE</span>
        </Link>
      </div>

      {/* Center nav links — desktop only */}
      <div className="hidden lg:flex items-center gap-1 absolute left-1/2 -translate-x-1/2">
        {NAV_LINK_DEFS.map((link) => {
          const active = isActive(link.path)
          return (
            <motion.button
              key={link.key}
              onClick={() => handleNavClick(link)}
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 500, damping: 28 }}
              className={`nav-link-underline${active ? ' active' : ''} relative px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
                active ? 'text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              {t(link.key)}
            </motion.button>
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
            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.95 }} transition={{ type: 'spring', stiffness: 500, damping: 25 }} className="hidden sm:block">
              <Link
                to="/wallet?tab=buy"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-extrabold text-white transition-all"
                style={{ background: 'linear-gradient(135deg,#00D4FF,#00B8E0)', boxShadow: '0 0 14px rgba(0,212,255,0.35)' }}
              >
                {t('buy_coins')}
              </Link>
            </motion.div>

            {/* Cash Out — hidden on mobile to prevent overflow */}
            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.95 }} transition={{ type: 'spring', stiffness: 500, damping: 25 }} className="hidden sm:block">
              <Link
                to="/wallet?tab=cashout"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all"
                style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.28)', color: 'rgb(52,211,153)' }}
              >
                <DollarSign size={13} /> Cash Out
              </Link>
            </motion.div>

            {/* Coin balance — mobile only */}
            <Link
              to="/wallet"
              className="flex sm:hidden items-center gap-1 px-2.5 py-1 rounded-full"
              style={{ background: 'rgba(234,179,8,0.12)', border: '1px solid rgba(234,179,8,0.22)' }}
            >
              <CoinIcon />
              <span className="text-yellow-300 text-[11px] font-black">{coins.toLocaleString()}</span>
            </Link>

            {/* Buy Coins — mobile only */}
            <Link
              to="/wallet?tab=buy"
              className="flex sm:hidden items-center px-2.5 py-1 rounded-lg text-[11px] font-extrabold text-white"
              style={{ background: 'linear-gradient(135deg,#00D4FF,#00B8E0)', boxShadow: '0 0 14px rgba(0,212,255,0.35)' }}
            >
              Buy Coins
            </Link>

            {/* Notification bell */}
            <div ref={notifsRef} className="relative">
              <motion.button
                onClick={() => { setShowNotifs((v) => !v); setShowUserMenu(false) }}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                className="relative w-9 h-9 flex items-center justify-center rounded-xl text-gray-500 hover:text-white hover:bg-white/5 transition-colors"
              >
                <Bell size={17} />
                <AnimatePresence>
                  {unreadCount > 0 && (
                    <motion.span
                      key="badge"
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ type: 'spring', stiffness: 600, damping: 20 }}
                      className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 bg-cyan-400 rounded-full text-[9px] flex items-center justify-center font-black text-white px-0.5"
                    >
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>

              <AnimatePresence>
                {showNotifs && (
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.97 }}
                    transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
                    className="absolute right-0 top-full mt-2 w-80 rounded-2xl overflow-hidden shadow-card z-50"
                    style={{ background: '#111120', border: '1px solid rgba(255,255,255,0.08)' }}
                  >
                    <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
                      <h3 className="text-sm font-black text-white">Notifications</h3>
                      <div className="flex items-center gap-3">
                        {unreadCount > 0 && (
                          <button onClick={handleMarkAllRead} className="text-[10px] text-cyan-400-light hover:underline font-semibold">
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
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="py-6 flex flex-col items-center text-center px-4"
                        >
                          <EmptyStateIllustration variant="notifications" size={80} />
                          <p className="text-white/70 text-xs font-semibold mt-1">All caught up!</p>
                          <p className="text-gray-600 text-[11px] mt-0.5">You have no new notifications</p>
                        </motion.div>
                      ) : notifications.map((n) => (
                        <div key={n._id} onClick={() => !n.read && handleMarkOne(n._id)}
                          className={`flex items-start gap-3 px-4 py-3 border-b border-white/[0.04] last:border-0 cursor-pointer hover:bg-white/3 transition-colors ${!n.read ? 'bg-cyan-400/5' : ''}`}>
                          <span className="text-base flex-shrink-0 mt-0.5">{notifIcon(n.type)}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-xs font-bold">{n.title}</p>
                            <p className="text-gray-600 text-[11px] leading-relaxed mt-0.5 line-clamp-2">{n.message}</p>
                            <p className="text-gray-700 text-[10px] mt-1">{new Date(n.createdAt).toLocaleDateString()}</p>
                          </div>
                          {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 flex-shrink-0 mt-1.5" />}
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Avatar + dropdown */}
            <div ref={userMenuRef} className="relative">
              <motion.button
                onClick={() => { setShowUserMenu((v) => !v); setShowNotifs(false) }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.93 }}
                transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                className="flex items-center gap-1.5"
              >
                {user?.avatar ? (
                  <img src={user.avatar} alt="" className="w-8 h-8 rounded-full object-cover border border-cyan-400/40" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-blue-900 flex items-center justify-center text-white text-sm font-black border border-cyan-400/40">
                    {user?.username?.[0]?.toUpperCase() || 'U'}
                  </div>
                )}
                <ChevronDown size={11} className={`text-gray-600 transition-transform hidden sm:block ${showUserMenu ? 'rotate-180' : ''}`} />
              </motion.button>

              <AnimatePresence>
              {showUserMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.97, transition: { duration: 0.1 } }}
                  transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                  className="absolute right-0 top-full mt-2 w-52 rounded-2xl overflow-hidden shadow-card z-50"
                  style={{ background: '#111120', border: '1px solid rgba(255,255,255,0.08)' }}>
                  {/* Profile header */}
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.04, duration: 0.18 }}
                    className="px-4 py-3 border-b border-white/5 space-y-2"
                  >
                    <div className="flex items-center gap-2.5">
                      {user?.avatar ? (
                        <img src={user.avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-blue-900 flex items-center justify-center text-white text-sm font-black">
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
                  </motion.div>

                  {/* Staggered menu items */}
                  {[
                    { to: `/profile/${user?.id || user?._id}`, icon: <User size={13} />, label: t('profile'), extra: null },
                    { to: '/friends', icon: <Users size={13} />, label: 'Friends', extra: pendingRequests > 0 ? (
                      <span className="ml-auto min-w-[18px] h-[18px] px-1 rounded-full bg-cyan-500 text-[9px] font-black flex items-center justify-center text-white">
                        {pendingRequests > 9 ? '9+' : pendingRequests}
                      </span>
                    ) : null },
                    { to: '/wallet', icon: <Wallet size={13} />, label: t('wallet'), extra: null },
                    { to: '/settings', icon: <Settings size={13} />, label: t('settings'), extra: null },
                  ].map((item, i) => (
                    <motion.div
                      key={item.to}
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.06 + i * 0.04, duration: 0.16 }}
                    >
                      <Link to={item.to} onClick={() => setShowUserMenu(false)}
                        className="w-full px-4 py-2.5 text-sm text-gray-500 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-2">
                        {item.icon} {item.label} {item.extra}
                      </Link>
                    </motion.div>
                  ))}

                  {/* Mobile-only quick actions */}
                  <div className="lg:hidden border-t border-white/5 px-4 py-2 flex gap-2">
                    <Link to="/wallet?tab=buy" onClick={() => setShowUserMenu(false)}
                      className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-extrabold text-white"
                      style={{ background: 'linear-gradient(135deg,#00D4FF,#00B8E0)' }}>
                      {t('buy_coins')}
                    </Link>
                    <Link to="/wallet?tab=cashout" onClick={() => setShowUserMenu(false)}
                      className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-extrabold"
                      style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.28)', color: 'rgb(52,211,153)' }}>
                      <DollarSign size={12} /> Cash Out
                    </Link>
                  </div>

                  {/* Mobile-only nav links */}
                  <div className="lg:hidden border-t border-white/5">
                    {NAV_LINK_DEFS.map((link, i) => (
                      <motion.button
                        key={link.key}
                        onClick={() => handleNavClick(link)}
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.22 + i * 0.03, duration: 0.15 }}
                        className="w-full px-4 py-2.5 text-left text-sm text-gray-500 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-2"
                      >
                        {t(link.key)}
                      </motion.button>
                    ))}
                  </div>

                  <button
                    onClick={() => { logout(); navigate('/'); setShowUserMenu(false) }}
                    className="w-full px-4 py-2.5 text-left text-sm text-red-400/70 hover:text-red-400 hover:bg-red-500/5 transition-colors flex items-center gap-2 border-t border-white/5"
                  >
                    <LogOut size={13} /> {t('logout')}
                  </button>
                </motion.div>
              )}
              </AnimatePresence>
            </div>
          </>
        ) : (
          <>
            {/* Auth buttons */}
            <Link to="/auth"
              className="px-4 py-1.5 rounded-lg text-gray-300 border border-white/10 hover:text-white hover:border-white/20 text-sm font-semibold transition-all">
              {t('login')}
            </Link>
            <Link to="/auth?tab=signup"
              className="px-4 py-1.5 rounded-lg text-white text-sm font-black transition-all hover:opacity-90"
              style={{ background: 'linear-gradient(135deg,#00D4FF,#00B8E0)', boxShadow: '0 0 16px rgba(0,212,255,0.3)' }}>
              {t('signup')}
            </Link>
          </>
        )}
      </div>
    </nav>
  )
}
