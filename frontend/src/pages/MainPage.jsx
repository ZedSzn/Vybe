import { useState, useEffect, useLayoutEffect, useRef, Fragment } from 'react'
import ProfilePill from '../components/ProfilePill'
import { createPortal } from 'react-dom'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Lock, Globe, ChevronDown, UserPlus, Copy, Check,
  Crown, Loader2, X as XIcon, Video, VideoOff, Shield,
  Camera, DollarSign, SlidersHorizontal, User, Users, RefreshCw,
  Eye, EyeOff,
} from 'lucide-react'

const FEATURE_CARDS = [
  { key: 'instant', title: 'Instant Match',    desc: 'Connect with someone new in under 2 seconds.',     color: 'rgba(0,212,255',  hex: '#00D4FF' },
  { key: 'global',  title: 'Global',           desc: 'Meet people from 150+ countries worldwide.',       color: 'rgba(0,212,255', hex: '#00D4FF' },
  { key: 'safe',    title: 'Safe & Moderated', desc: 'Human moderation with instant ban enforcement.',   color: 'rgba(0,212,255', hex: '#00B8E0' },
]

function FeatureIcon({ k, hex }) {
  const s = { color: hex }
  if (k === 'instant') return <Video  size={20} style={s} />
  if (k === 'global')  return <Globe  size={20} style={s} />
  if (k === 'safe')    return <Shield size={20} style={s} />
  return null
}
import Navbar from '../components/Navbar'
import PremiumModal from '../components/PremiumModal'
import Footer from '../components/Footer'
import { useAuth } from '../context/AuthContext'
import { useSocket } from '../context/SocketContext'

const COUNTRIES = [
  'Afghanistan', 'Albania', 'Algeria', 'Angola', 'Argentina',
  'Armenia', 'Australia', 'Austria', 'Azerbaijan', 'Bahrain',
  'Bangladesh', 'Belgium', 'Bolivia', 'Bosnia & Herzegovina',
  'Brazil', 'Bulgaria', 'Cambodia', 'Cameroon', 'Canada',
  'Chile', 'China', 'Colombia', 'Congo', 'Costa Rica',
  'Croatia', 'Cuba', 'Czech Republic', 'Denmark', 'Dominican Republic',
  'Ecuador', 'Egypt', 'El Salvador', 'Ethiopia', 'Finland',
  'France', 'Georgia', 'Germany', 'Ghana', 'Greece',
  'Guatemala', 'Guinea', 'Haiti', 'Honduras', 'Hong Kong',
  'Hungary', 'Iceland', 'India', 'Indonesia', 'Iran',
  'Iraq', 'Ireland', 'Israel', 'Italy', 'Jamaica',
  'Japan', 'Jordan', 'Kazakhstan', 'Kenya', 'Kuwait',
  'Kyrgyzstan', 'Laos', 'Lebanon', 'Libya', 'Lithuania',
  'Malaysia', 'Mali', 'Mexico', 'Moldova', 'Mongolia',
  'Morocco', 'Mozambique', 'Myanmar', 'Nepal', 'Netherlands',
  'New Zealand', 'Nigeria', 'North Macedonia', 'Norway',
  'Oman', 'Pakistan', 'Panama', 'Papua New Guinea', 'Paraguay',
  'Peru', 'Philippines', 'Poland', 'Portugal', 'Puerto Rico',
  'Qatar', 'Romania', 'Russia', 'Rwanda', 'Saudi Arabia',
  'Senegal', 'Serbia', 'Sierra Leone', 'Singapore', 'Slovakia',
  'Somalia', 'South Africa', 'South Korea', 'South Sudan',
  'Spain', 'Sri Lanka', 'Sudan', 'Sweden', 'Switzerland',
  'Syria', 'Taiwan', 'Tajikistan', 'Tanzania', 'Thailand',
  'Tunisia', 'Turkey', 'Turkmenistan', 'Uganda', 'Ukraine',
  'United Arab Emirates', 'United Kingdom', 'United States',
  'Uruguay', 'Uzbekistan', 'Venezuela', 'Vietnam',
  'Yemen', 'Zambia', 'Zimbabwe',
]

const FAQ_ITEMS = [
  {
    q: 'What is Vybe?',
    a: "Vybe is a premium random video chat platform that instantly connects you with real people from around the world. It's designed to help you meet new people, make friends, and have genuine face-to-face conversations — no bots, no nonsense.",
  },
  {
    q: 'How does Vybe work?',
    a: "Click \"Start Video Chat\", allow camera access, and you'll be instantly matched with a random person worldwide. Don't vibe with who you got? Hit Skip to find someone new in seconds.",
  },
  {
    q: 'Is Vybe free to use?',
    a: 'Yes — Vybe is free with full access to core random video chat. Upgrading to Basic or VIP unlocks advanced filters like gender and country matching, and exclusive features.',
  },
  {
    q: 'What is Vybe Membership?',
    a: 'Membership comes in two tiers. Basic (£6.99/mo) unlocks gender filtering so you choose who you match with. VIP (£12.99/mo) adds country filtering and a VIP badge on your profile.',
  },
  {
    q: 'How do I report someone?',
    a: 'During any chat, tap the Flag icon in the top-right corner. Select a reason — nudity, harassment, underage, or other — and submit. All reports are anonymous and reviewed by our moderation team within 24 hours.',
  },
  {
    q: 'Is Vybe safe?',
    a: 'Safety is our top priority. Every report is reviewed by a human moderator. Users with 3 or more verified reports within 24 hours are automatically suspended pending review. Serious violations result in permanent bans.',
  },
  {
    q: 'Can I use Vybe on my phone?',
    a: "Absolutely. Vybe is fully optimized for mobile browsers on iOS and Android. No app download needed — just visit Vybe in your browser and you're ready to go.",
  },
  {
    q: 'What countries is Vybe available in?',
    a: "Vybe is available globally with users from over 150 countries. By default you're matched with anyone worldwide. VIP members can filter by specific country for a more targeted experience.",
  },
]

const genCode = () => 'VY-' + Math.random().toString(36).substring(2, 6).toUpperCase()

