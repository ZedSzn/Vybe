import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Search, UserPlus, Users, Clock, Send, X, Check, MessageCircle } from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { useAuth } from '../context/AuthContext'
import { useSocket } from '../context/SocketContext'
import { Skeleton } from '../components/Skeleton'
import EmptyStateIllustration from '../components/EmptyStateIllustration'
import axios from 'axios'


function Avatar({ name, size = 9, online }) {
  return (
    <div className="relative flex-shrink-0">
      <div
        className={`w-${size} h-${size} rounded-full bg-gradient-to-br from-cyan-400 to-cyan-400 flex items-center justify-center text-white font-black`}
        style={{ fontSize: size > 8 ? 16 : 13 }}
      >
        {name?.[0]?.toUpperCase() || '?'}
      </div>
      {online !== undefined && (
        <span
          className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-black transition-colors duration-500 ${online ? 'bg-cyan-500' : 'bg-gray-600'}`}
        />
      )}
    </div>
  )
}

export default function FriendsPage() {
  const { user, token, loading: authLoading } = useAuth()
  const { socket } = useSocket()
  const navigate = useNavigate()

  const [tab, setTab] = useState('friends')
  const [friends, setFriends] = useState([])
  const [requests, setRequests] = useState([])
  const [sentRequests, setSentRequests] = useState([])
  const [selectedFriend, setSelectedFriend] = useState(null)
  const [messages, setMessages] = useState([])
  const [msgInput, setMsgInput] = useState('')
  const [searchQ, setSearchQ] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [loadingFriends, setLoadingFriends] = useState(true)
  const [loadingMsgs, setLoadingMsgs] = useState(false)
  const [actionLoading, setActionLoading] = useState('')
  const [toast, setToast] = useState('')
  const [unreadCounts, setUnreadCounts] = useState({})
  const [partnerTyping, setPartnerTyping] = useState(false)

  const messagesEndRef = useRef(null)
  const typingEndRef   = useRef(null)
  const inputRef = useRef(null)
  const searchTimeout = useRef(null)
  const typingTimeout = useRef(null)
  const selectedFriendRef = useRef(null)
  selectedFriendRef.current = selectedFriend

  useEffect(() => {
    if (authLoading) return
    if (!user) { navigate('/auth'); return }
    fetchAll()
  }, [user, authLoading])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (!socket) return
    const onReceive = (msg) => {
      const current = selectedFriendRef.current
      if (current && String(msg.from) === String(current.friend._id)) {
        setMessages(prev => [...prev, { ...msg, fromMe: false }])
        setPartnerTyping(false)
        axios.patch(`/api/dm/${current.friend._id}/read`, {}, { headers: { Authorization: `Bearer ${token}` } }).catch(() => {})
      } else {
        setUnreadCounts(prev => ({ ...prev, [msg.from]: (prev[msg.from] || 0) + 1 }))
      }
    }
    const onTyping = ({ fromUserId, isTyping }) => {
      const current = selectedFriendRef.current
      if (current && String(fromUserId) === String(current.friend._id)) {
        setPartnerTyping(isTyping)
        if (isTyping) {
          clearTimeout(typingTimeout.current)
          typingTimeout.current = setTimeout(() => setPartnerTyping(false), 4000)
        }
      }
    }
    socket.on('dm-receive', onReceive)
    socket.on('dm-typing',  onTyping)
    return () => { socket.off('dm-receive', onReceive); socket.off('dm-typing', onTyping) }
  }, [socket, token])

  const fetchAll = async () => {
    setLoadingFriends(true)
    try {
      const [fr, rq, sent, conv] = await Promise.all([
        axios.get(`/api/friends`,          { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`/api/friends/requests`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`/api/friends/sent`,     { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`/api/dm/conversations`, { headers: { Authorization: `Bearer ${token}` } }),
      ])
      setFriends(fr.data.friends || [])
      setRequests(rq.data.requests || [])
      setSentRequests(sent.data.requests || [])
      const counts = {}
      for (const c of (conv.data.conversations || [])) {
        if (c.unread > 0) counts[c.userId] = c.unread
      }
      setUnreadCounts(counts)
    } catch {}
    setLoadingFriends(false)
  }

  const openChat = async (friendship) => {
    setSelectedFriend(friendship)
    setMsgInput('')
    setPartnerTyping(false)
    setLoadingMsgs(true)
    setUnreadCounts(prev => ({ ...prev, [friendship.friend._id]: 0 }))
    try {
      const { data } = await axios.get(`/api/dm/${friendship.friend._id}`, { headers: { Authorization: `Bearer ${token}` } })
      setMessages(data.messages || [])
      await axios.patch(`/api/dm/${friendship.friend._id}/read`, {}, { headers: { Authorization: `Bearer ${token}` } })
    } catch {}
    setLoadingMsgs(false)
    setTimeout(() => inputRef.current?.focus(), 100)
  }

  const emitTyping = (isTyping) => {
    if (!socket || !selectedFriend) return
    socket.emit('dm-typing', { toUserId: selectedFriend.friend._id, isTyping })
  }

  const sendMessage = () => {
    const content = msgInput.trim()
    if (!content || !selectedFriend || !socket) return
    emitTyping(false)
    setMsgInput('')
    setMessages(prev => [...prev, { _id: Date.now(), content, fromMe: true, createdAt: new Date().toISOString() }])
    socket.emit('dm-send', { toUserId: selectedFriend.friend._id, content })
  }

  const respondToRequest = async (friendshipId, action) => {
    setActionLoading(friendshipId + action)
    try {
      await axios.post(`/api/friends/respond/${friendshipId}`, { action }, { headers: { Authorization: `Bearer ${token}` } })
      setRequests(prev => prev.filter(r => r._id !== friendshipId))
      if (action === 'accept') {
        showToast('Friend added!')
        const [fr] = await Promise.all([axios.get(`/api/friends`, { headers: { Authorization: `Bearer ${token}` } })])
        setFriends(fr.data.friends || [])
      } else {
        showToast('Request declined.')
      }
    } catch (err) {
      showToast(err.response?.data?.error || 'Action failed.')
    }
    setActionLoading('')
  }

  const cancelSentRequest = async (friendshipId) => {
    setActionLoading(friendshipId + 'cancel')
    try {
      await axios.delete(`/api/friends/${friendshipId}`, { headers: { Authorization: `Bearer ${token}` } })
      setSentRequests(prev => prev.filter(r => r._id !== friendshipId))
      showToast('Request cancelled.')
    } catch (err) {
      showToast(err.response?.data?.error || 'Action failed.')
    }
    setActionLoading('')
  }

  const removeFriend = async (friendshipId) => {
    try {
      await axios.delete(`/api/friends/${friendshipId}`, { headers: { Authorization: `Bearer ${token}` } })
      if (selectedFriend?.friendshipId === friendshipId) setSelectedFriend(null)
      setFriends(prev => prev.filter(f => f.friendshipId !== friendshipId))
      showToast('Friend removed.')
    } catch {}
  }

  const handleSearch = (q) => {
    setSearchQ(q)
    clearTimeout(searchTimeout.current)
    if (!q.trim()) { setSearchResults([]); return }
    searchTimeout.current = setTimeout(async () => {
      setSearching(true)
      try {
        const { data } = await axios.get(`/api/users/search?q=${encodeURIComponent(q)}`, { headers: { Authorization: `Bearer ${token}` } })
        setSearchResults(data.users || [])
      } catch {}
      setSearching(false)
    }, 350)
  }

  const sendRequest = async (recipientId) => {
    setActionLoading('req_' + recipientId)
    try {
      await axios.post(`/api/friends/request`, { recipientId }, { headers: { Authorization: `Bearer ${token}` } })
      showToast('Friend request sent!')
      setSearchResults(prev => prev.map(u => u._id === recipientId ? { ...u, requestSent: true } : u))
      try {
        const { data } = await axios.get(`/api/friends/sent`, { headers: { Authorization: `Bearer ${token}` } })
        setSentRequests(data.requests || [])
      } catch {}
    } catch (err) {
      showToast(err.response?.data?.error || 'Could not send request.')
    }
    setActionLoading('')
  }

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  const totalUnread = Object.values(unreadCounts).reduce((a, b) => a + b, 0)

  return (
    <div className="min-h-screen font-space" style={{ background: '#07090f' }}>
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }}>
        <div style={{ position: 'absolute', top: '-5%', left: '20%', width: '500px', height: '500px', background: 'radial-gradient(ellipse at 50% 50%, rgba(0,212,255,0.06) 0%, transparent 65%)' }} />
        <div style={{ position: 'absolute', bottom: '10%', right: '10%', width: '400px', height: '400px', background: 'radial-gradient(ellipse at 50% 50%, rgba(168,85,247,0.04) 0%, transparent 65%)' }} />
      </div>

      <Navbar />

      <AnimatePresence>
        {toast && (
          <motion.div
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl text-white text-sm font-semibold"
            style={{ background: '#0d1428', border: '1px solid rgba(0,212,255,0.4)', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}
            initial={{ opacity: 0, y: -16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.96 }}
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative z-10 max-w-5xl mx-auto px-4 pt-24 pb-16">
        <div className="mb-6 flex items-center gap-4">
          <motion.button
            onClick={() => navigate(-1)}
            whileHover={{ x: -3, color: '#ffffff' }}
            whileTap={{ scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 500, damping: 28 }}
            className="inline-flex items-center gap-2 text-sm transition-colors"
            style={{ color: '#888899' }}
          >
            <ArrowLeft size={15} />
          </motion.button>
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight">Friends</h1>
            <p className="text-sm mt-0.5" style={{ color: '#888899' }}>
              {friends.length} friend{friends.length !== 1 ? 's' : ''}
              {totalUnread > 0 && <span className="ml-2 text-cyan-400 font-semibold">{totalUnread} unread</span>}
            </p>
          </div>
        </div>

        <div className="flex gap-4" style={{ height: 'calc(100vh - 200px)', minHeight: '540px' }}>

          {/* ── Left panel ── hidden on mobile when chat is open */}
          <div
            className={`${selectedFriend ? 'hidden sm:flex' : 'flex'} w-full sm:w-72 flex-shrink-0 flex-col rounded-2xl overflow-hidden`}
            style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            {/* Tabs */}
            <div className="flex flex-shrink-0 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
              {[
                { id: 'friends',  label: 'Friends',  icon: <Users size={12} /> },
                { id: 'requests', label: 'Requests', icon: <Clock size={12} />, badge: requests.length },
                { id: 'sent',     label: 'Sent',     icon: <Send size={12} /> },
                { id: 'add',      label: 'Add',      icon: <UserPlus size={12} /> },
              ].map(t => (
                <motion.button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  whileTap={{ scale: 0.94 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  className="flex-1 relative flex items-center justify-center gap-1.5 py-3 text-[11px] font-extrabold uppercase tracking-wide transition-colors"
                  style={{
                    color: tab === t.id ? '#fff' : '#4b5563',
                    borderBottom: tab === t.id ? '2px solid #00D4FF' : '2px solid transparent',
                  }}
                >
                  {t.icon}
                  {t.label}
                  {t.badge > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-cyan-500 text-[9px] font-black flex items-center justify-center text-white">
                      {t.badge > 9 ? '9+' : t.badge}
                    </span>
                  )}
                </motion.button>
              ))}
            </div>

            {/* Panel content */}
            <div className="flex-1 overflow-y-auto">

              {/* ── Friends list ── */}
              {tab === 'friends' && (
                loadingFriends ? (
                  <div className="p-4 space-y-3">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="flex items-center gap-3 px-2 py-1">
                        <Skeleton className="w-9 h-9 flex-shrink-0" rounded="rounded-full" />
                        <div className="flex-1 space-y-1.5">
                          <Skeleton className="h-3 w-24" />
                          <Skeleton className="h-2 w-14" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : friends.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="py-10 text-center px-6 flex flex-col items-center"
                  >
                    <EmptyStateIllustration variant="friends" size={88} />
                    <p className="text-sm font-bold text-white mt-3 mb-1">No friends yet</p>
                    <p className="text-xs mb-4" style={{ color: '#888899' }}>Meet people in video chat and add them</p>
                    <motion.button
                      onClick={() => setTab('add')}
                      whileHover={{ scale: 1.04 }}
                      whileTap={{ scale: 0.96 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 22 }}
                      className="text-xs font-bold px-4 py-2 rounded-xl transition-colors"
                      style={{ background: 'rgba(0,212,255,0.15)', color: '#00B8E0', border: '1px solid rgba(0,212,255,0.25)' }}
                    >
                      Find friends
                    </motion.button>
                  </motion.div>
                ) : (
                  <div>
                    {friends.map(f => {
                      const unread = unreadCounts[f.friend._id] || 0
                      const isSelected = selectedFriend?.friendshipId === f.friendshipId
                      return (
                        <motion.button
                          key={f.friendshipId}
                          onClick={() => openChat(f)}
                          whileHover={{ backgroundColor: 'rgba(255,255,255,0.045)' }}
                          whileTap={{ scale: 0.985 }}
                          transition={{ duration: 0.15 }}
                          className="w-full flex items-center gap-3 px-4 py-3 text-left border-b"
                          style={{
                            borderColor: 'rgba(255,255,255,0.04)',
                            background: isSelected ? 'rgba(0,212,255,0.1)' : 'transparent',
                          }}
                        >
                          <Avatar name={f.friend.username} size={9} online={f.isOnline} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-white truncate">{f.friend.username}</p>
                            <p className="text-[11px] transition-colors duration-300" style={{ color: f.isOnline ? '#4ade80' : '#6b7280' }}>
                              {f.isOnline ? 'Online' : 'Offline'}
                            </p>
                          </div>
                          <AnimatePresence>
                            {unread > 0 && (
                              <motion.span
                                key="unread"
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0, opacity: 0 }}
                                transition={{ type: 'spring', stiffness: 600, damping: 20 }}
                                className="w-5 h-5 rounded-full bg-cyan-500 text-[10px] font-black flex items-center justify-center text-white flex-shrink-0"
                              >
                                {unread > 9 ? '9+' : unread}
                              </motion.span>
                            )}
                          </AnimatePresence>
                        </motion.button>
                      )
                    })}
                  </div>
                )
              )}

              {/* ── Requests ── */}
              {tab === 'requests' && (
                requests.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="py-10 text-center px-6 flex flex-col items-center"
                  >
                    <EmptyStateIllustration variant="requests" size={88} />
                    <p className="text-sm font-bold text-white mt-3 mb-1">No pending requests</p>
                    <p className="text-xs" style={{ color: '#888899' }}>Friend requests will appear here</p>
                  </motion.div>
                ) : (
                  <div>
                    {requests.map(r => (
                      <div
                        key={r._id}
                        className="flex items-center gap-3 px-4 py-3 border-b"
                        style={{ borderColor: 'rgba(255,255,255,0.04)' }}
                      >
                        <Avatar name={r.requester.username} size={9} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-white truncate">{r.requester.username}</p>
                          <p className="text-[11px]" style={{ color: '#888899' }}>wants to be friends</p>
                        </div>
                        <div className="flex gap-1.5 flex-shrink-0">
                          <motion.button
                            onClick={() => respondToRequest(r._id, 'accept')}
                            disabled={!!actionLoading}
                            whileTap={{ scale: 0.88 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                            className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-cyan-500/20 disabled:opacity-50"
                            style={{ background: 'rgba(74,222,128,0.12)', color: '#4ade80' }}
                            title="Accept"
                          >
                            <Check size={13} />
                          </motion.button>
                          <motion.button
                            onClick={() => respondToRequest(r._id, 'decline')}
                            disabled={!!actionLoading}
                            whileTap={{ scale: 0.88 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                            className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-red-500/20 disabled:opacity-50"
                            style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171' }}
                            title="Decline"
                          >
                            <X size={13} />
                          </motion.button>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              )}

              {/* ── Sent requests ── */}
              {tab === 'sent' && (
                sentRequests.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="py-10 text-center px-6 flex flex-col items-center"
                  >
                    <EmptyStateIllustration variant="requests" size={88} />
                    <p className="text-sm font-bold text-white mt-3 mb-1">No sent requests</p>
                    <p className="text-xs" style={{ color: '#888899' }}>Requests you send will appear here</p>
                  </motion.div>
                ) : (
                  <div>
                    {sentRequests.map(r => (
                      <div
                        key={r._id}
                        className="flex items-center gap-3 px-4 py-3 border-b"
                        style={{ borderColor: 'rgba(255,255,255,0.04)' }}
                      >
                        <Avatar name={r.recipient?.username || '?'} size={9} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-white truncate">{r.recipient?.username || 'Unknown'}</p>
                          <p className="text-[11px]" style={{ color: '#888899' }}>Request pending</p>
                        </div>
                        <motion.button
                          onClick={() => cancelSentRequest(r._id)}
                          disabled={!!actionLoading}
                          whileTap={{ scale: 0.9 }}
                          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                          className="flex items-center gap-1 px-3 h-7 rounded-lg text-[11px] font-bold transition-colors hover:bg-red-500/20 disabled:opacity-50 flex-shrink-0"
                          style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171' }}
                          title="Cancel request"
                        >
                          <X size={12} /> Cancel
                        </motion.button>
                      </div>
                    ))}
                  </div>
                )
              )}

              {/* ── Add friend ── */}
              {tab === 'add' && (
                <div className="p-4">
                  <div className="relative mb-4">
                    <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#888899' }} />
                    <input
                      type="text"
                      value={searchQ}
                      onChange={e => handleSearch(e.target.value)}
                      placeholder="Search by username…"
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm text-white placeholder-gray-600 outline-none transition-colors"
                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
                    />
                  </div>
                  {searching ? (
                    <div className="space-y-2">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                          <Skeleton className="w-8 h-8 flex-shrink-0" rounded="rounded-full" />
                          <Skeleton className="flex-1 h-3" />
                          <Skeleton className="w-12 h-7 flex-shrink-0" rounded="rounded-lg" />
                        </div>
                      ))}
                    </div>
                  ) : searchResults.length > 0 ? (
                    <div className="space-y-2">
                      {searchResults.map(u => (
                        <div
                          key={u._id}
                          className="flex items-center gap-3 p-3 rounded-xl"
                          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                        >
                          <Avatar name={u.username} size={8} />
                          <p className="text-sm font-semibold text-white flex-1 truncate">{u.username}</p>
                          <motion.button
                            onClick={() => !u.requestSent && !u.isFriend && sendRequest(u._id)}
                            disabled={u.requestSent || u.isFriend || actionLoading === 'req_' + u._id}
                            whileTap={{ scale: 0.92 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                            className="text-xs font-bold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-60 flex-shrink-0"
                            style={{
                              background: u.isFriend || u.requestSent ? 'rgba(255,255,255,0.05)' : 'rgba(0,212,255,0.15)',
                              color: u.isFriend || u.requestSent ? '#6b7280' : '#00B8E0',
                              border: '1px solid rgba(0,212,255,0.2)',
                            }}
                          >
                            {u.isFriend ? 'Friends' : u.requestSent ? 'Sent ✓' : 'Add'}
                          </motion.button>
                        </div>
                      ))}
                    </div>
                  ) : searchQ && !searching ? (
                    <div className="text-center text-sm py-6" style={{ color: '#888899' }}>No users found</div>
                  ) : (
                    <p className="text-center text-xs py-6 leading-relaxed" style={{ color: '#888899' }}>
                      Search for someone's username to send them a friend request
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ── Right panel: DM chat ── hidden on mobile when no friend selected */}
          <div
            className={`${selectedFriend ? 'flex' : 'hidden sm:flex'} flex-1 flex-col rounded-2xl overflow-hidden`}
            style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            {selectedFriend ? (
              <>
                {/* Header */}
                <div className="flex items-center gap-3 px-5 py-4 border-b flex-shrink-0" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                  {/* Back button — mobile only */}
                  <button
                    onClick={() => setSelectedFriend(null)}
                    className="sm:hidden flex-shrink-0 text-gray-500 hover:text-white transition-colors"
                  >
                    <ArrowLeft size={18} />
                  </button>
                  <Avatar name={selectedFriend.friend.username} size={9} online={selectedFriend.isOnline} />
                  <div className="flex-1">
                    <p className="text-sm font-bold text-white">{selectedFriend.friend.username}</p>
                    <p className="text-[11px]" style={{ color: selectedFriend.isOnline ? '#4ade80' : '#6b7280' }}>
                      {selectedFriend.isOnline ? '● Online' : '○ Offline'}
                    </p>
                  </div>
                  <motion.button
                    onClick={() => removeFriend(selectedFriend.friendshipId)}
                    whileTap={{ scale: 0.93 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                    style={{ color: '#888899', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                  >
                    Unfriend
                  </motion.button>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-5 space-y-3">
                  {loadingMsgs ? (
                    <div className="space-y-3 pt-2">
                      {[...Array(4)].map((_, i) => (
                        <div key={i} className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
                          <Skeleton className="h-10 rounded-2xl" style={{ width: `${45 + Math.random() * 30}%` }} />
                        </div>
                      ))}
                    </div>
                  ) : messages.length === 0 ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3 }}
                      className="h-full flex flex-col items-center justify-center text-center"
                    >
                      <EmptyStateIllustration variant="messages" size={88} />
                      <p className="text-sm font-bold text-white mt-2 mb-1">Say hello!</p>
                      <p className="text-xs" style={{ color: '#888899' }}>Start the conversation with {selectedFriend.friend.username}</p>
                    </motion.div>
                  ) : (
                    messages.map((msg, i) => (
                      <motion.div
                        key={msg._id || i}
                        className={`flex ${msg.fromMe ? 'justify-end' : 'justify-start'}`}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div
                          className="max-w-xs px-4 py-2.5 text-sm text-white"
                          style={{
                            background: msg.fromMe ? 'linear-gradient(135deg, #00D4FF, #00B8E0)' : 'rgba(255,255,255,0.07)',
                            borderRadius: msg.fromMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                          }}
                        >
                          {msg.content}
                          <p className="text-[10px] mt-1 opacity-50 text-right">
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </motion.div>
                    ))
                  )}
                  <AnimatePresence>
                    {partnerTyping && (
                      <motion.div
                        initial={{ opacity: 0, y: 6, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 4, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="flex justify-start"
                      >
                        <div className="px-4 py-3 rounded-2xl rounded-bl-sm flex items-center gap-1.5"
                          style={{ background: 'rgba(255,255,255,0.07)' }}>
                          {[0, 0.18, 0.36].map((delay, i) => (
                            <span key={i} className="w-1.5 h-1.5 rounded-full bg-white/50"
                              style={{ animation: `loading-dot 1.1s ease-in-out ${delay}s infinite` }} />
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="px-4 py-4 border-t flex-shrink-0" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                  <div className="flex gap-3 items-center">
                    <input
                      ref={inputRef}
                      type="text"
                      value={msgInput}
                      onChange={e => {
                        setMsgInput(e.target.value)
                        emitTyping(true)
                        clearTimeout(typingTimeout.current)
                        typingTimeout.current = setTimeout(() => emitTyping(false), 2000)
                      }}
                      onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
                      placeholder={`Message ${selectedFriend.friend.username}…`}
                      maxLength={500}
                      className="flex-1 px-4 py-3 rounded-xl text-sm text-white placeholder-gray-600 outline-none transition-colors"
                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
                    />
                    <motion.button
                      onClick={sendMessage}
                      disabled={!msgInput.trim()}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="w-11 h-11 rounded-xl flex items-center justify-center transition-all disabled:opacity-40"
                      style={{ background: 'linear-gradient(135deg, #00D4FF, #00B8E0)', boxShadow: '0 0 18px rgba(0,212,255,0.35)' }}
                    >
                      <Send size={16} className="text-white" />
                    </motion.button>
                  </div>
                </div>
              </>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="flex-1 flex flex-col items-center justify-center text-center px-8"
              >
                <motion.div
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
                  style={{ background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.2)' }}
                >
                  <MessageCircle size={28} style={{ color: '#00B8E0' }} />
                </motion.div>
                <p className="text-base font-black text-white mb-2">Your messages</p>
                <p className="text-sm leading-relaxed" style={{ color: '#888899' }}>
                  Select a friend from the list to start chatting.<br />Messages are private between friends only.
                </p>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
