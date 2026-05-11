import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  SkipForward, PhoneOff, Flag, Send, Mic, MicOff, Video, VideoOff,
  MessageSquare, X, ChevronRight, Globe, Shield, ShieldCheck, Loader2, Ban, Gift, UserX, UserPlus, Camera, Crown, Zap,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { io } from 'socket.io-client'
import SimplePeer from 'simple-peer'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'
import VybeCoin from '../components/VybeCoin'
import { VybeBadge } from '../components/VybeBadge'
import { playMatchFound, playGiftReceived, playGiftSent, playTipSent, playClick } from '../utils/sounds'

// Defined outside ChatPage so the reference is stable across re-renders (no unmount flicker)
function BarBtn({ onClick, children, label, active, red, disabled: dis, title: t }) {
  return (
    <button onClick={onClick} disabled={dis} title={t || label}
      className={`flex flex-col items-center gap-0.5 px-2.5 py-1.5 rounded-xl select-none disabled:opacity-40 disabled:cursor-default
        ${red ? 'text-red-400/80 hover:text-red-300' : active ? 'text-vybe-purple-light' : 'text-white/55 hover:text-white'}`}
      style={{ transition: 'color 150ms ease' }}>
      <div className="w-9 h-9 rounded-xl flex items-center justify-center"
        style={{
          transition: 'background-color 150ms ease, box-shadow 150ms ease',
          background: red && active ? '#dc2626' : red ? 'rgba(239,68,68,0.15)' : active ? 'rgba(139,92,246,0.25)' : 'rgba(255,255,255,0.06)',
        }}>
        {children}
      </div>
      <span className="text-[9px] font-medium tracking-wide whitespace-nowrap">{label}</span>
    </button>
  )
}

const CHAT_BADGES = [
  { id: 'spark', name: 'Spark',         cost: 75,  rarity: 'common',    label: 'Common'    },
  { id: 'star',  name: 'Shooting Star', cost: 120, rarity: 'common',    label: 'Common'    },
  { id: 'flame', name: 'Flame',         cost: 250, rarity: 'rare',      label: 'Rare'      },
  { id: 'orb',   name: 'Lightning Orb', cost: 480, rarity: 'epic',      label: 'Epic'      },
  { id: 'crown', name: 'Cosmic Crown',  cost: 950, rarity: 'legendary', label: 'Legendary' },
]

