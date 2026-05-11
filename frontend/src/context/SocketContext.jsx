import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { io } from 'socket.io-client'
import { useAuth } from './AuthContext'

const SocketContext = createContext(null)

const BACKEND = import.meta.env.VITE_BACKEND_URL || ''

// Fire-and-forget HTTP ping so Render wakes up before the socket tries to connect
function pingBackend() {
  fetch(`${BACKEND}/api/online-count`).catch(() => {})
}

export function SocketProvider({ children }) {
  const { user } = useAuth()
  const [socket, setSocket] = useState(null)
  const [isConnected, setIsConnected] = useState(false)
  const [onlineCount, setOnlineCount] = useState(0)

  // Keep a ref so the connect callback always reads fresh user data
  // without needing to recreate the socket when non-identity fields change
  const userRef = useRef(user)
  useEffect(() => { userRef.current = user }, [user])

  // Only reconnect when the user's identity changes (login / logout)
  // NOT on every refreshUser() call that updates profile fields
  useEffect(() => {
    pingBackend()

    const s = io(BACKEND, {
      transports: ['polling', 'websocket'],
      withCredentials: true,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 8000,
      reconnectionAttempts: 20,
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
      })
    })

    s.on('disconnect', () => setIsConnected(false))
    s.on('online-count', setOnlineCount)

    setSocket(s)

    return () => {
      s.disconnect()
      setSocket(null)
    }
  }, [user?.id]) // eslint-disable-line — only reconnect on identity change

  return (
    <SocketContext.Provider value={{ socket, isConnected, onlineCount }}>
      {children}
    </SocketContext.Provider>
  )
}

export const useSocket = () => {
  const ctx = useContext(SocketContext)
  if (!ctx) throw new Error('useSocket must be used within SocketProvider')
  return ctx
}