function fmtTime(seconds) {
  if (seconds == null || seconds < 0) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

function WaitingDots() {
  return (
    <span className="inline-flex items-end gap-[3px] ml-1 mb-[1px]">
      {[0, 0.22, 0.44].map((delay, i) => (
        <motion.span key={i} className="inline-block w-[3px] h-[3px] rounded-full"
          style={{ background: 'rgba(255,255,255,0.5)' }}
          animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
          transition={{ duration: 1.3, delay, repeat: Infinity, ease: 'easeInOut' }} />
      ))}
    </span>
  )
}

const AVATARS = [11, 26, 44, 7, 65, 15, 37]

const GRID_USERS = [
  { name: 'Sofia',    age: 23, country: 'IT', photo: 'https://randomuser.me/api/portraits/women/44.jpg', online: true  },
  { name: 'Ava',      age: 25, country: 'US', photo: 'https://randomuser.me/api/portraits/women/33.jpg', online: true  },
  { name: 'Ella',     age: 25, country: 'GB', photo: 'https://randomuser.me/api/portraits/women/22.jpg', online: false },
  { name: 'John',     age: 28, country: 'CA', photo: 'https://randomuser.me/api/portraits/men/32.jpg',   online: true  },
  { name: 'Isabella', age: 24, country: 'US', photo: 'https://randomuser.me/api/portraits/women/55.jpg', online: true  },
  { name: 'Zoey',     age: 22, country: 'AU', photo: 'https://randomuser.me/api/portraits/women/66.jpg', online: false },
  { name: 'Lucas',    age: 27, country: 'FR', photo: 'https://randomuser.me/api/portraits/men/44.jpg',   online: true  },
  { name: 'Emma',     age: 26, country: 'DE', photo: 'https://randomuser.me/api/portraits/women/11.jpg', online: false },
  { name: 'Marco',    age: 29, country: 'BR', photo: 'https://randomuser.me/api/portraits/men/55.jpg',   online: true  },
  { name: 'Mia',      age: 24, country: 'NL', photo: 'https://randomuser.me/api/portraits/women/77.jpg', online: true  },
  { name: 'Alex',     age: 26, country: 'ES', photo: 'https://randomuser.me/api/portraits/men/66.jpg',   online: false },
  { name: 'Chloe',    age: 22, country: 'KR', photo: 'https://randomuser.me/api/portraits/women/88.jpg', online: true  },
]


export default function MainPage() {
  const { user }                              = useAuth()
  const { socket, isConnected, onlineCount, myCountry } = useSocket()
  // Custom image shown in the camera panel when the device has no webcam.
  const camBgImage  = user?.cameraBackground === 'custom' ? (user?.cameraBackgroundImage || null) : null
  const navigate                             = useNavigate()
  const location                             = useLocation()
  const videoRef                             = useRef(null)   // mobile camera
  const videoRefDesktop                      = useRef(null)   // desktop camera
  const streamRef                            = useRef(null)

  const [mode,            setMode]            = useState('solo')
  const [filterGender,    setFilterGender]    = useState('both')
  const [filterCountry,   setFilterCountry]   = useState('')
  const [showCountryDrop, setShowCountryDrop] = useState(false)
  const [countrySearch,   setCountrySearch]   = useState('')
  const [showPremium,     setShowPremium]     = useState(false)
  const [cameraOn,           setCameraOn]           = useState(false)
  const [cameraErr,          setCameraErr]          = useState(false)
  const [cameraErrMsg,       setCameraErrMsg]       = useState('')
  const [noCameraDevice,     setNoCameraDevice]     = useState(false)
  const [facingMode,         setFacingMode]         = useState('user')
  const [permissionAsked,    setPermissionAsked]    = useState(false)
  const [faqOpen,         setFaqOpen]         = useState(null)
  const [autoMatch,       setAutoMatch]       = useState(true)
  const [showAdvanced,    setShowAdvanced]    = useState(false)
  const [showGenderPop,   setShowGenderPop]   = useState(false)

  const [squad,        setSquad]        = useState(null)
  const [squadLoading, setSquadLoading] = useState(false)
  const [squadError,   setSquadError]   = useState('')
  const [timeLeft,     setTimeLeft]     = useState(null)
  const [copied,       setCopied]       = useState(false)

  const [snapCopied,     setSnapCopied]     = useState(false)
  const [instantDuoCode, setInstantDuoCode] = useState('')
  const [codeVisible,    setCodeVisible]    = useState(false)

  const countryBtnRef    = useRef(null)
  const codeRevealTimer  = useRef(null)
  const [countryDropPos, setCountryDropPos] = useState({ top: 0, left: 0, width: 0 })

  const flipCamera = async () => {
    const newFacing = facingMode === 'user' ? 'environment' : 'user'
    setFacingMode(newFacing)
    streamRef.current?.getTracks().forEach(t => t.stop())
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: newFacing, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: true,
      })
      streamRef.current = stream
      if (videoRef.current) videoRef.current.srcObject = stream
      if (videoRefDesktop.current) videoRefDesktop.current.srcObject = stream
    } catch {
      setFacingMode(facingMode)
    }
  }

  const handleGender = (g) => {
    if (g !== 'both' && !user?.isPremium) { navigate('/subscription'); return }
    setFilterGender(g)
  }

  const handleCountryClick = () => {
    if (!user?.isVip) { navigate('/subscription'); return }
    setShowCountryDrop(v => { if (v) setCountrySearch(''); return !v })
  }


  useEffect(() => {
    if (!showGenderPop) return
    const handler = () => setShowGenderPop(false)
    const timer = setTimeout(() => document.addEventListener('click', handler), 60)
    return () => { clearTimeout(timer); document.removeEventListener('click', handler) }
  }, [showGenderPop])
  useEffect(() => {
    if (!showCountryDrop || !countryBtnRef.current) return
    const calcPos = () => {
      const r = countryBtnRef.current?.getBoundingClientRect()
      if (!r) return
      setCountryDropPos({ bottom: window.innerHeight - r.top + 8, left: Math.max(8, r.left), width: Math.max(r.width, 280) })
    }
    calcPos()
    const close = () => setShowCountryDrop(false)
    window.addEventListener('scroll', close, { passive: true })
    window.addEventListener('resize', close, { passive: true })
    return () => {
      window.removeEventListener('scroll', close)
      window.removeEventListener('resize', close)
    }
  }, [showCountryDrop])

  const enableCamera = async () => {
    setPermissionAsked(true)
    setCameraErrMsg('')

    // HTTPS required on mobile (localhost is exempt for dev)
    if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
      setCameraErr(true)
      setCameraErrMsg('Camera requires HTTPS. Please access this site over a secure connection.')
      return
    }

    // webkit fallback for older iOS
    const gum = navigator.mediaDevices?.getUserMedia?.bind(navigator.mediaDevices)
      ?? (cb => new Promise((res, rej) => navigator.webkitGetUserMedia?.call(navigator, cb, rej) ?? rej(new Error('Not supported'))))

    if (!navigator.mediaDevices?.getUserMedia && !navigator.webkitGetUserMedia) {
      setCameraErr(true)
      setCameraErrMsg('Your browser does not support camera access. Try Chrome or Safari.')
      return
    }

    const constraints = {
      video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
      audio: true,
    }

    try {
      const stream = await (navigator.mediaDevices?.getUserMedia
        ? navigator.mediaDevices.getUserMedia(constraints)
        : new Promise((res, rej) => navigator.webkitGetUserMedia(constraints, res, rej)))
      streamRef.current = stream
      if (videoRef.current) videoRef.current.srcObject = stream
      if (videoRefDesktop.current) videoRefDesktop.current.srcObject = stream
      setCameraOn(true)
      setCameraErr(false)
    } catch (err) {
      setCameraErr(true)
      const name = err?.name || ''
      if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
        setCameraErrMsg('Permission denied — allow camera in your browser settings.')
      } else if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
        setCameraErrMsg('No camera found on this device.')
      } else if (name === 'NotReadableError' || name === 'TrackStartError') {
        setCameraErrMsg('Camera is in use by another app. Close it and try again.')
      } else if (name === 'OverconstrainedError') {
        setCameraErrMsg('Camera does not meet requirements. Try a different browser.')
      } else {
        setCameraErrMsg('Could not access camera. Check your settings and try again.')
      }
    }
  }

  // Detect whether the device has any webcam at all.
  useEffect(() => {
    if (!navigator.mediaDevices?.enumerateDevices) return
    navigator.mediaDevices.enumerateDevices()
      .then((devices) => setNoCameraDevice(!devices.some((d) => d.kind === 'videoinput')))
      .catch(() => {})
  }, [])

  useEffect(() => {
    // Mobile browsers require a user gesture to access the camera — skip auto-attempt
    const isMobile = navigator.maxTouchPoints > 0
    if (isMobile) return

    let mounted = true
    if (!navigator.mediaDevices?.getUserMedia) { setCameraErr(true); return }
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'user', width: { ideal: 1280 } }, audio: false })
      .then((stream) => {
        if (!mounted) { stream.getTracks().forEach((t) => t.stop()); return }
        streamRef.current = stream
        if (videoRef.current) videoRef.current.srcObject = stream
        if (videoRefDesktop.current) videoRefDesktop.current.srcObject = stream
        setCameraOn(true)
      })
      .catch(() => { if (mounted) setCameraErr(true) })
    return () => {
      mounted = false
      streamRef.current?.getTracks().forEach((t) => t.stop())
    }
  }, [])

  useEffect(() => {
    if (!squad) { setTimeLeft(null); return }
    const update = () => {
      const remaining = Math.max(0, Math.floor((squad.expiresAt - Date.now()) / 1000))
      setTimeLeft(remaining)
      if (remaining === 0) { setSquad(null); setMode('solo') }
    }
    update()
    const id = setInterval(update, 1000)
    return () => clearInterval(id)
  }, [squad?.expiresAt])

  useEffect(() => {
    if (location.state?.squadJoined) {
      setSquad(location.state.squadJoined)
      setMode('squad')
      window.history.replaceState({}, '')
    }
    if (location.state?.scrollToFaq) {
      window.history.replaceState({}, '')
    }
  }, []) // eslint-disable-line

  // Scroll to FAQ before first paint so the top of the page never flashes
  useLayoutEffect(() => {
    if (location.state?.scrollToFaq) {
      const el = document.getElementById('faq')
      if (el) el.scrollIntoView({ behavior: 'instant' })
    }
  }, []) // eslint-disable-line

  useEffect(() => {
    if (!socket) return
    const onCreated  = (data) => { setSquad(data); setSquadLoading(false); setSquadError(''); setInstantDuoCode('') }
    const onUpdated  = (data) => setSquad(data)
    const onJoined   = (data) => { setSquad(data); setSquadError('') }
    const onExpired  = ()     => { setSquad(null); setSquadError('Duo expired. Create a new one.') }
    const onKicked   = ()     => { setSquad(null); setMode('solo'); setSquadError('You were removed from the duo.') }
    const onError    = ({ message }) => { setSquadLoading(false); setSquadError(message) }
    const onNavigate = ({ squadId }) => {
      streamRef.current?.getTracks().forEach((t) => t.stop())
      navigate('/chat', { state: { mode: 'squad', squadId, filterGender: null, filterCountry: '' } })
    }
    socket.on('squad-created',       onCreated)
    socket.on('squad-updated',       onUpdated)
    socket.on('squad-joined',        onJoined)
    socket.on('squad-expired',       onExpired)
    socket.on('squad-kicked',        onKicked)
    socket.on('squad-error',         onError)
    socket.on('squad-navigate',      onNavigate)
    return () => {
      socket.off('squad-created',       onCreated)
      socket.off('squad-updated',       onUpdated)
      socket.off('squad-joined',        onJoined)
      socket.off('squad-expired',       onExpired)
      socket.off('squad-kicked',        onKicked)
      socket.off('squad-error',         onError)
      socket.off('squad-navigate',      onNavigate)
    }
  }, [socket, navigate])

  const createSquad = () => {
    if (!socket || !isConnected) { setSquadError('Not connected. Please wait…'); return }
    setSquadLoading(true); setSquadError('')
    socket.emit('create-squad', { username: user?.username || 'Guest' })
    const timeout = setTimeout(() => {
      setSquadLoading((still) => {
        if (still) setSquadError('Connection issue — please restart the Vybe server.')
        return false
      })
    }, 8000)
    socket.once('squad-created', () => clearTimeout(timeout))
    socket.once('squad-error',   () => clearTimeout(timeout))
  }

  const kickMember = (targetSocketId) => {
    if (!socket || !squad) return
    socket.emit('kick-squad-member', { squadId: squad.squadId, targetSocketId })
  }

  const leaveSquad = () => {
    if (squad && socket) socket.emit('leave-squad', { squadId: squad.squadId })
    setSquad(null)
    setInstantDuoCode('')
    setSquadLoading(false)
    setSquadError('')
  }

  const duoDisplayCode = squad?.code || instantDuoCode
  const inviteUrl = duoDisplayCode ? `${window.location.origin}/duo/${duoDisplayCode}` : ''
  const handleModeClick = (val) => {
    setMode(val)
    if (val === 'squad' && !squad && !instantDuoCode) {
      setInstantDuoCode(genCode())
      if (socket && isConnected) {
        setSquadLoading(true); setSquadError('')
        socket.emit('create-squad', { username: user?.username || 'Guest' })
      }
    }
  }

  const inviteText = `Join my duo on Vybe! ${inviteUrl}`

  const toggleCodeVisibility = () => {
    if (codeRevealTimer.current) clearTimeout(codeRevealTimer.current)
    if (codeVisible) {
      setCodeVisible(false)
    } else {
      setCodeVisible(true)
      codeRevealTimer.current = setTimeout(() => setCodeVisible(false), 10000)
    }
  }

  const copyLink = async () => {
    try { await navigator.clipboard.writeText(inviteUrl); setCopied(true); setTimeout(() => setCopied(false), 2000) }
    catch {}
  }

  const copySnapDuo = async () => {
    try { await navigator.clipboard.writeText(inviteUrl); setSnapCopied(true); setTimeout(() => setSnapCopied(false), 2000) }
    catch {}
  }

  const shareUrls = {
    whatsapp: `https://wa.me/?text=${encodeURIComponent(inviteText)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(inviteUrl)}`,
    twitter:  `https://twitter.com/intent/tweet?text=${encodeURIComponent('Join my duo on Vybe!')}&url=${encodeURIComponent(inviteUrl)}`,
  }

  const squadReady = squad?.members?.length >= 2

  const startVybing = () => {
    if (mode === 'squad') {
      if (!squad) { setSquadError('Create a duo room first.'); return }
      if (squad.members.length < 2) { setSquadError('Waiting for your friend to join…'); return }
      socket.emit('squad-start-match', { squadId: squad.squadId })
      return
    }
    streamRef.current?.getTracks().forEach((t) => t.stop())
    navigate('/chat', {
      state: {
        mode,
        filterGender: filterGender === 'both' ? null : filterGender,
        filterCountry,
      },
    })
  }

  return (
    <motion.div
      className="min-h-screen font-space"
      style={{ background: '#0a0a0f' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      {/* Animated ambient background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>
      </div>

      <Navbar onPremiumClick={() => setShowPremium(true)} />

      {/* ══════════════ MOBILE LAYOUT ══════════════ */}
      <div className="lg:hidden relative z-10 px-4 pt-4 pb-12 flex flex-col gap-5">

        {/* Live pill */}
        <div className="flex justify-center">
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="inline-flex items-center gap-2"
            style={{ background: 'rgba(0,212,255,0.06)', border: '1px solid rgba(0,212,255,0.2)', borderRadius: 20, padding: '6px 14px' }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 online-pulse" />
            <span className="text-[10px] tracking-[0.14em] uppercase" style={{ color: '#00B8E0', fontFamily: "'Sora', system-ui, sans-serif", fontWeight: 700 }}>Live · Random · Real</span>
          </motion.div>
        </div>

        {/* Camera preview — dominant, full-width */}
        <motion.div
          className="relative rounded-2xl overflow-hidden w-full"
          style={{ aspectRatio: '4/3', background: '#080812', border: '1px solid rgba(0,212,255,0.2)', boxShadow: '0 0 0 1px rgba(0,212,255,0.06) inset, 0 20px 60px rgba(0,0,0,0.6), 0 0 32px rgba(0,212,255,0.08)' }}
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.06, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="camera-panel-bg">
            <div className="smoke-1" />
            <div className="smoke-2" />
            <div className="smoke-3" />
            <div className="smoke-4" />
          </div>
          <video ref={videoRef} autoPlay muted playsInline className={`w-full h-full object-cover ${cameraOn && !cameraErr ? 'block' : 'hidden'}`} />
          {noCameraDevice && camBgImage && (
            <div className="absolute inset-0 flex items-center justify-center" style={{ zIndex: 15 }}>
              <img src={camBgImage} alt="" className="absolute inset-0 w-full h-full object-cover" />
              {user?.avatar ? (
                <img src={user.avatar} alt="" style={{ position: 'relative', width: 64, height: 64, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(0,212,255,0.35)', boxShadow: '0 0 0 8px rgba(0,212,255,0.06), 0 0 32px rgba(0,212,255,0.15)' }} />
              ) : (
                <div style={{ position: 'relative', width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg, rgba(0,212,255,0.15), rgba(124,58,237,0.15))', border: '2px solid rgba(0,212,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 900, color: '#00D4FF' }}>
                  {user?.username?.[0]?.toUpperCase() || 'Y'}
                </div>
              )}
            </div>
          )}
          {!cameraOn || cameraErr ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center px-5 py-6"
              style={{ background: 'radial-gradient(ellipse at 40% 35%, rgba(0,212,255,0.18) 0%, rgba(8,12,20,1) 65%)' }}>
              {window.location.protocol !== 'https:' && window.location.hostname !== 'localhost' && (
                <div className="absolute top-3 left-3 right-3 z-20 flex items-center gap-2 px-3 py-2 rounded-xl text-[11px] font-semibold"
                  style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171' }}>
                  <Shield size={12} className="flex-shrink-0" /> Camera requires HTTPS
                </div>
              )}
              <motion.div animate={{ opacity: [0.25, 0.5, 0.25], scale: [1, 1.1, 1] }} transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute w-32 h-32 rounded-full pointer-events-none"
                style={{ background: 'radial-gradient(circle, rgba(0,212,255,0.18) 0%, transparent 70%)', top: '16%' }} />
              {!permissionAsked || cameraErr ? (
                <div className="relative z-10 flex flex-col items-center w-full">
                  {user?.avatar ? (
                    <img src={user.avatar} alt="" className="mb-3" style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(0,212,255,0.35)', boxShadow: '0 0 0 8px rgba(0,212,255,0.06), 0 0 32px rgba(0,212,255,0.15)' }} />
                  ) : user ? (
                    <div className="mb-3" style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg, rgba(0,212,255,0.15), rgba(124,58,237,0.15))', border: '2px solid rgba(0,212,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 900, color: '#00D4FF' }}>
                      {user.username?.[0]?.toUpperCase() || 'Y'}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center mb-3 rounded-2xl" style={{ width: 48, height: 48, background: 'rgba(0,212,255,0.15)', border: '1.5px solid rgba(0,212,255,0.35)' }}>
                      <Camera size={20} style={{ color: 'rgba(0,184,224,0.85)' }} />
                    </div>
                  )}
                  {cameraErr ? (
                    <>
                      <p className="text-white font-bold text-[13px] text-center mb-1 leading-snug">Camera blocked</p>
                      <p className="text-[11px] text-center mb-3 leading-relaxed px-2" style={{ color: 'rgba(248,113,113,0.8)' }}>{cameraErrMsg || 'Allow camera in your browser settings.'}</p>
                      {(() => {
                        const ua = navigator.userAgent
                        const isIOS = /iPad|iPhone|iPod/.test(ua)
                        const isAndroid = /Android/.test(ua)
                        const steps = isIOS
                          ? ['Settings > Chrome/Safari > Camera > Allow']
                          : isAndroid
                          ? ['Address bar lock > Permissions > Camera > Allow']
                          : null
                        if (!steps) return null
                        return (
                          <div className="w-full mb-3 px-1">
                            {steps.map((s, i) => (
                              <p key={i} className="text-[10px] text-center leading-relaxed" style={{ color: 'rgba(0,184,224,0.55)' }}>› {s}</p>
                            ))}
                          </div>
                        )
                      })()}
                    </>
                  ) : (
                    <>
                      <p className="text-white font-bold text-[13px] text-center mb-1 leading-snug">Allow camera access</p>
                      <p className="text-[11px] text-center mb-4 leading-relaxed" style={{ color: 'rgba(160,160,180,0.55)' }}>Required to start video chatting</p>
                      <motion.button onClick={enableCamera} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                        className="w-full py-2.5 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2" style={{ background: 'linear-gradient(140deg, #004466 0%, #00D4FF 55%, #00B8E0 100%)' }}>
                        <Video size={14} />Allow Camera
                      </motion.button>
                    </>
                  )}
                </div>
              ) : (
                <div className="relative z-10 flex flex-col items-center gap-3">
                  <Loader2 size={28} className="animate-spin" style={{ color: 'rgba(0,184,224,0.7)' }} />
                  <p className="text-[12px]" style={{ color: 'rgba(160,160,180,0.6)' }}>Waiting for permission…</p>
                </div>
              )}
            </div>
          ) : null}
          <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at center, transparent 52%, rgba(0,0,0,0.45) 100%)' }} />
          <div className="absolute bottom-0 left-0 right-0 h-14 pointer-events-none" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)' }} />
          {cameraOn && (
            <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2 py-1 rounded-lg" style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(10px)' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 online-pulse" />
              <span className="text-white text-[9px] font-extrabold tracking-[0.2em]">LIVE</span>
            </div>
          )}
          {cameraOn && (
            <motion.button onClick={flipCamera} whileTap={{ scale: 0.9 }} className="absolute top-3 right-3 w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(10px)' }}>
              <Camera size={16} className="text-white" />
            </motion.button>
          )}
        </motion.div>

        {/* Headline — compact, centered */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        >
          <h1 className="font-extrabold leading-[1.1] tracking-[-0.03em] text-white mb-2" style={{ fontSize: 'clamp(1.7rem, 7vw, 2.3rem)' }}>
            Meet real people.{' '}
            <span style={{ background: 'linear-gradient(125deg, #00D4FF 0%, #00B8E0 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              Instantly.
            </span>
          </h1>
          <p className="leading-relaxed" style={{ fontSize: 17, color: 'rgba(255,255,255,0.72)', fontWeight: 400 }}>
            Random video chat with real people.<br />Connect instantly. No sign up needed.
          </p>
        </motion.div>

        {/* Online count */}
        <div className="flex items-center justify-center gap-2.5">
          <motion.span
            style={{ width: 9, height: 9, borderRadius: '50%', background: '#4ade80', flexShrink: 0, display: 'block' }}
            animate={{ opacity: [1, 0.35, 1], scale: [1, 1.3, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }} />
          <span style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.55)' }}>
            <span style={{ color: '#00D4FF', fontWeight: 800 }}>
              {onlineCount >= 20 ? onlineCount.toLocaleString() : '12,846'}
            </span>{' '}people online right now
          </span>
        </div>

        {/* Start Chatting Now — dominant CTA */}
        <motion.button
          onClick={mode === 'squad' && !squadReady ? undefined : startVybing}
          whileHover={mode === 'squad' && !squadReady ? {} : { scale: 1.02 }}
          whileTap={mode === 'squad' && !squadReady ? {} : { scale: 0.97 }}
          className="w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl font-extrabold"
          style={{
            fontSize: '16px',
            background: mode === 'squad' && !squadReady
              ? 'rgba(20,20,36,0.8)'
              : 'linear-gradient(140deg, #1a3a8f 0%, #00D4FF 55%, #00B8E0 100%)',
            boxShadow: mode === 'squad' && !squadReady
              ? 'none'
              : '0 0 20px rgba(0,212,255,0.28), 0 4px 20px rgba(0,0,0,0.4)',
            border: mode === 'squad' && !squadReady ? '1px solid rgba(255,255,255,0.08)' : 'none',
            color: mode === 'squad' && !squadReady ? 'rgba(255,255,255,0.35)' : 'white',
            cursor: mode === 'squad' && !squadReady ? 'not-allowed' : 'pointer',
          }}
        >
          {mode === 'squad' && !squadReady
            ? <><Loader2 size={17} className="animate-spin" />Waiting for partner…</>
            : mode === 'squad' && squadReady
              ? <><Video size={19} strokeWidth={2.5} />Start Vybing</>
              : <><Video size={19} strokeWidth={2.5} />Start Chatting Now</>
          }
        </motion.button>

        <motion.button
          onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
          whileTap={{ scale: 0.97 }}
          className="w-full flex items-center justify-center gap-1.5 py-3 rounded-2xl text-sm font-semibold"
          style={{ color: 'rgba(180,190,210,0.6)', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          See How It Works 
        </motion.button>

        {/* â”€â”€ Match Settings â”€â”€ */}
        <div className="rounded-2xl p-4 space-y-4" style={{ background: 'rgba(13,13,24,0.92)', backdropFilter: 'blur(20px) saturate(1.4)', border: '1px solid rgba(30,30,46,0.8)', boxShadow: '0 24px 64px rgba(0,0,0,0.6), 0 0 0 1px rgba(0,212,255,0.05) inset' }}>

          {/* Mode */}
          <div>
            <p className="text-[10px] font-black tracking-[0.18em] uppercase mb-2" style={{ color: 'rgba(160,160,180,0.45)' }}>MODE</p>
            <div className="flex gap-1.5 p-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)' }}>
              {[{ id: 'solo', label: 'Solo' }, { id: 'squad', label: 'Duo' }].map(({ id, label }) => (
                <motion.button key={id} onClick={() => handleModeClick(id)} whileTap={{ scale: 0.93 }} transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  className="flex-1 py-2 text-xs font-bold transition-colors"
                  style={mode === id
                    ? { background: 'linear-gradient(135deg, #0099BB, #00D4FF)', color: 'white', borderRadius: '10px' }
                    : { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(160,160,180,0.5)', borderRadius: '10px' }}>
                  {label}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Gender */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <p className="text-[10px] font-black tracking-[0.18em] uppercase" style={{ color: 'rgba(160,160,180,0.45)' }}>MATCH WITH</p>
              <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(0,212,255,0.12)', color: 'rgba(147,197,253,0.85)' }}>Basic</span>
            </div>
            <div className="flex gap-1.5">
              {[{ id: 'both', label: 'Anyone', free: true }, { id: 'male', label: 'Male', free: false }, { id: 'female', label: 'Female', free: false }].map(({ id, label, free }) => (
                <motion.button key={id} onClick={() => handleGender(id)} whileTap={{ scale: 0.92 }} transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  className="flex-1 py-2 text-xs font-bold relative"
                  style={filterGender === id
                    ? { background: 'linear-gradient(135deg, #0099BB, #00D4FF)', color: 'white', borderRadius: '10px' }
                    : { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(160,160,180,0.5)', borderRadius: '10px' }}>
                  {label}
                  {!free && !user?.isPremium && <Lock size={8} className="absolute top-1 right-1" style={{ opacity: 0.3 }} />}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Country — always visible */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <p className="text-[10px] font-black tracking-[0.18em] uppercase" style={{ color: 'rgba(160,160,180,0.45)' }}>COUNTRY</p>
              <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(234,179,8,0.12)', color: 'rgba(250,204,21,0.85)' }}>VIP</span>
            </div>
            <motion.button
              ref={countryBtnRef}
              onClick={handleCountryClick}
              whileTap={{ scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              className="w-full flex items-center justify-between px-3 py-2.5 text-xs font-bold"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(160,160,180,0.5)', borderRadius: '10px' }}
            >
              <span className="flex items-center gap-2">
                {user?.isVip ? <Globe size={12} style={{ color: 'rgba(167,139,250,0.7)' }} /> : <Lock size={12} style={{ opacity: 0.3 }} />}
                <span style={{ color: filterCountry ? 'white' : undefined }}>{filterCountry || 'Any country'}</span>
              </span>
              <ChevronDown size={12} style={{ transition: 'transform 200ms', transform: showCountryDrop ? 'rotate(180deg)' : 'rotate(0deg)' }} />
            </motion.button>
          </div>

          {/* Duo room inline panel */}
          <AnimatePresence initial={false}>
            {mode === 'squad' && (
              <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.18 }}>
                <div className="rounded-2xl p-4 space-y-3" style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.10)', paddingBottom: 20, overflow: 'visible' }}>
                  {!duoDisplayCode ? (
                    <div className="flex items-center justify-center gap-2 py-3">
                      <Loader2 size={13} className="animate-spin" style={{ color: '#00D4FF' }} />
                      <p className="text-[12px]" style={{ color: 'rgba(200,210,255,0.6)' }}>Setting up room<WaitingDots /></p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Users size={12} style={{ color: '#00D4FF' }} />
                          <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.5)' }}>Duo Room</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {timeLeft != null && <span className="text-[9px] font-mono" style={{ color: 'rgba(160,160,180,0.5)' }}>Expires {fmtTime(timeLeft)}</span>}
                          <button onClick={leaveSquad} className="w-5 h-5 flex items-center justify-center rounded-lg text-white/30 hover:text-white hover:bg-white/10 transition-all"><XIcon size={10} /></button>
                        </div>
                      </div>
                      <div className="py-1">
                        <div className="flex items-center justify-center gap-1.5 mb-1">
                          <Lock size={8} style={{ color: 'rgba(0,212,255,0.4)', flexShrink: 0 }} />
                          <p className="text-[9px] font-bold uppercase tracking-[0.25em]" style={{ color: 'rgba(0,212,255,0.5)' }}>Room Code</p>
                          <button
                            onClick={toggleCodeVisibility}
                            title="Click to reveal your code"
                            className="flex items-center justify-center rounded-md transition-colors"
                            style={{ color: codeVisible ? '#00D4FF' : 'rgba(0,212,255,0.5)', background: codeVisible ? 'rgba(0,212,255,0.1)' : 'rgba(0,212,255,0.06)', border: '1px solid rgba(0,212,255,0.15)', cursor: 'pointer', padding: '3px 5px', borderRadius: 6 }}
                          >
                            {codeVisible ? <EyeOff size={13} /> : <Eye size={13} />}
                          </button>
                        </div>
                        <p
                          className="text-2xl font-black tracking-[0.18em] text-center"
                          style={{
                            color: '#00D4FF',
                            fontFamily: 'ui-monospace, monospace',
                            textShadow: codeVisible ? '0 0 20px rgba(0,212,255,0.4)' : 'none',
                            filter: codeVisible ? 'none' : 'blur(6px)',
                            userSelect: codeVisible ? 'text' : 'none',
                            transition: 'filter 0.2s',
                          }}
                        >{duoDisplayCode}</p>
                      </div>
                      <div className="flex gap-1.5">
                        <div
                          className="flex-1 px-2.5 py-2 rounded-xl text-[9px] font-mono truncate select-all"
                          style={{
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.08)',
                            color: 'rgba(200,210,255,0.5)',
                            filter: codeVisible ? 'none' : 'blur(5px)',
                            userSelect: codeVisible ? 'text' : 'none',
                            transition: 'filter 0.2s',
                          }}
                        >{inviteUrl}</div>
                        <motion.button onClick={copyLink} whileTap={{ scale: 0.85 }} animate={copied ? { scale: [1, 1.15, 1] } : {}} transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                          className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={copied ? { background: 'rgba(34,197,94,0.2)', color: '#4ade80' } : { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(160,160,180,0.7)' }}>
                          <AnimatePresence mode="wait">
                            {copied ? <motion.span key="ck" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}><Check size={11} /></motion.span>
                                    : <motion.span key="cp" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}><Copy size={11} /></motion.span>}
                          </AnimatePresence>
                        </motion.button>
                      </div>
                      <div className="grid grid-cols-4 gap-1.5" style={{ marginBottom: 16 }}>
                        <a href={shareUrls.whatsapp} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-0.5 py-2 rounded-xl" style={{ background: '#25D366' }}>
                          <svg viewBox="0 0 24 24" style={{ width: 14, height: 14, fill: 'white' }}><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 00-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                          <span className="text-[7px] font-bold" style={{ color: 'white' }}>WhatsApp</span>
                        </a>
                        <motion.button onClick={copySnapDuo} whileTap={{ scale: 0.9 }} className="flex flex-col items-center gap-0.5 py-2 rounded-xl" style={{ background: 'linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)' }}>
                          <svg viewBox="0 0 24 24" style={{ width: 14, height: 14, fill: 'white' }}><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                          <span className="text-[7px] font-bold" style={{ color: 'white' }}>{snapCopied ? 'Copied!' : 'Instagram'}</span>
                        </motion.button>
                        <a href={shareUrls.twitter} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-0.5 py-2 rounded-xl" style={{ background: '#000000', border: '1px solid rgba(255,255,255,0.12)' }}>
                          <svg viewBox="0 0 24 24" style={{ width: 14, height: 14, fill: 'white' }}><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                          <span className="text-[7px] font-bold" style={{ color: 'rgba(255,255,255,0.9)' }}>Twitter</span>
                        </a>
                        <motion.button onClick={copyLink} whileTap={{ scale: 0.9 }} className="flex flex-col items-center gap-0.5 py-2 rounded-xl" style={copied ? { background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)' } : { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                          {copied ? <svg viewBox="0 0 24 24" style={{ width: 14, height: 14, fill: 'none', stroke: '#4ade80', strokeWidth: '2.5' }}><polyline points="20 6 9 17 4 12"/></svg> : <svg viewBox="0 0 24 24" style={{ width: 14, height: 14, fill: 'none', stroke: 'rgba(255,255,255,0.5)', strokeWidth: '2' }}><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>}
                          <span className="text-[7px] font-bold" style={{ color: copied ? '#4ade80' : 'rgba(255,255,255,0.5)' }}>{copied ? 'Copied!' : 'Copy'}</span>
                        </motion.button>
                      </div>
                      <AnimatePresence mode="wait">
                        {!squad ? (
                          <motion.div key="setup" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2 px-3 py-2.5 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                            <Loader2 size={11} className="animate-spin flex-shrink-0" style={{ color: '#00D4FF' }} />
                            <p className="text-[11px]" style={{ color: 'rgba(200,210,255,0.6)' }}>Setting up room<WaitingDots /></p>
                          </motion.div>
                        ) : !squadReady ? (
                          <motion.div key="waiting" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2 px-3 py-2.5 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                            <Loader2 size={11} className="animate-spin flex-shrink-0" style={{ color: '#00D4FF' }} />
                            <p className="text-[11px]" style={{ color: 'rgba(200,210,255,0.6)' }}>Waiting for friend to join<WaitingDots /></p>
                          </motion.div>
                        ) : (
                          <motion.div key="ready" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2 px-3 py-2.5 rounded-xl" style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)' }}>
                            <div className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0" style={{ boxShadow: '0 0 6px rgba(74,222,128,0.6)' }} />
                            <div className="flex-1">
                              <p className="text-[11px] font-bold text-green-400">Friend connected!</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                {squad.members.map((m) => (
                                  <div key={m.socketId} className="flex items-center gap-1">
                                    <div className="w-4 h-4 rounded-full flex items-center justify-center text-[7px] font-black" style={{ background: 'rgba(0,212,255,0.25)', color: '#00D4FF' }}>{m.username?.[0]?.toUpperCase() || '?'}</div>
                                    <span className="text-[8px]" style={{ color: 'rgba(255,255,255,0.5)' }}>{m.username || 'User'}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                      {squadError && <div className="flex items-center justify-between gap-2 text-red-400 text-[10px] bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2"><span>{squadError}</span></div>}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>

        {/* Mobile VIP trial banner */}
        {!user?.isVip && !user?.isPremium && !user?.trialUsed && (
          <motion.div
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.35 }}
            style={{ position: 'relative', overflow: 'hidden', borderRadius: 16, background: 'linear-gradient(135deg, rgba(0,212,255,0.05) 0%, rgba(124,58,237,0.05) 100%)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1px solid rgba(0,212,255,0.2)', padding: '16px' }}>
            {/* VIP watermark */}
            <span style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', fontSize: 64, fontWeight: 900, color: 'rgba(255,255,255,0.03)', letterSpacing: -3, pointerEvents: 'none', zIndex: 0, userSelect: 'none', lineHeight: 1 }}>VIP</span>
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ marginBottom: 8 }}>
                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', color: 'white', background: 'linear-gradient(135deg, #00D4FF, #7C3AED)', borderRadius: 20, padding: '3px 10px', display: 'inline-block' }}>LIMITED OFFER</span>
              </div>
              <p style={{ fontSize: 16, fontWeight: 700, color: 'white', margin: '0 0 6px' }}>Try VIP Free for 7 Days</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 12px', marginBottom: 12 }}>
                {['Gender filter', 'Country filter', 'VIP profile badge'].map(f => (
                  <span key={f} style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ color: '#00D4FF', fontWeight: 700 }}>✓</span>{f}
                  </span>
                ))}
              </div>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={async () => {
                  if (!user) { navigate('/auth'); return }
                  try {
                    const { default: axios } = await import('axios')
                    const token = localStorage.getItem('vybe_token')
                    const res = await axios.post('/api/subscription/trial', {}, { headers: { Authorization: `Bearer ${token}` } })
                    if (res.data.url) window.location.href = res.data.url
                  } catch (e) {
                    const msg = e?.response?.data?.error || e?.response?.data?.message || e?.message || 'Could not start trial. Try again.'
                    alert(msg)
                  }
                }}
                style={{ width: '100%', padding: '13px', borderRadius: 12, background: 'linear-gradient(135deg, #00D4FF, #7C3AED)', color: 'white', fontSize: 14, fontWeight: 700, border: 'none', cursor: 'pointer', boxShadow: '0 0 20px rgba(0,212,255,0.3)' }}>
                Start Free Trial →
              </motion.button>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', textAlign: 'center', marginTop: 8, marginBottom: 0 }}>🔒 Secured by Stripe · Cancel before day 7 to avoid £12.99/mo · Cancelling ends VIP access immediately</p>
            </div>
          </motion.div>
        )}

        {/* Country dropdown portal — closes on scroll, anchored */}
        {showCountryDrop && createPortal(
          <AnimatePresence>
            {showCountryDrop && (
              <motion.div
                key="country-drop"
                initial={{ opacity: 0, scale: 0.96, y: 6 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 4 }}
                transition={{ duration: 0.14, ease: [0.22, 1, 0.36, 1] }}
                style={{
                  position: 'fixed',
                  bottom: countryDropPos.bottom,
                  left: countryDropPos.left,
                  width: countryDropPos.width,
                  zIndex: 99999,
                  background: 'rgba(13,13,24,0.97)',
                  backdropFilter: 'blur(24px) saturate(1.6)',
                  WebkitBackdropFilter: 'blur(24px) saturate(1.6)',
                  border: '1px solid rgba(0,212,255,0.18)',
                  borderRadius: 16,
                  boxShadow: '0 0 0 1px rgba(0,212,255,0.06) inset, 0 24px 64px rgba(0,0,0,0.7), 0 0 40px rgba(0,212,255,0.08)',
                  overflow: 'hidden',
                  transformOrigin: 'bottom center',
                }}
              >
                <div style={{ padding: '10px 10px 8px', borderBottom: '1px solid rgba(0,212,255,0.1)' }}>
                  <input
                    autoFocus
                    value={countrySearch}
                    onChange={e => setCountrySearch(e.target.value)}
                    placeholder="Search country..."
                    style={{
                      width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(0,212,255,0.14)',
                      outline: 'none', color: 'white', fontSize: '13px', padding: '8px 12px', borderRadius: 10,
                      letterSpacing: '-0.01em',
                    }}
                    className="placeholder-[rgba(100,120,180,0.4)]"
                  />
                </div>
                <div style={{ overflowY: 'auto', maxHeight: 220 }}>
                  {!countrySearch && (
                    <button
                      onClick={() => { setFilterCountry(''); setShowCountryDrop(false); setCountrySearch('') }}
                      style={{
                        width: '100%', textAlign: 'left', padding: '9px 14px', background: 'transparent',
                        border: 'none', cursor: 'pointer', fontSize: '13px', color: 'rgba(130,160,255,0.6)',
                        display: 'flex', alignItems: 'center', gap: 8, transition: 'background 120ms, color 120ms',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,212,255,0.12)'; e.currentTarget.style.color = 'white' }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(130,160,255,0.6)' }}
                    >
                      <Globe size={12} style={{ flexShrink: 0 }} />
                      Any country
                    </button>
                  )}
                  {COUNTRIES.filter(cc => cc.toLowerCase().includes(countrySearch.toLowerCase())).map((cc) => (
                    <button
                      key={cc}
                      onClick={() => { setFilterCountry(cc); setShowCountryDrop(false); setCountrySearch('') }}
                      style={{
                        width: '100%', textAlign: 'left', padding: '9px 14px', background: 'transparent',
                        border: 'none', cursor: 'pointer', fontSize: '13px',
                        color: filterCountry === cc ? 'white' : 'rgba(200,215,255,0.65)',
                        fontWeight: filterCountry === cc ? 700 : 400,
                        transition: 'background 120ms, color 120ms',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,212,255,0.12)'; e.currentTarget.style.color = 'white' }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = filterCountry === cc ? 'white' : 'rgba(200,215,255,0.65)';
                      }}
                    >
                      {cc}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}

                {/* Start Without Camera — ghost secondary */}
        <motion.button
          onClick={() => {
            streamRef.current?.getTracks().forEach((t) => t.stop())
            streamRef.current = null
            setCameraOn(false)
            navigate('/chat', { state: { mode, filterGender: filterGender === 'both' ? null : filterGender, filterCountry, noCam: true } })
          }}
          whileTap={{ scale: 0.97 }}
          className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium"
          style={{ color: 'rgba(107,114,128,0.4)', background: 'transparent' }}
        >
          <VideoOff size={12} strokeWidth={2} />
          Start Without Camera
        </motion.button>

        <p className="text-center text-[11px]" style={{ color: 'rgba(75,85,99,0.4)' }}>Free forever · No sign-up required</p>
      </div>





      {/* ─── Desktop Hero ─────────────────────────────────────── */}
      <section
        className="hidden lg:flex flex-col relative z-10"
        style={{ height: 'calc(100vh - 64px)', marginTop: '64px', background: '#0a0a0f', overflow: 'hidden' }}>

        {/* ── Announcement banner ── */}
        <div
          className="flex-shrink-0 flex items-center justify-center gap-4 relative overflow-hidden"
          style={{
            padding: '11px 24px',
            background: 'linear-gradient(90deg, rgba(0,212,255,0.06) 0%, rgba(0,212,255,0.13) 40%, rgba(124,58,237,0.1) 70%, rgba(0,212,255,0.06) 100%)',
            borderBottom: '1px solid rgba(0,212,255,0.18)',
            boxShadow: '0 1px 0 rgba(0,212,255,0.06), inset 0 1px 0 rgba(0,212,255,0.08)',
          }}>
          {/* Glow streak */}
          <div className="absolute inset-0 pointer-events-none" style={{
            background: 'radial-gradient(ellipse 60% 100% at 50% 50%, rgba(0,212,255,0.07) 0%, transparent 70%)',
          }} />
          {/* NEW badge */}
          <span className="flex-shrink-0 px-2.5 py-1 rounded-md text-[10px] font-black tracking-[0.18em] uppercase"
            style={{
              background: 'linear-gradient(135deg, #00D4FF, #7C3AED)',
              color: '#fff',
              letterSpacing: '0.16em',
              boxShadow: '0 0 10px rgba(0,212,255,0.4)',
            }}>NEW</span>
          {/* Message */}
          <span className="text-[13px] font-medium" style={{ color: 'rgba(255,255,255,0.75)', letterSpacing: '-0.01em' }}>
            Get paid to chat — turn your conversations into real money.
          </span>
          {/* CTA */}
          <button
            className="flex-shrink-0 flex items-center gap-1.5 text-[12px] font-bold px-3 py-1 rounded-lg"
            style={{
              color: '#00D4FF',
              background: 'rgba(0,212,255,0.1)',
              border: '1px solid rgba(0,212,255,0.25)',
              letterSpacing: '-0.01em',
            }}
            onClick={() => navigate('/earn')}>
            Learn more <span style={{ fontSize: 13 }}>→</span>
          </button>
        </div>

        {/* ── Two-column area ── */}
        <div className="flex-1 min-h-0" style={{ display: 'flex', alignItems: 'flex-start', overflow: 'hidden' }}>

          {/* ────────── LEFT: Controls ────────── */}
          <div style={{ flex: 1, alignSelf: 'stretch', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', padding: '40px 52px 24px 72px' }}>

            <div>
            {/* Live badge */}
            <motion.div
              className="inline-flex items-center gap-2 mb-8"
              style={{ width: 'fit-content', padding: '6px 14px', borderRadius: 20, background: 'rgba(0,212,255,0.06)', border: '1px solid rgba(0,212,255,0.2)' }}>
              <motion.span
                className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                style={{ background: '#00D4FF' }}
                animate={{ opacity: [1, 0.3, 1], scale: [1, 1.3, 1] }}
                transition={{ duration: 2.4, repeat: Infinity }} />
              <span style={{ fontFamily: "'Sora', system-ui, sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: '0.22em', color: '#00D4FF' }}>
                LIVE &middot; RANDOM &middot; REAL
              </span>
            </motion.div>

            {/* Headline */}
            <h1 style={{ fontSize: 'clamp(38px,3.4vw,58px)', lineHeight: 1.04, fontWeight: 900, letterSpacing: '-0.035em', marginBottom: 22 }}>
              <span style={{ color: '#ffffff', display: 'block' }}>Meet someone real.</span>
              <span style={{ display: 'block', background: 'linear-gradient(120deg,#00D4FF 0%,#00B8E0 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                Share authentic vibes.
              </span>
            </h1>

            {/* Subtitle */}
            <p style={{ fontSize: 18, lineHeight: 1.65, color: 'rgba(255,255,255,0.75)', fontWeight: 400, maxWidth: 400, marginBottom: 28 }}>
              Random video chat with real people.<br />Connect instantly. No sign up needed.
            </p>

            {/* Online count */}
            <div className="flex items-center gap-2.5" style={{ marginBottom: 32 }}>
              <motion.span
                style={{ width: 9, height: 9, borderRadius: '50%', background: '#4ade80', flexShrink: 0, display: 'block' }}
                animate={{ opacity: [1, 0.35, 1], scale: [1, 1.3, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }} />
              <span style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.55)' }}>
                <span style={{ color: '#00D4FF', fontWeight: 800 }}>
                  {onlineCount >= 20 ? onlineCount.toLocaleString() : '12,846'}
                </span>{' '}people online right now
              </span>
            </div>

            {/* CTA buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 12 }}>

              {/* Primary */}
              <motion.button
                onClick={mode === 'squad' && !squadReady ? undefined : startVybing}
                whileHover={mode === 'squad' && !squadReady ? {} : { scale: 1.012 }}
                whileTap={mode === 'squad' && !squadReady ? {} : { scale: 0.985 }}
                style={{
                  width: '100%', height: 56, borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                  background: mode === 'squad' && !squadReady
                    ? 'rgba(20,20,36,0.8)'
                    : 'linear-gradient(135deg, #00B8E0 0%, #00D4FF 50%, #00B8E0 100%)',
                  boxShadow: mode === 'squad' && !squadReady
                    ? 'none'
                    : '0 4px 28px rgba(0,212,255,0.38), 0 1px 0 rgba(255,255,255,0.12) inset',
                  border: mode === 'squad' && !squadReady ? '1px solid rgba(255,255,255,0.08)' : 'none',
                  color: mode === 'squad' && !squadReady ? 'rgba(255,255,255,0.35)' : 'white',
                  fontSize: 15, fontWeight: 800, letterSpacing: '-0.01em',
                  cursor: mode === 'squad' && !squadReady ? 'not-allowed' : 'pointer',
                  opacity: 1, transition: 'all 0.25s ease',
                }}>
                {mode === 'squad' && !squadReady
                  ? <><Loader2 size={17} className="animate-spin" />Waiting for partner…</>
                  : mode === 'squad' && squadReady
                    ? <><Video size={17} />Start Vybing</>
                    : <><Video size={17} />Start Video Chat</>
                }
              </motion.button>

              {/* Secondary */}
              <motion.button
                onClick={() => {
                  streamRef.current?.getTracks().forEach(t => t.stop());
                  streamRef.current = null; setCameraOn(false);
                  navigate('/chat', { state: { mode, filterGender: filterGender === 'both' ? null : filterGender, filterCountry, noCam: true } });
                }}
                whileHover={{ scale: 1.012, borderColor: 'rgba(0,212,255,0.28)' }}
                whileTap={{ scale: 0.985 }}
                style={{
                  width: '100%', height: 50, borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                  background: 'rgba(13,13,24,0.55)', backdropFilter: 'blur(16px)',
                  border: '1px solid rgba(0,212,255,0.18)',
                  color: 'rgba(255,255,255,0.55)', fontSize: 14, fontWeight: 700, letterSpacing: '-0.01em', cursor: 'pointer',
                }}>
                <VideoOff size={16} />
                Start Without Camera
              </motion.button>

            </div>

            {/* ── Filters: Gender / Country / Mode ── */}
            <div style={{
              marginTop: 14, borderRadius: 16, display: 'flex', alignItems: 'stretch', overflow: 'hidden',
              background: 'linear-gradient(135deg, rgba(0,212,255,0.04) 0%, rgba(10,10,28,0.9) 50%, rgba(124,58,237,0.04) 100%)',
              border: '1px solid rgba(0,212,255,0.14)',
              boxShadow: '0 4px 24px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.05)',
              backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
            }}>

              {/* GENDER */}
              <div style={{ flex: 1, padding: '11px 14px', display: 'flex', flexDirection: 'column', gap: 7 }}>
                <span style={{ fontSize: 8, fontWeight: 900, letterSpacing: '0.22em', color: 'rgba(0,212,255,0.5)', textTransform: 'uppercase' }}>Gender</span>
                <div style={{ display: 'flex', gap: 4 }}>
                  {[['Both', 'both'], ['Male', 'male'], ['Female', 'female']].map(([label, val]) => (
                    <motion.button key={val}
                      onClick={() => handleGender(val)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.92 }}
                      style={{
                        padding: '5px 12px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', position: 'relative', transition: 'all 0.15s ease',
                        ...(filterGender === val
                          ? { background: '#00D4FF', color: '#060612', border: '1px solid transparent', boxShadow: '0 0 14px rgba(0,212,255,0.5), 0 2px 6px rgba(0,212,255,0.3)' }
                          : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.55)', border: '1px solid rgba(255,255,255,0.08)' }),
                      }}>
                      {label}
                      {val !== 'both' && !user?.isPremium && !user?.isVip && (
                        <Lock size={6} style={{ position: 'absolute', top: 1, right: 2, opacity: 0.35 }} />
                      )}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Divider */}
              <div style={{ width: 1, background: 'linear-gradient(to bottom, transparent, rgba(0,212,255,0.15), transparent)', flexShrink: 0 }} />

              {/* COUNTRY */}
              <div style={{ flex: 1, padding: '11px 14px', display: 'flex', flexDirection: 'column', gap: 7 }}>
                <span style={{ fontSize: 8, fontWeight: 900, letterSpacing: '0.22em', color: 'rgba(0,212,255,0.5)', textTransform: 'uppercase' }}>Country</span>
                <motion.button
                  ref={countryBtnRef}
                  onClick={handleCountryClick}
                  whileHover={{ background: filterCountry ? 'rgba(0,212,255,0.22)' : 'rgba(255,255,255,0.10)' }}
                  whileTap={{ scale: 0.96 }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 8, transition: 'all 0.15s ease',
                    background: filterCountry ? 'rgba(0,212,255,0.15)' : 'rgba(255,255,255,0.06)',
                    border: filterCountry ? '1px solid rgba(0,212,255,0.3)' : '1px solid rgba(255,255,255,0.08)',
                    color: filterCountry ? '#00D4FF' : 'rgba(255,255,255,0.55)',
                    fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', width: 'fit-content',
                    boxShadow: filterCountry ? '0 0 10px rgba(0,212,255,0.2)' : 'none',
                  }}>
                  {user?.isVip
                    ? <Globe size={10} style={{ color: filterCountry ? '#00D4FF' : 'rgba(0,212,255,0.45)', flexShrink: 0 }} />
                    : <Lock size={10} style={{ color: 'rgba(255,255,255,0.22)', flexShrink: 0 }} />}
                  {filterCountry || 'Any country'}
                  <ChevronDown size={8} style={{ color: filterCountry ? '#00D4FF' : 'rgba(255,255,255,0.3)', transition: 'transform 200ms', transform: showCountryDrop ? 'rotate(180deg)' : 'rotate(0deg)', flexShrink: 0 }} />
                </motion.button>
              </div>

              {/* Divider */}
              <div style={{ width: 1, background: 'linear-gradient(to bottom, transparent, rgba(0,212,255,0.15), transparent)', flexShrink: 0 }} />

              {/* MODE */}
              <div style={{ flex: 1, padding: '11px 14px', display: 'flex', flexDirection: 'column', gap: 7 }}>
                <span style={{ fontSize: 8, fontWeight: 900, letterSpacing: '0.22em', color: 'rgba(0,212,255,0.5)', textTransform: 'uppercase' }}>Mode</span>
                <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                  {[['Solo', 'solo'], ['Duo', 'squad']].map(([label, val]) => (
                    <motion.button key={val}
                      onClick={() => handleModeClick(val)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.92 }}
                      style={{
                        padding: '5px 12px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s ease',
                        ...(mode === val
                          ? { background: '#00D4FF', color: '#060612', border: '1px solid transparent', boxShadow: '0 0 14px rgba(0,212,255,0.5), 0 2px 6px rgba(0,212,255,0.3)' }
                          : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.55)', border: '1px solid rgba(255,255,255,0.08)' }),
                      }}>
                      {label}
                    </motion.button>
                  ))}
                  <motion.button
                    onClick={() => setShowAdvanced(v => !v)}
                    whileTap={{ scale: 0.9 }}
                    style={{ marginLeft: 'auto', padding: '4px 6px', borderRadius: 7, color: showAdvanced ? '#00D4FF' : 'rgba(255,255,255,0.28)', background: showAdvanced ? 'rgba(0,212,255,0.1)' : 'none', border: 'none', cursor: 'pointer', display: 'flex', transition: 'all 0.15s ease' }}>
                    <SlidersHorizontal size={13} />
                  </motion.button>
                </div>
              </div>

            </div>

            </div>

            {/* ── VIP Trial banner — only for eligible free users ── */}
            {!user?.isVip && !user?.isPremium && !user?.trialUsed && (
              <motion.div
                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.4 }}
                style={{
                  marginTop: 16, borderRadius: 16, position: 'relative', overflow: 'hidden',
                  background: 'linear-gradient(135deg, rgba(0,212,255,0.05) 0%, rgba(124,58,237,0.05) 100%)',
                  backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
                  border: '1px solid rgba(0,212,255,0.25)',
                  boxShadow: '0 0 28px rgba(0,212,255,0.1), inset 0 1px 0 rgba(0,212,255,0.08)',
                  padding: '16px 20px',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
                }}>
                {/* Left content */}
                <div style={{ flex: 1, position: 'relative', zIndex: 1 }}>
                  <div style={{ marginBottom: 8 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', color: 'white', background: 'linear-gradient(135deg, #00D4FF, #7C3AED)', borderRadius: 20, padding: '3px 10px', display: 'inline-block' }}>LIMITED OFFER</span>
                  </div>
                  <p style={{ fontSize: 17, fontWeight: 700, color: 'white', margin: '0 0 4px' }}>Try VIP Free for 7 Days</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6, flexWrap: 'wrap' }}>
                    {['Gender filter', 'Country filter', 'VIP profile badge'].map(f => (
                      <span key={f} style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ color: '#00D4FF', fontWeight: 700 }}>✓</span>{f}
                      </span>
                    ))}
                  </div>
                  <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', margin: 0 }}>Card required. Cancel before day 7 to avoid the £12.99/month charge — cancelling ends your VIP access immediately.</p>
                </div>
                {/* Right CTA */}
                <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, position: 'relative', zIndex: 1 }}>
                  <motion.button
                    whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                    onClick={async () => {
                      if (!user) { navigate('/auth'); return }
                      try {
                        const { default: axios } = await import('axios')
                        const token = localStorage.getItem('vybe_token')
                        const res = await axios.post('/api/subscription/trial', {}, { headers: { Authorization: `Bearer ${token}` } })
                        if (res.data.url) window.location.href = res.data.url
                      } catch (e) {
                        const msg = e?.response?.data?.error || e?.response?.data?.message || e?.message || 'Could not start trial. Try again.'
                        alert(msg)
                      }
                    }}
                    style={{ padding: '12px 24px', borderRadius: 12, background: 'linear-gradient(135deg, #00D4FF, #7C3AED)', color: 'white', fontSize: 14, fontWeight: 700, border: 'none', cursor: 'pointer', whiteSpace: 'nowrap', boxShadow: '0 4px 20px rgba(0,212,255,0.35), 0 2px 8px rgba(124,58,237,0.2)' }}>
                    Start Free Trial
                  </motion.button>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>🔒 Secured by Stripe</span>
                </div>
              </motion.div>
            )}

            {/* ── Trust panel — mirrors the filter bar above, fills the space past the trial offer ── */}
            {(user?.isVip || user?.isPremium || user?.trialUsed) && (
              <div
                style={{
                  marginTop: 14, borderRadius: 16, display: 'flex', alignItems: 'stretch', overflow: 'hidden',
                  background: 'linear-gradient(135deg, rgba(0,212,255,0.04) 0%, rgba(10,10,28,0.9) 50%, rgba(124,58,237,0.04) 100%)',
                  border: '1px solid rgba(0,212,255,0.14)',
                  boxShadow: '0 4px 24px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.05)',
                  backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
                }}>
                {[
                  { icon: Shield, title: 'Safe by design', desc: 'Every report reviewed by a human' },
                  { icon: Video,  title: 'Never stuck',    desc: 'Skip and re-match in seconds' },
                  { icon: Globe,  title: 'Worldwide',      desc: 'Real people across the globe' },
                ].map(({ icon: Icon, title, desc }, i) => (
                  <Fragment key={title}>
                    {i > 0 && (
                      <div style={{ width: 1, background: 'linear-gradient(to bottom, transparent, rgba(0,212,255,0.15), transparent)', flexShrink: 0 }} />
                    )}
                    <div style={{ flex: 1, padding: '16px 15px', display: 'flex', flexDirection: 'column', gap: 11 }}>
                      <div style={{
                        width: 38, height: 38, borderRadius: 11,
                        background: 'linear-gradient(135deg, rgba(0,212,255,0.2), rgba(0,212,255,0.05))',
                        border: '1px solid rgba(0,212,255,0.3)',
                        boxShadow: '0 0 16px rgba(0,212,255,0.16), inset 0 1px 0 rgba(255,255,255,0.08)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <Icon size={17} style={{ color: '#00D4FF' }} />
                      </div>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 700, color: 'white', margin: '0 0 3px', letterSpacing: '-0.01em' }}>{title}</p>
                        <p style={{ fontSize: 11.5, lineHeight: 1.45, color: 'rgba(255,255,255,0.48)', margin: 0 }}>{desc}</p>
                      </div>
                    </div>
                  </Fragment>
                ))}
              </div>
            )}

          </div>


          {/* ────────── RIGHT: Camera panel ────────── */}
          <div style={{ flex: '0 0 50%', alignSelf: 'stretch', background: 'transparent', height: '100%', position: 'relative' }}>
          <div style={{
            position: 'relative', overflow: 'hidden',
            height: 'calc(100% - 48px)', borderRadius: 20,
            margin: '24px 24px 24px 8px',
            background: 'linear-gradient(135deg, #0a0a1a 0%, #0d1020 50%, #080d18 100%)',
            border: '1px solid rgba(255,255,255,0.06)', outline: 'none', boxShadow: 'none',
          }}>
            <style>{`
              @keyframes lightDrift {
                0%   { transform: translate(0px, 0px) scale(1);      opacity: 0.6; }
                33%  { transform: translate(-30px, 20px) scale(1.1); opacity: 1;   }
                66%  { transform: translate(-10px, 40px) scale(0.95); opacity: 0.7; }
                100% { transform: translate(-40px, 10px) scale(1.05); opacity: 0.8; }
              }
              @keyframes lightDrift2 {
                0%   { transform: translate(0px, 0px) scale(1);      opacity: 0.5; }
                50%  { transform: translate(30px, -20px) scale(1.2); opacity: 0.9; }
                100% { transform: translate(10px, -40px) scale(0.9); opacity: 0.6; }
              }
            `}</style>

            {/* Your profile pill — always inside panel top-left */}
            <div style={{ position: 'absolute', top: 16, left: 16, zIndex: 20 }}>
              <ProfilePill
                username={user?.username || 'You'}
                avatarUrl={user?.avatar}
                isOnline
                isVerified={!!user?.emailVerified}
                country={myCountry}
                accentColor={user?.accentColor}
                friendStatus="self"
              />
            </div>

            {mode === 'squad' ? (
              <>
                {/* Shared animated background */}
                <div style={{ position: 'absolute', inset: 0, zIndex: 0, background: 'linear-gradient(135deg, #0a0a1a 0%, #0d1020 50%, #080d18 100%)' }}>
                  <div style={{ position: 'absolute', top: '-20%', right: '-20%', width: '70%', height: '70%', background: 'radial-gradient(ellipse, rgba(255,255,255,0.04) 0%, transparent 70%)', animation: 'lightDrift 8s ease-in-out infinite alternate' }} />
                  <div style={{ position: 'absolute', bottom: '-20%', left: '-20%', width: '60%', height: '60%', background: 'radial-gradient(ellipse, rgba(0,212,255,0.03) 0%, transparent 70%)', animation: 'lightDrift2 10s ease-in-out infinite alternate' }} />
                </div>

                {/* TOP HALF: Your camera */}
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: '50%', overflow: 'hidden', borderRadius: '28px 28px 0 0', borderBottom: '1px solid rgba(0,212,255,0.18)', zIndex: 1 }}>
                  <video ref={videoRefDesktop} autoPlay muted playsInline
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top', opacity: cameraOn && !cameraErr ? 1 : 0, transition: 'opacity 0.5s ease' }} />
                  {noCameraDevice && camBgImage && (
                    <div style={{ position: 'absolute', inset: 0, zIndex: 15, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <img src={camBgImage} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                      {user?.avatar ? (
                        <img src={user.avatar} alt="" style={{ position: 'relative', width: 52, height: 52, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(0,212,255,0.35)', boxShadow: '0 0 0 8px rgba(0,212,255,0.06), 0 0 32px rgba(0,212,255,0.12)' }} />
                      ) : (
                        <div style={{ position: 'relative', width: 52, height: 52, borderRadius: '50%', background: 'linear-gradient(135deg, rgba(0,212,255,0.15), rgba(124,58,237,0.15))', border: '2px solid rgba(0,212,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 900, color: '#00D4FF' }}>
                          {user?.username?.[0]?.toUpperCase() || 'Y'}
                        </div>
                      )}
                    </div>
                  )}
                  {(!cameraOn || cameraErr) && (
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, #0a0a1a 0%, #0d1020 50%, #080d18 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                      {user?.avatar ? (
                        <img src={user.avatar} alt="" style={{ width: 52, height: 52, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(0,212,255,0.35)', boxShadow: '0 0 0 8px rgba(0,212,255,0.06), 0 0 32px rgba(0,212,255,0.12)' }} />
                      ) : user ? (
                        <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'linear-gradient(135deg, rgba(0,212,255,0.15), rgba(124,58,237,0.15))', border: '2px solid rgba(0,212,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 900, color: '#00D4FF' }}>
                          {user?.username?.[0]?.toUpperCase() || 'Y'}
                        </div>
                      ) : (
                        <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Camera size={16} style={{ color: 'rgba(0,212,255,0.45)' }} />
                        </div>
                      )}
                      {!cameraErr && (
                        <motion.button onClick={enableCamera} whileTap={{ scale: 0.95 }}
                          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 16px', borderRadius: 99, background: 'rgba(13,13,24,0.8)', border: '1px solid rgba(0,212,255,0.25)', color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                          <Camera size={11} />Enable Camera
                        </motion.button>
                      )}
                    </div>
                  )}
                  {/* Bottom fade */}
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 40, background: 'linear-gradient(to top, rgba(0,0,0,0.3) 0%, transparent 100%)', pointerEvents: 'none' }} />
                </div>

                {/* BOTTOM HALF: Invite UI or partner joined */}
                <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, bottom: 0, overflow: 'hidden', borderRadius: '0 0 28px 28px', zIndex: 1 }}>
                  <AnimatePresence mode="wait">
                    {!squadReady ? (
                      <motion.div key="invite-panel"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, background: 'linear-gradient(135deg, #0a0a1a 0%, #0d1020 50%, #080d18 100%)' }}>
                        {/* Ambient cyan glow */}
                        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 50%, rgba(0,212,255,0.07) 0%, transparent 70%)', pointerEvents: 'none' }} />
                        {/* Room code */}
                        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, marginBottom: 4 }}>
                            <Lock size={7} style={{ color: 'rgba(0,212,255,0.4)', flexShrink: 0 }} />
                            <p style={{ fontSize: 8, fontWeight: 800, letterSpacing: '0.25em', color: 'rgba(0,212,255,0.5)', textTransform: 'uppercase', margin: 0 }}>Room Code</p>
                            <button
                              onClick={toggleCodeVisibility}
                              title="Click to reveal your code"
                              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: codeVisible ? '#00D4FF' : 'rgba(0,212,255,0.5)', background: codeVisible ? 'rgba(0,212,255,0.1)' : 'rgba(0,212,255,0.06)', border: '1px solid rgba(0,212,255,0.15)', cursor: 'pointer', padding: '3px 5px', borderRadius: 6 }}
                            >
                              {codeVisible ? <EyeOff size={12} /> : <Eye size={12} />}
                            </button>
                          </div>
                          {duoDisplayCode
                            ? <p style={{ fontSize: 20, fontWeight: 900, letterSpacing: '0.18em', color: '#00D4FF', fontFamily: 'ui-monospace, monospace', textShadow: codeVisible ? '0 0 16px rgba(0,212,255,0.5)' : 'none', margin: 0, filter: codeVisible ? 'none' : 'blur(6px)', transition: 'filter 0.2s', userSelect: codeVisible ? 'text' : 'none' }}>{duoDisplayCode}</p>
                            : <Loader2 size={14} className="animate-spin" style={{ color: '#00D4FF' }} />
                          }
                        </div>
                        <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', margin: 0, zIndex: 1 }}>Invite a friend to join</p>
                        {/* Share buttons */}
                        <div style={{ display: 'flex', gap: 7, zIndex: 1 }}>
                          <a href={shareUrls.whatsapp} target="_blank" rel="noopener noreferrer"
                            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 11px', borderRadius: 20, background: '#25D366', textDecoration: 'none' }}>
                            <svg viewBox="0 0 24 24" style={{ width: 11, height: 11, fill: 'white', flexShrink: 0 }}><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 00-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                            <span style={{ color: 'white', fontSize: 10, fontWeight: 700 }}>WhatsApp</span>
                          </a>
                          <motion.button onClick={copySnapDuo} whileTap={{ scale: 0.9 }}
                            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 11px', borderRadius: 20, background: 'linear-gradient(45deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)', border: 'none', cursor: 'pointer' }}>
                            <svg viewBox="0 0 24 24" style={{ width: 11, height: 11, fill: 'white', flexShrink: 0 }}><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                            <span style={{ color: 'white', fontSize: 10, fontWeight: 700 }}>{snapCopied ? 'Copied!' : 'Instagram'}</span>
                          </motion.button>
                          <motion.button onClick={copyLink} whileTap={{ scale: 0.9 }}
                            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 11px', borderRadius: 20, border: 'none', cursor: 'pointer', ...(copied ? { background: 'rgba(34,197,94,0.2)' } : { background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }) }}>
                            {copied ? <Check size={11} style={{ color: '#4ade80' }} /> : <Copy size={11} style={{ color: 'rgba(255,255,255,0.6)' }} />}
                            <span style={{ color: copied ? '#4ade80' : 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: 700 }}>{copied ? 'Copied!' : 'Copy Link'}</span>
                          </motion.button>
                        </div>
                        {/* Waiting indicator */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, zIndex: 1 }}>
                          <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'rgba(0,212,255,0.35)' }} />
                          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.28)' }}>Waiting for friend<WaitingDots /></span>
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div key="friend-joined"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, #0a0a1a 0%, #0d1020 50%, #080d18 100%)' }}>
                        {(() => {
                          const partner = squad?.members?.find(m => m.socketId !== socket?.id)
                          const initial = partner?.username?.[0]?.toUpperCase() || '?'
                          const name = partner?.username || 'Partner'
                          return (
                            <>
                              {/* Subtle ambient glow */}
                              <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 40% 35%, rgba(0,212,255,0.09) 0%, transparent 65%)', pointerEvents: 'none' }} />
                              {/* Pulsing rings */}
                              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                                <motion.div style={{ position: 'absolute', width: 90, height: 90, borderRadius: '50%', border: '1px solid rgba(0,212,255,0.15)' }}
                                  animate={{ scale: [1, 1.18, 1], opacity: [0.5, 0.1, 0.5] }} transition={{ duration: 3.2, repeat: Infinity }} />
                                <motion.div style={{ position: 'absolute', width: 68, height: 68, borderRadius: '50%', border: '1px solid rgba(0,212,255,0.1)' }}
                                  animate={{ scale: [1, 1.1, 1], opacity: [0.35, 0.05, 0.35] }} transition={{ duration: 3.2, repeat: Infinity, delay: 0.4 }} />
                              </div>
                              {/* Avatar + name */}
                              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, zIndex: 1 }}>
                                <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(0,212,255,0.12)', border: '1.5px solid rgba(0,212,255,0.28)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 900, color: '#00D4FF', boxShadow: '0 0 20px rgba(0,212,255,0.18)' }}>
                                  {initial}
                                </div>
                                <p style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.7)', margin: 0 }}>{name}</p>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                  <motion.span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80', display: 'inline-block', boxShadow: '0 0 6px rgba(74,222,128,0.7)' }}
                                    animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 2, repeat: Infinity }} />
                                  <span style={{ fontSize: 10, color: 'rgba(74,222,128,0.65)' }}>Connected</span>
                                </div>
                              </div>
                              {/* Profile pill top-left */}
                              <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 10 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid rgba(0,212,255,0.2)', borderRadius: 50, padding: '6px 12px 6px 6px' }}>
                                  <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(0,212,255,0.2)', color: '#00D4FF', fontSize: 10, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{initial}</div>
                                  <span style={{ color: 'white', fontWeight: 700, fontSize: 10 }}>{name}</span>
                                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#4ade80', display: 'inline-block' }} />
                                </div>
                              </div>
                              {/* Bottom fade */}
                              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 40, background: 'linear-gradient(to top, rgba(0,0,0,0.3) 0%, transparent 100%)', pointerEvents: 'none' }} />
                            </>
                          )
                        })()}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            ) : (
              <>
                {/* SOLO: animated background */}
                <div style={{ position: 'absolute', inset: 0, borderRadius: 'inherit', overflow: 'hidden', zIndex: 0, background: 'linear-gradient(135deg, #0a0a1a 0%, #0d1020 50%, #080d18 100%)' }}>
                  <div style={{ position: 'absolute', top: '-20%', right: '-20%', width: '70%', height: '70%', background: 'radial-gradient(ellipse, rgba(255,255,255,0.05) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0, animation: 'lightDrift 8s ease-in-out infinite alternate' }} />
                  <div style={{ position: 'absolute', bottom: '-20%', left: '-20%', width: '60%', height: '60%', background: 'radial-gradient(ellipse, rgba(255,255,255,0.03) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0, animation: 'lightDrift2 10s ease-in-out infinite alternate' }} />
                </div>

                {/* Live video feed */}
                <video ref={videoRefDesktop} autoPlay muted playsInline
                  className="absolute inset-0 w-full h-full object-cover"
                  style={{ objectPosition: 'center top', opacity: cameraOn && !cameraErr ? 1 : 0, transition: 'opacity 0.5s ease' }} />

                {noCameraDevice && camBgImage && (
                  <div className="absolute inset-0 flex items-center justify-center" style={{ zIndex: 15 }}>
                    <img src={camBgImage} alt="" className="absolute inset-0 w-full h-full object-cover" />
                    {user?.avatar ? (
                      <img src={user.avatar} alt="" style={{ position: 'relative', width: 64, height: 64, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(0,212,255,0.35)', boxShadow: '0 0 0 10px rgba(0,212,255,0.06), 0 0 48px rgba(0,212,255,0.12)' }} />
                    ) : (
                      <div style={{ position: 'relative', width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg, rgba(0,212,255,0.15), rgba(124,58,237,0.15))', border: '2px solid rgba(0,212,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 900, color: '#00D4FF' }}>
                        {user?.username?.[0]?.toUpperCase() || 'Y'}
                      </div>
                    )}
                  </div>
                )}

                {/* Idle state */}
                {(!cameraOn || cameraErr) && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ zIndex: 10 }}>
                    <motion.div className="relative flex items-center justify-center" style={{ marginBottom: 24 }}>
                      <motion.div style={{ position: 'absolute', width: 96, height: 96, borderRadius: '50%', border: '1px solid rgba(0,212,255,0.25)' }}
                        animate={{ scale: [1, 1.18, 1], opacity: [0.6, 0.15, 0.6] }} transition={{ duration: 3, repeat: Infinity }} />
                      <motion.div style={{ position: 'absolute', width: 72, height: 72, borderRadius: '50%', border: '1px solid rgba(0,212,255,0.18)' }}
                        animate={{ scale: [1, 1.1, 1], opacity: [0.4, 0.08, 0.4] }} transition={{ duration: 3, repeat: Infinity, delay: 0.3 }} />
                      {user?.avatar ? (
                        <img src={user.avatar} alt="" style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(0,212,255,0.35)', boxShadow: '0 0 0 10px rgba(0,212,255,0.06), 0 0 48px rgba(0,212,255,0.12)' }} />
                      ) : user ? (
                        <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg, rgba(0,212,255,0.15), rgba(124,58,237,0.15))', border: '2px solid rgba(0,212,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 900, color: '#00D4FF' }}>
                          {user?.username?.[0]?.toUpperCase() || 'Y'}
                        </div>
                      ) : (
                        <div style={{ width: 64, height: 64, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(13,13,24,0.8)', border: '1px solid rgba(0,212,255,0.2)', backdropFilter: 'blur(12px)' }}>
                          <Camera size={24} style={{ color: 'rgba(0,212,255,0.5)' }} />
                        </div>
                      )}
                    </motion.div>
                    {cameraErr && (
                      <>
                        <p style={{ fontSize: 15, fontWeight: 700, color: 'rgba(255,255,255,0.55)', marginBottom: 4 }}>Camera access needed</p>
                        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.22)', marginBottom: 24, textAlign: 'center', maxWidth: 200, lineHeight: 1.45 }}>{cameraErrMsg || 'Allow camera access in browser settings'}</p>
                      </>
                    )}
                    {!cameraErr && (
                      <motion.button onClick={enableCamera} whileHover={{ scale: 1.04, boxShadow: '0 0 24px rgba(0,212,255,0.3)' }} whileTap={{ scale: 0.96 }}
                        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 24px', borderRadius: 99, background: 'rgba(13,13,24,0.75)', backdropFilter: 'blur(20px)', border: '1px solid rgba(0,212,255,0.3)', color: 'rgba(255,255,255,0.75)', fontSize: 13, fontWeight: 700, cursor: 'pointer', boxShadow: '0 0 0 1px rgba(0,212,255,0.06) inset' }}>
                        <Camera size={14} />
                        Enable Camera
                      </motion.button>
                    )}
                  </div>
                )}

                {/* Top-left camera controls (when live) */}
                {cameraOn && !cameraErr && (
                  <div className="absolute top-4 left-4 flex flex-col gap-2 z-20">
                    <motion.button onClick={flipCamera} whileTap={{ scale: 0.9 }}
                      style={{ width: 38, height: 38, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(10,10,15,0.6)', backdropFilter: 'blur(12px)', border: '1px solid rgba(0,212,255,0.18)', cursor: 'pointer' }}>
                      <Camera size={15} style={{ color: 'rgba(255,255,255,0.65)' }} />
                    </motion.button>
                  </div>
                )}
              </>
            )}

          </div>
          </div>

        </div>

      </section>

                        {/* ══════════════ HOW IT WORKS ══════════════ */}
      <section id="how-it-works" className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-10 py-16 lg:py-24">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55 }}
        >
          <p className="text-[11px] font-black tracking-[0.2em] uppercase mb-3" style={{ color: '#00B8E0' }}>Simple by design</p>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Up and chatting in{' '}
            <span style={{ background: 'linear-gradient(135deg, #00D4FF 0%, #7C3AED 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              30 seconds
            </span>
          </h2>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {[
            { num: '01', title: 'Open Your Camera', desc: 'Allow camera access when prompted. Takes two seconds. You can also start without a camera if you prefer.', icon: Camera, color: '#00D4FF' },
            { num: '02', title: 'Set Your Preferences', desc: 'Choose who to match with — anyone, a specific gender, or people from your country. Free and paid options available.', icon: Globe, color: '#00B8E0' },
            { num: '03', title: 'Meet Someone Now', desc: "You're matched in under 2 seconds. Don't vibe with who you got? Hit Skip and find someone new instantly.", icon: Video, color: 'rgba(0,212,255,0.55)' },
          ].map(({ num, title, desc, icon: Icon, color }, i) => (
            <motion.div
              key={num}
              className="flex flex-col items-center text-center gap-4 p-6 rounded-2xl"
              style={{ background: 'rgba(10,10,15,0.6)', border: '1px solid rgba(0,212,255,0.1)' }}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              whileHover={{ y: -4, borderColor: 'rgba(0,212,255,0.28)', boxShadow: '0 12px 40px rgba(0,212,255,0.1)' }}
            >
              <div className="relative">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.2)' }}>
                  <Icon size={22} style={{ color }} />
                </div>
                <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black text-white" style={{ background: '#00D4FF' }}>{i + 1}</span>
              </div>
              <div>
                <p className="text-white font-bold text-base mb-2">{title}</p>
                <p className="text-sm leading-relaxed" style={{ color: 'rgba(180,190,210,0.65)' }}>{desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ══════════════ MEMBERSHIP VALUE ══════════════ */}
      <section className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-10 pb-16 lg:pb-20">
        <div className="rounded-3xl overflow-hidden p-8 lg:p-12" style={{ background: 'rgba(10,10,15,0.5)', border: '1px solid rgba(0,212,255,0.12)' }}>
          <div className="grid md:grid-cols-2 gap-8 lg:gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55 }}
            >
              <p className="text-[11px] font-black tracking-[0.2em] uppercase mb-3" style={{ color: '#00B8E0' }}>Membership</p>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-4">
                Match smarter with{' '}
                <span style={{ background: 'linear-gradient(135deg, #00D4FF 0%, #7C3AED 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>filters</span>
              </h2>
              <p className="text-sm leading-relaxed mb-6" style={{ color: 'rgba(180,190,210,0.65)' }}>
                Free gets you started. Membership gets you exactly who you want to meet — filter by gender, country, and more.
              </p>
              <motion.button
                onClick={() => navigate('/subscription')}
                whileHover={{ scale: 1.03, boxShadow: '0 0 28px rgba(0,212,255,0.38)' }}
                whileTap={{ scale: 0.97 }}
                className="px-6 py-3 rounded-xl text-white font-bold text-sm"
                style={{
                  background: 'linear-gradient(140deg, #004466 0%, #00D4FF 55%, #00B8E0 100%)',
                  boxShadow: '0 0 20px rgba(0,212,255,0.28), 0 4px 16px rgba(0,0,0,0.3)',
                }}
              >
                View Membership Plans
              </motion.button>
            </motion.div>
            <motion.div
              className="flex flex-col gap-3"
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55 }}
            >
              {[
                { tier: 'Basic', price: '£6.99/mo', features: ['Filter by gender', 'Basic badge on profile'], borderColor: 'rgba(0,212,255,0.2)', bg: 'rgba(0,212,255,0.06)', labelColor: '#00D4FF', checkColor: '#00D4FF' },
                { tier: 'VIP', price: '£12.99/mo', features: ['Filter by gender', 'Filter by country', 'VIP badge on profile'], borderColor: 'rgba(0,212,255,0.3)', bg: 'rgba(0,212,255,0.08)', labelColor: '#00B8E0', checkColor: '#00D4FF' },
              ].map(({ tier, price, features, borderColor, bg, labelColor, checkColor }) => (
                <div key={tier} className="p-4 rounded-2xl" style={{ background: bg, border: `1px solid ${borderColor}` }}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-black text-white text-sm">{tier}</span>
                    <span className="text-sm font-bold" style={{ color: labelColor }}>{price}</span>
                  </div>
                  <div className="space-y-1.5">
                    {features.map(f => (
                      <div key={f} className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: `${checkColor}25` }}>
                          <Check size={9} style={{ color: checkColor }} />
                        </div>
                        <span className="text-xs" style={{ color: 'rgba(220,220,240,0.75)' }}>{f}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ══════════════ CREATOR MONETIZATION ══════════════ */}
      <section className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-10 pb-16 lg:pb-20">
        <div className="rounded-3xl overflow-hidden" style={{ background: 'rgba(10,10,15,0.5)', border: '1px solid rgba(0,212,255,0.12)' }}>
          <div className="p-8 lg:p-12">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.55 }}
              >
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-4" style={{ background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.22)' }}>
                  <DollarSign size={12} style={{ color: '#00B8E0' }} />
                  <span className="text-[11px] font-black tracking-[0.1em] uppercase" style={{ color: '#00B8E0' }}>For Creators</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-4">
                  Go live. Get paid.{' '}
                  <span style={{ background: 'linear-gradient(135deg, #00D4FF 0%, #7C3AED 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Keep 70%.</span>
                </h2>
                <p className="text-sm leading-relaxed mb-6" style={{ color: 'rgba(180,190,210,0.65)' }}>
                  Turn your conversations into income. Viewers send gifts, you earn real money — no middlemen taking the bulk of your earnings.
                </p>
                <motion.button
                  onClick={() => navigate('/earn')}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2"
                  style={{ background: 'rgba(0,212,255,0.12)', border: '1px solid rgba(0,212,255,0.28)', color: '#00B8E0' }}
                >
                  <DollarSign size={15} /> Start Earning
                </motion.button>
              </motion.div>
              <motion.div
                className="grid grid-cols-2 gap-3"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1, duration: 0.55 }}
              >
                {[
                  { label: '70%', sub: 'Creator cut', color: '#00B8E0' },
                  { label: 'Live', sub: 'Real-time gifts', color: '#00B8E0' },
                  { label: '150+', sub: 'Countries', color: '#00D4FF' },
                  { label: 'Free', sub: 'To start', color: 'rgba(0,212,255,0.55)' },
                ].map(({ label, sub, color }) => (
                  <div key={label} className="p-4 rounded-2xl text-center" style={{ background: 'rgba(10,10,15,0.7)', border: '1px solid rgba(0,212,255,0.1)' }}>
                    <p className="text-2xl font-black mb-1" style={{ color }}>{label}</p>
                    <p className="text-[11px]" style={{ color: 'rgba(180,190,210,0.5)' }}>{sub}</p>
                  </div>
                ))}
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════ TRUST & SAFETY ══════════════ */}
      <section className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-10 pb-16 lg:pb-24">
        <motion.div
          className="text-center mb-10"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55 }}
        >
          <p className="text-[11px] font-black tracking-[0.2em] uppercase mb-3" style={{ color: '#00B8E0' }}>Trust & Safety</p>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Safe by{' '}
            <span style={{ background: 'linear-gradient(135deg, #00D4FF 0%, #7C3AED 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>default</span>
          </h2>
        </motion.div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: Shield, title: '100% Anonymous', desc: 'No account needed. No data stored. Your sessions vanish the moment you leave.', color: '#00D4FF' },
            { icon: Globe, title: 'Human Moderation', desc: 'Our moderation team reviews every report. Violations are acted on, not ignored.', color: '#00D4FF' },
            { icon: Video, title: 'One-Tap Report', desc: 'Tap the flag icon during any chat to report instantly and anonymously.', color: '#00D4FF' },
            { icon: Lock, title: 'Instant Bans', desc: 'Verified rule-breakers are suspended immediately — no second chances for serious violations.', color: '#00B8E0' },
          ].map(({ icon: Icon, title, desc, color }, i) => (
            <motion.div
              key={title}
              className="p-5 rounded-2xl flex flex-col gap-3"
              style={{ background: 'rgba(10,10,15,0.6)', border: '1px solid rgba(0,212,255,0.1)' }}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.07, duration: 0.45 }}
              whileHover={{ y: -3, borderColor: 'rgba(0,212,255,0.28)', boxShadow: '0 8px 28px rgba(0,212,255,0.1)' }}
            >
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.18)' }}>
                <Icon size={18} style={{ color }} />
              </div>
              <div>
                <p className="text-white font-bold text-sm mb-1">{title}</p>
                <p className="text-[12px] leading-relaxed" style={{ color: 'rgba(180,190,210,0.65)' }}>{desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ══════════════ FAQ SECTION ══════════════ */}
      <section id="faq" className="relative z-10 max-w-3xl mx-auto w-full px-4 pb-24 pt-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.55 }}
        >
          <div className="text-center mb-10">
            <p className="text-[11px] font-black tracking-[0.2em] uppercase mb-3" style={{ color: '#00B8E0' }}>
              Got questions?
            </p>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Frequently Asked{' '}
              <span style={{ background: 'linear-gradient(135deg, #00D4FF 0%, #7C3AED 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Questions</span>
            </h2>
          </div>

          <div className="space-y-2">
            {FAQ_ITEMS.map((item, i) => {
              const isOpen = faqOpen === i
              return (
                <div
                  key={i}
                  className="rounded-2xl overflow-hidden transition-all duration-200"
                  style={{
                    background: isOpen ? 'rgba(13,13,24,0.8)' : 'rgba(10,10,15,0.4)',
                    border: isOpen ? '1px solid rgba(0,212,255,0.25)' : '1px solid rgba(0,212,255,0.08)',
                  }}
                >
                  <button
                    onClick={() => setFaqOpen(isOpen ? null : i)}
                    className="w-full flex items-center justify-between px-5 py-4 text-left gap-4"
                  >
                    <span className="font-semibold text-sm sm:text-[15px] transition-colors" style={{ color: isOpen ? 'white' : 'rgba(186,200,225,0.65)' }}>
                      {item.q}
                    </span>
                    <span
                      className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
                        isOpen ? '' : ''
                      }`}
                      style={{ background: isOpen ? 'rgba(0,212,255,0.15)' : 'rgba(255,255,255,0.04)', color: isOpen ? '#00B8E0' : 'rgba(180,190,210,0.5)' }}
                    >
                      <ChevronDown size={14} className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                    </span>
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                        className="overflow-hidden"
                      >
                        <p className="px-5 pb-5 text-sm leading-relaxed" style={{ color: 'rgba(180,190,210,0.6)' }}>{item.a}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )
            })}
          </div>
        </motion.div>
      </section>

      <PremiumModal isOpen={showPremium} onClose={() => setShowPremium(false)} />
      <Footer />
    </motion.div>
  )
}
