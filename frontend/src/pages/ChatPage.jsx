import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence, useMotionValue, animate as fmAnimate } from 'framer-motion'
import {
  SkipForward, PhoneOff, Flag, Send, Mic, MicOff, Video, VideoOff,
  MessageSquare, X, ChevronRight, Shield, ShieldCheck, Loader2, Ban, UserX, UserPlus, Camera, Crown, Zap,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { io } from 'socket.io-client'
import SimplePeer from 'simple-peer'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'
import VybeCoin from '../components/VybeCoin'
import VybeGlobe from '../components/VybeGlobe'
import { playMatchFound, playTipSent, playClick } from '../utils/sounds'

// Defined outside ChatPage so the reference is stable across re-renders (no unmount flicker)
function BarBtn({ onClick, children, label, active, red, disabled: dis, title: t }) {
  return (
    <button onClick={onClick} disabled={dis} title={t || label}
      className={`flex flex-col items-center gap-0.5 px-2.5 py-1.5 rounded-xl select-none disabled:opacity-40 disabled:cursor-default
        ${red ? 'text-red-400/80 hover:text-red-300' : active ? 'text-cyan-400' : 'text-white/55 hover:text-white'}`}
      style={{ transition: 'color 150ms ease' }}>
      <div className="w-9 h-9 rounded-xl flex items-center justify-center"
        style={{
          transition: 'background-color 150ms ease, box-shadow 150ms ease',
          background: red && active ? '#dc2626' : red ? 'rgba(239,68,68,0.15)' : active ? 'rgba(0,212,255,0.25)' : 'rgba(255,255,255,0.06)',
        }}>
        {children}
      </div>
      <span className="text-[9px] font-medium tracking-wide whitespace-nowrap">{label}</span>
    </button>
  )
}


// Floating pill button for mobile immersive bar
function MobileFloatBtn({ onClick, children, active, red, amber, primary, disabled: dis }) {
  let bg = 'rgba(255,255,255,0.07)'
  let border = '1px solid rgba(255,255,255,0.06)'
  let glow = 'none'
  let color = active ? '#00D4FF' : 'rgba(255,255,255,0.72)'
  let sz = primary ? 46 : 40

  if (red && active)  { bg = 'rgba(220,38,38,0.88)'; border = '1px solid rgba(220,38,38,0.5)'; glow = '0 0 22px rgba(220,38,38,0.55), 0 0 44px rgba(220,38,38,0.18)'; color = '#fff' }
  else if (red)       { bg = 'rgba(239,68,68,0.1)';  border = '1px solid rgba(239,68,68,0.18)'; color = '#f87171' }
  else if (amber)     { bg = 'rgba(0,212,255,0.12)'; border = '1px solid rgba(0,212,255,0.35)'; glow = '0 0 14px rgba(0,212,255,0.18)'; color = '#00B8E0' }
  else if (primary)   { bg = 'rgba(0,212,255,0.15)';  border = '1px solid rgba(0,212,255,0.32)'; glow = '0 0 16px rgba(0,212,255,0.28)'; color = '#00D4FF' }
  else if (active)    { bg = 'rgba(0,212,255,0.15)'; border = '1px solid rgba(0,212,255,0.28)'; color = '#00D4FF' }

  return (
    <motion.button
      onClick={onClick}
      disabled={dis}
      whileTap={{ scale: 0.86 }}
      transition={{ type: 'spring', stiffness: 520, damping: 24 }}
      className="rounded-full flex items-center justify-center disabled:opacity-25 flex-shrink-0"
      style={{ width: sz, height: sz, background: bg, border, boxShadow: glow, color, transition: 'background 140ms, box-shadow 140ms' }}
    >
      {children}
    </motion.button>
  )
}

function GlassBtn({ onClick, children, active, red, disabled: dis, title: t }) {
  return (
    <motion.button
      onClick={onClick}
      disabled={dis}
      title={t}
      whileHover={!dis ? { scale: 1.05, background: 'rgba(255,255,255,0.12)' } : {}}
      whileTap={!dis ? { scale: 0.9 } : {}}
      className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 disabled:opacity-30"
      style={{
        background: red ? 'rgba(255,50,50,0.18)' : active ? 'rgba(0,212,255,0.18)' : 'rgba(255,255,255,0.06)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        border: red ? '1px solid rgba(255,50,50,0.3)' : active ? '1px solid rgba(0,212,255,0.4)' : '1px solid rgba(255,255,255,0.12)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.15)',
        color: red ? '#ff6b6b' : active ? '#00D4FF' : 'rgba(255,255,255,0.8)',
        transition: 'all 200ms ease',
      }}
    >
      {children}
    </motion.button>
  )
}

