import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  SkipForward, PhoneOff, Flag, Send, Mic, MicOff, Video, VideoOff,
  MessageSquare, X, ChevronRight, User, Shield, Loader2, Ban, Gift, UserX, Camera,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { io } from 'socket.io-client'
import SimplePeer from 'simple-peer'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'

const REPORT_REASONS = [
  { id: 'nudity',     label: '🔞 Nudity / Sexual content' },
  { id: 'harassment', label: '😤 Harassment or bullying' },
  { id: 'underage',   label: '👶 Suspected underage user' },
  { id: 'spam',       label: '🤖 Spam or bot' },
  { id: 'other',      label: '📋 Other' },
]

export default function ChatPage() {
  const navigate  = useNavigate()
  const location  = useLocation()
  const { user }  = useAuth()

  const prefs = location.state || { mode: 'solo', filterGender: null, filterCountry: '' }

  const [status,           setStatus]           = useState('init')
  const [banReason,        setBanReason]        = useState('')
  const [banType,          setBanType]          = useState(null)
  const [banExpiresAt,     setBanExpiresAt]     = useState(null)
  const [unbanLoading,     setUnbanLoading]     = useState(false)
  const [messages,         setMessages]         = useState([])
  const [input,            setInput]            = useState('')
  const [showChat,         setShowChat]         = useState(false)
  const [isMuted,          setIsMuted]          = useState(false)
  const [videoOff,         setVideoOff]         = useState(false)
  const [showReport,       setShowReport]       = useState(false)
  const [reportSent,       setReportSent]       = useState(false)
  const [elapsed,          setElapsed]          = useState(0)
  const [unread,           setUnread]           = useState(0)
  const [roomId,           setRoomId]           = useState(null)
  const [partnerSock,      setPartnerSock]      = useState(null)
  const [partnerUid,       setPartnerUid]       = useState(null)
  const [remoteStreams,    setRemoteStreams]     = useState({})   // socketId → MediaStream
  const [squadMates,       setSquadMates]       = useState([])   // socket IDs of own squad (not opponents)
  // Searching / loading UX
  const [searchElapsed,    setSearchElapsed]    = useState(0)   // seconds spent searching
  const [onlineCount,      setOnlineCount]      = useState(0)
  const [searchTextIdx,    setSearchTextIdx]    = useState(0)
  const [connectionLost,   setConnectionLost]   = useState(false)
  const [reconnectCount,   setReconnectCount]   = useState(0)

  const [adminWarning,   setAdminWarning]     = useState('')
  const [showGifts,      setShowGifts]        = useState(false)
  const [gifts,          setGifts]            = useState({})
  const [giftSending,    setGiftSending]      = useState(false)
  const [giftError,      setGiftError]        = useState('')
  const [giftReceived,   setGiftReceived]     = useState(null)
  const [blockLoading,   setBlockLoading]     = useState(false)
  const [coins,          setCoins]            = useState(user?.coins ?? 0)
  const [floatingGifts,  setFloatingGifts]    = useState([]) // [{id, emoji, fromMe}]
  const [showTip,        setShowTip]          = useState(false)
  const [tipAmount,      setTipAmount]        = useState('50')
  const [tipLoading,     setTipLoading]       = useState(false)
  const [tipFeedback,    setTipFeedback]      = useState(null) // {type:'success'|'error', msg}
  const [boostLoading,   setBoostLoading]     = useState(false)
  const [boostActive,    setBoostActive]      = useState(false)
  const [skipQueueLoading, setSkipQueueLoading] = useState(false)
  const [hasCamera,      setHasCamera]        = useState(true)
  const [noCamDismissed, setNoCamDismissed]   = useState(false)
  const [facingMode,     setFacingMode]       = useState('user')

  const searchTimerRef   = useRef(null)
  const searchTextTimer  = useRef(null)
  const reconnectTimer   = useRef(null)
  const statusRef        = useRef(status)

  const SEARCH_TEXTS = [
    'Finding your next Vybe…',
    'Connecting you…',
    'Almost there…',
    'Looking for the perfect match…',
    'Hang tight…',
  ]

  const socketRef       = useRef(null)
  const peersRef        = useRef({})           // socketId → SimplePeer
  const remoteVideoRefs = useRef({})           // socketId → HTMLVideoElement
  const localStreamRef  = useRef(null)
  const localVideoRef   = useRef(null)
  const messagesEndRef  = useRef(null)
  const timerRef        = useRef(null)
  const prefsRef        = useRef(prefs)
  const partnerSockRef  = useRef(null)
  const partnerUidRef   = useRef(null)

  useEffect(() => {
    axios.get('/api/gifts').then(({ data }) => setGifts(data.gifts)).catch(() => {})
    if (user?.coins !== undefined) setCoins(user.coins)
  }, []) // eslint-disable-line

  useEffect(() => { prefsRef.current  = prefs   }, [prefs])
  useEffect(() => { partnerSockRef.current = partnerSock }, [partnerSock])
  useEffect(() => { partnerUidRef.current  = partnerUid  }, [partnerUid])
  useEffect(() => { statusRef.current = status }, [status])

  // Sync remote streams → video elements (stream objects don't trigger re-renders on srcObject change)
  useEffect(() => {
    for (const [sid, stream] of Object.entries(remoteStreams)) {
      const el = remoteVideoRefs.current[sid]
      if (el && el.srcObject !== stream) {
        el.srcObject = stream
        el.play().catch(() => {})
      }
    }
  }, [remoteStreams])

  // Auto-scroll chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    if (showChat) setUnread(0)
  }, [messages, showChat])

  // Connection timer
  useEffect(() => {
    if (status === 'matched') {
      timerRef.current = setInterval(() => setElapsed((t) => t + 1), 1000)
    } else {
      clearInterval(timerRef.current)
      if (status !== 'matched') setElapsed(0)
    }
    return () => clearInterval(timerRef.current)
  }, [status])

  // Search timer + online count + cycling text
  useEffect(() => {
    if (status === 'searching') {
      setSearchElapsed(0)
      setSearchTextIdx(0)
      searchTimerRef.current  = setInterval(() => setSearchElapsed((t) => t + 1), 1000)
      searchTextTimer.current = setInterval(() => setSearchTextIdx((i) => (i + 1) % SEARCH_TEXTS.length), 3000)
      // Fetch online count every 10s
      const fetchCount = () => axios.get('/api/online-count').then(({ data }) => setOnlineCount(data.count)).catch(() => {})
      fetchCount()
      const countTimer = setInterval(fetchCount, 10000)
      return () => {
        clearInterval(searchTimerRef.current)
        clearInterval(searchTextTimer.current)
        clearInterval(countTimer)
      }
    } else {
      clearInterval(searchTimerRef.current)
      clearInterval(searchTextTimer.current)
    }
  }, [status]) // eslint-disable-line

  // Connection lost: when socket disconnects while matched
  useEffect(() => {
    if (!connectionLost) { clearTimeout(reconnectTimer.current); return }
    if (reconnectCount >= 3) {
      // Give up — go find new match
      setConnectionLost(false)
      setReconnectCount(0)
      destroyAllPeers()
      setMessages([])
      setStatus('searching')
      if (socketRef.current?.connected) findMatch(socketRef.current)
      return
    }
    // Retry reconnect after 3s
    reconnectTimer.current = setTimeout(() => {
      if (socketRef.current?.connected) {
        setConnectionLost(false)
        setReconnectCount(0)
      } else {
        setReconnectCount((n) => n + 1)
      }
    }, 3000)
    return () => clearTimeout(reconnectTimer.current)
  }, [connectionLost, reconnectCount]) // eslint-disable-line

  const fmt = (s) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

  const destroyAllPeers = () => {
    Object.values(peersRef.current).forEach((p) => { try { p.destroy() } catch {} })
    peersRef.current = {}
    setRemoteStreams({})
    setSquadMates([])
    setPartnerSock(null)
    setPartnerUid(null)
  }

  const findMatch = (socket) => {
    const p = prefsRef.current
    socket.emit('find-match', {
      mode:          p.mode         || 'solo',
      filterGender:  p.filterGender  || null,
      filterCountry: p.filterCountry || '',
      squadId:       p.squadId       || null,
    })
  }

  const createPeerForSocket = (socket, peerId, isInitiator) => {
    if (peersRef.current[peerId]) {
      try { peersRef.current[peerId].destroy() } catch {}
      delete peersRef.current[peerId]
    }

    const peer = new SimplePeer({
      initiator: isInitiator,
      stream:    localStreamRef.current,
      trickle:   true,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          { urls: 'stun:global.stun.twilio.com:3478' },
        ],
      },
    })

    peer.on('signal', (data) => {
      if (!socket.connected) return
      if      (data.type === 'offer')  socket.emit('webrtc-offer',         { offer:     data, to: peerId })
      else if (data.type === 'answer') socket.emit('webrtc-answer',        { answer:    data, to: peerId })
      else                             socket.emit('webrtc-ice-candidate', { candidate: data, to: peerId })
    })

    peer.on('stream', (remoteStream) => {
      setRemoteStreams((prev) => ({ ...prev, [peerId]: remoteStream }))
    })

    peer.on('error', (err) => console.warn('Peer error:', err.message))
    peer.on('close', () => {
      delete peersRef.current[peerId]
      setRemoteStreams((prev) => { const n = { ...prev }; delete n[peerId]; return n })
    })

    peersRef.current[peerId] = peer
  }

  useEffect(() => {
    let mounted = true

    const init = async () => {
      // Try video+audio with progressively simpler constraints, then audio-only, then nothing.
      let stream = null
      const audioConstraints = { echoCancellation: true, noiseSuppression: true }
      if (navigator.mediaDevices?.getUserMedia) {
        try {
          // First try: facingMode only (avoids OverconstrainedError on older iOS)
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'user' },
            audio: audioConstraints,
          })
        } catch {
          try {
            // Second try: any video
            stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: audioConstraints })
          } catch {
            try {
              // Third try: audio only
              stream = await navigator.mediaDevices.getUserMedia({ audio: audioConstraints })
            } catch {
              // No media at all — still allow text-only chat
            }
          }
        }
      }
      if (!mounted) { stream?.getTracks().forEach((t) => t.stop()); return }
      const camAvailable = !!(stream?.getVideoTracks().length)
      setHasCamera(camAvailable)
      if (stream) {
        localStreamRef.current = stream
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream
          // iOS Safari sometimes ignores autoPlay when srcObject is set programmatically
          localVideoRef.current.play().catch(() => {})
        }
      }

      // Progress past 'init' immediately — don't wait for socket to connect.
      // On Render free tier, the socket may take 50 s to wake; staying on
      // "Starting camera…" the whole time is confusing.
      if (mounted) setStatus('searching')

      const socket = io(import.meta.env.VITE_BACKEND_URL || '', { transports: ['websocket', 'polling'] })
      socketRef.current = socket

      socket.on('connect', () => {
        if (!mounted) return
        socket.emit('register', {
          userId:    user?.id       || null,
          username:  user?.username || 'Guest',
          gender:    user?.gender   || 'other',
          country:   user?.country  || '',
          isPremium: user?.isPremium || false,
          isVip:     user?.isVip    || false,
        })
        if (mounted) setStatus('searching')
        const p = prefsRef.current
        if (p.mode === 'private') {
          if (p.joining) socket.emit('join-private-room',  { code: p.privateCode })
          else           socket.emit('wait-private-room',  { code: p.privateCode })
        } else {
          findMatch(socket)
        }
      })

      socket.on('private-room-waiting', () => { if (mounted) setStatus('searching') })
      socket.on('private-room-error',   ({ message }) => {
        if (!mounted) return
        setStatus('searching')
        console.warn('Private room error:', message)
      })

      socket.on('you-are-banned', ({ reason, banType: bt, banExpiresAt: bea }) => {
        if (!mounted) return
        setBanReason(reason || 'Your account has been suspended.')
        setBanType(bt || null)
        setBanExpiresAt(bea ? new Date(bea) : null)
        setStatus('banned')
      })

      socket.on('waiting', () => { if (mounted) setStatus('searching') })

      socket.on('match-found', ({ room, peers, squadMates: mates, isInitiator, partnerId, partnerUserId }) => {
        if (!mounted) return

        // Destroy existing peers
        Object.values(peersRef.current).forEach((p) => { try { p.destroy() } catch {} })
        peersRef.current = {}
        setRemoteStreams({})

        setRoomId(room)
        setMessages([])
        setElapsed(0)
        setReportSent(false)
        setStatus('matched')
        setSquadMates(mates || [])

        // Support both new format (peers array) and legacy 1v1 format
        const peersToCreate = (peers && peers.length > 0)
          ? peers
          : (partnerId ? [{ socketId: partnerId, isInitiator }] : [])

        // Set partner sock to first opponent for reporting
        const opponents = peersToCreate.filter((p) => !(mates || []).includes(p.socketId))
        if (opponents.length > 0) {
          setPartnerSock(opponents[0].socketId)
          setPartnerUid(partnerUserId || null)
        }

        for (const { socketId: peerId, isInitiator: init } of peersToCreate) {
          createPeerForSocket(socket, peerId, init)
        }
      })

      // Route WebRTC signals to the correct peer using `from`
      socket.on('webrtc-offer',         ({ offer,     from }) => { if (peersRef.current[from]) try { peersRef.current[from].signal(offer)     } catch {} })
      socket.on('webrtc-answer',        ({ answer,    from }) => { if (peersRef.current[from]) try { peersRef.current[from].signal(answer)    } catch {} })
      socket.on('webrtc-ice-candidate', ({ candidate, from }) => { if (peersRef.current[from]) try { peersRef.current[from].signal(candidate) } catch {} })

      socket.on('chat-message', ({ message, timestamp }) => {
        if (!mounted) return
        setMessages((prev) => [...prev, { text: message, from: 'stranger', timestamp }])
        setUnread((n) => n + 1)
      })

      const handlePartnerGone = () => {
        if (!mounted) return
        Object.values(peersRef.current).forEach((p) => { try { p.destroy() } catch {} })
        peersRef.current = {}
        setRemoteStreams({})
        setSquadMates([])
        setMessages([])
        setReportSent(false)
        setStatus('searching')
        findMatch(socket)
      }
      socket.on('partner-skipped', handlePartnerGone)
      socket.on('partner-left',    handlePartnerGone)

      socket.on('disconnect', () => {
        if (!mounted) return
        if (statusRef.current === 'matched') {
          setConnectionLost(true)
          setReconnectCount(0)
        }
      })

      socket.on('admin-warning', ({ message }) => {
        if (!mounted) return
        setAdminWarning(message)
        setTimeout(() => setAdminWarning(''), 8000)
      })

      socket.on('gift-received', ({ emoji, from }) => {
        if (!mounted) return
        const id = Date.now() + Math.random()
        setFloatingGifts((prev) => [...prev, { id, emoji: emoji || '🎁', from, fromMe: false }])
        setTimeout(() => setFloatingGifts((prev) => prev.filter((g) => g.id !== id)), 2800)
        setGiftReceived({ gift: emoji || '🎁', from })
        setTimeout(() => setGiftReceived(null), 3500)
      })

      socket.on('gift-sent', ({ emoji }) => {
        if (!mounted) return
        const id = Date.now() + Math.random()
        setFloatingGifts((prev) => [...prev, { id, emoji: emoji || '🎁', fromMe: true }])
        setTimeout(() => setFloatingGifts((prev) => prev.filter((g) => g.id !== id)), 2800)
      })

      socket.on('tip-received', ({ from, yourShare, coins: newCoins }) => {
        if (!mounted) return
        setCoins(newCoins)
        setTipFeedback({ type: 'success', msg: `💰 ${from} tipped you ${yourShare} coins!` })
        setTimeout(() => setTipFeedback(null), 4000)
      })

      socket.on('tip-sent', ({ to, coins: newCoins }) => {
        if (!mounted) return
        setCoins(newCoins)
        setShowTip(false)
        setTipFeedback({ type: 'success', msg: `✅ Tip sent to ${to}!` })
        setTipLoading(false)
        setTimeout(() => setTipFeedback(null), 3500)
      })

      socket.on('tip-error', ({ message }) => {
        if (!mounted) return
        setTipFeedback({ type: 'error', msg: message })
        setTipLoading(false)
        setTimeout(() => setTipFeedback(null), 3500)
      })

      socket.on('coin-update', ({ coins: newCoins }) => {
        if (!mounted) return
        setCoins(newCoins)
      })
    }

    init()

    return () => {
      mounted = false
      destroyAllPeers()
      localStreamRef.current?.getTracks().forEach((t) => t.stop())
      socketRef.current?.disconnect()
      clearInterval(timerRef.current)
    }
  }, []) // eslint-disable-line

  const flipCamera = async () => {
    const newFacing = facingMode === 'user' ? 'environment' : 'user'
    setFacingMode(newFacing)
    localStreamRef.current?.getTracks().forEach((t) => t.stop())
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: newFacing, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: { echoCancellation: true, noiseSuppression: true },
      })
      localStreamRef.current = stream
      if (localVideoRef.current) localVideoRef.current.srcObject = stream
      // Replace the video track in all active peer connections
      const videoTrack = stream.getVideoTracks()[0]
      if (videoTrack) {
        Object.values(peersRef.current).forEach((peer) => {
          const sender = peer._pc?.getSenders().find((s) => s.track?.kind === 'video')
          if (sender) sender.replaceTrack(videoTrack).catch(() => {})
        })
      }
    } catch {
      setFacingMode(facingMode)
    }
  }

  const handleSkip = () => {
    destroyAllPeers()
    setMessages([])
    setReportSent(false)
    setStatus('searching')
    socketRef.current?.emit('skip')
    if (socketRef.current?.connected) findMatch(socketRef.current)
  }

  const handleEnd = () => {
    socketRef.current?.emit('end-chat')
    navigate('/')
  }

  const handleReport = async (reasonId) => {
    setShowReport(false)
    setReportSent(true)
    try {
      await axios.post('/api/reports', {
        reportedSocketId: partnerSockRef.current,
        reportedUserId:   partnerUidRef.current || null,
        reporterSocketId: socketRef.current?.id,
        reporterUserId:   user?.id || null,
        reason:           reasonId,
      })
    } catch {}
    handleSkip()
  }

  const handleBlock = async () => {
    if (!partnerUidRef.current || !user) return
    setBlockLoading(true)
    try {
      await axios.post(`/api/user/block/${partnerUidRef.current}`)
    } catch {}
    setBlockLoading(false)
    handleSkip()
  }

  const handleSendGift = async (giftId) => {
    if (!partnerSockRef.current) return
    setGiftSending(true)
    setGiftError('')
    try {
      const { data } = await axios.post('/api/user/send-gift', { giftId, recipientSocketId: partnerSockRef.current })
      setCoins(data.coins)
      setShowGifts(false)
    } catch (err) {
      setGiftError(err.response?.data?.error || 'Could not send gift')
    }
    setGiftSending(false)
  }

  const handleSendTip = () => {
    const amount = parseInt(tipAmount, 10)
    if (!amount || amount < 10) { setTipFeedback({ type: 'error', msg: 'Minimum tip is 10 coins' }); return }
    if (!partnerSockRef.current) { setTipFeedback({ type: 'error', msg: 'No partner to tip' }); return }
    setTipLoading(true)
    socketRef.current?.emit('send-tip', { amount, recipientSocketId: partnerSockRef.current })
  }

  const handleBoost = async () => {
    setBoostLoading(true)
    try {
      const { data } = await axios.post('/api/coins/boost')
      if (data.alreadyBoosted) {
        setTipFeedback({ type: 'error', msg: 'Boost already active!' })
      } else {
        setBoostActive(true)
        setTipFeedback({ type: 'success', msg: '⚡ Boost active! You\'re at the top of the queue for 1 hour.' })
        setTimeout(() => setBoostActive(false), 60 * 60 * 1000)
      }
    } catch (err) {
      setTipFeedback({ type: 'error', msg: err.response?.data?.error || 'Could not activate boost' })
    }
    setBoostLoading(false)
    setTimeout(() => setTipFeedback(null), 4000)
  }

  const handleSkipQueue = async () => {
    setSkipQueueLoading(true)
    try {
      await axios.post('/api/coins/skip-queue')
      // Re-emit find-match to instantly search again
      if (socketRef.current?.connected) findMatch(socketRef.current)
    } catch (err) {
      setTipFeedback({ type: 'error', msg: err.response?.data?.error || 'Could not skip queue' })
      setTimeout(() => setTipFeedback(null), 3000)
    }
    setSkipQueueLoading(false)
  }

  const handleSend = (e) => {
    e.preventDefault()
    if (!input.trim() || !roomId || status !== 'matched') return
    setMessages((prev) => [...prev, { text: input, from: 'me', timestamp: Date.now() }])
    socketRef.current?.emit('chat-message', { message: input, room: roomId })
    setInput('')
  }

  const toggleMute = () => {
    const track = localStreamRef.current?.getAudioTracks()[0]
    if (track) { track.enabled = !track.enabled; setIsMuted(!track.enabled) }
  }

  const toggleVideo = () => {
    const track = localStreamRef.current?.getVideoTracks()[0]
    if (track) { track.enabled = !track.enabled; setVideoOff(!track.enabled) }
  }

  const toggleChat = () => {
    setShowChat((v) => { if (!v) setUnread(0); return !v })
  }

  // Derive opponent vs squad-mate video entries
  const allRemoteEntries   = Object.keys(remoteStreams)
  const opponentSocketIds  = allRemoteEntries.filter((sid) => !squadMates.includes(sid))
  const mateSocketIds      = allRemoteEntries.filter((sid) => squadMates.includes(sid))

  // ── Shared chat content ────────────────────────────────────────────────────
  const ChatContent = () => (
    <>
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-white/10 flex-shrink-0">
        <div className="flex items-center gap-2">
          <MessageSquare size={14} className="text-vybe-purple-light" />
          <h3 className="font-bold text-white text-sm">Live Chat</h3>
        </div>
        <button
          onClick={() => setShowChat(false)}
          className="w-7 h-7 flex items-center justify-center rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-all"
        >
          <X size={15} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
        {messages.length === 0 ? (
          <div className="text-center py-10">
            <MessageSquare size={26} className="text-white/20 mx-auto mb-3" />
            <p className="text-white/40 text-[13px]">
              {status === 'matched' ? 'Say hello! 👋' : 'Waiting to connect…'}
            </p>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.from === 'me' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[82%] px-3.5 py-2 rounded-2xl text-[13px] leading-relaxed ${
                msg.from === 'me'
                  ? 'bg-vybe-purple text-white rounded-br-sm'
                  : 'bg-white/8 text-gray-200 rounded-bl-sm border border-white/10'
              }`}>
                {msg.text}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSend} className="p-3 border-t border-white/10 flex-shrink-0">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={status === 'matched' ? 'Type a message…' : 'Connecting…'}
            disabled={status !== 'matched'}
            className="flex-1 px-3.5 py-2.5 bg-white/6 border border-white/10 rounded-xl text-white placeholder-white/30 text-sm focus:border-vybe-purple focus:outline-none transition-all disabled:opacity-40"
          />
          <button
            type="submit"
            disabled={!input.trim() || status !== 'matched'}
            className="w-10 h-10 rounded-xl bg-vybe-purple text-white flex items-center justify-center hover:bg-vybe-purple-light transition-all disabled:opacity-40 flex-shrink-0"
          >
            <Send size={13} />
          </button>
        </div>
      </form>
    </>
  )

  const handleUnbanPurchase = async () => {
    setUnbanLoading(true)
    try {
      const token = localStorage.getItem('vybe_token')
      const { data } = await axios.post('/api/unban/create-session', {}, {
        headers: { Authorization: `Bearer ${token}` },
      })
      window.location.href = data.url
    } catch (err) {
      setUnbanLoading(false)
      alert(err.response?.data?.error || 'Payment unavailable. Please try again later.')
    }
  }

  const formatBanExpiry = () => {
    if (!banExpiresAt) return null
    const diff = banExpiresAt - Date.now()
    if (diff <= 0) return 'soon'
    const days  = Math.floor(diff / 86400000)
    const hours = Math.floor((diff % 86400000) / 3600000)
    if (days > 0) return `${days}d ${hours}h`
    const mins = Math.floor((diff % 3600000) / 60000)
    return `${hours}h ${mins}m`
  }

  // ── Banned screen ──────────────────────────────────────────────────────────
  if (status === 'banned') {
    const isPermanent = banType === 'permanent'
    const timeLeft    = formatBanExpiry()
    return (
      <div className="h-screen bg-vybe-bg flex flex-col items-center justify-center px-6 font-space text-center">
        <div className="w-16 h-16 rounded-full bg-red-500/15 border border-red-500/30 flex items-center justify-center mx-auto mb-6">
          <Ban size={28} className="text-red-400" />
        </div>
        <h1 className="text-2xl font-black text-white mb-3">
          {isPermanent ? 'Permanently Banned' : 'Account Suspended'}
        </h1>
        <p className="text-vybe-muted text-sm max-w-sm leading-relaxed mb-2">{banReason}</p>
        {timeLeft && !isPermanent && (
          <p className="text-yellow-400 text-sm font-bold mb-2">Time remaining: {timeLeft}</p>
        )}
        <p className="text-vybe-muted text-xs max-w-sm mb-6">
          Questions? Contact us at{' '}
          <span className="text-vybe-purple-light">support@vybelivechat.com</span>
        </p>

        {!isPermanent && user && (
          <button
            onClick={handleUnbanPurchase}
            disabled={unbanLoading}
            className="w-full max-w-xs py-3.5 rounded-xl bg-green-600 hover:bg-green-500 text-white font-black text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-60 disabled:cursor-not-allowed mb-3"
          >
            {unbanLoading ? (
              <><Loader2 size={15} className="animate-spin" /> Processing…</>
            ) : (
              <>Remove Ban for $4.99</>
            )}
          </button>
        )}
        {isPermanent && (
          <p className="text-red-400/60 text-xs mb-4">Permanent bans cannot be removed.</p>
        )}

        <button onClick={() => navigate('/')} className="px-6 py-3 rounded-xl border border-vybe-border text-vybe-muted hover:text-white text-sm transition-colors">
          Back to Home
        </button>
      </div>
    )
  }

  return (
    <div className="h-screen bg-black overflow-hidden font-space">
      <div className="h-full flex">

        {/* ── Connection lost overlay ───────────────────────────────── */}
        <AnimatePresence>
          {connectionLost && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center px-6"
              style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)' }}
            >
              <div className="text-center max-w-xs">
                <Loader2 size={44} className="text-vybe-purple animate-spin mx-auto mb-5" />
                <h2 className="text-xl font-black text-white mb-2">
                  {reconnectCount < 3 ? 'Connection lost' : 'Could not reconnect'}
                </h2>
                <p className="text-vybe-muted text-sm leading-relaxed">
                  {reconnectCount < 3
                    ? `Trying to reconnect… (attempt ${reconnectCount + 1}/3)`
                    : 'Finding you a new match…'}
                </p>
                {reconnectCount > 0 && reconnectCount < 3 && (
                  <div className="mt-4 flex justify-center gap-1">
                    {[0, 1, 2].map((i) => (
                      <div key={i} className={`w-2 h-2 rounded-full ${i < reconnectCount ? 'bg-red-400' : 'bg-vybe-border'}`} />
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Admin warning toast ───────────────────────────────────── */}
        <AnimatePresence>
          {adminWarning && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="fixed top-4 left-1/2 -translate-x-1/2 z-50 max-w-sm w-full px-4"
            >
              <div className="bg-yellow-500/15 border border-yellow-500/40 rounded-2xl px-5 py-4 flex items-start gap-3 backdrop-blur-sm">
                <Shield size={16} className="text-yellow-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-yellow-300 text-xs font-black uppercase tracking-wider mb-1">Admin Warning</p>
                  <p className="text-white text-sm leading-relaxed">{adminWarning}</p>
                </div>
                <button onClick={() => setAdminWarning('')} className="text-white/40 hover:text-white ml-auto">
                  <X size={14} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Email verification soft banner ───────────────────────── */}
        {user && !user.emailVerified && status === 'matched' && (
          <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 px-4 w-full max-w-sm pointer-events-none">
            <div className="bg-blue-500/15 border border-blue-500/30 rounded-2xl px-4 py-3 flex items-center gap-3 backdrop-blur-sm pointer-events-auto">
              <span className="text-sm">📧</span>
              <p className="text-blue-300 text-xs flex-1">Verify your email to unlock badges &amp; all features</p>
              <Link to="/settings?tab=account" className="text-blue-400 text-xs font-bold hover:underline flex-shrink-0">→ Settings</Link>
            </div>
          </div>
        )}

        {/* ── Floating gift animations ──────────────────────────────── */}
        <div className="fixed inset-0 z-50 pointer-events-none overflow-hidden">
          <AnimatePresence>
            {floatingGifts.map((g) => (
              <motion.div
                key={g.id}
                initial={{ opacity: 1, y: 0, x: g.fromMe ? '-50%' : '-50%', scale: 1 }}
                animate={{ opacity: 0, y: -280, scale: 1.6 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 2.4, ease: 'easeOut' }}
                className="absolute text-6xl select-none"
                style={{ left: g.fromMe ? '30%' : '70%', bottom: '25%' }}
              >
                {g.emoji}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* ── Tip / gift feedback toast ─────────────────────────────── */}
        <AnimatePresence>
          {tipFeedback && (
            <motion.div
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl text-sm font-semibold backdrop-blur-sm whitespace-nowrap"
              style={{
                background: tipFeedback.type === 'success' ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
                border: `1px solid ${tipFeedback.type === 'success' ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
                color:  tipFeedback.type === 'success' ? '#4ade80' : '#f87171',
              }}
            >
              {tipFeedback.msg}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Gift received toast ───────────────────────────────────── */}
        <AnimatePresence>
          {giftReceived && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 px-6 py-4 rounded-2xl bg-vybe-card2 border border-blue-500/25 text-center backdrop-blur-sm"
            >
              <p className="text-3xl mb-1">{giftReceived.gift}</p>
              <p className="text-white text-sm font-bold">{giftReceived.from} sent you a gift!</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Tip modal ────────────────────────────────────────────── */}
        <AnimatePresence>
          {showTip && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 flex items-end justify-center pb-24 px-4"
              style={{ background: 'rgba(0,0,0,0.75)' }}
              onClick={() => setShowTip(false)}
            >
              <motion.div
                initial={{ y: 48 }}
                animate={{ y: 0 }}
                exit={{ y: 48 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-sm rounded-3xl p-5 border border-white/10"
                style={{ background: 'linear-gradient(160deg,#0d0d1c,#09091a)' }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-white font-black text-sm">Send a Tip 💰</h3>
                    <p className="text-white/40 text-xs mt-0.5">30% goes to Vybe · Min 10 coins</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-yellow-300 text-xs font-black">🪙 {coins.toLocaleString()}</span>
                    <button onClick={() => setShowTip(false)} className="text-white/40 hover:text-white"><X size={15} /></button>
                  </div>
                </div>
                <div className="flex gap-2 mb-3">
                  {[10, 50, 100, 250].map((v) => (
                    <button
                      key={v}
                      onClick={() => setTipAmount(String(v))}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${tipAmount === String(v) ? 'bg-blue-600 text-white' : 'bg-white/8 text-white/60 hover:bg-white/12'}`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2 mb-4">
                  <input
                    type="number"
                    value={tipAmount}
                    onChange={(e) => setTipAmount(e.target.value)}
                    placeholder="Custom amount"
                    min="10"
                    className="flex-1 bg-white/6 border border-white/12 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-blue-500/60 transition-all"
                  />
                </div>
                {tipAmount && parseInt(tipAmount) >= 10 && (
                  <p className="text-white/40 text-xs mb-3 text-center">
                    Partner receives {Math.floor(parseInt(tipAmount) * 0.70)} coins · Vybe keeps {Math.ceil(parseInt(tipAmount) * 0.30)}
                  </p>
                )}
                <button
                  onClick={handleSendTip}
                  disabled={tipLoading || !tipAmount || parseInt(tipAmount) < 10}
                  className="w-full py-3 rounded-xl text-sm font-extrabold text-white disabled:opacity-50 transition-all"
                  style={{ background: 'linear-gradient(135deg,#1b62f5,#4b88f7)', boxShadow: '0 0 20px rgba(27,98,245,0.4)' }}
                >
                  {tipLoading ? 'Sending…' : `Send ${tipAmount || 0} coins`}
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Gift picker overlay ───────────────────────────────────── */}
        <AnimatePresence>
          {showGifts && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 flex items-end justify-center pb-24 px-4"
              style={{ background: 'rgba(0,0,0,0.75)' }}
              onClick={() => { setShowGifts(false); setGiftError('') }}
            >
              <motion.div
                initial={{ y: 40 }}
                animate={{ y: 0 }}
                exit={{ y: 40 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-sm rounded-3xl p-5 border border-white/10"
                style={{ background: 'linear-gradient(160deg,#0d0d1c,#09091a)' }}
              >
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-white font-black text-sm">Send a Gift 🎁</h3>
                  <div className="flex items-center gap-3">
                    <span className="text-yellow-300 text-xs font-black">🪙 {coins.toLocaleString()}</span>
                    <button onClick={() => { setShowGifts(false); setGiftError('') }} className="text-white/40 hover:text-white"><X size={16} /></button>
                  </div>
                </div>
                <p className="text-white/30 text-[10px] mb-4">Gift flies across both screens when sent</p>
                {giftError && (
                  <p className="text-red-400 text-xs mb-3 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20">{giftError}</p>
                )}
                <div className="grid grid-cols-5 gap-2">
                  {Object.entries(gifts).map(([id, g]) => (
                    <button
                      key={id}
                      onClick={() => handleSendGift(id)}
                      disabled={giftSending || coins < g.cost}
                      className="flex flex-col items-center gap-1 p-3 rounded-2xl bg-white/4 border border-white/8 hover:border-blue-500/40 hover:bg-blue-500/8 transition-all disabled:opacity-40"
                    >
                      <span className="text-2xl">{g.emoji || g.name.split(' ')[0]}</span>
                      <span className="text-yellow-300 text-[10px] font-black">{g.cost}🪙</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Camera area ──────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col min-w-0 relative">

          {/* Status overlay — covers both camera sections */}
          <AnimatePresence>
            {status !== 'matched' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-20 flex flex-col items-center justify-center px-6"
                style={{ background: '#0a0a0f' }}
              >
                {status === 'searching' && searchElapsed < 30 && (
                  <div className="text-center max-w-sm">
                    {/* Pulsing Vybe logo */}
                    <div className="relative w-24 h-24 mx-auto mb-8">
                      <div className="absolute inset-0 rounded-full border-2 border-vybe-purple/60 animate-ping" style={{ animationDuration: '1.5s' }} />
                      <div className="absolute inset-2 rounded-full border border-vybe-purple/30 animate-pulse" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-lg font-black tracking-widest">
                          <span style={{ background: 'linear-gradient(135deg,#2572ff,#70a8ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>VY</span>
                          <span className="text-white">BE</span>
                        </div>
                      </div>
                    </div>

                    {/* Cycling search text */}
                    <AnimatePresence mode="wait">
                      <motion.h2
                        key={prefs.mode === 'private' ? 'private' : searchTextIdx}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.3 }}
                        className="text-xl sm:text-2xl font-black text-white mb-2"
                      >
                        {prefs.mode === 'private' ? 'Waiting for your friend…' : SEARCH_TEXTS[searchTextIdx]}
                      </motion.h2>
                    </AnimatePresence>

                    <p className="text-vybe-muted text-sm mb-2">
                      {onlineCount > 0 && (
                        <span className="inline-flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                          {onlineCount} {onlineCount === 1 ? 'person' : 'people'} online
                        </span>
                      )}
                    </p>

                    <div className="loading-dots flex justify-center mb-8"><span /><span /><span /></div>

                    {/* Coin actions while searching */}
                    {user && (
                      <div className="flex gap-2 mb-5 w-full max-w-xs">
                        <motion.button
                          onClick={handleBoost}
                          disabled={boostLoading || boostActive}
                          whileTap={{ scale: 0.96 }}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
                          style={{ background: boostActive ? 'rgba(251,191,36,0.15)' : 'rgba(27,98,245,0.12)', border: `1px solid ${boostActive ? 'rgba(251,191,36,0.3)' : 'rgba(27,98,245,0.25)'}`, color: boostActive ? '#fbbf24' : '#4b88f7' }}
                          title="Move to front of queue for 1 hour"
                        >
                          <span>⚡</span>
                          <span>{boostActive ? 'Boosted!' : `Boost`}</span>
                        </motion.button>
                        <motion.button
                          onClick={handleSkipQueue}
                          disabled={skipQueueLoading}
                          whileTap={{ scale: 0.96 }}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold text-white/60 hover:text-white transition-all disabled:opacity-50"
                          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                          title="Instantly retry matching"
                        >
                          <span>⏭️</span>
                          <span>{skipQueueLoading ? '…' : 'Skip'}</span>
                        </motion.button>
                      </div>
                    )}

                    <button
                      onClick={handleEnd}
                      className="px-6 py-3 rounded-xl border border-vybe-border text-vybe-muted hover:text-white hover:border-vybe-purple/40 transition-all text-sm font-medium"
                    >
                      Cancel &amp; Leave
                    </button>
                  </div>
                )}

                {status === 'searching' && searchElapsed >= 30 && (
                  <div className="text-center max-w-sm">
                    <div className="text-5xl mb-5">😴</div>
                    <h2 className="text-2xl font-black text-white mb-3">No one available right now</h2>
                    <p className="text-vybe-muted text-sm leading-relaxed mb-2">
                      Check back soon — Vybe gets busiest on evenings and weekends!
                    </p>
                    <div className="bg-vybe-card border border-vybe-border rounded-2xl p-4 mb-6 text-left space-y-2">
                      <p className="text-xs font-bold text-vybe-muted uppercase tracking-wider mb-3">Estimated busy times</p>
                      {[
                        { day: 'Weekday evenings', time: '7 PM – 11 PM' },
                        { day: 'Weekends',         time: 'All day' },
                        { day: 'Friday nights',    time: 'Peak traffic 🔥' },
                      ].map(({ day, time }) => (
                        <div key={day} className="flex justify-between text-sm">
                          <span className="text-white/70">{day}</span>
                          <span className="text-vybe-purple-light font-semibold">{time}</span>
                        </div>
                      ))}
                    </div>
                    <div className="space-y-3">
                      <button
                        onClick={() => { setSearchElapsed(0); findMatch(socketRef.current) }}
                        className="w-full py-3.5 rounded-xl btn-purple text-white font-black text-sm"
                      >
                        Try Again
                      </button>
                      <button
                        onClick={handleEnd}
                        className="w-full py-3 rounded-xl border border-vybe-border text-vybe-muted hover:text-white text-sm transition-colors"
                      >
                        Back to Home
                      </button>
                    </div>
                  </div>
                )}
                {status === 'init' && (
                  <div className="text-center">
                    <Loader2 size={40} className="text-vybe-purple animate-spin mx-auto mb-4" />
                    <p className="text-white font-semibold">Starting camera…</p>
                  </div>
                )}
                {/* No-camera recommendation banner */}
                {!hasCamera && !noCamDismissed && (status === 'searching' || status === 'matched') && (
                  <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 w-[calc(100%-2rem)] max-w-sm">
                    <div className="flex items-start gap-3 px-4 py-3 rounded-2xl text-sm"
                      style={{ background: 'rgba(10,10,22,0.92)', border: '1px solid rgba(255,255,255,0.12)', backdropFilter: 'blur(16px)' }}>
                      <span className="text-xl flex-shrink-0 mt-0.5">📷</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-bold text-[13px] leading-snug">No webcam detected</p>
                        <p className="text-white/50 text-[11px] mt-0.5 leading-relaxed">
                          You can still chat, but adding a webcam gives you a <span className="text-blue-400 font-semibold">much better chance</span> of finding someone.
                        </p>
                      </div>
                      <button onClick={() => setNoCamDismissed(true)} className="text-white/30 hover:text-white/60 transition-colors flex-shrink-0 mt-0.5 text-base leading-none">✕</button>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── TOP 50%: Opponent camera(s) ───────────────────────── */}
          <div className={`flex-1 relative overflow-hidden bg-[#0a0a0f] flex ${opponentSocketIds.length > 1 ? '' : ''}`}>
            {opponentSocketIds.length === 0 ? (
              /* Placeholder while connecting */
              <div className="w-full h-full flex items-center justify-center">
                {status === 'matched' && (
                  <div className="loading-dots flex"><span /><span /><span /></div>
                )}
              </div>
            ) : (
              opponentSocketIds.map((sid, idx) => (
                <div
                  key={sid}
                  className={`relative overflow-hidden bg-[#0a0a0f] flex-1 ${idx > 0 ? 'border-l border-white/10' : ''}`}
                >
                  <video
                    ref={(el) => { remoteVideoRefs.current[sid] = el }}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover no-mirror"
                  />
                  {/* Opponent label */}
                  <div className="absolute bottom-3 left-4 z-10">
                    <span className="text-[10px] font-black tracking-widest text-white/50 uppercase bg-black/30 backdrop-blur-sm px-2 py-1 rounded-md">
                      {opponentSocketIds.length > 1 ? `Duo ${idx + 1}` : 'Stranger'}
                    </span>
                  </div>
                </div>
              ))
            )}

            {/* Top gradient bar — logo + timer + report */}
            <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 pt-3 pb-10 bg-gradient-to-b from-black/70 to-transparent pointer-events-none z-10">
              <button onClick={() => navigate('/')} className="text-base sm:text-lg font-black tracking-widest hover:opacity-75 transition-opacity pointer-events-auto">
                <span style={{ background: 'linear-gradient(135deg,#2572ff,#70a8ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>VY</span>
                <span className="text-white">BE</span>
              </button>
              <div className="flex items-center gap-2 pointer-events-auto">
                {status === 'matched' && (
                  <span className="text-white/70 text-xs font-medium bg-black/50 px-2.5 py-1 rounded-lg backdrop-blur-sm">
                    {fmt(elapsed)}
                  </span>
                )}
                {reportSent ? (
                  <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500/20 text-green-400 text-xs font-semibold">
                    ✓ Reported
                  </span>
                ) : (
                  <button
                    onClick={() => status === 'matched' && setShowReport(true)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/50 text-xs font-semibold backdrop-blur-sm transition-all ${
                      status === 'matched'
                        ? 'text-red-400 hover:text-red-300 hover:bg-red-500/20'
                        : 'text-white/30 cursor-not-allowed'
                    }`}
                  >
                    <Flag size={11} />
                    <span className="hidden sm:inline">Report</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-white/10 flex-shrink-0 z-10" />

          {/* ── BOTTOM 50%: Own camera + squad mates ──────────────── */}
          <div className="flex-1 relative overflow-hidden bg-[#0a0a0f]">
            <div className="h-full flex">
              {/* Self video */}
              <div className={`relative overflow-hidden ${mateSocketIds.length > 0 ? 'flex-1 border-r border-white/10' : 'w-full h-full'}`}>
                <video
                  ref={localVideoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                />
                {/* No-camera placeholder */}
                {!hasCamera && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0a0a14] z-10 gap-2">
                    <div className="w-14 h-14 rounded-full bg-white/8 border border-white/10 flex items-center justify-center">
                      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                      </svg>
                    </div>
                    <p className="text-white/25 text-[10px] font-semibold tracking-wider uppercase">No Camera</p>
                  </div>
                )}
                {videoOff && hasCamera && (
                  <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-10">
                    <VideoOff size={22} className="text-white/30" />
                  </div>
                )}
                <div className="absolute top-3 left-4 z-10">
                  <span className="text-[10px] font-black tracking-widest text-white/50 uppercase bg-black/30 backdrop-blur-sm px-2 py-1 rounded-md">
                    You
                  </span>
                </div>

                {/* Flip camera — mobile only */}
                {hasCamera && !videoOff && (
                  <button
                    onClick={flipCamera}
                    className="absolute top-3 right-3 w-9 h-9 rounded-xl flex items-center justify-center z-10"
                    style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(10px)' }}
                    title="Flip camera"
                  >
                    <Camera size={16} className="text-white" />
                  </button>
                )}
              </div>

              {/* Squad mate video(s) */}
              {mateSocketIds.map((sid, idx) => (
                <div key={sid} className={`flex-1 relative overflow-hidden ${idx > 0 ? 'border-l border-white/10' : ''}`}>
                  <video
                    ref={(el) => { remoteVideoRefs.current[sid] = el }}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 left-4 z-10">
                    <span className="text-[10px] font-black tracking-widest text-vybe-purple-light/80 uppercase bg-black/30 backdrop-blur-sm px-2 py-1 rounded-md">
                      Duo
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Controls pill — bottom center of bottom section */}
            <div className="absolute bottom-5 left-0 right-0 flex justify-center px-4 z-10">
              <div className="flex items-center gap-1.5 sm:gap-2.5 px-3 sm:px-5 py-3 rounded-full shadow-[0_8px_40px_rgba(0,0,0,0.7)]"
                   style={{ background: 'rgba(6,6,16,0.82)', backdropFilter: 'blur(24px) saturate(1.5)', border: '1px solid rgba(255,255,255,0.1)' }}>

                <button
                  onClick={toggleMute}
                  className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center transition-all flex-shrink-0 ${
                    isMuted ? 'bg-red-500 text-white' : 'text-white/80 hover:bg-white/15'
                  }`}
                >
                  {isMuted ? <MicOff size={15} /> : <Mic size={15} />}
                </button>

                {hasCamera && (
                  <button
                    onClick={toggleVideo}
                    className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center transition-all flex-shrink-0 ${
                      videoOff ? 'bg-red-500 text-white' : 'text-white/80 hover:bg-white/15'
                    }`}
                  >
                    {videoOff ? <VideoOff size={15} /> : <Video size={15} />}
                  </button>
                )}
                {!hasCamera && (
                  <button
                    disabled
                    title="No webcam detected"
                    className="w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center transition-all flex-shrink-0 text-white/20 cursor-not-allowed"
                  >
                    <VideoOff size={15} />
                  </button>
                )}

                <div className="w-px h-6 bg-white/15 mx-1 flex-shrink-0" />

                {/* Gift + Tip buttons — logged-in only */}
                {user && status === 'matched' && (
                  <>
                    <motion.button
                      onClick={() => { setShowGifts(true); setGiftError('') }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="w-10 h-10 rounded-full flex items-center justify-center text-yellow-400/80 hover:bg-white/15 transition-all flex-shrink-0"
                      title="Send gift"
                    >
                      <Gift size={15} />
                    </motion.button>
                    <motion.button
                      onClick={() => setShowTip(true)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="w-10 h-10 rounded-full flex items-center justify-center font-black transition-all flex-shrink-0 text-sm"
                      style={{ color: 'rgba(250,204,21,0.8)' }}
                      title="Send tip"
                    >
                      💰
                    </motion.button>
                  </>
                )}

                {/* Block button — logged-in only */}
                {user && partnerUid && status === 'matched' && (
                  <motion.button
                    onClick={handleBlock}
                    disabled={blockLoading}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-10 h-10 rounded-full flex items-center justify-center text-red-400/60 hover:bg-red-500/15 hover:text-red-400 transition-all flex-shrink-0 disabled:opacity-40"
                    title="Block & skip"
                  >
                    <UserX size={15} />
                  </motion.button>
                )}

                <motion.button
                  onClick={handleSkip}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center gap-1.5 px-3.5 sm:px-5 py-2 rounded-full text-vybe-purple-light font-bold text-sm flex-shrink-0 transition-all hover:bg-vybe-purple/20"
                  style={{ border: '1px solid rgba(75,136,247,0.45)' }}
                >
                  <SkipForward size={14} />
                  <span>Skip</span>
                </motion.button>

                <motion.button
                  onClick={handleEnd}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center gap-1.5 px-3.5 sm:px-5 py-2 rounded-full bg-red-600 hover:bg-red-500 text-white font-bold text-sm transition-all flex-shrink-0"
                  style={{ boxShadow: '0 0 18px rgba(220,38,38,0.35)' }}
                >
                  <PhoneOff size={14} />
                  <span className="hidden xs:inline">End</span>
                </motion.button>

                {/* Chat toggle — mobile only */}
                <button
                  onClick={toggleChat}
                  className={`sm:hidden relative w-10 h-10 rounded-full flex items-center justify-center transition-all flex-shrink-0 ${
                    showChat ? 'bg-vybe-purple text-white' : 'text-white/80 hover:bg-white/15'
                  }`}
                >
                  <MessageSquare size={15} />
                  {unread > 0 && !showChat && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full text-[9px] font-black flex items-center justify-center">
                      {unread > 9 ? '9+' : unread}
                    </span>
                  )}
                </button>

              </div>
            </div>
          </div>

          {/* Chat tab — desktop only, right edge of camera area */}
          <button
            onClick={toggleChat}
            className="hidden sm:flex absolute right-0 top-1/2 -translate-y-1/2 z-30 flex-col items-center justify-center gap-1 w-5 h-16 bg-white/8 hover:bg-white/15 backdrop-blur-sm border-y border-l border-white/10 rounded-l-lg transition-all"
          >
            <ChevronRight
              size={13}
              className={`text-white/60 transition-transform duration-300 ${showChat ? 'rotate-180' : ''}`}
            />
            {unread > 0 && !showChat && (
              <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
            )}
          </button>

        </div>

        {/* ── Desktop chat panel ───────────────────────────────────── */}
        <motion.div
          className="hidden sm:flex flex-col flex-shrink-0 overflow-hidden border-l border-white/10"
          style={{ background: '#0d0d18' }}
          animate={{ width: showChat ? 340 : 0 }}
          transition={{ type: 'spring', damping: 28, stiffness: 260 }}
        >
          <div className="w-[340px] h-full flex flex-col">
            <ChatContent />
          </div>
        </motion.div>

      </div>

      {/* ── Mobile chat panel — slides up from bottom ────────────── */}
      <motion.div
        className="sm:hidden fixed inset-x-0 bottom-0 flex flex-col rounded-t-2xl border-t border-white/10 z-50"
        style={{ height: '72%', background: '#0d0d18' }}
        animate={{ y: showChat ? 0 : '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 260 }}
      >
        <div className="flex justify-center pt-2.5 pb-1 flex-shrink-0">
          <div className="w-8 h-1 rounded-full bg-white/20" />
        </div>
        <ChatContent />
      </motion.div>

      {/* ── Report modal ──────────────────────────────────────────── */}
      <AnimatePresence>
        {showReport && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/65 z-40"
              onClick={() => setShowReport(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              transition={{ type: 'spring', damping: 26, stiffness: 320 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[min(320px,90vw)] bg-vybe-bg2 border border-vybe-border rounded-2xl p-5 shadow-purple"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-xl bg-red-500/15 border border-red-500/25 flex items-center justify-center flex-shrink-0">
                  <Shield size={16} className="text-red-400" />
                </div>
                <div>
                  <h3 className="font-black text-white text-sm">Report User</h3>
                  <p className="text-vybe-muted text-[11px]">Select a reason — you will not be identified</p>
                </div>
              </div>
              <div className="space-y-1.5">
                {REPORT_REASONS.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => handleReport(r.id)}
                    className="w-full text-left px-4 py-3 rounded-xl text-[13px] text-gray-300 hover:bg-vybe-border hover:text-white transition-colors flex items-center justify-between group min-h-[44px]"
                  >
                    {r.label}
                    <ChevronRight size={13} className="text-vybe-muted group-hover:text-white transition-colors flex-shrink-0" />
                  </button>
                ))}
              </div>
              <button
                onClick={() => setShowReport(false)}
                className="w-full mt-3 py-3 rounded-xl border border-vybe-border text-vybe-muted hover:text-white text-[13px] transition-colors"
              >
                Cancel
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
