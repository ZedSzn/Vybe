import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react'
import { io } from 'socket.io-client'
import { useAuth } from './AuthContext'

const SocketContext = createContext(null)

const BACKEND = import.meta.env.VITE_BACKEND_URL || ''

// Fire-and-forget HTTP ping so Render wakes up before the socket tries to connect
function pingBackend() {
  fetch(`${BACKEND}/api/online-count`).catch(() => {})
}

export function SocketProvider({ children }) {
  const { user, refreshUser } = useAuth()
  const [socket, setSocket] = useState(null)
  const [isConnected, setIsConnected] = useState(false)
  const [onlineCount, setOnlineCount] = useState(0)
  const [pendingWarnings, setPendingWarnings] = useState([])
  const [pendingAnnouncements, setPendingAnnouncements] = useState([])
  const [bannedInfo, setBannedInfo] = useState(null) // { reason, banType, banExpiresAt }

  // Keep a ref so the connect callback always reads fresh user data
  // without needing to recreate the socket when non-identity fields change
  const userRef = useRef(user)
  useEffect(() => { userRef.current = user }, [user])

  // Only reconnect when the user's identity changes (login / logout)
  // NOT on every refreshUser() call that updates profile fields
  useEffect(() => {
    pingBackend()

    const token = localStorage.getItem('vybe_token')
    const s = io(BACKEND, {
      transports: ['polling', 'websocket'],
      withCredentials: true,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 8000,
      reconnectionAttempts: 20,
      auth: token ? { token } : {},
    })

    s.on('connect', () => {
      setIsConnected(true)
      const u = userRef.current
      s.emit('register', {
        userId:    u?.id        || null,
        username:  u?.username  || 'Guest',
        gender:    u?.gender    || 'other',
        country:   u?.country   || '',
        isPremium: u?.isPremium || false,
        isVip:     u?.isVip     || false,
        token:     localStorage.getItem('vybe_token') || null,
      })
    })

    s.on('disconnect', () => setIsConnected(false))
    s.on('online-count', setOnlineCount)

    // Global admin warning handlers — work on any page
    s.on('admin-warning', ({ message }) => {
      setPendingWarnings(prev => [...prev, message])
    })
    s.on('admin-warnings', (warnings) => {
      if (warnings?.length) {
        setPendingWarnings(prev => [...prev, ...warnings.map(w => w.message).filter(Boolean)])
      }
    })

    // Ban handler — works on any page, not just ChatPage
    s.on('you-are-banned', ({ reason, banType, banExpiresAt }) => {
      setBannedInfo({ reason: reason || 'Your account has been suspended.', banType: banType || null, banExpiresAt: banExpiresAt ? new Date(banExpiresAt) : null })
    })

    // Live broadcast announcement from admin
    s.on('announcement', ({ message }) => {
      if (message) setPendingAnnouncements(prev => [...prev, message])
    })

    // Membership updated by admin — refresh auth state so features unlock immediately
    s.on('membership-updated', () => {
      refreshUser()
    })

    setSocket(s)

    return () => {
      s.disconnect()
      setSocket(null)
    }
  }, [user?.id]) // eslint-disable-line — only reconnect on identity change

  const dismissWarning      = useCallback(() => setPendingWarnings(prev => prev.slice(1)), [])
  const dismissAnnouncement = useCallback(() => setPendingAnnouncements(prev => prev.slice(1)), [])
  const clearBanned         = useCallback(() => setBannedInfo(null), [])

  return (
    <SocketContext.Provider value={{ socket, isConnected, onlineCount, pendingWarnings, dismissWarning, pendingAnnouncements, dismissAnnouncement, bannedInfo, clearBanned }}>
      {children}
    </SocketContext.Provider>
  )
}

export const useSocket = () => {
  const ctx = useContext(SocketContext)
  if (!ctx) throw new Error('useSocket must be used within SocketProvider')
  return ctx
}