function AnimatedDots() {
  return (
    <span className="inline-flex items-end gap-[3px] ml-1 mb-[1px]">
      {[0, 0.22, 0.44].map((delay, i) => (
        <motion.span
          key={i}
          className="inline-block w-[3px] h-[3px] rounded-full"
          style={{ background: '#00D4FF' }}
          animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
          transition={{ duration: 1.3, delay, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
    </span>
  )
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
  const [matchFlash,     setMatchFlash]       = useState(false)
  const [selfViewExpanded, setSelfViewExpanded] = useState(true)
  const [duoPipExpanded,   setDuoPipExpanded]   = useState(false)
  const [tipIdx,           setTipIdx]           = useState(0)

  const searchTimerRef   = useRef(null)
  const searchTextTimer  = useRef(null)
  const reconnectTimer   = useRef(null)
  const matchFlashTimer  = useRef(null)
  const statusRef        = useRef(status)

  const SEARCH_TEXTS = [
    'Finding your next Vybe…',
    'Connecting you…',
    'Almost there…',
    'Looking for the perfect match…',
    'Hang tight…',
  ]

  const TIPS = [
    'Tip: Users with a webcam get 3× more matches',
    'Tip: Say hi first — it breaks the ice instantly',
    'Tip: Upgrade to filter by gender or country',
    'Tip: VIP badge makes your profile stand out',
  ]

  const socketRef       = useRef(null)
  const peersRef        = useRef({})           // socketId → SimplePeer
  const remoteVideoRefs = useRef({})           // socketId → HTMLVideoElement
  const localStreamRef      = useRef(null)
  const localVideoRef       = useRef(null)   // mobile PiP
  const localVideoDesktopRef = useRef(null)  // desktop panel
  const pipContainerRef     = useRef(null)
  const pipLastTapRef       = useRef(0)
  const duoPipLastTapRef    = useRef(0)
  const PIP_H = 190
  const PIP_BOTTOM_GAP = 88
  const DUO_PIP_W_SM = 96
  const DUO_PIP_H_SM = 128
  const DUO_PIP_W_LG = 126
  const DUO_PIP_H_LG = 168
  const pipX = useMotionValue(12)
  const pipY = useMotionValue(
    typeof window !== 'undefined' ? window.innerHeight - PIP_H - PIP_BOTTOM_GAP : 600
  )
  const duoPipX = useMotionValue(
    typeof window !== 'undefined' ? window.innerWidth - DUO_PIP_W_SM - 12 : 250
  )
  const duoPipY = useMotionValue(72)
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

  // Animate PiP above chat drawer when open, back to bottom-left when closed
  useEffect(() => {
    const bottomY = window.innerHeight - PIP_H - PIP_BOTTOM_GAP
    const aboveDrawerY = window.innerHeight * 0.67 - PIP_H - 20
    fmAnimate(pipY, showChat ? aboveDrawerY : bottomY, {
      type: 'spring', damping: 28, stiffness: 260,
    })
  }, [showChat])

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
      setTipIdx(0)
      searchTimerRef.current  = setInterval(() => setSearchElapsed((t) => t + 1), 1000)
      searchTextTimer.current = setInterval(() => setSearchTextIdx((i) => (i + 1) % SEARCH_TEXTS.length), 3000)
      const tipTimer = setInterval(() => setTipIdx((i) => i + 1), 5000)
      // Fetch online count every 10s
      const fetchCount = () => axios.get('/api/online-count').then(({ data }) => setOnlineCount(data.count)).catch(() => {})
      fetchCount()
      const countTimer = setInterval(fetchCount, 10000)
      return () => {
        clearInterval(searchTimerRef.current)
        clearInterval(searchTextTimer.current)
        clearInterval(tipTimer)
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
          localVideoRef.current.play().catch(() => {})
        }
        if (localVideoDesktopRef.current) {
          localVideoDesktopRef.current.srcObject = stream
          localVideoDesktopRef.current.play().catch(() => {})
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
        setMatchFlash(true)
        clearTimeout(matchFlashTimer.current)
        matchFlashTimer.current = setTimeout(() => setMatchFlash(false), 1200)

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
      clearTimeout(matchFlashTimer.current)
    }
  }, []) // eslint-disable-line

  const flipCamera = async () => {
    const newFacing = facingMode === 'user' ? 'environment' : 'user'
    setFacingMode(newFacing)
    // Only stop video tracks — preserve the existing audio track so mute keeps working
    localStreamRef.current?.getVideoTracks().forEach((t) => t.stop())
    try {
      const videoStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: newFacing, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      })
      const newVideoTrack = videoStream.getVideoTracks()[0]
      if (newVideoTrack && localStreamRef.current) {
        localStreamRef.current.getVideoTracks().forEach((t) => localStreamRef.current.removeTrack(t))
        localStreamRef.current.addTrack(newVideoTrack)
      }
      if (localVideoRef.current) localVideoRef.current.srcObject = localStreamRef.current
      if (localVideoDesktopRef.current) localVideoDesktopRef.current.srcObject = localStreamRef.current
      if (newVideoTrack) {
        Object.values(peersRef.current).forEach((peer) => {
          const sender = peer._pc?.getSenders().find((s) => s.track?.kind === 'video')
          if (sender) sender.replaceTrack(newVideoTrack).catch(() => {})
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
    const stream = localStreamRef.current
    if (!stream) return
    const newMuted = !isMuted
    stream.getAudioTracks().forEach((t) => { t.enabled = !newMuted })
    // Also update any peer connection senders directly (stays in sync after camera flips)
    Object.values(peersRef.current).forEach((peer) => {
      peer._pc?.getSenders().forEach((s) => { if (s.track?.kind === 'audio') s.track.enabled = !newMuted })
    })
    setIsMuted(newMuted)
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
  const isDuoMode          = mateSocketIds.length > 0

  // ── Shared chat content ────────────────────────────────────────────────────
  const ChatContent = () => (
    <>
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-white/10 flex-shrink-0">
        <div className="flex items-center gap-2">
          <MessageSquare size={14} className="text-cyan-400" />
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
              <div className="max-w-[82%] px-3.5 py-2 text-[13px] leading-relaxed text-white"
                style={msg.from === 'me' ? {
                  background: 'rgba(0,212,255,0.15)',
                  border: '1px solid rgba(0,212,255,0.2)',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  borderRadius: '18px 18px 4px 18px',
                } : {
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  borderRadius: '18px 18px 18px 4px',
                }}>
                {msg.text}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSend} className="p-3 border-t flex-shrink-0" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={status === 'matched' ? 'Type a message…' : 'Connecting…'}
            disabled={status !== 'matched'}
            className="flex-1 px-4 py-2.5 text-white placeholder-white/30 text-sm focus:outline-none disabled:opacity-40"
            style={{ background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 50 }}
          />
          <button
            type="submit"
            disabled={!input.trim() || status !== 'matched'}
            className="w-10 h-10 rounded-full flex items-center justify-center disabled:opacity-40 flex-shrink-0"
            style={{ background: 'rgba(0,212,255,0.85)', color: '#000', boxShadow: '0 0 16px rgba(0,212,255,0.3)' }}
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
          <p className="text-cyan-400 text-sm font-bold mb-2">Time remaining: {timeLeft}</p>
        )}
        <p className="text-vybe-muted text-xs max-w-sm mb-6">
          Questions? Contact us at{' '}
          <span className="text-vybe-blue-light">support@vybelivechat.com</span>
        </p>

        {!isPermanent && user && (
          <button
            onClick={handleUnbanPurchase}
            disabled={unbanLoading}
            className="w-full max-w-xs py-3.5 rounded-xl bg-cyan-500 hover:bg-cyan-500 text-white font-black text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-60 disabled:cursor-not-allowed mb-3"
          >
            {unbanLoading ? (
              <><Loader2 size={15} className="animate-spin" /> Processing…</>
            ) : (
              <>Remove Ban for £4.99</>
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
    <div className="chat-fullscreen bg-black font-space">

      {/* ═══════════════════════════════════════════════════════════════
          SHARED FIXED OVERLAYS — visible on both mobile and desktop
      ═══════════════════════════════════════════════════════════════ */}

        {/* ── Fixed overlays ───────────────────────────────────────── */}

        {/* Connection lost */}
        <AnimatePresence>
          {connectionLost && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center px-6"
              style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)' }}>
              <div className="text-center max-w-xs">
                <Loader2 size={44} className="text-cyan-400 animate-spin mx-auto mb-5" />
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
              <div className="bg-cyan-500/15 border border-yellow-500/40 rounded-2xl px-5 py-4 flex items-start gap-3 backdrop-blur-sm">
                <Shield size={16} className="text-cyan-400 mt-0.5 flex-shrink-0" />
                <div><p className="text-cyan-300 text-xs font-black uppercase tracking-wider mb-1">Admin Warning</p><p className="text-white text-sm">{adminWarning}</p></div>
                <button onClick={() => setAdminWarning('')} className="text-white/40 hover:text-white ml-auto"><X size={14} /></button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Match found flash */}
        <AnimatePresence>
          {matchFlash && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
            >
              <div className="animate-match-found flex flex-col items-center gap-3">
                <div
                  className="animate-match-fade w-20 h-20 rounded-full flex items-center justify-center"
                  style={{
                    background: 'radial-gradient(circle, rgba(0,212,255,0.35) 0%, transparent 70%)',
                    border: '2px solid rgba(0,184,224,0.55)',
                    boxShadow: '0 0 40px rgba(0,212,255,0.55), 0 0 80px rgba(0,212,255,0.25)',
                  }}
                >
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#00B8E0" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <div className="animate-match-fade text-center">
                  <p className="text-white font-black text-lg tracking-tight leading-none">Match Found!</p>
                  <p className="text-cyan-400/70 text-xs font-medium mt-1">Connecting you now…</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Email verification */}
        {user && !user.emailVerified && status === 'matched' && (
          <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-40 px-4 w-full max-w-sm pointer-events-none">
            <div className="bg-cyan-400/15 border border-cyan-400/30 rounded-2xl px-4 py-3 flex items-center gap-3 backdrop-blur-sm pointer-events-auto">
              <span className="text-sm">📧</span>
              <p className="text-cyan-400 text-xs flex-1">Verify your email to unlock all features</p>
              <Link to="/settings?tab=account" className="text-cyan-400 text-xs font-bold hover:underline flex-shrink-0">→ Settings</Link>
            </div>
          </div>
        )}

        {/* Tip/gift feedback toast */}
        <AnimatePresence>
          {tipFeedback && (
            <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
              className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl text-sm font-semibold backdrop-blur-sm whitespace-nowrap"
              style={{ background: tipFeedback.type === 'success' ? 'rgba(0,212,255,0.15)' : 'rgba(239,68,68,0.15)', border: `1px solid ${tipFeedback.type === 'success' ? 'rgba(0,212,255,0.3)' : 'rgba(239,68,68,0.3)'}`, color: tipFeedback.type === 'success' ? '#4ade80' : '#f87171' }}>
              {tipFeedback.msg}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tip modal */}
        <AnimatePresence>
          {showTip && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-end justify-center px-4"
              style={{ background: 'rgba(0,0,0,0.75)', paddingBottom: '24px' }} onClick={() => setShowTip(false)}>
              <motion.div initial={{ y: 48 }} animate={{ y: 0 }} exit={{ y: 48 }} onClick={(e) => e.stopPropagation()}
                className="w-full max-w-sm rounded-3xl p-5 border border-white/10" style={{ background: 'linear-gradient(160deg,#0d0d1c,#09091a)' }}>
                <div className="flex items-center justify-between mb-4">
                  <div><h3 className="text-white font-black text-sm flex items-center gap-1.5">Send a Tip <VybeCoin size={15} /></h3><p className="text-white/40 text-xs mt-0.5">30% goes to Vybe · Min 10 coins</p></div>
                  <button onClick={() => setShowTip(false)} className="text-white/40 hover:text-white"><X size={15} /></button>
                </div>
                {/* Coin balance breakdown */}
                <div className="flex gap-2 mb-4">
                  <div className="flex-1 rounded-xl px-3 py-2.5 text-center" style={{ background: 'rgba(0,184,224,0.08)', border: '1px solid rgba(0,212,255,0.15)' }}>
                    <p className="text-cyan-300 font-black text-sm flex items-center gap-1 justify-center"><VybeCoin size={13}/> {coins.toLocaleString()}</p>
                    <p className="text-white/40 text-[10px] mt-0.5">Spendable</p>
                  </div>
                  {cashableCoins > 0 && (
                    <div className="flex-1 rounded-xl px-3 py-2.5 text-center" style={{ background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.2)' }}>
                      <p className="text-cyan-400 font-black text-sm flex items-center gap-1 justify-center"><VybeCoin size={13}/> {cashableCoins.toLocaleString()}</p>
                      <p className="text-white/40 text-[10px] mt-0.5">Earned (cashable)</p>
                    </div>
                  )}
                </div>
                <div className="flex gap-2 mb-3">{[10,50,100,250].map((v) => {
                  const canAfford = v <= coins
                  return (
                    <button key={v} onClick={() => canAfford && setTipAmount(String(v))} disabled={!canAfford}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold transition-colors ${tipAmount===String(v)?'bg-cyan-500 text-white':canAfford?'bg-white/8 text-white/60 hover:bg-white/12':'bg-white/4 text-white/25 cursor-not-allowed'}`}>
                      {v}
                    </button>
                  )
                })}</div>
                <div className="flex gap-2 mb-3"><input type="number" value={tipAmount} onChange={(e) => setTipAmount(e.target.value)} placeholder="Custom amount" min="10" max={coins} className="flex-1 bg-white/6 border border-white/12 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-cyan-400/60 transition-colors" /></div>
                {tipAmount && parseInt(tipAmount) >= 10 && parseInt(tipAmount) <= coins && <p className="text-white/40 text-xs mb-3 text-center">Partner receives {Math.floor(parseInt(tipAmount)*0.70)} coins · Vybe keeps {Math.ceil(parseInt(tipAmount)*0.30)}</p>}
                {tipAmount && parseInt(tipAmount) > coins && <p className="text-red-400 text-xs mb-3 text-center">You only have {coins} spendable coins</p>}
                <button onClick={handleSendTip} disabled={tipLoading||!tipAmount||parseInt(tipAmount)<10||parseInt(tipAmount)>coins} className="w-full py-3 rounded-xl text-sm font-extrabold text-white disabled:opacity-50" style={{ background: 'linear-gradient(135deg,#00D4FF,#00B8E0)', boxShadow: '0 0 20px rgba(0,212,255,0.4)' }}>{tipLoading?'Sending…':`Send ${tipAmount||0} coins`}</button>
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
              <Loader2 size={36} className="text-cyan-400 animate-spin mb-4" />
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



        {/* ── MOBILE: Fullscreen immersive camera ── */}
        <div ref={pipContainerRef} className="lg:hidden fixed inset-0 z-[1] bg-black overflow-hidden">

          {/* Fullscreen background: stranger video OR searching state */}
          {status === 'searching' ? (
            <div className="absolute inset-0 bg-[#0a0a0f] flex flex-col items-center justify-center px-6" style={{ gap: 20 }}>
              {/* Globe — fixed container so rings stay within bounds */}
              <div className="relative flex items-center justify-center flex-shrink-0" style={{ width: 240, height: 240 }}>
                <motion.div className="absolute rounded-full" style={{ width: 232, height: 232, border: '1.5px solid #00D4FF' }} animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }} />
                <motion.div className="absolute rounded-full" style={{ width: 210, height: 210, border: '1px solid rgba(0,212,255,0.4)' }} animate={{ opacity: [0.3, 0.7, 0.3] }} transition={{ duration: 2.5, delay: 0.5, repeat: Infinity, ease: 'easeInOut' }} />
                <VybeGlobe size={180} />
              </div>
              <div className="text-center relative z-10 flex flex-col items-center" style={{ gap: 10 }}>
                <AnimatePresence mode="wait">
                  <motion.p key={prefs.mode === 'private' ? 'private' : searchTextIdx} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} transition={{ duration: 0.3 }} className="text-lg" style={{ color: '#00D4FF', fontWeight: 600, letterSpacing: '-0.01em' }}>
                    {prefs.mode === 'private' ? 'Waiting for your friend…' : SEARCH_TEXTS[searchTextIdx]}
                    <AnimatedDots />
                  </motion.p>
                </AnimatePresence>
                {onlineCount > 0 && (
                  <p className="text-sm flex items-center justify-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full animate-pulse flex-shrink-0" style={{ background: '#00D4FF' }} />
                    <span className="text-white font-medium">{onlineCount.toLocaleString()}</span>
                    <span style={{ color: '#666677' }}>{onlineCount === 1 ? 'person' : 'people'} online now</span>
                  </p>
                )}
                <AnimatePresence mode="wait">
                  <motion.p key={tipIdx} initial={{ opacity: 0, y: 3 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -3 }} transition={{ duration: 0.4 }} className="text-[11px]" style={{ color: '#555566' }}>
                    {TIPS[tipIdx % TIPS.length]}
                  </motion.p>
                </AnimatePresence>
              </div>
            </div>
          ) : opponentSocketIds.length === 0 ? (
            <div className="absolute inset-0 bg-[#080812] flex items-center justify-center">
              {status === 'matched' && <div className="loading-dots flex"><span /><span /><span /></div>}
            </div>
          ) : (
            <motion.div key={opponentSocketIds.join(',')} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }} className="absolute inset-0">
              {/* Primary opponent — always fullscreen */}
              <video
                ref={(el) => { remoteVideoRefs.current[opponentSocketIds[0]] = el }}
                autoPlay playsInline
                className="w-full h-full object-cover"
              />
              {/* Secondary opponent PiP — only when 2 opponents and no duo mate */}
              {opponentSocketIds.length > 1 && !isDuoMode && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: 'spring', damping: 26, stiffness: 300 }}
                  className="absolute z-[8] overflow-hidden"
                  style={{ top: 'max(72px, env(safe-area-inset-top, 0px) + 62px)', right: 12, width: 96, height: 128, borderRadius: 14, border: '1.5px solid rgba(255,255,255,0.12)', boxShadow: '0 8px 28px rgba(0,0,0,0.55)' }}
                >
                  <video ref={(el) => { remoteVideoRefs.current[opponentSocketIds[1]] = el }} autoPlay playsInline className="w-full h-full object-cover" />
                </motion.div>
              )}
            </motion.div>
          )}

          {/* Safe mode overlay */}
          <AnimatePresence>
            {strangerHidden && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
                className="absolute inset-0 z-[5] flex flex-col items-center justify-center gap-2.5"
                style={{ background: 'rgba(4,4,12,0.97)', backdropFilter: 'blur(32px)' }}>
                <div className="relative flex items-center justify-center">
                  <div className="absolute w-14 h-14 rounded-full" style={{ background: 'radial-gradient(circle, rgba(0,212,255,0.18) 0%, transparent 70%)' }} />
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(0,212,255,0.1)', border: '1.5px solid rgba(0,212,255,0.35)', boxShadow: '0 0 16px rgba(0,212,255,0.15)' }}>
                    <Shield size={18} style={{ color: '#00B8E0' }} />
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-white font-black text-xs tracking-wide mb-0.5">Safe Mode Active</p>
                  <p className="text-white/35 text-[10px]">Stranger's camera is hidden</p>
                </div>
                <button onClick={() => setStrangerHidden(false)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold active:scale-95 mt-1" style={{ background: 'rgba(0,212,255,0.12)', border: '1px solid rgba(0,212,255,0.35)', color: '#00B8E0' }}>
                  <Video size={11} /> Reveal Camera
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Top gradient overlay */}
          <div className="absolute inset-x-0 top-0 h-36 pointer-events-none z-[3]" style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, transparent 100%)' }} />
          {/* Bottom gradient overlay */}
          <div className="absolute inset-x-0 bottom-0 h-52 pointer-events-none z-[3]" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.72) 0%, transparent 100%)' }} />

          {/* Partner info — top left */}
          <AnimatePresence>
            {status === 'matched' && (
              <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.25 }}
                className="absolute z-[6] flex items-center gap-2"
                style={{ top: 'max(12px, env(safe-area-inset-top, 0px) + 10px)', left: 12 }}>
                <div className="flex items-center gap-2 px-3 py-1.5" style={{ background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 50 }}>
                  <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#00D4FF' }} />
                  <div className="flex items-center gap-1.5">
                    <span className="text-white font-bold text-[12px]">{partnerUsername ? partnerUsername : 'Stranger'}</span>
                    {partnerEmailVerified && <ShieldCheck size={10} style={{ color: '#00B8E0', flexShrink: 0 }} />}
                    {partnerIsVip && <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[8px] font-black" style={{ background: 'linear-gradient(135deg, rgba(0,212,255,0.3), rgba(124,58,237,0.3))', color: '#e0f0ff', border: '1px solid rgba(0,212,255,0.3)' }}><Crown size={7} /> VIP</span>}
                    {!partnerIsVip && partnerIsPremium && <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[8px] font-black" style={{ background: 'rgba(0,212,255,0.15)', color: '#00D4FF', border: '1px solid rgba(0,212,255,0.3)' }}><Zap size={7} /> Member</span>}
                  </div>
                  {user && partnerUid && !friendReqSent && (
                    <button onClick={handleAddFriend} disabled={friendReqLoad} className="flex items-center justify-center w-5 h-5 rounded-full ml-0.5 active:scale-95" style={{ background: 'rgba(0,212,255,0.25)', border: '1px solid rgba(0,212,255,0.4)', color: '#00B8E0', flexShrink: 0 }}>
                      {friendReqLoad ? <Loader2 size={9} className="animate-spin" /> : <UserPlus size={9} />}
                    </button>
                  )}
                  {user && partnerUid && friendReqSent && (
                    <span className="flex items-center justify-center w-5 h-5 rounded-full ml-0.5" style={{ background: 'rgba(0,212,255,0.2)', border: '1px solid rgba(0,212,255,0.35)', color: '#4ade80', flexShrink: 0 }}>
                      <UserPlus size={9} />
                    </span>
                  )}
                </div>
                {user && status === 'matched' && (
                  <button onClick={() => setShowTip(true)} className="flex items-center justify-center w-7 h-7 rounded-xl active:scale-90" style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <VybeCoin size={14} />
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Timer — top right */}
          {status === 'matched' && (
            <div className="absolute z-[6] px-2.5 py-1.5 rounded-xl font-mono text-[11px] text-white/70"
              style={{ top: 'max(12px, env(safe-area-inset-top, 0px) + 10px)', right: 12, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.08)' }}>
              {fmt(elapsed)}
            </div>
          )}

          {/* Draggable PiP self-view */}
          <motion.div
            drag
            dragConstraints={{
              left: 0,
              top: 0,
              right: window.innerWidth - 138,
              bottom: window.innerHeight - PIP_H,
            }}
            dragElastic={0.08}
            dragMomentum={false}
            onTap={() => {
              const now = Date.now()
              if (now - pipLastTapRef.current < 350) {
                setSelfViewExpanded(v => !v)
                pipLastTapRef.current = 0
              } else {
                pipLastTapRef.current = now
              }
            }}
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{
              opacity: 1,
              scale: 1,
              width: selfViewExpanded ? 138 : 86,
              height: selfViewExpanded ? 190 : 115,
              borderRadius: selfViewExpanded ? 16 : 12,
            }}
            transition={{ type: 'spring', damping: 26, stiffness: 300 }}
            className="absolute z-[10] overflow-hidden"
            style={{
              x: pipX,
              y: pipY,
              top: 0,
              left: 0,
              boxShadow: '0 8px 32px rgba(0,0,0,0.65), 0 2px 8px rgba(0,0,0,0.45)',
              border: '1.5px solid rgba(255,255,255,0.15)',
              touchAction: 'none',
              cursor: 'grab',
            }}
          >
            <video ref={localVideoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
            {!hasCamera && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0a0a14]">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              </div>
            )}
            {videoOff && hasCamera && (
              <div className="absolute inset-0 bg-black/80 flex items-center justify-center"><VideoOff size={14} className="text-white/30" /></div>
            )}
            {/* Username label */}
            <div className="absolute bottom-1 inset-x-0 flex items-center justify-center pointer-events-none">
              <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}>
                <span className="text-white/75 font-semibold text-[9px]">{user ? user.username : 'You'}</span>
              </div>
            </div>
            {/* Camera controls — only shown when expanded */}
            {selfViewExpanded && (
              <div className="absolute top-1.5 right-1.5 flex gap-1">
                {hasCamera && (
                  <button
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => { e.stopPropagation(); toggleVideo() }}
                    className="w-6 h-6 rounded-full flex items-center justify-center active:scale-90"
                    style={{ background: videoOff ? 'rgba(220,38,38,0.55)' : 'rgba(0,0,0,0.6)', border: videoOff ? '1px solid rgba(220,38,38,0.5)' : '1px solid rgba(255,255,255,0.12)' }}>
                    {videoOff ? <VideoOff size={10} className="text-white" /> : <Video size={10} className="text-white/70" />}
                  </button>
                )}
              </div>
            )}
          </motion.div>

          {/* ── DUO MODE: squad-mate floating PiP ── */}
          <AnimatePresence>
            {isDuoMode && mateSocketIds[0] && (
              <motion.div
                drag
                dragConstraints={{ left: 0, top: 0, right: window.innerWidth - DUO_PIP_W_LG, bottom: window.innerHeight - DUO_PIP_H_LG }}
                dragElastic={0.08}
                dragMomentum={false}
                onTap={() => {
                  const now = Date.now()
                  if (now - duoPipLastTapRef.current < 350) {
                    setDuoPipExpanded(v => !v)
                    duoPipLastTapRef.current = 0
                  } else {
                    duoPipLastTapRef.current = now
                  }
                }}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  width: duoPipExpanded ? DUO_PIP_W_LG : DUO_PIP_W_SM,
                  height: duoPipExpanded ? DUO_PIP_H_LG : DUO_PIP_H_SM,
                  borderRadius: duoPipExpanded ? 18 : 14,
                }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ type: 'spring', damping: 26, stiffness: 300 }}
                className="absolute z-[11] overflow-hidden"
                style={{
                  x: duoPipX,
                  y: duoPipY,
                  top: 0,
                  left: 0,
                  boxShadow: '0 0 22px rgba(0,212,255,0.38), 0 8px 32px rgba(0,0,0,0.65)',
                  border: '1.5px solid rgba(0,212,255,0.4)',
                  touchAction: 'none',
                  cursor: 'grab',
                }}
              >
                <video
                  ref={(el) => { remoteVideoRefs.current[mateSocketIds[0]] = el }}
                  autoPlay playsInline
                  className="w-full h-full object-cover"
                />
                {/* DUO label */}
                <div className="absolute top-1.5 left-1.5 pointer-events-none">
                  <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-md" style={{ background: 'rgba(0,212,255,0.75)', backdropFilter: 'blur(8px)' }}>
                    <span className="text-white font-black text-[7px] tracking-wider">DUO</span>
                  </div>
                </div>
                {/* Username label */}
                <div className="absolute bottom-1 inset-x-0 flex items-center justify-center pointer-events-none">
                  <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}>
                    <span className="text-white/80 font-semibold text-[9px]">Your partner</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── DUO MODE badge — top center ── */}
          <AnimatePresence>
            {isDuoMode && status === 'matched' && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ type: 'spring', damping: 24, stiffness: 280 }}
                className="absolute z-[6] left-1/2 -translate-x-1/2 pointer-events-none"
                style={{ top: 'max(14px, env(safe-area-inset-top, 0px) + 12px)' }}
              >
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full" style={{ background: 'rgba(0,212,255,0.22)', backdropFilter: 'blur(16px)', border: '1px solid rgba(0,212,255,0.38)', boxShadow: '0 0 16px rgba(0,212,255,0.15)' }}>
                  <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#00D4FF' }} />
                  <span className="text-[10px] font-black tracking-widest text-white/90">DUO MODE</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>

        {/* ── MOBILE: floating glassmorphism controls pill ── */}
        <AnimatePresence>
          {!showChat && (
            <motion.div
              initial={{ opacity: 0, y: 22, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 18, scale: 0.92 }}
              transition={{ type: 'spring', damping: 30, stiffness: 340 }}
              className="lg:hidden fixed z-[30] flex items-center rounded-full"
              style={{
                bottom: 'max(22px, calc(env(safe-area-inset-bottom, 0px) + 14px))',
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'rgba(255,255,255,0.04)',
                backdropFilter: 'blur(30px)',
                WebkitBackdropFilter: 'blur(30px)',
                border: '1px solid rgba(255,255,255,0.10)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)',
                borderRadius: 60,
                padding: '10px 18px',
                gap: '8px',
              }}
            >
              {/* Mute */}
              <MobileFloatBtn onClick={toggleMute} active={isMuted} red={isMuted}>
                {isMuted ? <MicOff size={16} /> : <Mic size={16} />}
              </MobileFloatBtn>

              {/* Skip — always visible, dimmed when searching */}
              <motion.button
                onClick={status === 'matched' ? handleSkip : undefined}
                whileTap={status === 'matched' ? { scale: 0.88 } : {}}
                style={{ padding: '10px 20px', background: '#00D4FF', borderRadius: 50, color: '#000', fontWeight: 700, fontSize: 14, border: 'none', display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, boxShadow: status === 'matched' ? '0 0 20px rgba(0,212,255,0.35)' : 'none', opacity: status === 'matched' ? 1 : 0.45, cursor: status === 'matched' ? 'pointer' : 'default', transition: 'all 150ms ease' }}>
                <SkipForward size={15} /> Skip
              </motion.button>

              {/* End call */}
              <MobileFloatBtn onClick={handleEnd} red active={status === 'matched'}>
                <PhoneOff size={status === 'matched' ? 18 : 16} />
              </MobileFloatBtn>

              {/* Divider */}
              <div className="w-px h-5 flex-shrink-0 mx-0.5" style={{ background: 'rgba(255,255,255,0.07)' }} />

              {/* Chat */}
              <MobileFloatBtn onClick={toggleChat}>
                <span className="relative">
                  <MessageSquare size={16} />
                  {unread > 0 && !showChat && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full text-[7px] font-black flex items-center justify-center"
                      style={{ background: '#00D4FF', color: '#fff' }}>
                      {unread > 9 ? '9+' : unread}
                    </span>
                  )}
                </span>
              </MobileFloatBtn>

              {/* Safe mode */}
              <MobileFloatBtn onClick={() => setStrangerHidden(h => !h)} amber={strangerHidden} active={strangerHidden}>
                <Shield size={16} />
              </MobileFloatBtn>

              {/* Report */}
              {!reportSent ? (
                <MobileFloatBtn onClick={() => status === 'matched' && setShowReport(true)} disabled={status !== 'matched'}>
                  <Flag size={16} />
                </MobileFloatBtn>
              ) : (
                <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(0,212,255,0.12)', border: '1px solid rgba(0,212,255,0.22)' }}>
                  <span className="text-cyan-400 text-xs font-bold">✓</span>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ══════════════════════════════════════════════════════════
            DESKTOP LAYOUT
        ══════════════════════════════════════════════════════════ */}
        <div className="hidden lg:flex" style={{ height: '100dvh', width: '100%', background: '#0a0a0f' }}>
          <div className="flex-1 flex min-h-0" style={{ padding: 8, gap: 8 }}>

              {/* Stranger video */}
              <div className="relative flex-1 overflow-hidden min-h-0 min-w-0" style={{ borderRadius: 20, background: '#0d0d18', border: '1px solid rgba(255,255,255,0.06)' }}>
                {status === 'searching' ? (
                  <div className="w-full h-full flex flex-col items-center justify-center px-4 relative overflow-hidden" style={{ gap: 20, paddingBottom: 100 }}>
                    {/* Globe — fixed-size container so rings don't overflow into text */}
                    <div className="relative flex items-center justify-center flex-shrink-0" style={{ width: 280, height: 280 }}>
                      <motion.div className="absolute rounded-full" style={{ width: 272, height: 272, border: '1.5px solid #00D4FF' }} animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }} />
                      <motion.div className="absolute rounded-full" style={{ width: 248, height: 248, border: '1px solid rgba(0,212,255,0.4)' }} animate={{ opacity: [0.3, 0.7, 0.3] }} transition={{ duration: 2.6, delay: 0.5, repeat: Infinity, ease: 'easeInOut' }} />
                      <VybeGlobe size={210} />
                    </div>
                    <div className="text-center relative z-10 flex flex-col items-center" style={{ gap: 10 }}>
                      <AnimatePresence mode="wait">
                        <motion.div key={prefs.mode === 'private' ? 'private' : searchTextIdx} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} transition={{ duration: 0.3 }}>
                          <p className="text-xl" style={{ color: '#00D4FF', fontWeight: 600, letterSpacing: '-0.01em' }}>
                            {prefs.mode === 'private' ? 'Waiting for your friend…' : SEARCH_TEXTS[searchTextIdx]}
                            <AnimatedDots />
                          </p>
                        </motion.div>
                      </AnimatePresence>
                      {onlineCount > 0 && (
                        <p className="text-sm flex items-center justify-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full animate-pulse flex-shrink-0" style={{ background: '#00D4FF' }} />
                          <span className="text-white font-medium">{onlineCount.toLocaleString()}</span>
                          <span style={{ color: '#666677' }}>{onlineCount === 1 ? 'person' : 'people'} online now</span>
                        </p>
                      )}
                      <AnimatePresence mode="wait">
                        <motion.p key={tipIdx} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.4 }} className="text-[12px]" style={{ color: '#555566' }}>
                          {TIPS[tipIdx % TIPS.length]}
                        </motion.p>
                      </AnimatePresence>
                    </div>
                  </div>
                ) : opponentSocketIds.length === 0 ? (
                  <div className="w-full h-full flex items-center justify-center">
                    {status === 'matched' && <div className="loading-dots flex"><span /><span /><span /></div>}
                  </div>
                ) : (
                  <motion.div
                    key={opponentSocketIds.join(',')}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                    className="w-full h-full flex"
                  >
                    {opponentSocketIds.map((sid, idx) => (
                      <div key={sid} className={`relative flex-1 overflow-hidden ${idx > 0 ? 'border-l border-white/10' : ''}`}>
                        <video ref={(el) => { remoteVideoRefs.current[sid] = el }} autoPlay playsInline className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </motion.div>
                )}

                {/* Partner identity overlay */}
                <AnimatePresence>
                  {status === 'matched' && (
                    <motion.div
                      initial={{ opacity: 0, y: -6, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -4, scale: 0.97 }}
                      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                      className="absolute top-3 left-3 z-10 flex items-center gap-2">
                      <div className="flex items-center gap-2 px-3 py-1.5" style={{ background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 50 }}>
                        {partnerAvatar ? (
                          <img src={partnerAvatar} alt="" className="w-5 h-5 rounded-full object-cover flex-shrink-0" />
                        ) : (
                          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#00D4FF' }} />
                        )}
                        <div className="flex items-center gap-1.5">
                          <span className="text-white font-bold text-[13px]">
                            {partnerUsername ? partnerUsername : 'Stranger'}
                          </span>
                          {partnerEmailVerified && (
                            <ShieldCheck size={11} style={{ color: '#00B8E0', flexShrink: 0 }} title="Verified" />
                          )}
                          {partnerIsVip && (
                            <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-black" style={{ background: 'linear-gradient(135deg, rgba(0,212,255,0.3), rgba(124,58,237,0.3))', color: '#e0f0ff', border: '1px solid rgba(0,212,255,0.3)' }}>
                              <Crown size={8} /> VIP
                            </span>
                          )}
                          {!partnerIsVip && partnerIsPremium && (
                            <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-black" style={{ background: 'rgba(0,212,255,0.15)', color: '#00D4FF', border: '1px solid rgba(0,212,255,0.3)' }}>
                              <Zap size={8} /> Member
                            </span>
                          )}
                        </div>
                        {user && partnerUid && !friendReqSent && (
                          <button onClick={handleAddFriend} disabled={friendReqLoad} title="Add friend" className="flex items-center justify-center w-5 h-5 rounded-full ml-0.5 active:scale-95" style={{ background: 'rgba(0,212,255,0.2)', border: '1px solid rgba(0,212,255,0.35)', color: '#00D4FF', flexShrink: 0 }}>
                            {friendReqLoad ? <Loader2 size={9} className="animate-spin" /> : <UserPlus size={9} />}
                          </button>
                        )}
                        {user && partnerUid && friendReqSent && (
                          <span className="flex items-center justify-center w-5 h-5 rounded-full ml-0.5" style={{ background: 'rgba(74,222,128,0.2)', border: '1px solid rgba(74,222,128,0.35)', color: '#4ade80', flexShrink: 0 }}>
                            <UserPlus size={9} />
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => setStrangerHidden(h => !h)}
                        title={strangerHidden ? 'Reveal camera (exit safe mode)' : 'Safe Mode — hide camera instantly'}
                        className="flex items-center justify-center w-7 h-7 rounded-full"
                        style={{
                          backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
                          background: strangerHidden ? 'rgba(0,212,255,0.2)' : 'rgba(255,255,255,0.05)',
                          border: strangerHidden ? '1px solid rgba(0,212,255,0.4)' : '1px solid rgba(255,255,255,0.12)',
                          transition: 'all 200ms ease',
                        }}>
                        <Shield size={13} style={{ color: strangerHidden ? '#00D4FF' : 'rgba(255,255,255,0.7)' }} />
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Timer */}
                {status === 'matched' && (
                  <div className="absolute top-3 right-3 z-10 px-2.5 py-1.5 rounded-full font-mono text-[12px] text-white/80" style={{ background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.12)' }}>
                    {fmt(elapsed)}
                  </div>
                )}

                {status === 'matched' && (
                  <div className="absolute bottom-3 inset-x-0 flex items-center justify-center z-10 pointer-events-none">
                    <div className="px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase" style={{ background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' }}>
                      STRANGER
                    </div>
                  </div>
                )}
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
                      <div className="relative flex items-center justify-center">
                        <div className="absolute w-20 h-20 rounded-full"
                          style={{ background: 'radial-gradient(circle, rgba(0,212,255,0.18) 0%, transparent 70%)' }} />
                        <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                          style={{ background: 'rgba(0,212,255,0.1)', border: '1.5px solid rgba(0,212,255,0.35)', boxShadow: '0 0 24px rgba(0,212,255,0.15)' }}>
                          <Shield size={26} style={{ color: '#00B8E0' }} />
                        </div>
                      </div>
                      <div className="text-center">
                        <p className="text-white font-black text-sm tracking-wide mb-0.5">Safe Mode Active</p>
                        <p className="text-white/35 text-[11px]">Stranger's camera is hidden</p>
                      </div>
                      <button
                        onClick={() => setStrangerHidden(false)}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold active:scale-95"
                        style={{ background: 'rgba(0,212,255,0.12)', border: '1px solid rgba(0,212,255,0.35)', color: '#00B8E0' }}
                      >
                        <Video size={12} /> Reveal Camera
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
                {/* Bottom fade for bar clearance */}
                <div className="absolute bottom-0 left-0 right-0 pointer-events-none z-[5]" style={{ height: 120, background: 'linear-gradient(to top, rgba(0,0,0,0.32) 0%, transparent 100%)' }} />
              </div>

              {/* Your video — desktop only, uses localVideoDesktopRef */}
              <div className="relative flex-1 overflow-hidden min-h-0 min-w-0" style={{ borderRadius: 20, background: '#0d0d18', border: '1px solid rgba(255,255,255,0.06)' }}>
                <video ref={localVideoDesktopRef} autoPlay muted playsInline className="w-full h-full object-cover" />

                {!hasCamera && (
                  <div className="absolute inset-0 flex items-center justify-center bg-[#0a0a0f]">
                    <VideoOff size={48} style={{ color: '#00D4FF' }} />
                  </div>
                )}
                {videoOff && hasCamera && (
                  <div className="absolute inset-0 bg-black/80 flex items-center justify-center"><VideoOff size={26} className="text-white/30" /></div>
                )}

                {/* You label */}
                <div className="absolute top-3 right-3 z-10">
                  <div className="flex items-center gap-2 px-3 py-1.5" style={{ background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 50 }}>
                    {user?.avatar ? (
                      <img src={user.avatar} alt="" className="w-6 h-6 rounded-full object-cover flex-shrink-0 ring-1 ring-white/20" />
                    ) : user?.username ? (
                      <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-white font-black text-[10px]"
                        style={{ background: 'linear-gradient(135deg, #00D4FF, #7C3AED)' }}>
                        {user.username[0].toUpperCase()}
                      </div>
                    ) : null}
                    <div className="flex items-center gap-1.5">
                      <span className="text-white font-bold text-[13px]">{user ? user.username : 'You'}</span>
                      {user?.emailVerified && (
                        <ShieldCheck size={11} style={{ color: '#00B8E0', flexShrink: 0 }} title="Verified" />
                      )}
                      {user?.isVip && (
                        <span className="flex items-center gap-0.5 px-2 py-0.5 rounded-md text-[9px] font-black" style={{ background: 'linear-gradient(135deg, #00D4FF, #7C3AED)', color: '#fff' }}>
                          <Crown size={7} /> VIP
                        </span>
                      )}
                      {!user?.isVip && user?.isPremium && (
                        <span className="flex items-center gap-0.5 px-2 py-0.5 rounded-md text-[9px] font-black" style={{ background: 'linear-gradient(135deg, #00D4FF, #7C3AED)', color: '#fff' }}>
                          <Zap size={7} /> Member
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Squad mates */}
                {mateSocketIds.map((sid) => (
                  <div key={sid} className="absolute inset-y-0 right-0 w-1/2 border-l border-white/10">
                    <video ref={(el) => { remoteVideoRefs.current[sid] = el }} autoPlay playsInline className="w-full h-full object-cover" />
                    <div className="absolute top-2 left-2 z-10"><span className="text-[9px] font-black tracking-widest text-cyan-400/80 uppercase bg-black/30 backdrop-blur-sm px-2 py-1 rounded-md">Duo</span></div>
                  </div>
                ))}
                {/* Bottom fade for bar clearance */}
                <div className="absolute bottom-0 left-0 right-0 pointer-events-none z-[5]" style={{ height: 120, background: 'linear-gradient(to top, rgba(0,0,0,0.32) 0%, transparent 100%)' }} />
              </div>

          </div>

          {/* Desktop chat sidebar */}
          <motion.div className="flex flex-col flex-shrink-0 overflow-hidden"
            style={{ background: 'rgba(10,10,20,0.6)', backdropFilter: 'blur(30px)', WebkitBackdropFilter: 'blur(30px)', borderLeft: '1px solid rgba(255,255,255,0.08)' }}
            animate={{ width: showChat ? 320 : 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 260 }}>
            <div className="w-[320px] h-full flex flex-col">{ChatContent()}</div>
          </motion.div>

        </div>

        {/* ── Desktop fixed floating control bar ── */}
        <div className="hidden lg:flex fixed z-40 items-center" style={{
          bottom: 28, left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(6,6,14,0.92)',
          backdropFilter: 'blur(48px)', WebkitBackdropFilter: 'blur(48px)',
          border: '1px solid rgba(255,255,255,0.16)',
          borderRadius: 60,
          padding: '12px 24px',
          gap: 14,
          boxShadow: '0 12px 48px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.12)',
        }}>

          {/* Mic */}
          <motion.button onClick={toggleMute} whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}
            title={isMuted ? 'Unmute' : 'Mute'}
            style={{ width: 48, height: 48, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: isMuted ? 'rgba(255,50,50,0.2)' : 'rgba(255,255,255,0.07)', border: isMuted ? '1px solid rgba(255,50,50,0.35)' : '1px solid rgba(255,255,255,0.12)', color: isMuted ? '#FF4444' : 'rgba(255,255,255,0.85)', transition: 'all 150ms ease', cursor: 'pointer' }}>
            {isMuted ? <MicOff size={18} /> : <Mic size={18} />}
          </motion.button>

          {/* Camera */}
          {hasCamera && (
            <motion.button onClick={toggleVideo} whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}
              title={videoOff ? 'Camera On' : 'Camera Off'}
              style={{ width: 48, height: 48, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: videoOff ? 'rgba(255,50,50,0.2)' : 'rgba(255,255,255,0.07)', border: videoOff ? '1px solid rgba(255,50,50,0.35)' : '1px solid rgba(255,255,255,0.12)', color: videoOff ? '#FF4444' : 'rgba(255,255,255,0.85)', transition: 'all 150ms ease', cursor: 'pointer' }}>
              {videoOff ? <VideoOff size={18} /> : <Video size={18} />}
            </motion.button>
          )}

          {/* SKIP — always visible, dimmed when not matched */}
          <motion.button
            onClick={status === 'matched' ? handleSkip : undefined}
            disabled={status !== 'matched'}
            whileHover={status === 'matched' ? { scale: 1.06 } : {}}
            whileTap={status === 'matched' ? { scale: 0.94 } : {}}
            style={{ padding: '12px 28px', background: '#00D4FF', borderRadius: 50, color: '#000000', fontWeight: 700, fontSize: 15, border: 'none', display: 'flex', alignItems: 'center', flexShrink: 0, boxShadow: '0 0 24px rgba(0,212,255,0.35)', opacity: status === 'matched' ? 1 : 0.45, cursor: status === 'matched' ? 'pointer' : 'default', transition: 'all 150ms ease' }}>
            Skip
          </motion.button>

          {/* Chat */}
          <motion.button onClick={toggleChat} whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}
            title="Chat"
            style={{ width: 48, height: 48, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', background: showChat ? 'rgba(0,212,255,0.18)' : 'rgba(255,255,255,0.07)', border: showChat ? '1px solid rgba(0,212,255,0.35)' : '1px solid rgba(255,255,255,0.12)', color: showChat ? '#00D4FF' : 'rgba(255,255,255,0.85)', transition: 'all 150ms ease', cursor: 'pointer' }}>
            <MessageSquare size={18} />
            {unread > 0 && !showChat && (
              <span style={{ position: 'absolute', top: -2, right: -2, width: 14, height: 14, background: '#FF4444', borderRadius: '50%', fontSize: 7, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </motion.button>

          {/* Report */}
          {reportSent ? (
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(0,212,255,0.12)', border: '1px solid rgba(0,212,255,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ color: '#00D4FF', fontSize: 12, fontWeight: 700 }}>✓</span>
            </div>
          ) : (
            <motion.button onClick={() => status === 'matched' && setShowReport(true)} disabled={status !== 'matched'}
              whileHover={status === 'matched' ? { scale: 1.08 } : {}} whileTap={status === 'matched' ? { scale: 0.92 } : {}}
              title="Report"
              style={{ width: 48, height: 48, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.85)', opacity: status === 'matched' ? 1 : 0.38, cursor: status === 'matched' ? 'pointer' : 'default', transition: 'all 150ms ease' }}>
              <Flag size={18} />
            </motion.button>
          )}

          {/* End */}
          <motion.button onClick={handleEnd} whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}
            title={status === 'matched' ? 'End Chat' : 'Leave'}
            style={{ width: 48, height: 48, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,45,45,0.25)', border: '1px solid rgba(255,45,45,0.35)', color: '#FF4444', boxShadow: '0 0 16px rgba(255,45,45,0.2)', transition: 'all 150ms ease', cursor: 'pointer' }}>
            <PhoneOff size={18} />
          </motion.button>

          {/* Secondary: Tip + Friend + Block when matched */}
          {user && status === 'matched' && (
            <>
              <div style={{ width: 1, height: 28, background: 'rgba(255,255,255,0.08)', flexShrink: 0 }} />
              <motion.button onClick={() => setShowTip(true)} whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}
                title="Send Tip"
                style={{ width: 48, height: 48, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.85)', transition: 'all 150ms ease', cursor: 'pointer' }}>
                <VybeCoin size={17} />
              </motion.button>
              {partnerUid && (
                <motion.button onClick={handleAddFriend} disabled={friendReqLoad || friendReqSent}
                  whileHover={!friendReqSent ? { scale: 1.08 } : {}} whileTap={!friendReqSent ? { scale: 0.92 } : {}}
                  title={friendReqSent ? 'Request sent' : 'Add Friend'}
                  style={{ width: 48, height: 48, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: friendReqSent ? 'rgba(74,222,128,0.15)' : 'rgba(255,255,255,0.07)', border: friendReqSent ? '1px solid rgba(74,222,128,0.3)' : '1px solid rgba(255,255,255,0.12)', color: friendReqSent ? '#4ade80' : 'rgba(255,255,255,0.85)', transition: 'all 150ms ease', cursor: friendReqSent ? 'default' : 'pointer' }}>
                  {friendReqSent ? <span style={{ fontSize: 12, fontWeight: 700 }}>✓</span> : <UserPlus size={17} />}
                </motion.button>
              )}
              {partnerUid && (
                <motion.button onClick={handleBlock} disabled={blockLoading}
                  whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}
                  title="Block"
                  style={{ width: 48, height: 48, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,50,50,0.1)', border: '1px solid rgba(255,50,50,0.25)', color: '#f87171', transition: 'all 150ms ease', cursor: 'pointer' }}>
                  <UserX size={17} />
                </motion.button>
              )}
            </>
          )}

        </div>

        {/* ── Mobile chat drawer — compact bottom sheet ── */}
        <AnimatePresence>
          {showChat && (
            <>
              {/* Tap-outside to close */}
              <div className="lg:hidden fixed inset-0 z-[35]" onClick={toggleChat} />
              <motion.div
                className="lg:hidden fixed inset-x-0 z-[40] flex flex-col rounded-t-2xl border-t border-white/10"
                style={{ bottom: 0, height: '33dvh', minHeight: 240, background: 'rgba(10,10,20,0.96)', backdropFilter: 'blur(28px)' }}
                initial={{ y: '110%' }}
                animate={{ y: 0 }}
                exit={{ y: '110%' }}
                drag="y"
                dragConstraints={{ top: 0 }}
                dragElastic={0.15}
                onDragEnd={(_, info) => { if (info.offset.y > 80) toggleChat() }}
                transition={{ type: 'spring', damping: 28, stiffness: 260 }}
              >
                <div className="flex justify-center pt-2.5 pb-1 flex-shrink-0"><div className="w-8 h-1 rounded-full bg-white/20" /></div>
                {ChatContent()}
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* ── Report modal ── */}
        <AnimatePresence>
          {showReport && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/65 z-[45]" onClick={() => setShowReport(false)} />
              <motion.div initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.92 }} transition={{ type: 'spring', damping: 26, stiffness: 320 }}
                className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[50] w-[min(320px,90vw)] bg-vybe-bg2 border border-vybe-border rounded-2xl p-5 shadow-purple">
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