const RARITY_COLORS = {
  common:    { bg: 'rgba(250,204,21,0.07)',   border: 'rgba(250,204,21,0.22)',  glow: 'rgba(250,204,21,0.15)',   text: '#fde047' },
  rare:      { bg: 'rgba(249,115,22,0.1)',    border: 'rgba(249,115,22,0.38)',  glow: 'rgba(249,115,22,0.22)',   text: '#fb923c' },
  epic:      { bg: 'rgba(139,92,246,0.1)',    border: 'rgba(139,92,246,0.38)',  glow: 'rgba(139,92,246,0.26)',   text: '#a78bfa' },
  legendary: { bg: 'rgba(251,191,36,0.12)',   border: 'rgba(251,191,36,0.48)', glow: 'rgba(251,191,36,0.38)',   text: '#fbbf24' },
}


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
  const [giftSending,    setGiftSending]      = useState(false)
  const [giftError,      setGiftError]        = useState('')
  const [giftReceived,   setGiftReceived]     = useState(null)
  const [partnerUsername,      setPartnerUsername]      = useState(null)
  const [partnerAvatar,        setPartnerAvatar]        = useState(null)
  const [partnerIsVip,         setPartnerIsVip]         = useState(false)
  const [partnerIsPremium,     setPartnerIsPremium]     = useState(false)
  const [partnerEmailVerified, setPartnerEmailVerified] = useState(false)
  const [strangerHidden,   setStrangerHidden]   = useState(false)
  const [blockLoading,   setBlockLoading]     = useState(false)
  const [friendReqSent,  setFriendReqSent]    = useState(false)
  const [friendReqLoad,  setFriendReqLoad]    = useState(false)
  const [coins,          setCoins]            = useState(user?.coins ?? 0)
  const [cashableCoins,  setCashableCoins]    = useState(user?.cashableCoins ?? 0)
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
    // Always fetch fresh balance — localStorage can be stale
    if (user) {
      axios.get('/api/coins').then(({ data }) => {
        setCoins(data.coins ?? 0)
        setCashableCoins(data.cashableCoins ?? 0)
      }).catch(() => {
        if (user?.coins !== undefined) setCoins(user.coins)
      })
    }
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
    setPartnerAvatar(null)
    setPartnerIsVip(false)
    setPartnerIsPremium(false)
    setPartnerEmailVerified(false)
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
          userId:        user?.id            || null,
          username:      user?.username      || 'Guest',
          avatar:        user?.avatar        || null,
          gender:        user?.gender        || 'other',
          country:       user?.country       || '',
          isPremium:     user?.isPremium     || false,
          isVip:         user?.isVip         || false,
          emailVerified: user?.emailVerified || false,
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

      socket.on('match-found', ({ room, peers, squadMates: mates, isInitiator, partnerId, partnerUserId, partnerUsername: pUsername, partnerAvatar: pAvatar, partnerIsPremium: pIsPremium, partnerIsVip: pIsVip, partnerEmailVerified: pEmailVerified }) => {
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
        setStrangerHidden(false)
        setPartnerUsername(pUsername || null)
        setPartnerAvatar(pAvatar || null)
        setPartnerIsVip(pIsVip || false)
        setPartnerIsPremium(pIsPremium || false)
        setPartnerEmailVerified(pEmailVerified || false)
        setFriendReqSent(false)
        playMatchFound()

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

      socket.on('gift-received', ({ rarity, giftId, from }) => {
        if (!mounted) return
        const id = Date.now() + Math.random()
        setFloatingGifts((prev) => [...prev, { id, badgeId: giftId || 'spark', rarity: rarity || 'common', from, fromMe: false }])
        setTimeout(() => setFloatingGifts((prev) => prev.filter((g) => g.id !== id)), 3200)
        setGiftReceived({ badgeId: giftId || 'spark', rarity: rarity || 'common', from })
        setTimeout(() => setGiftReceived(null), 4000)
        playGiftReceived()
      })

      socket.on('gift-sent', ({ rarity, giftId }) => {
        if (!mounted) return
        const id = Date.now() + Math.random()
        setFloatingGifts((prev) => [...prev, { id, badgeId: giftId || 'spark', rarity: rarity || 'common', fromMe: true }])
        setTimeout(() => setFloatingGifts((prev) => prev.filter((g) => g.id !== id)), 3200)
        playGiftSent()
      })

      socket.on('tip-received', ({ from, yourShare, coins: newCoins, cashableCoins: newCashable }) => {
        if (!mounted) return
        if (newCoins     !== undefined) setCoins(newCoins)
        if (newCashable  !== undefined) setCashableCoins(newCashable)
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
        playTipSent()
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

  const handleAddFriend = async () => {
    if (!partnerUidRef.current || !user || friendReqSent) return
    setFriendReqLoad(true)
    try {
      await axios.post('/api/friends/request', { recipientId: partnerUidRef.current })
      setFriendReqSent(true)
      setTipFeedback({ type: 'success', msg: 'Friend request sent!' })
      setTimeout(() => setTipFeedback(null), 3000)
    } catch (err) {
      setTipFeedback({ type: 'error', msg: err.response?.data?.error || 'Could not send request' })
      setTimeout(() => setTipFeedback(null), 3000)
    }
    setFriendReqLoad(false)
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
    if (amount > coins) { setTipFeedback({ type: 'error', msg: `Not enough spendable coins. You have ${coins} coins.` }); return }
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
          className="w-7 h-7 flex items-center justify-center rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
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
            className="flex-1 px-3.5 py-2.5 bg-white/6 border border-white/10 rounded-xl text-white placeholder-white/30 text-sm focus:border-vybe-purple focus:outline-none transition-colors disabled:opacity-40"
          />
          <button
            type="submit"
            disabled={!input.trim() || status !== 'matched'}
            className="w-10 h-10 rounded-xl bg-vybe-purple text-white flex items-center justify-center hover:bg-vybe-purple-light transition-colors disabled:opacity-40 flex-shrink-0"
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
      setTipFeedback({ type: 'error', msg: err.response?.data?.error || 'Payment unavailable. Please try again later.' })
      setTimeout(() => setTipFeedback(null), 5000)
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
            className="w-full max-w-xs py-3.5 rounded-xl bg-green-600 hover:bg-green-500 text-white font-black text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-60 disabled:cursor-not-allowed mb-3"
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

  // BarBtn is defined at module level (stable reference — no per-render flicker)

  return (
    <div className="h-screen bg-black overflow-hidden font-space flex flex-col">
      <div className="flex-1 flex overflow-hidden min-h-0">

        {/* ── Fixed overlays ───────────────────────────────────────── */}

        {/* Connection lost */}
        <AnimatePresence>
          {connectionLost && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center px-6"
              style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)' }}>
              <div className="text-center max-w-xs">
                <Loader2 size={44} className="text-vybe-purple animate-spin mx-auto mb-5" />
                <h2 className="text-xl font-black text-white mb-2">{reconnectCount < 3 ? 'Connection lost' : 'Could not reconnect'}</h2>
                <p className="text-vybe-muted text-sm">{reconnectCount < 3 ? `Reconnecting… (${reconnectCount + 1}/3)` : 'Finding you a new match…'}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Admin warning */}
        <AnimatePresence>
          {adminWarning && (
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              className="fixed top-4 left-1/2 -translate-x-1/2 z-50 max-w-sm w-full px-4">
              <div className="bg-yellow-500/15 border border-yellow-500/40 rounded-2xl px-5 py-4 flex items-start gap-3 backdrop-blur-sm">
                <Shield size={16} className="text-yellow-400 mt-0.5 flex-shrink-0" />
                <div><p className="text-yellow-300 text-xs font-black uppercase tracking-wider mb-1">Admin Warning</p><p className="text-white text-sm">{adminWarning}</p></div>
                <button onClick={() => setAdminWarning('')} className="text-white/40 hover:text-white ml-auto"><X size={14} /></button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Email verification */}
        {user && !user.emailVerified && status === 'matched' && (
          <div className="fixed bottom-28 lg:bottom-24 left-1/2 -translate-x-1/2 z-40 px-4 w-full max-w-sm pointer-events-none">
            <div className="bg-blue-500/15 border border-blue-500/30 rounded-2xl px-4 py-3 flex items-center gap-3 backdrop-blur-sm pointer-events-auto">
              <span className="text-sm">📧</span>
              <p className="text-blue-300 text-xs flex-1">Verify your email to unlock all features</p>
              <Link to="/settings?tab=account" className="text-blue-400 text-xs font-bold hover:underline flex-shrink-0">→ Settings</Link>
            </div>
          </div>
        )}

        {/* Floating badges */}
        <div className="fixed inset-0 z-50 pointer-events-none overflow-hidden">
          <AnimatePresence>
            {floatingGifts.map((g) => (
              <motion.div key={g.id}
                initial={{ opacity: 1, y: 0, x: '-50%', scale: 0.6 }}
                animate={{ opacity: 0, y: -220, scale: 2 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 2.8, ease: 'easeOut' }}
                className="absolute select-none"
                style={{ left: g.fromMe ? '28%' : '72%', bottom: '22%' }}>
                <VybeBadge id={g.badgeId} size={64} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Tip/gift feedback toast */}
        <AnimatePresence>
          {tipFeedback && (
            <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
              className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl text-sm font-semibold backdrop-blur-sm whitespace-nowrap"
              style={{ background: tipFeedback.type === 'success' ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)', border: `1px solid ${tipFeedback.type === 'success' ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`, color: tipFeedback.type === 'success' ? '#4ade80' : '#f87171' }}>
              {tipFeedback.msg}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Badge received overlay */}
        <AnimatePresence>
          {giftReceived && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
              <motion.div
                initial={{ scale: 0.5, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.8, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 22 }}
                className="flex flex-col items-center gap-3 px-8 py-6 rounded-3xl text-center"
                style={{
                  background: 'rgba(8,8,20,0.88)',
                  backdropFilter: 'blur(20px)',
                  border: `1.5px solid ${RARITY_COLORS[giftReceived.rarity]?.border || 'rgba(255,255,255,0.2)'}`,
                  boxShadow: `0 0 48px ${RARITY_COLORS[giftReceived.rarity]?.glow || 'rgba(255,255,255,0.1)'}`,
                }}>
                <VybeBadge id={giftReceived.badgeId} size={96} />
                <div>
                  <p className="text-white font-black text-base">{giftReceived.from}</p>
                  <p className="text-sm mt-0.5 font-semibold" style={{ color: RARITY_COLORS[giftReceived.rarity]?.text }}>
                    sent you a {CHAT_BADGES.find(b => b.id === giftReceived.badgeId)?.name || 'badge'}!
                  </p>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tip modal */}
        <AnimatePresence>
          {showTip && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-end justify-center px-4"
              style={{ background: 'rgba(0,0,0,0.75)', paddingBottom: 'calc(84px + 8px)' }} onClick={() => setShowTip(false)}>
              <motion.div initial={{ y: 48 }} animate={{ y: 0 }} exit={{ y: 48 }} onClick={(e) => e.stopPropagation()}
                className="w-full max-w-sm rounded-3xl p-5 border border-white/10" style={{ background: 'linear-gradient(160deg,#0d0d1c,#09091a)' }}>
                <div className="flex items-center justify-between mb-4">
                  <div><h3 className="text-white font-black text-sm flex items-center gap-1.5">Send a Tip <VybeCoin size={15} /></h3><p className="text-white/40 text-xs mt-0.5">30% goes to Vybe · Min 10 coins</p></div>
                  <button onClick={() => setShowTip(false)} className="text-white/40 hover:text-white"><X size={15} /></button>
                </div>
                {/* Coin balance breakdown */}
                <div className="flex gap-2 mb-4">
                  <div className="flex-1 rounded-xl px-3 py-2.5 text-center" style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)' }}>
                    <p className="text-yellow-300 font-black text-sm flex items-center gap-1 justify-center"><VybeCoin size={13}/> {coins.toLocaleString()}</p>
                    <p className="text-white/40 text-[10px] mt-0.5">Spendable</p>
                  </div>
                  {cashableCoins > 0 && (
                    <div className="flex-1 rounded-xl px-3 py-2.5 text-center" style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)' }}>
                      <p className="text-green-400 font-black text-sm flex items-center gap-1 justify-center"><VybeCoin size={13}/> {cashableCoins.toLocaleString()}</p>
                      <p className="text-white/40 text-[10px] mt-0.5">Earned (cashable)</p>
                    </div>
                  )}
                </div>
                <div className="flex gap-2 mb-3">{[10,50,100,250].map((v) => {
                  const canAfford = v <= coins
                  return (
                    <button key={v} onClick={() => canAfford && setTipAmount(String(v))} disabled={!canAfford}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold transition-colors ${tipAmount===String(v)?'bg-blue-600 text-white':canAfford?'bg-white/8 text-white/60 hover:bg-white/12':'bg-white/4 text-white/25 cursor-not-allowed'}`}>
                      {v}
                    </button>
                  )
                })}</div>
                <div className="flex gap-2 mb-3"><input type="number" value={tipAmount} onChange={(e) => setTipAmount(e.target.value)} placeholder="Custom amount" min="10" max={coins} className="flex-1 bg-white/6 border border-white/12 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-blue-500/60 transition-colors" /></div>
                {tipAmount && parseInt(tipAmount) >= 10 && parseInt(tipAmount) <= coins && <p className="text-white/40 text-xs mb-3 text-center">Partner receives {Math.floor(parseInt(tipAmount)*0.70)} coins · Vybe keeps {Math.ceil(parseInt(tipAmount)*0.30)}</p>}
                {tipAmount && parseInt(tipAmount) > coins && <p className="text-red-400 text-xs mb-3 text-center">You only have {coins} spendable coins</p>}
                <button onClick={handleSendTip} disabled={tipLoading||!tipAmount||parseInt(tipAmount)<10||parseInt(tipAmount)>coins} className="w-full py-3 rounded-xl text-sm font-extrabold text-white disabled:opacity-50" style={{ background: 'linear-gradient(135deg,#1b62f5,#4b88f7)', boxShadow: '0 0 20px rgba(27,98,245,0.4)' }}>{tipLoading?'Sending…':`Send ${tipAmount||0} coins`}</button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Badge picker */}
        <AnimatePresence>
          {showGifts && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-end justify-center px-4"
              style={{ background: 'rgba(0,0,0,0.82)', paddingBottom: 'calc(84px + 8px)' }} onClick={() => { setShowGifts(false); setGiftError('') }}>
              <motion.div initial={{ y: 48 }} animate={{ y: 0 }} exit={{ y: 48 }} onClick={(e) => e.stopPropagation()}
                className="w-full max-w-sm rounded-3xl p-5 border border-white/10" style={{ background: 'linear-gradient(160deg,#0d0d1c,#060612)', maxHeight: '72vh', overflowY: 'auto' }}>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-white font-black text-sm">Send a Badge</h3>
                    <p className="text-white/30 text-[10px] mt-0.5">Animates on both screens</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1 text-yellow-300 text-xs font-black"><VybeCoin size={12}/> {coins.toLocaleString()}</span>
                    <button onClick={() => { setShowGifts(false); setGiftError('') }} className="text-white/40 hover:text-white"><X size={16} /></button>
                  </div>
                </div>
                {giftError && <p className="text-red-400 text-xs mb-3 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20">{giftError}</p>}
                <div className="space-y-2.5">
                  {CHAT_BADGES.map((badge) => {
                    const rc = RARITY_COLORS[badge.rarity]
                    const canAfford = coins >= badge.cost
                    return (
                      <button key={badge.id} onClick={() => handleSendGift(badge.id)} disabled={giftSending || !canAfford}
                        className="w-full flex items-center gap-3 p-3 rounded-2xl transition-colors text-left"
                        style={{ background: rc.bg, border: `1px solid ${rc.border}`, opacity: canAfford ? 1 : 0.35, boxShadow: canAfford ? `0 0 14px ${rc.glow}` : 'none' }}>
                        <div className="flex-shrink-0"><VybeBadge id={badge.id} size={44}/></div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-bold text-sm leading-none">{badge.name}</p>
                          <p className="text-[11px] mt-1 font-semibold" style={{ color: rc.text }}>{badge.label}</p>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <VybeCoin size={11}/>
                          <span className="text-yellow-300 font-black text-sm">{badge.cost.toLocaleString()}</span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Init overlay (camera starting) ───────────────────────── */}
        <AnimatePresence>
          {status === 'init' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-20 flex flex-col items-center justify-center"
              style={{ background: '#0a0a0f' }}>
              <Loader2 size={36} className="text-vybe-purple animate-spin mb-4" />
              <p className="text-white/60 font-medium text-sm">Starting camera…</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── No one available overlay ──────────────────────────────── */}
        <AnimatePresence>
          {status === 'searching' && searchElapsed >= 30 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-20 flex flex-col items-center justify-center px-6"
              style={{ background: '#0a0a0f' }}>
              <div className="text-center max-w-sm">
                <div className="text-5xl mb-5">😴</div>
                <h2 className="text-2xl font-black text-white mb-3">No one available right now</h2>
                <p className="text-vybe-muted text-sm mb-4">Check back soon — Vybe gets busiest on evenings and weekends!</p>
                <div className="space-y-3">
                  <button onClick={() => { setSearchElapsed(0); findMatch(socketRef.current) }} className="w-full py-3.5 rounded-xl btn-purple text-white font-black text-sm">Try Again</button>
                  <button onClick={handleEnd} className="w-full py-3 rounded-xl border border-vybe-border text-vybe-muted hover:text-white text-sm transition-colors">Back to Home</button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── No webcam banner ─────────────────────────────────────── */}
        {!hasCamera && !noCamDismissed && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-30 w-[calc(100%-2rem)] max-w-sm">
            <div className="flex items-start gap-3 px-4 py-3 rounded-2xl" style={{ background: 'rgba(10,10,22,0.92)', border: '1px solid rgba(255,255,255,0.12)', backdropFilter: 'blur(16px)' }}>
              <span className="text-xl flex-shrink-0 mt-0.5">📷</span>
              <div className="flex-1"><p className="text-white font-bold text-[13px]">No webcam detected</p><p className="text-white/50 text-[11px] mt-0.5">Adding a webcam gives you a <span className="text-blue-400 font-semibold">much better chance</span> of matching.</p></div>
              <button onClick={() => setNoCamDismissed(true)} className="text-white/30 hover:text-white/60 text-base leading-none">✕</button>
            </div>
          </div>
        )}

        {/* ── VIDEO FEEDS ─────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 flex flex-col lg:flex-row gap-1.5 p-2 min-h-0">

            {/* Stranger video — dominant on mobile, equal on desktop */}
            <div className="relative rounded-2xl overflow-hidden bg-[#0d0d18] flex-[3] lg:flex-1 min-h-0">
              {status === 'searching' ? (
                /* ── Radar pulse while searching ── */
                <div className="w-full h-full flex flex-col items-center justify-center gap-6 px-4">
                  <div className="relative flex items-center justify-center" style={{ width: 180, height: 180 }}>
                    <div className="absolute rounded-full animate-ping border border-purple-500/45" style={{ width: 128, height: 128, animationDuration: '2.2s', animationDelay: '0s' }} />
                    <div className="absolute rounded-full animate-ping border border-purple-500/28" style={{ width: 128, height: 128, animationDuration: '2.2s', animationDelay: '0.73s' }} />
                    <div className="absolute rounded-full animate-ping border border-purple-500/14" style={{ width: 128, height: 128, animationDuration: '2.2s', animationDelay: '1.46s' }} />
                    <div className="rounded-full flex items-center justify-center" style={{ width: 128, height: 128, background: '#0d0d18', border: '1.5px solid rgba(124,58,237,0.45)', boxShadow: '0 0 32px rgba(124,58,237,0.2)', zIndex: 1, position: 'relative' }}>
                      <Globe size={40} className="text-vybe-purple/40" style={{ animation: 'spin 8s linear infinite' }} />
                    </div>
                  </div>
                  <div className="text-center">
                    <AnimatePresence mode="wait">
                      <motion.p key={prefs.mode==='private'?'private':searchTextIdx} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} transition={{ duration: 0.3 }} className="text-white font-bold text-base mb-1.5">
                        {prefs.mode === 'private' ? 'Waiting for your friend…' : SEARCH_TEXTS[searchTextIdx]}
                      </motion.p>
                    </AnimatePresence>
                    {onlineCount > 0 && (
                      <p className="text-xs flex items-center justify-center gap-1.5" style={{ color: '#6b7280' }}>
                        <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse flex-shrink-0" />
                        {onlineCount} {onlineCount === 1 ? 'person' : 'people'} online
                      </p>
                    )}
                  </div>
                </div>
              ) : opponentSocketIds.length === 0 ? (
                <div className="w-full h-full flex items-center justify-center">
                  {status === 'matched' && <div className="loading-dots flex"><span /><span /><span /></div>}
                </div>
              ) : (
                <div className="w-full h-full flex">
                  {opponentSocketIds.map((sid, idx) => (
                    <div key={sid} className={`relative flex-1 overflow-hidden ${idx > 0 ? 'border-l border-white/10' : ''}`}>
                      <video ref={(el) => { remoteVideoRefs.current[sid] = el }} autoPlay playsInline className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              )}

              {/* Partner identity + streamer hide button */}
              {status === 'matched' && (
                <div className="absolute top-3 left-3 z-10 flex items-center gap-2">
                  <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(12px)' }}>
                    {/* Partner avatar */}
                    {partnerAvatar ? (
                      <img src={partnerAvatar} alt="" className="w-6 h-6 rounded-full object-cover flex-shrink-0 ring-1 ring-white/20" />
                    ) : partnerUsername ? (
                      <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-white font-black text-[10px]"
                        style={{ background: 'linear-gradient(135deg, #7c3aed, #1b62f5)' }}>
                        {partnerUsername[0].toUpperCase()}
                      </div>
                    ) : (
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400 online-pulse" />
                    )}
                    <div className="flex items-center gap-1.5">
                      <span className="text-white font-bold text-[13px]">
                        {partnerUsername ? `@${partnerUsername}` : 'Stranger'}
                      </span>
                      {partnerEmailVerified && (
                        <ShieldCheck size={11} style={{ color: '#60a5fa', flexShrink: 0 }} title="Verified" />
                      )}
                      {partnerIsVip && (
                        <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-black" style={{ background: 'rgba(245,158,11,0.2)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.35)' }}>
                          <Crown size={8} /> VIP
                        </span>
                      )}
                      {!partnerIsVip && partnerIsPremium && (
                        <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-black" style={{ background: 'rgba(27,98,245,0.2)', color: '#60a5fa', border: '1px solid rgba(27,98,245,0.35)' }}>
                          <Zap size={8} /> Member
                        </span>
                      )}
                    </div>
                    {/* Inline Add Friend — only show if logged in, partner is known, not yet sent */}
                    {user && partnerUid && !friendReqSent && (
                      <button
                        onClick={handleAddFriend}
                        disabled={friendReqLoad}
                        title="Add friend"
                        className="flex items-center justify-center w-5 h-5 rounded-full ml-0.5 active:scale-95"
                        style={{ background: 'rgba(27,98,245,0.25)', border: '1px solid rgba(27,98,245,0.4)', color: '#60a5fa', flexShrink: 0 }}
                      >
                        {friendReqLoad ? <Loader2 size={9} className="animate-spin" /> : <UserPlus size={9} />}
                      </button>
                    )}
                    {user && partnerUid && friendReqSent && (
                      <span className="flex items-center justify-center w-5 h-5 rounded-full ml-0.5" style={{ background: 'rgba(34,197,94,0.2)', border: '1px solid rgba(34,197,94,0.35)', color: '#4ade80', flexShrink: 0 }}>
                        <UserPlus size={9} />
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => setStrangerHidden(h => !h)}
                    title={strangerHidden ? 'Reveal camera (exit safe mode)' : 'Safe Mode — hide camera instantly'}
                    className="flex items-center justify-center w-7 h-7 rounded-lg"
                    style={{
                      backdropFilter: 'blur(12px)',
                      background: strangerHidden ? 'rgba(245,158,11,0.22)' : 'rgba(0,0,0,0.55)',
                      border:     strangerHidden ? '1px solid rgba(245,158,11,0.5)' : '1px solid rgba(255,255,255,0.1)',
                      transition: 'background-color 150ms ease, border-color 150ms ease',
                    }}>
                    <Shield size={13} style={{ color: strangerHidden ? '#fbbf24' : 'rgba(255,255,255,0.6)' }} />
                  </button>
                </div>
              )}

              {/* Timer — top right of stranger video */}
              {status === 'matched' && (
                <div className="absolute top-3 right-3 z-10 px-2.5 py-1.5 rounded-xl font-mono text-[12px] text-white/70" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(12px)' }}>
                  {fmt(elapsed)}
                </div>
              )}

              <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.3) 100%)' }} />
              {/* Safe Mode overlay */}
              <AnimatePresence>
                {strangerHidden && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4"
                    style={{ background: 'rgba(4,4,12,0.97)', backdropFilter: 'blur(32px)' }}
                  >
                    {/* Shield glow */}
                    <div className="relative flex items-center justify-center">
                      <div className="absolute w-20 h-20 rounded-full"
                        style={{ background: 'radial-gradient(circle, rgba(245,158,11,0.18) 0%, transparent 70%)' }} />
                      <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                        style={{ background: 'rgba(245,158,11,0.12)', border: '1.5px solid rgba(245,158,11,0.35)', boxShadow: '0 0 24px rgba(245,158,11,0.2)' }}>
                        <Shield size={26} style={{ color: '#fbbf24' }} />
                      </div>
                    </div>
                    <div className="text-center">
                      <p className="text-white font-black text-sm tracking-wide mb-0.5">Safe Mode Active</p>
                      <p className="text-white/35 text-[11px]">Stranger's camera is hidden</p>
                    </div>
                    <button
                      onClick={() => setStrangerHidden(false)}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold active:scale-95"
                      style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.35)', color: '#fbbf24' }}
                    >
                      <Video size={12} /> Reveal Camera
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Your video */}
            <div className="relative rounded-2xl overflow-hidden bg-[#0d0d18] flex-1 min-h-0">
              <video ref={localVideoRef} autoPlay muted playsInline className="w-full h-full object-cover" />

              {!hasCamera && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0a0a14] gap-2">
                  <div className="w-14 h-14 rounded-full bg-white/8 border border-white/10 flex items-center justify-center">
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  </div>
                  <p className="text-white/25 text-[10px] font-semibold tracking-wider uppercase">No Camera</p>
                </div>
              )}
              {videoOff && hasCamera && (
                <div className="absolute inset-0 bg-black/80 flex items-center justify-center"><VideoOff size={26} className="text-white/30" /></div>
              )}

              {/* You label */}
              <div className="absolute top-3 left-3 z-10">
                <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(12px)' }}>
                  {user?.avatar ? (
                    <img src={user.avatar} alt="" className="w-6 h-6 rounded-full object-cover flex-shrink-0 ring-1 ring-white/20" />
                  ) : user?.username ? (
                    <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-white font-black text-[10px]"
                      style={{ background: 'linear-gradient(135deg, #1b62f5, #7c3aed)' }}>
                      {user.username[0].toUpperCase()}
                    </div>
                  ) : null}
                  <div className="flex items-center gap-1.5">
                    <span className="text-white font-bold text-[13px]">{user ? `@${user.username}` : 'You'}</span>
                    {user?.emailVerified && (
                      <ShieldCheck size={11} style={{ color: '#60a5fa', flexShrink: 0 }} title="Verified" />
                    )}
                    {user?.isVip && (
                      <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-black" style={{ background: 'rgba(245,158,11,0.2)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.35)' }}>
                        <Crown size={8} /> VIP
                      </span>
                    )}
                    {!user?.isVip && user?.isPremium && (
                      <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-black" style={{ background: 'rgba(27,98,245,0.2)', color: '#60a5fa', border: '1px solid rgba(27,98,245,0.35)' }}>
                        <Zap size={8} /> Member
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Squad mates */}
              {mateSocketIds.map((sid) => (
                <div key={sid} className="absolute inset-y-0 right-0 w-1/2 border-l border-white/10">
                  <video ref={(el) => { remoteVideoRefs.current[sid] = el }} autoPlay playsInline className="w-full h-full object-cover" />
                  <div className="absolute top-2 left-2 z-10"><span className="text-[9px] font-black tracking-widest text-vybe-purple-light/80 uppercase bg-black/30 backdrop-blur-sm px-2 py-1 rounded-md">Duo</span></div>
                </div>
              ))}

              <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.3) 100%)' }} />
            </div>

          </div>

          {/* ── BOTTOM CONTROL BAR ──────────────────────────────────── */}
          <div className="flex-shrink-0 px-4 sm:px-6 py-3 relative z-40" style={{ background: '#0a0a0f', borderTop: '1px solid rgba(255,255,255,0.07)' }}>

            {/* Desktop */}
            <div className="hidden lg:flex items-center justify-between max-w-5xl mx-auto">

              {/* Left: secondary controls */}
              <div className="flex items-center gap-1">
                <BarBtn onClick={toggleMute} label={isMuted ? 'Unmute' : 'Mute'} red={isMuted} active={isMuted}>
                  {isMuted ? <MicOff size={17} /> : <Mic size={17} />}
                </BarBtn>
                {hasCamera ? (
                  <BarBtn onClick={toggleVideo} label={videoOff ? 'Camera On' : 'Camera'} red={videoOff} active={videoOff}>
                    {videoOff ? <VideoOff size={17} /> : <Video size={17} />}
                  </BarBtn>
                ) : null}
                {hasCamera && !videoOff && (
                  <BarBtn onClick={flipCamera} label="Flip">
                    <Camera size={17} />
                  </BarBtn>
                )}
                {/* Safe Mode — always accessible, not behind a menu */}
                <button
                  onClick={() => setStrangerHidden(h => !h)}
                  className="flex flex-col items-center gap-0.5 px-2.5 py-1.5 rounded-xl select-none"
                  style={{ color: strangerHidden ? '#fbbf24' : 'rgba(255,255,255,0.55)', transition: 'color 150ms ease' }}
                  title={strangerHidden ? 'Reveal camera (exit safe mode)' : 'Safe Mode — hide stranger\'s camera'}
                >
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{
                      background:  strangerHidden ? 'rgba(245,158,11,0.18)' : 'rgba(255,255,255,0.06)',
                      border:      strangerHidden ? '1px solid rgba(245,158,11,0.45)' : '1px solid transparent',
                      boxShadow:   strangerHidden ? '0 0 14px rgba(245,158,11,0.3)' : 'none',
                      transition:  'background-color 150ms ease, border-color 150ms ease, box-shadow 150ms ease',
                    }}>
                    <Shield size={17} />
                  </div>
                  <span className="text-[9px] font-medium tracking-wide whitespace-nowrap">
                    {strangerHidden ? 'Reveal' : 'Safe'}
                  </span>
                </button>
                {user && status === 'matched' && (
                  <>
                    <div className="w-px h-6 bg-white/10 mx-1" />
                    <BarBtn onClick={() => { setShowGifts(true); setGiftError('') }} label="Gift">
                      <Gift size={17} />
                    </BarBtn>
                    <BarBtn onClick={() => setShowTip(true)} label="Tip">
                      <VybeCoin size={17} />
                    </BarBtn>
                  </>
                )}
                {user && partnerUid && status === 'matched' && (
                  <>
                    <BarBtn onClick={handleAddFriend} disabled={friendReqLoad || friendReqSent} label={friendReqSent ? 'Requested' : 'Add Friend'} active={friendReqSent}>
                      {friendReqSent ? <span className="text-sm">✓</span> : <UserPlus size={17} />}
                    </BarBtn>
                    <BarBtn onClick={handleBlock} disabled={blockLoading} label="Block" red>
                      <UserX size={17} />
                    </BarBtn>
                  </>
                )}
              </div>

              {/* Center: primary actions */}
              <div className="flex items-center gap-3">
                {status === 'matched' ? (
                  <>
                    <motion.button onClick={handleSkip} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                      className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm text-white/80"
                      style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)' }}>
                      <SkipForward size={16} /> Next
                    </motion.button>
                    <motion.button onClick={handleEnd} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                      className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-red-600 text-white font-bold text-sm"
                      style={{ boxShadow: '0 0 20px rgba(220,38,38,0.3)' }}>
                      <PhoneOff size={16} /> End Chat
                    </motion.button>
                  </>
                ) : (
                  <motion.button onClick={handleEnd} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                    className="flex items-center gap-2 px-8 py-2.5 rounded-xl font-bold text-sm"
                    style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.7)' }}>
                    <PhoneOff size={16} /> Cancel &amp; Leave
                  </motion.button>
                )}
              </div>

              {/* Right: chat + report */}
              <div className="flex items-center gap-1">
                <BarBtn onClick={toggleChat} label="Chat" active={showChat}>
                  <span className="relative">
                    <MessageSquare size={17} />
                    {unread > 0 && !showChat && <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 rounded-full text-[8px] font-black flex items-center justify-center">{unread > 9 ? '9+' : unread}</span>}
                  </span>
                </BarBtn>
                {reportSent ? (
                  <div className="flex flex-col items-center gap-0.5 px-2.5 py-1.5 rounded-xl text-green-400">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-green-500/15"><span className="text-sm">✓</span></div>
                    <span className="text-[9px] font-medium">Reported</span>
                  </div>
                ) : (
                  <BarBtn onClick={() => status === 'matched' && setShowReport(true)} label="Report" red disabled={status !== 'matched'}>
                    <Flag size={17} />
                  </BarBtn>
                )}
              </div>

            </div>

            {/* Mobile */}
            <div className="flex lg:hidden items-center justify-around">
              {/* Mute */}
              <button onClick={toggleMute} className="flex flex-col items-center gap-1">
                <div className={`w-11 h-11 rounded-full flex items-center justify-center ${isMuted ? 'bg-red-500/25' : 'bg-white/10'}`}>
                  {isMuted ? <MicOff size={19} className="text-red-400" /> : <Mic size={19} className="text-white/80" />}
                </div>
                <span className="text-[9px] text-white/40">{isMuted ? 'Unmute' : 'Mute'}</span>
              </button>
              {/* Safe Mode */}
              <button onClick={() => setStrangerHidden(h => !h)} className="flex flex-col items-center gap-1">
                <div className="w-11 h-11 rounded-full flex items-center justify-center"
                  style={{
                    background:  strangerHidden ? 'rgba(245,158,11,0.2)'   : 'rgba(255,255,255,0.1)',
                    border:      strangerHidden ? '1.5px solid rgba(245,158,11,0.5)' : '1.5px solid transparent',
                    boxShadow:   strangerHidden ? '0 0 18px rgba(245,158,11,0.35)' : 'none',
                    transition:  'background-color 150ms ease, border-color 150ms ease, box-shadow 150ms ease',
                  }}>
                  <Shield size={19} style={{ color: strangerHidden ? '#fbbf24' : 'rgba(255,255,255,0.8)', transition: 'color 150ms ease' }} />
                </div>
                <span className="text-[9px]" style={{ color: strangerHidden ? '#fbbf24' : 'rgba(255,255,255,0.4)', transition: 'color 150ms ease' }}>
                  {strangerHidden ? 'Reveal' : 'Safe'}
                </span>
              </button>
              {/* Next / Cancel */}
              {status === 'matched' ? (
                <button onClick={handleSkip} className="flex flex-col items-center gap-1">
                  <div className="w-11 h-11 rounded-full border border-white/25 flex items-center justify-center"><SkipForward size={19} className="text-white/80" /></div>
                  <span className="text-[9px] text-white/40">Next</span>
                </button>
              ) : null}
              {/* End / Cancel */}
              <button onClick={handleEnd} className="flex flex-col items-center gap-1">
                <div className="w-11 h-11 rounded-full flex items-center justify-center" style={{ background: status === 'matched' ? '#dc2626' : 'rgba(255,255,255,0.1)', boxShadow: status === 'matched' ? '0 0 16px rgba(220,38,38,0.4)' : 'none' }}>
                  <PhoneOff size={19} className="text-white" />
                </div>
                <span className="text-[9px] text-white/40">{status === 'matched' ? 'End' : 'Cancel'}</span>
              </button>
              {/* Chat */}
              <button onClick={toggleChat} className="flex flex-col items-center gap-1">
                <div className={`w-11 h-11 rounded-full flex items-center justify-center relative ${showChat ? 'bg-vybe-purple/30' : 'bg-white/10'}`}>
                  <MessageSquare size={19} className={showChat ? 'text-vybe-purple-light' : 'text-white/80'} />
                  {unread > 0 && !showChat && <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full text-[8px] font-black flex items-center justify-center">{unread > 9 ? '9+' : unread}</span>}
                </div>
                <span className="text-[9px] text-white/40">Chat</span>
              </button>
              {/* Add Friend */}
              {user && partnerUid && status === 'matched' && (
                <button onClick={handleAddFriend} disabled={friendReqLoad || friendReqSent} className="flex flex-col items-center gap-1 disabled:opacity-60">
                  <div className={`w-11 h-11 rounded-full flex items-center justify-center ${friendReqSent ? 'bg-vybe-purple/30' : 'bg-white/10'}`}>
                    {friendReqSent ? <span className="text-vybe-purple-light text-sm">✓</span> : <UserPlus size={19} className="text-white/70" />}
                  </div>
                  <span className="text-[9px] text-white/40">{friendReqSent ? 'Sent' : 'Add'}</span>
                </button>
              )}
              {/* Report */}
              {reportSent ? (
                <div className="flex flex-col items-center gap-1">
                  <div className="w-11 h-11 rounded-full bg-green-500/20 flex items-center justify-center"><span className="text-green-400 text-sm">✓</span></div>
                  <span className="text-[9px] text-green-400/60">Reported</span>
                </div>
              ) : (
                <button onClick={() => status === 'matched' && setShowReport(true)} disabled={status !== 'matched'} className="flex flex-col items-center gap-1 disabled:opacity-40">
                  <div className="w-11 h-11 rounded-full bg-white/10 flex items-center justify-center"><Flag size={19} className="text-white/70" /></div>
                  <span className="text-[9px] text-white/40">Report</span>
                </button>
              )}
            </div>

          </div>
        </div>

        {/* ── Desktop chat sidebar ─────────────────────────────────── */}
        <motion.div className="hidden lg:flex flex-col flex-shrink-0 overflow-hidden border-l border-white/[0.07]"
          style={{ background: '#0d0d18' }}
          animate={{ width: showChat ? 320 : 0 }}
          transition={{ type: 'spring', damping: 28, stiffness: 260 }}>
          <div className="w-[320px] h-full flex flex-col">{ChatContent()}</div>
        </motion.div>

      </div>

      {/* ── Mobile chat slide-up — sits above the control bar, partial height ── */}
      <AnimatePresence>
        {showChat && (
          <motion.div
            className="lg:hidden fixed inset-x-0 z-30 flex flex-col rounded-t-2xl border-t border-white/10"
            style={{ bottom: '84px', height: '42%', background: 'rgba(10,10,20,0.92)', backdropFilter: 'blur(24px)' }}
            initial={{ y: '110%' }}
            animate={{ y: 0 }}
            exit={{ y: '110%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 260 }}
          >
            <div className="flex justify-center pt-2.5 pb-1 flex-shrink-0"><div className="w-8 h-1 rounded-full bg-white/20" /></div>
            {ChatContent()}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Report modal ─────────────────────────────────────────── */}
      <AnimatePresence>
        {showReport && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/65 z-40" onClick={() => setShowReport(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.92 }} transition={{ type: 'spring', damping: 26, stiffness: 320 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[min(320px,90vw)] bg-vybe-bg2 border border-vybe-border rounded-2xl p-5 shadow-purple">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-xl bg-red-500/15 border border-red-500/25 flex items-center justify-center flex-shrink-0"><Shield size={16} className="text-red-400" /></div>
                <div><h3 className="font-black text-white text-sm">Report User</h3><p className="text-vybe-muted text-[11px]">Select a reason — you will not be identified</p></div>
              </div>
              <div className="space-y-1.5">
                {REPORT_REASONS.map((r) => (
                  <button key={r.id} onClick={() => handleReport(r.id)}
                    className="w-full text-left px-4 py-3 rounded-xl text-[13px] text-gray-300 hover:bg-vybe-border hover:text-white transition-colors flex items-center justify-between group min-h-[44px]">
                    {r.label}<ChevronRight size={13} className="text-vybe-muted group-hover:text-white transition-colors flex-shrink-0" />
                  </button>
                ))}
              </div>
              <button onClick={() => setShowReport(false)} className="w-full mt-3 py-3 rounded-xl border border-vybe-border text-vybe-muted hover:text-white text-[13px] transition-colors">Cancel</button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
