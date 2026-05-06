import { createContext, useContext, useEffect, useState } from 'react'
import { io } from 'socket.io-client'
import { useAuth } from './AuthContext'

const SocketContext = createContext(null)

export function SocketProvider({ children }) {
  const { user } = useAuth()
  const [socket, setSocket] = useState(null)
  const [isConnected, setIsConnected] = useState(false)
  const [onlineCount, setOnlineCount] = useState(0)

  useEffect(() => {
    const backendUrl = import.meta.env.VITE_BACKEND_URL || ''
    const s = io(backendUrl, {
      transports: ['websocket', 'polling'],
      withCredentials: true,
    })

    s.on('connect', () => {
      setIsConnected(true)
      s.emit('register', {
        userId:    user?.id       || null,
        username:  user?.username || 'Guest',
        gender:    user?.gender   || 'other',
        country:   user?.country  || '',
        isPremium: user?.isPremium || false,
        isVip:     user?.isVip    || false,
      })
    })

    s.on('disconnect', () => setIsConnected(false))
    s.on('online-count', setOnlineCount)

    setSocket(s)

    return () => {
      s.disconnect()
      setSocket(null)
    }
  }, [user])

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
