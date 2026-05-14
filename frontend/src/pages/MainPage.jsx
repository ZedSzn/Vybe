import { useState, useEffect, useLayoutEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Lock, Globe, ChevronDown, UserPlus, Copy, Check,
  Crown, Loader2, X as XIcon, Video, VideoOff, Shield,
  Camera, DollarSign, SlidersHorizontal, User, Users,
} from 'lucide-react'

const FEATURE_CARDS = [
  { key: 'instant', title: 'Instant Match',    desc: 'Connect with someone new in under 2 seconds.',     color: 'rgba(27,98,245',  hex: '#1b62f5' },
  { key: 'global',  title: 'Global',           desc: 'Meet people from 150+ countries worldwide.',       color: 'rgba(16,185,129', hex: '#10b981' },
  { key: 'safe',    title: 'Safe & Moderated', desc: 'Human moderation with instant ban enforcement.',   color: 'rgba(245,158,11', hex: '#f59e0b' },
]

function FeatureIcon({ k, hex }) {
  const s = { color: hex }
  if (k === 'private') return <Lock   size={20} style={s} />
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
    a: 'Yes — Vybe is free with full access to core random video chat. Upgrading to Basic or VIP unlocks advanced filters like gender and country matching, priority queues, and exclusive features.',
  },
  {
    q: 'What is Vybe Membership?',
    a: 'Membership comes in two tiers. Basic (£6.99/mo) unlocks gender filtering so you choose who you match with. VIP (£12.99/mo) adds country filtering, priority matching, and early access to new features.',
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

function fmtTime(seconds) {
  if (seconds == null || seconds < 0) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

const AVATARS = [11, 26, 44, 7, 65, 15, 37]

const GRID_USERS = [
  { name: 'Grace',   age: 30, flag: 'US', photo: 'https://randomuser.me/api/portraits/women/33.jpg' },
  { name: 'Sofia',   age: 28, flag: 'BR', photo: 'https://randomuser.me/api/portraits/women/44.jpg' },
  { name: 'Olivia',  age: 23, flag: 'AU', photo: 'https://randomuser.me/api/portraits/women/55.jpg' },
  { name: 'Emma',    age: 25, flag: 'GB', photo: 'https://randomuser.me/api/portraits/women/22.jpg' },
  { name: 'Mia',     age: 27, flag: 'DE', photo: 'https://randomuser.me/api/portraits/women/11.jpg' },
  { name: 'Luna',    age: 24, flag: 'FR', photo: 'https://randomuser.me/api/portraits/women/66.jpg' },
]


export default function MainPage() {
  const { user }                              = useAuth()
  const { socket, isConnected, onlineCount } = useSocket()
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
  const [facingMode,         setFacingMode]         = useState('user')
  const [permissionAsked,    setPermissionAsked]    = useState(false)
  const [faqOpen,         setFaqOpen]         = useState(null)
  const [autoMatch,       setAutoMatch]       = useState(true)
  const [showAdvanced,    setShowAdvanced]    = useState(false)

  const [squad,        setSquad]        = useState(null)
  const [squadLoading, setSquadLoading] = useState(false)
  const [squadError,   setSquadError]   = useState('')
  const [timeLeft,     setTimeLeft]     = useState(null)
  const [copied,       setCopied]       = useState(false)

  const [privateCode,    setPrivateCode]    = useState('')
  const [privateLoading, setPrivateLoading] = useState(false)
  const [privateError,   setPrivateError]   = useState('')
  const [privateCopied,  setPrivateCopied]  = useState(false)

  const countryBtnRef = useRef(null)
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
    if (showCountryDrop && countryBtnRef.current) {
      const r = countryBtnRef.current.getBoundingClientRect()
      setCountryDropPos({ bottom: window.innerHeight - r.top + 8, left: Math.max(8, r.left), width: Math.max(r.width, 260) })
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
    const onCreated  = (data) => { setSquad(data); setSquadLoading(false); setSquadError('') }
    const onUpdated  = (data) => setSquad(data)
    const onJoined   = (data) => { setSquad(data); setSquadError('') }
    const onExpired  = ()     => { setSquad(null); setSquadError('Duo expired. Create a new one.') }
    const onKicked   = ()     => { setSquad(null); setMode('solo'); setSquadError('You were removed from the duo.') }
    const onError    = ({ message }) => { setSquadLoading(false); setSquadError(message) }
    const onNavigate = ({ squadId }) => {
      streamRef.current?.getTracks().forEach((t) => t.stop())
      navigate('/chat', { state: { mode: 'squad', squadId, filterGender: null, filterCountry: '' } })
    }
    const onPrivateCreated = ({ code }) => { setPrivateCode(code); setPrivateLoading(false); setPrivateError('') }
    const onPrivateError   = ({ message }) => { setPrivateLoading(false); setPrivateError(message) }

    socket.on('squad-created',       onCreated)
    socket.on('squad-updated',       onUpdated)
    socket.on('squad-joined',        onJoined)
    socket.on('squad-expired',       onExpired)
    socket.on('squad-kicked',        onKicked)
    socket.on('squad-error',         onError)
    socket.on('squad-navigate',      onNavigate)
    socket.on('private-room-created', onPrivateCreated)
    socket.on('private-room-error',   onPrivateError)
    return () => {
      socket.off('squad-created',       onCreated)
      socket.off('squad-updated',       onUpdated)
      socket.off('squad-joined',        onJoined)
      socket.off('squad-expired',       onExpired)
      socket.off('squad-kicked',        onKicked)
      socket.off('squad-error',         onError)
      socket.off('squad-navigate',      onNavigate)
      socket.off('private-room-created', onPrivateCreated)
      socket.off('private-room-error',   onPrivateError)
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
    if (!socket || !squad) return
    socket.emit('leave-squad', { squadId: squad.squadId })
    setSquad(null)
  }

  const createPrivateRoom = () => {
    if (!socket || !isConnected) { setPrivateError('Not connected. Please wait…'); return }
    setPrivateLoading(true); setPrivateError('')
    socket.emit('create-private-room')
  }

  const privateInviteUrl = privateCode ? `${window.location.origin}/private/${privateCode}` : ''

  const copyPrivateLink = async () => {
    try { await navigator.clipboard.writeText(privateInviteUrl); setPrivateCopied(true); setTimeout(() => setPrivateCopied(false), 2000) }
    catch {}
  }

  const inviteUrl  = squad ? `${window.location.origin}/duo/${squad.code}` : ''
  const inviteText = `Join my duo on Vybe! ${inviteUrl}`

  const copyLink = async () => {
    try { await navigator.clipboard.writeText(inviteUrl); setCopied(true); setTimeout(() => setCopied(false), 2000) }
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
    if (mode === 'private') {
      if (!privateCode) { setPrivateError('Create a private room first.'); return }
      streamRef.current?.getTracks().forEach((t) => t.stop())
      navigate('/chat', { state: { mode: 'private', privateCode } })
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

      {/* ══════════════ EARN BANNER — slim ══════════════ */}
      <div
        className="relative z-10 w-full flex flex-wrap items-center justify-center gap-2 px-4 py-2 text-[12px]"
        style={{ background: 'rgba(37,99,235,0.06)', borderBottom: '1px solid rgba(59,130,246,0.12)', marginTop: '64px' }}
      >
        <span className="px-1.5 py-0.5 rounded-full text-[9px] font-black tracking-wide uppercase" style={{ background: 'rgba(37,99,235,0.25)', color: '#93c5fd' }}>New</span>
        <span className="flex items-center gap-1.5" style={{ color: 'rgba(200,200,220,0.72)' }}>
          <DollarSign size={11} style={{ color: 'rgba(96,165,250,0.85)' }} />
          <span className="text-white/75 font-medium">Get paid to live chat.</span>
          <span className="hidden sm:inline text-white/40">Earn real money from viewer gifts.</span>
        </span>
        <button onClick={() => navigate('/earn')} className="font-semibold text-[11px] underline underline-offset-2 opacity-75 hover:opacity-100" style={{ color: '#a78bfa' }}>
          Learn more â†’
        </button>
      </div>

      {/* ══════════════ MOBILE LAYOUT ══════════════ */}
      <div className="lg:hidden relative z-10 px-4 pt-4 pb-12 flex flex-col gap-5">

        {/* Live pill */}
        <div className="flex justify-center">
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full"
            style={{ background: 'rgba(37,99,235,0.1)', border: '1px solid rgba(59,130,246,0.2)' }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 online-pulse" />
            <span className="text-[10px] font-black tracking-[0.14em] uppercase" style={{ color: '#93c5fd' }}>Live · Random · Real</span>
          </motion.div>
        </div>

        {/* Camera preview — dominant, full-width */}
        <motion.div
          className="relative rounded-2xl overflow-hidden w-full"
          style={{ aspectRatio: '4/3', background: '#080812', border: '1px solid rgba(59,130,246,0.2)', boxShadow: '0 0 0 1px rgba(59,130,246,0.06) inset, 0 20px 60px rgba(0,0,0,0.6), 0 0 32px rgba(37,99,235,0.08)' }}
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.06, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <video ref={videoRef} autoPlay muted playsInline className={`w-full h-full object-cover ${cameraOn && !cameraErr ? 'block' : 'hidden'}`} />
          {!cameraOn || cameraErr ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center px-5 py-6"
              style={{ background: 'radial-gradient(ellipse at 40% 35%, rgba(37,99,235,0.18) 0%, rgba(8,12,20,1) 65%)' }}>
              {window.location.protocol !== 'https:' && window.location.hostname !== 'localhost' && (
                <div className="absolute top-3 left-3 right-3 z-20 flex items-center gap-2 px-3 py-2 rounded-xl text-[11px] font-semibold"
                  style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171' }}>
                  <Shield size={12} className="flex-shrink-0" /> Camera requires HTTPS
                </div>
              )}
              <motion.div animate={{ opacity: [0.25, 0.5, 0.25], scale: [1, 1.1, 1] }} transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute w-32 h-32 rounded-full pointer-events-none"
                style={{ background: 'radial-gradient(circle, rgba(37,99,235,0.18) 0%, transparent 70%)', top: '16%' }} />
              {!permissionAsked || cameraErr ? (
                <div className="relative z-10 flex flex-col items-center w-full">
                  <div className="flex items-center justify-center mb-3 rounded-2xl" style={{ width: 48, height: 48, background: cameraErr ? 'rgba(220,38,38,0.12)' : 'rgba(37,99,235,0.15)', border: `1.5px solid ${cameraErr ? 'rgba(220,38,38,0.28)' : 'rgba(37,99,235,0.35)'}` }}>
                    {cameraErr ? <VideoOff size={20} style={{ color: '#f87171' }} /> : <Camera size={20} style={{ color: 'rgba(96,165,250,0.85)' }} />}
                  </div>
                  {cameraErr ? (
                    <>
                      <p className="text-white font-bold text-[13px] text-center mb-1 leading-snug">Camera blocked</p>
                      <p className="text-[11px] text-center mb-3 leading-relaxed px-2" style={{ color: 'rgba(248,113,113,0.8)' }}>{cameraErrMsg || 'Allow camera in your browser settings.'}</p>
                      {(() => {
                        const ua = navigator.userAgent
                        const isIOS = /iPad|iPhone|iPod/.test(ua)
                        const isAndroid = /Android/.test(ua)
                        const steps = isIOS
                          ? ['Settings â†’ Chrome/Safari â†’ Camera â†’ Allow']
                          : isAndroid
                          ? ['Address bar lock â†’ Permissions â†’ Camera â†’ Allow']
                          : null
                        if (!steps) return null
                        return (
                          <div className="w-full mb-3 px-1">
                            {steps.map((s, i) => (
                              <p key={i} className="text-[10px] text-center leading-relaxed" style={{ color: 'rgba(96,165,250,0.6)' }}>› {s}</p>
                            ))}
                          </div>
                        )
                      })()}
                    </>
                  ) : (
                    <>
                      <p className="text-white font-bold text-[13px] text-center mb-1 leading-snug">Allow camera access</p>
                      <p className="text-[11px] text-center mb-4 leading-relaxed" style={{ color: 'rgba(160,160,180,0.55)' }}>Required to start video chatting</p>
                    </>
                  )}
                  <motion.button onClick={enableCamera} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                    className="w-full py-2.5 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2" style={{ background: "linear-gradient(140deg, #1e3a8a 0%, #2563eb 55%, #0891b2 100%)" }}>
                    <Video size={14} />{cameraErr ? 'Try Again' : 'Allow Camera'}
                  </motion.button>
                </div>
              ) : (
                <div className="relative z-10 flex flex-col items-center gap-3">
                  <Loader2 size={28} className="animate-spin" style={{ color: 'rgba(96,165,250,0.7)' }} />
                  <p className="text-[12px]" style={{ color: 'rgba(160,160,180,0.6)' }}>Waiting for permission…</p>
                </div>
              )}
            </div>
          ) : null}
          <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at center, transparent 52%, rgba(0,0,0,0.45) 100%)' }} />
          <div className="absolute bottom-0 left-0 right-0 h-14 pointer-events-none" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)' }} />
          <p className="absolute bottom-2.5 left-0 right-0 text-center text-[10px] pointer-events-none" style={{ color: 'rgba(255,255,255,0.25)' }}>Your preview · only you can see this</p>
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
            <span style={{ background: 'linear-gradient(125deg, #60a5fa 0%, #0ea5e9 65%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              Instantly.
            </span>
          </h1>
          <p className="text-sm leading-relaxed" style={{ color: '#6b7280' }}>
            Live video chat with strangers worldwide — free, anonymous, no sign-up.
          </p>
        </motion.div>

        {/* Social proof */}
        <div className="flex items-center justify-center gap-3">
          <div className="flex">
            {AVATARS.map((n, i) => (
              <img key={n} src={`https://i.pravatar.cc/48?img=${n}`} alt="" className="w-7 h-7 rounded-full"
                style={{ border: '2px solid #0a0a0f', marginLeft: i === 0 ? '0' : '-8px', zIndex: AVATARS.length - i, position: 'relative' }} />
            ))}
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 online-pulse" />
            <span className="font-medium text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>
              {onlineCount >= 20 ? `${onlineCount.toLocaleString()} people online` : 'People matching now'}
            </span>
          </div>
        </div>

        {/* Start Chatting Now — dominant CTA */}
        <motion.button
          onClick={startVybing}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          className="w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl text-white font-extrabold"
          style={{ fontSize: '16px', background: 'linear-gradient(140deg, #1e3a8a 0%, #2563eb 55%, #0891b2 100%)', boxShadow: '0 0 20px rgba(37,99,235,0.28), 0 4px 20px rgba(0,0,0,0.4)' }}
        >
          <Video size={19} strokeWidth={2.5} />
          Start Chatting Now
        </motion.button>

        <motion.button
          onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
          whileTap={{ scale: 0.97 }}
          className="w-full flex items-center justify-center gap-1.5 py-3 rounded-2xl text-sm font-semibold"
          style={{ color: 'rgba(148,163,184,0.65)', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          See How It Works â†“
        </motion.button>

        {/* â”€â”€ Match Settings â”€â”€ */}
        <div className="rounded-2xl p-4 space-y-4" style={{ background: 'rgba(13,13,24,0.92)', backdropFilter: 'blur(20px) saturate(1.4)', border: '1px solid rgba(30,30,46,0.8)', boxShadow: '0 24px 64px rgba(0,0,0,0.6), 0 0 0 1px rgba(59,130,246,0.05) inset' }}>

          {/* Mode */}
          <div>
            <p className="text-[10px] font-black tracking-[0.18em] uppercase mb-2" style={{ color: 'rgba(160,160,180,0.45)' }}>MODE</p>
            <div className="flex gap-1.5 p-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)' }}>
              {[{ id: 'solo', label: 'Solo' }, { id: 'squad', label: 'Duo' }, { id: 'private', label: 'Private' }].map(({ id, label }) => (
                <motion.button key={id} onClick={() => setMode(id)} whileTap={{ scale: 0.93 }} transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  className="flex-1 py-2 text-xs font-bold transition-colors"
                  style={mode === id
                    ? { background: 'linear-gradient(135deg, #1d4ed8, #3b82f6)', color: 'white', borderRadius: '10px' }
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
              <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(59,130,246,0.12)', color: 'rgba(147,197,253,0.85)' }}>Basic</span>
            </div>
            <div className="flex gap-1.5">
              {[{ id: 'both', label: 'Anyone', free: true }, { id: 'male', label: 'Male', free: false }, { id: 'female', label: 'Female', free: false }].map(({ id, label, free }) => (
                <motion.button key={id} onClick={() => handleGender(id)} whileTap={{ scale: 0.92 }} transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  className="flex-1 py-2 text-xs font-bold relative"
                  style={filterGender === id
                    ? { background: 'linear-gradient(135deg, #1d4ed8, #3b82f6)', color: 'white', borderRadius: '10px' }
                    : { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(160,160,180,0.5)', borderRadius: '10px' }}>
                  {label}
                  {!free && <Lock size={8} className="absolute top-1 right-1" style={{ opacity: 0.3 }} />}
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
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.22 }} className="overflow-hidden">
                <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center gap-2">
                      <p className="text-[10px] font-bold text-vybe-muted uppercase tracking-widest">My Duo</p>
                      {squadReady && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-green-500/15 text-green-400 border border-green-500/25 font-bold">âœ“ Ready</span>}
                    </div>
                    <div className="flex items-center gap-2">
                      {squad && timeLeft != null && <span className="text-[9px] text-vybe-muted font-mono">Expires {fmtTime(timeLeft)}</span>}
                      {squad && <button onClick={leaveSquad} className="w-4 h-4 flex items-center justify-center rounded text-vybe-muted hover:text-white"><XIcon size={10} /></button>}
                    </div>
                  </div>
                  {!squad ? (
                    <div>
                      <p className="text-vybe-muted text-[11px] text-center mb-2.5">Invite a friend to chat as a duo</p>
                      {squadError && <p className="text-red-400 text-[10px] bg-red-500/10 border border-red-500/20 rounded-lg px-2 py-1.5 mb-2 text-center">{squadError}</p>}
                      <button onClick={createSquad} disabled={squadLoading || !isConnected}
                        className="w-full py-2.5 rounded-xl text-white font-bold text-xs flex items-center justify-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed" style={{ background: "linear-gradient(140deg, #1e3a8a 0%, #2563eb 60%, #0891b2 100%)" }}>
                        {squadLoading ? <><Loader2 size={11} className="animate-spin" /> Creating…</> : !isConnected ? <><Loader2 size={11} className="animate-spin" /> Connecting…</> : <><UserPlus size={11} /> Create Duo Room</>}
                      </button>
                      {!isConnected && <p className="text-[10px] text-center mt-1" style={{ color: 'rgba(107,114,128,0.7)' }}>Waking up server, please wait…</p>}
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      <div className="flex gap-2">
                        {squad.members.map((m) => (
                          <div key={m.socketId} className="flex-1 flex flex-col items-center gap-1 p-2 rounded-xl border relative group" style={{ background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.08)' }}>
                            <div className="w-8 h-8 rounded-full flex items-center justify-center font-black text-xs" style={{ background: "rgba(37,99,235,0.2)", color: "#93c5fd" }}>{m.username?.[0]?.toUpperCase() || '?'}</div>
                            <span className="text-[9px] text-white font-semibold truncate w-full text-center" style={{ maxWidth: '52px' }}>{m.username || 'User'}</span>
                            {m.socketId === squad.leaderId && <Crown size={8} className="text-yellow-400" />}
                            {squad.leaderId === socket?.id && m.socketId !== socket?.id && (
                              <button onClick={() => kickMember(m.socketId)} className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><XIcon size={7} /></button>
                            )}
                          </div>
                        ))}
                        {squad.members.length < 2 && (
                          <div className="flex-1 flex flex-col items-center gap-1 p-2 rounded-xl border border-dashed" style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.1)' }}>
                            <div className="w-8 h-8 rounded-full border-2 border-dashed border-vybe-border flex items-center justify-center"><UserPlus size={11} className="text-vybe-muted" /></div>
                            <span className="text-[9px] text-vybe-muted">Waiting…</span>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-1.5">
                        <div className="flex-1 px-2 py-1.5 rounded-lg text-[9px] text-vybe-muted font-mono truncate select-all" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)' }}>{inviteUrl}</div>
                        <motion.button onClick={copyLink} whileTap={{ scale: 0.85 }} animate={copied ? { scale: [1, 1.2, 1] } : {}} transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                          className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${copied ? 'bg-green-500/20 text-green-400' : 'text-vybe-muted hover:text-white'}`}
                          style={!copied ? { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' } : {}}>
                          <AnimatePresence mode="wait">
                            {copied ? <motion.span key="check" initial={{ scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0 }} transition={{ type: 'spring', stiffness: 500, damping: 20 }}><Check size={10} /></motion.span>
                              : <motion.span key="copy" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}><Copy size={10} /></motion.span>}
                          </AnimatePresence>
                        </motion.button>
                      </div>
                      <div className="grid grid-cols-3 gap-1.5">
                        <a href={shareUrls.whatsapp} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-0.5 py-1.5 rounded-lg bg-[#25D366]/10 border border-[#25D366]/20 hover:bg-[#25D366]/20 transition-all">
                          <svg viewBox="0 0 24 24" className="w-3 h-3 fill-[#25D366]"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 00-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
                          <span className="text-[7px] text-[#25D366] font-bold">WhatsApp</span>
                        </a>
                        <a href={shareUrls.twitter} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-0.5 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all">
                          <svg viewBox="0 0 24 24" className="w-3 h-3 fill-white"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                          <span className="text-[7px] text-white/70 font-bold">Twitter</span>
                        </a>
                        <a href={shareUrls.facebook} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-0.5 py-1.5 rounded-lg bg-[#1877F2]/10 border border-[#1877F2]/20 hover:bg-[#1877F2]/20 transition-all">
                          <svg viewBox="0 0 24 24" className="w-3 h-3 fill-[#1877F2]"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
                          <span className="text-[7px] text-[#1877F2] font-bold">Facebook</span>
                        </a>
                      </div>
                      {squadError && <p className="text-red-400 text-[10px] bg-red-500/10 border border-red-500/20 rounded-lg px-2 py-1.5 text-center">{squadError}</p>}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Private room inline panel */}
          <AnimatePresence initial={false}>
            {mode === 'private' && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.22 }} className="overflow-hidden">
                <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="flex items-center justify-between mb-2.5">
                    <p className="text-[10px] font-bold text-vybe-muted uppercase tracking-widest">Private Room</p>
                    {privateCode && <button onClick={() => { setPrivateCode(''); setPrivateError('') }} className="w-4 h-4 flex items-center justify-center rounded text-vybe-muted hover:text-white"><XIcon size={10} /></button>}
                  </div>
                  {!privateCode ? (
                    <div>
                      <p className="text-vybe-muted text-[11px] text-center mb-2.5">Create a private room and share the link with one friend</p>
                      {privateError && <p className="text-red-400 text-[10px] bg-red-500/10 border border-red-500/20 rounded-lg px-2 py-1.5 mb-2 text-center">{privateError}</p>}
                      <button onClick={createPrivateRoom} disabled={privateLoading || !isConnected}
                        className="w-full py-2.5 rounded-xl text-white font-bold text-xs flex items-center justify-center gap-1.5 disabled:opacity-60" style={{ background: "linear-gradient(140deg, #1e3a8a 0%, #2563eb 60%, #0891b2 100%)" }}>
                        {privateLoading ? <><Loader2 size={11} className="animate-spin" /> Creating…</> : !isConnected ? <><Loader2 size={11} className="animate-spin" /> Connecting…</> : <><Lock size={11} /> Create Private Room</>}
                      </button>
                      {!isConnected && <p className="text-[10px] text-center mt-1" style={{ color: 'rgba(107,114,128,0.7)' }}>Waking up server, please wait…</p>}
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      <div className="flex items-center gap-2 p-2 rounded-xl" style={{ background: 'rgba(27,98,245,0.08)', border: '1px solid rgba(27,98,245,0.18)' }}>
                        <Lock size={11} className="text-blue-400 flex-shrink-0" />
                        <p className="text-[11px] text-blue-300 flex-1">Room ready — share the link below</p>
                      </div>
                      <div className="flex gap-1.5">
                        <div className="flex-1 px-2 py-1.5 rounded-lg text-[9px] text-vybe-muted font-mono truncate select-all" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)' }}>{privateInviteUrl}</div>
                        <motion.button onClick={copyPrivateLink} whileTap={{ scale: 0.85 }} animate={privateCopied ? { scale: [1, 1.2, 1] } : {}} transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                          className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${privateCopied ? 'bg-green-500/20 text-green-400' : 'text-vybe-muted hover:text-white'}`}
                          style={!privateCopied ? { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' } : {}}>
                          <AnimatePresence mode="wait">
                            {privateCopied ? <motion.span key="check" initial={{ scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0 }} transition={{ type: 'spring', stiffness: 500, damping: 20 }}><Check size={10} /></motion.span>
                              : <motion.span key="copy" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}><Copy size={10} /></motion.span>}
                          </AnimatePresence>
                        </motion.button>
                      </div>
                      <p className="text-[10px] text-center text-vybe-muted">Once your friend clicks the link, hit <span className="text-white font-bold">Start Vybe</span> to connect</p>
                      {privateError && <p className="text-red-400 text-[10px] bg-red-500/10 border border-red-500/20 rounded-lg px-2 py-1.5 text-center">{privateError}</p>}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>

        {/* Country dropdown portal */}
        {showCountryDrop && user?.isVip && createPortal(
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15 }}
              style={{
                position: 'fixed',
                bottom: countryDropPos.bottom,
                left: countryDropPos.left,
                width: countryDropPos.width,
                zIndex: 9999,
                background: '#0c0c1a',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 14,
                boxShadow: '0 20px 60px rgba(0,0,0,0.8)',
                overflow: 'hidden',
              }}
            >
              <div style={{ padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                <input
                  autoFocus
                  value={countrySearch}
                  onChange={e => setCountrySearch(e.target.value)}
                  placeholder="Search country…"
                  style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: 'none', outline: 'none', color: 'white', fontSize: '12px', padding: '10px 12px', borderRadius: 8 }}
                  className="placeholder-[rgba(120,120,140,0.5)]"
                />
              </div>
              <div style={{ overflowY: 'auto', maxHeight: 240 }}>
                {!countrySearch && (
                  <button
                    onClick={() => { setFilterCountry(''); setShowCountryDrop(false); setCountrySearch('') }}
                    className="w-full text-left text-xs"
                    style={{ padding: '8px 12px', color: 'rgba(160,160,180,0.6)', background: 'transparent', border: 'none', cursor: 'pointer' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(37,99,235,0.15)'; e.currentTarget.style.color = 'white' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(160,160,180,0.6)' }}
                  >
                    ðŸŒ Any country
                  </button>
                )}
                {COUNTRIES.filter(c => c.toLowerCase().includes(countrySearch.toLowerCase())).map((c) => (
                  <button
                    key={c}
                    onClick={() => { setFilterCountry(c); setShowCountryDrop(false); setCountrySearch('') }}
                    className="w-full text-left text-xs"
                    style={{ padding: '8px 12px', color: 'rgba(200,200,220,0.75)', background: 'transparent', border: 'none', cursor: 'pointer' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(37,99,235,0.15)'; e.currentTarget.style.color = 'white' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(200,200,220,0.75)' }}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </motion.div>
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


      {/* ══════════════ DESKTOP LAYOUT — Premium 2-Column Hero ══════════════ */}
      <section className="hidden lg:flex flex-col relative z-10 overflow-hidden" style={{ height: 'calc(100vh - 108px)', minHeight: '700px', background: '#080c14' }}>

        {/* Unified blue atmospheric lighting */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 72% 42%, rgba(37,99,235,0.18) 0%, rgba(14,165,233,0.05) 40%, transparent 62%)' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 88% 85%, rgba(14,165,233,0.07) 0%, transparent 40%)' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 12% 58%, rgba(37,99,235,0.06) 0%, transparent 48%)' }} />
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, transparent 0%, rgba(37,99,235,0.28) 35%, rgba(14,165,233,0.18) 58%, transparent 100%)' }} />
        </div>

        {/* ── 2-column main area ── */}
        <div className="relative flex flex-1 min-h-0 z-10">

          {/* LEFT: Content */}
          <motion.div
            className="flex flex-col justify-center flex-shrink-0"
            style={{ width: '44%', paddingLeft: '5%', paddingRight: '3%' }}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}>

            {/* Live badge */}
            <div className="inline-flex items-center gap-2 mb-5 px-3.5 py-1.5 rounded-full w-fit"
              style={{ background: 'rgba(14,165,233,0.08)', border: '1px solid rgba(14,165,233,0.2)', boxShadow: '0 0 16px rgba(14,165,233,0.08)' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 online-pulse" />
              <span className="text-[9.5px] font-black tracking-[0.2em] uppercase" style={{ color: '#7dd3fc' }}>Live · Random · Real</span>
            </div>

            {/* Headline */}
            <h1 className="font-black text-white leading-[1.04] mb-3" style={{ fontSize: 'clamp(2rem, 2.6vw, 3.2rem)', letterSpacing: '-0.038em' }}>
              Meet someone real.<br />
              <span style={{ background: 'linear-gradient(125deg, #60a5fa 0%, #0ea5e9 65%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                Share authentic vibes.
              </span>
            </h1>

            {/* Subtext */}
            <p className="mb-4 text-[13.5px] leading-[1.6]" style={{ color: 'rgba(148,163,184,0.6)', maxWidth: '320px' }}>
              Meet real people from around the world. Instantly.
            </p>

            {/* Avatars + online count */}
            <div className="flex items-center gap-3 mb-5">
              <div className="flex">
                {AVATARS.map((n, i) => (
                  <img key={n} src={`https://i.pravatar.cc/48?img=${n}`} alt=""
                    className="w-7 h-7 rounded-full"
                    style={{ border: '2px solid #080c14', marginLeft: i === 0 ? '0' : '-8px', zIndex: AVATARS.length - i, position: 'relative' }} />
                ))}
              </div>
              <div className="flex items-center gap-1.5">
                <motion.span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0"
                  animate={{ scale: [1, 1.5, 1], opacity: [1, 0.4, 1] }}
                  transition={{ duration: 2.2, repeat: Infinity }} />
                <span className="text-[13px] font-semibold text-white">{onlineCount >= 20 ? onlineCount.toLocaleString() : '—'}</span>
                <span className="text-[13px]" style={{ color: 'rgba(148,163,184,0.45)' }}>online now</span>
              </div>
            </div>

            {/* Primary CTA — deep blue */}
            <motion.button
              onClick={startVybing}
              whileHover={{ scale: 1.012, boxShadow: '0 0 0 1px rgba(96,165,250,0.35), 0 0 36px rgba(37,99,235,0.45), 0 8px 28px rgba(0,0,0,0.42), inset 0 1px 0 rgba(255,255,255,0.22)' }}
              whileTap={{ scale: 0.97 }}
              className="relative flex items-center justify-center gap-2.5 py-[13px] rounded-[14px] text-white mb-2.5 w-full overflow-hidden"
              style={{
                background: 'linear-gradient(140deg, #1e3a8a 0%, #2563eb 50%, #0891b2 100%)',
                boxShadow: '0 0 0 1px rgba(37,99,235,0.4), 0 0 24px rgba(37,99,235,0.32), 0 4px 20px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.16), inset 0 -1px 0 rgba(0,0,0,0.18)',
                fontSize: '14.5px', fontWeight: '600', letterSpacing: '0.01em',
              }}>
              <span className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.1) 0%, transparent 55%)' }} />
              <span className="absolute inset-x-0 top-0 h-px" style={{ background: 'linear-gradient(90deg, transparent 15%, rgba(255,255,255,0.38) 50%, transparent 85%)' }} />
              <Video size={15} strokeWidth={2.2} />
              Start Video Chat
            </motion.button>

            {/* Secondary CTA — dark blue glass */}
            <motion.button
              onClick={() => { streamRef.current?.getTracks().forEach(t => t.stop()); streamRef.current = null; setCameraOn(false); navigate('/chat', { state: { mode, filterGender: filterGender === 'both' ? null : filterGender, filterCountry, noCam: true } }) }}
              whileHover={{ scale: 1.01, borderColor: 'rgba(37,99,235,0.28)', boxShadow: '0 0 14px rgba(37,99,235,0.1)' }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center justify-center gap-2 py-[11px] rounded-[14px] mb-4 w-full"
              style={{
                background: 'rgba(255,255,255,0.03)',
                backdropFilter: 'blur(24px)',
                border: '1px solid rgba(255,255,255,0.07)',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)',
                color: 'rgba(148,163,184,0.6)',
                fontSize: '13.5px', fontWeight: '500', letterSpacing: '0.01em',
              }}>
              <VideoOff size={14} strokeWidth={1.8} />
              Start Without Camera
            </motion.button>

            {/* ── Premium horizontal filter bar ── */}
            <div className="rounded-[14px] overflow-hidden"
              style={{
                background: 'rgba(8,12,22,0.9)',
                backdropFilter: 'blur(48px) saturate(1.8)',
                border: '1px solid rgba(37,99,235,0.2)',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05), 0 0 20px rgba(37,99,235,0.08), 0 4px 24px rgba(0,0,0,0.5)',
              }}>
              <div className="flex items-stretch">

                {/* Gender */}
                <div className="flex flex-col gap-2 px-4 py-3.5 flex-shrink-0">
                  <span className="text-[8.5px] font-bold uppercase tracking-[0.2em]" style={{ color: 'rgba(96,165,250,0.4)' }}>Gender</span>
                  <div className="flex gap-1.5">
                    {[['Both','both'],['Male','male'],['Female','female']].map(([label, val]) => (
                      <motion.button key={val}
                        onClick={() => handleGender(val)}
                        whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.94 }}
                        className="px-3.5 py-1.5 rounded-[9px] text-[12px] font-medium transition-all"
                        style={filterGender === val ? {
                          background: 'rgba(37,99,235,0.28)',
                          border: '1px solid rgba(59,130,246,0.48)',
                          color: '#93c5fd',
                          boxShadow: '0 0 12px rgba(37,99,235,0.2), inset 0 1px 0 rgba(255,255,255,0.08)',
                        } : {
                          background: 'rgba(255,255,255,0.04)',
                          border: '1px solid rgba(255,255,255,0.08)',
                          color: 'rgba(148,163,184,0.5)',
                        }}>
                        {label}
                      </motion.button>
                    ))}
                  </div>
                </div>

                <div style={{ width: '1px', alignSelf: 'stretch', margin: '10px 0', background: 'rgba(37,99,235,0.15)', flexShrink: 0 }} />

                {/* Mode */}
                <div className="flex flex-col gap-2 px-4 py-3.5 flex-shrink-0">
                  <span className="text-[8.5px] font-bold uppercase tracking-[0.2em]" style={{ color: 'rgba(96,165,250,0.4)' }}>Mode</span>
                  <div className="flex gap-1.5">
                    {[['Solo','solo'],['Duo','squad'],['Private','private']].map(([label, val]) => (
                      <motion.button key={val}
                        onClick={() => setMode(val)}
                        whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.94 }}
                        className="px-3.5 py-1.5 rounded-[9px] text-[12px] font-medium transition-all"
                        style={mode === val ? {
                          background: 'rgba(37,99,235,0.28)',
                          border: '1px solid rgba(59,130,246,0.48)',
                          color: '#93c5fd',
                          boxShadow: '0 0 12px rgba(37,99,235,0.2), inset 0 1px 0 rgba(255,255,255,0.08)',
                        } : {
                          background: 'rgba(255,255,255,0.04)',
                          border: '1px solid rgba(255,255,255,0.08)',
                          color: 'rgba(148,163,184,0.5)',
                        }}>
                        {label}
                      </motion.button>
                    ))}
                  </div>
                </div>

                <div style={{ width: '1px', alignSelf: 'stretch', margin: '10px 0', background: 'rgba(37,99,235,0.15)', flexShrink: 0 }} />

                {/* Country */}
                <motion.button
                  ref={countryBtnRef}
                  onClick={handleCountryClick}
                  whileHover={{ background: 'rgba(37,99,235,0.06)' }}
                  whileTap={{ scale: 0.97 }}
                  className="flex flex-col gap-1.5 px-3.5 py-3 flex-1 min-w-0 transition-colors">
                  <span className="text-[8.5px] font-bold uppercase tracking-[0.2em]" style={{ color: 'rgba(96,165,250,0.4)' }}>Country</span>
                  <div className="flex items-center gap-1.5">
                    {user?.isVip
                      ? <Globe size={11} style={{ color: 'rgba(96,165,250,0.6)' }} />
                      : <Lock size={11} style={{ color: 'rgba(96,165,250,0.4)' }} />}
                    <span className="text-[12px] font-medium truncate" style={{ color: filterCountry ? 'rgba(255,255,255,0.8)' : 'rgba(148,163,184,0.45)' }}>
                      {filterCountry || 'Any country'}
                    </span>
                    <ChevronDown size={10} style={{ color: 'rgba(148,163,184,0.3)', flexShrink: 0, transition: 'transform 200ms', transform: showCountryDrop ? 'rotate(180deg)' : 'rotate(0deg)' }} />
                  </div>
                </motion.button>

                <div style={{ width: '1px', alignSelf: 'stretch', margin: '10px 0', background: 'rgba(37,99,235,0.15)', flexShrink: 0 }} />

                {/* Settings */}
                <motion.div
                  whileHover={{ scale: 1.1, background: 'rgba(37,99,235,0.08)' }}
                  whileTap={{ scale: 0.93 }}
                  className="flex items-center justify-center px-3.5 cursor-pointer transition-colors rounded-r-[14px]">
                  <SlidersHorizontal size={13} style={{ color: 'rgba(96,165,250,0.45)' }} />
                </motion.div>

              </div>
            </div>

            {/* Duo room panel */}
            <AnimatePresence initial={false}>
              {mode === 'squad' && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.22 }} className="overflow-hidden">
                  <div className="mt-3 rounded-xl p-3 space-y-2.5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div className="flex items-center justify-between">
                      <p className="text-[8.5px] font-bold uppercase tracking-widest" style={{ color: 'rgba(145,145,170,0.35)' }}>My Duo</p>
                      <div className="flex items-center gap-2">
                        {squadReady && <span className="text-[7px] px-1.5 py-0.5 rounded-full bg-green-500/15 text-green-400 border border-green-500/20 font-bold">Ready</span>}
                        {squad && timeLeft != null && <span className="text-[7px] text-gray-600 font-mono">{fmtTime(timeLeft)}</span>}
                        {squad && <button onClick={leaveSquad} className="w-3.5 h-3.5 flex items-center justify-center rounded text-gray-600 hover:text-white"><XIcon size={9} /></button>}
                      </div>
                    </div>
                    {!squad ? (
                      <>
                        {squadError && <p className="text-red-400 text-[9px] text-center">{squadError}</p>}
                        <button onClick={createSquad} disabled={squadLoading || !isConnected}
                          className="w-full py-2 rounded-lg text-white font-bold text-[10px] flex items-center justify-center gap-1 disabled:opacity-60"
                          style={{ background: 'linear-gradient(140deg, #1e3a8a 0%, #2563eb 60%, #0891b2 100%)' }}>
                          {squadLoading ? <><Loader2 size={9} className="animate-spin" /> Creating…</> : <><UserPlus size={9} /> Create Duo Room</>}
                        </button>
                      </>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex gap-1.5">
                          {squad.members.map((m) => (
                            <div key={m.socketId} className="flex-1 flex flex-col items-center gap-0.5 p-1.5 rounded-lg relative group" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                              <div className="w-6 h-6 rounded-full flex items-center justify-center font-black text-[8px]" style={{ background: 'rgba(37,99,235,0.3)', color: '#93c5fd' }}>{m.username?.[0]?.toUpperCase() || '?'}</div>
                              <span className="text-[7.5px] text-white font-semibold truncate w-full text-center">{m.username || 'User'}</span>
                              {m.socketId === squad.leaderId && <Crown size={6} className="text-yellow-400" />}
                              {squad.leaderId === socket?.id && m.socketId !== socket?.id && (
                                <button onClick={() => kickMember(m.socketId)} className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><XIcon size={6} /></button>
                              )}
                            </div>
                          ))}
                          {squad.members.length < 2 && (
                            <div className="flex-1 flex flex-col items-center gap-0.5 p-1.5 rounded-lg border border-dashed" style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.08)' }}>
                              <div className="w-6 h-6 rounded-full border border-dashed flex items-center justify-center" style={{ borderColor: 'rgba(255,255,255,0.12)' }}><UserPlus size={8} className="text-gray-600" /></div>
                              <span className="text-[7px] text-gray-600">Waiting…</span>
                            </div>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <div className="flex-1 px-2 py-1 rounded-lg text-[7.5px] text-gray-600 font-mono truncate select-all" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>{inviteUrl}</div>
                          <motion.button onClick={copyLink} whileTap={{ scale: 0.85 }} className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 ${copied ? 'bg-green-500/20 text-green-400' : 'text-gray-600 hover:text-white'}`} style={!copied ? { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' } : {}}>
                            <AnimatePresence mode="wait">
                              {copied ? <motion.span key="c" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}><Check size={9} /></motion.span> : <motion.span key="cp" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}><Copy size={9} /></motion.span>}
                            </AnimatePresence>
                          </motion.button>
                        </div>
                        {squadError && <p className="text-red-400 text-[9px] text-center">{squadError}</p>}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Private room panel */}
            <AnimatePresence initial={false}>
              {mode === 'private' && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.22 }} className="overflow-hidden">
                  <div className="mt-3 rounded-xl p-3 space-y-2.5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div className="flex items-center justify-between">
                      <p className="text-[8.5px] font-bold uppercase tracking-widest" style={{ color: 'rgba(145,145,170,0.35)' }}>Private Room</p>
                      {privateCode && <button onClick={() => { setPrivateCode(''); setPrivateError('') }} className="w-3.5 h-3.5 flex items-center justify-center rounded text-gray-600 hover:text-white"><XIcon size={9} /></button>}
                    </div>
                    {!privateCode ? (
                      <>
                        {privateError && <p className="text-red-400 text-[9px] text-center">{privateError}</p>}
                        <button onClick={createPrivateRoom} disabled={privateLoading || !isConnected}
                          className="w-full py-2 rounded-lg text-white font-bold text-[10px] flex items-center justify-center gap-1 disabled:opacity-60"
                          style={{ background: 'linear-gradient(140deg, #1e3a8a 0%, #2563eb 60%, #0891b2 100%)' }}>
                          {privateLoading ? <><Loader2 size={9} className="animate-spin" /> Creating…</> : <><Lock size={9} /> Create Private Room</>}
                        </button>
                      </>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex gap-1">
                          <div className="flex-1 px-2 py-1 rounded-lg text-[7.5px] text-gray-600 font-mono truncate select-all" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>{privateInviteUrl}</div>
                          <motion.button onClick={copyPrivateLink} whileTap={{ scale: 0.85 }} className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 ${privateCopied ? 'bg-green-500/20 text-green-400' : 'text-gray-600 hover:text-white'}`} style={!privateCopied ? { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' } : {}}>
                            <AnimatePresence mode="wait">
                              {privateCopied ? <motion.span key="c" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}><Check size={9} /></motion.span> : <motion.span key="cp" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}><Copy size={9} /></motion.span>}
                            </AnimatePresence>
                          </motion.button>
                        </div>
                        {privateError && <p className="text-red-400 text-[9px] text-center">{privateError}</p>}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

          </motion.div>

          {/* ── RIGHT: Camera panel ── */}
          <div className="flex-1 flex flex-col py-4 pr-5 pl-2 min-w-0">
            <motion.div
              className="relative flex-1 rounded-[24px] overflow-hidden"
              style={{
                background: '#070b12',
                boxShadow: 'inset 0 0 0 1px rgba(37,99,235,0.12), 0 0 60px rgba(37,99,235,0.05)',
              }}
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.08, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}>

              {/* Camera feed */}
              <video ref={videoRefDesktop} autoPlay muted playsInline
                className={`w-full h-full object-cover absolute inset-0 ${cameraOn && !cameraErr ? 'block' : 'hidden'}`}
                style={{ objectPosition: 'center top' }} />

              {/* Idle / error state — cinematic ambient */}
              {(!cameraOn || cameraErr) && (
                <div className="absolute inset-0">
                  {/* Blurred ambient background — someone is live feel */}
                  <img
                    src="https://i.pravatar.cc/600?img=47"
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover"
                    style={{ filter: 'blur(36px) saturate(1.3)', transform: 'scale(1.1)', opacity: 0.22 }}
                  />
                  {/* Deep dark base */}
                  <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(7,11,18,0.7) 0%, rgba(7,11,18,0.86) 100%)' }} />
                  {/* Blue cinematic glow */}
                  <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 48% 32%, rgba(37,99,235,0.24) 0%, rgba(14,165,233,0.07) 45%, transparent 68%)' }} />
                  <div className="absolute" style={{ bottom: '18%', left: '50%', transform: 'translateX(-50%)', width: 260, height: 100, background: 'radial-gradient(ellipse, rgba(37,99,235,0.14) 0%, transparent 70%)', filter: 'blur(36px)' }} />

                  {/* Live indicator — top right */}
                  {!cameraErr && (
                    <div className="absolute top-4 right-4 flex items-center gap-1.5 px-2.5 py-1 rounded-full z-20"
                      style={{ background: 'rgba(7,11,18,0.75)', border: '1px solid rgba(37,99,235,0.25)', backdropFilter: 'blur(16px)' }}>
                      <motion.span className="w-1.5 h-1.5 rounded-full bg-emerald-400"
                        animate={{ opacity: [1, 0.3, 1] }}
                        transition={{ duration: 2, repeat: Infinity }} />
                      <span className="text-[9px] font-black tracking-[0.18em] uppercase" style={{ color: '#7dd3fc' }}>Live</span>
                    </div>
                  )}

                  {/* Center content */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
                    {/* Blurred avatar silhouette */}
                    <div className="relative mb-5">
                      <div className="w-[68px] h-[68px] rounded-full overflow-hidden"
                        style={{ boxShadow: '0 0 0 2px rgba(37,99,235,0.3), 0 0 36px rgba(37,99,235,0.22)' }}>
                        <img src="https://i.pravatar.cc/128?img=47" alt="" className="w-full h-full object-cover"
                          style={{ filter: 'blur(5px) brightness(0.55)' }} />
                      </div>
                      <div className="absolute inset-0 rounded-full" style={{ background: 'radial-gradient(circle, rgba(37,99,235,0.28) 0%, transparent 70%)' }} />
                    </div>

                    <p className="font-semibold text-[13.5px] mb-1.5 tracking-[-0.01em]"
                      style={{ color: 'rgba(255,255,255,0.82)', textShadow: '0 0 24px rgba(37,99,235,0.5)' }}>
                      {cameraErr ? 'Camera access needed' : 'Enable your camera'}
                    </p>
                    <p className="text-[11px] mb-5 leading-relaxed text-center"
                      style={{ color: 'rgba(148,163,184,0.42)', maxWidth: '170px' }}>
                      {cameraErr ? (cameraErrMsg || 'Allow camera in browser settings') : 'Only you can see your preview'}
                    </p>

                    <motion.button onClick={enableCamera}
                      whileHover={{ scale: 1.04, boxShadow: '0 0 24px rgba(37,99,235,0.3)' }}
                      whileTap={{ scale: 0.96 }}
                      className="flex items-center gap-2 px-6 py-2.5 rounded-[10px] text-[12.5px] font-semibold"
                      style={{
                        background: 'rgba(37,99,235,0.14)',
                        border: '1px solid rgba(37,99,235,0.32)',
                        backdropFilter: 'blur(20px)',
                        color: '#93c5fd',
                        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08)',
                      }}>
                      {cameraErr ? <VideoOff size={13} /> : <Camera size={13} />}
                      {cameraErr ? 'Try Again' : 'Enable Camera'}
                    </motion.button>
                  </div>
                </div>
              )}

              {/* Camera-on overlays */}
              {cameraOn && !cameraErr && (
                <>
                  <div className="absolute inset-0 pointer-events-none"
                    style={{ background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.32) 100%)' }} />
                  <motion.button onClick={flipCamera} whileTap={{ scale: 0.9 }}
                    className="absolute top-4 right-4 w-9 h-9 rounded-xl flex items-center justify-center z-20"
                    style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <Camera size={15} className="text-white" />
                  </motion.button>
                </>
              )}

              {/* Vignette + edge */}
              <div className="absolute inset-0 pointer-events-none rounded-[24px] z-10"
                style={{ boxShadow: 'inset 0 0 60px rgba(0,0,0,0.38), inset 0 0 0 1px rgba(37,99,235,0.1)' }} />

            </motion.div>
          </div>

        </div>{/* end 2-column */}


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
          <p className="text-[11px] font-black tracking-[0.2em] uppercase mb-3" style={{ color: '#60a5fa' }}>Simple by design</p>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Up and chatting in{' '}
            <span style={{ background: 'linear-gradient(135deg, #2563eb 0%, #0ea5e9 55%, #38bdf8 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              30 seconds
            </span>
          </h2>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {[
            { num: '01', title: 'Open Your Camera', desc: 'Allow camera access when prompted. Takes two seconds. You can also start without a camera if you prefer.', icon: Camera, color: '#2563eb' },
            { num: '02', title: 'Set Your Preferences', desc: 'Choose who to match with — anyone, a specific gender, or people from your country. Free and paid options available.', icon: Globe, color: '#0ea5e9' },
            { num: '03', title: 'Meet Someone Now', desc: "You're matched in under 2 seconds. Don't vibe with who you got? Hit Skip and find someone new instantly.", icon: Video, color: '#38bdf8' },
          ].map(({ num, title, desc, icon: Icon, color }, i) => (
            <motion.div
              key={num}
              className="flex flex-col items-center text-center gap-4 p-6 rounded-2xl"
              style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' }}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              whileHover={{ y: -4, borderColor: `${color}40`, boxShadow: `0 12px 32px ${color}18` }}
            >
              <div className="relative">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: `${color}18`, border: `1px solid ${color}30` }}>
                  <Icon size={22} style={{ color }} />
                </div>
                <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black text-white" style={{ background: color }}>{i + 1}</span>
              </div>
              <div>
                <p className="text-white font-bold text-base mb-2">{title}</p>
                <p className="text-sm leading-relaxed" style={{ color: '#6b7280' }}>{desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ══════════════ MEMBERSHIP VALUE ══════════════ */}
      <section className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-10 pb-16 lg:pb-20">
        <div className="rounded-3xl overflow-hidden p-8 lg:p-12" style={{ background: 'linear-gradient(160deg, rgba(37,99,235,0.08) 0%, rgba(10,10,20,0) 100%)', border: '1px solid rgba(37,99,235,0.15)' }}>
          <div className="grid md:grid-cols-2 gap-8 lg:gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55 }}
            >
              <p className="text-[11px] font-black tracking-[0.2em] uppercase mb-3" style={{ color: '#60a5fa' }}>Membership</p>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-4">
                Match smarter with{' '}
                <span style={{ background: 'linear-gradient(135deg, #2563eb 0%, #0ea5e9 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>filters</span>
              </h2>
              <p className="text-sm leading-relaxed mb-6" style={{ color: '#6b7280' }}>
                Free gets you started. Membership gets you exactly who you want to meet — filter by gender, country, and more.
              </p>
              <motion.button
                onClick={() => navigate('/subscription')}
                whileHover={{ scale: 1.03, boxShadow: '0 0 28px rgba(37,99,235,0.38)' }}
                whileTap={{ scale: 0.97 }}
                className="px-6 py-3 rounded-xl text-white font-bold text-sm"
                style={{
                  background: 'linear-gradient(140deg, #1e3a8a 0%, #2563eb 55%, #0891b2 100%)',
                  boxShadow: '0 0 20px rgba(37,99,235,0.28), 0 4px 16px rgba(0,0,0,0.3)',
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
                { tier: 'Basic', price: '£6.99/mo', features: ['Filter by gender', 'Basic badge on profile'], borderColor: 'rgba(59,130,246,0.25)', bg: 'rgba(59,130,246,0.08)', labelColor: '#3b82f6', checkColor: '#3b82f6' },
                { tier: 'VIP', price: '£12.99/mo', features: ['Filter by gender', 'Filter by country', 'VIP badge on profile'], borderColor: 'rgba(245,158,11,0.25)', bg: 'rgba(245,158,11,0.07)', labelColor: '#f59e0b', checkColor: '#f59e0b' },
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
        <div className="rounded-3xl overflow-hidden" style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.05) 0%, rgba(37,99,235,0.06) 100%)', border: '1px solid rgba(245,158,11,0.14)' }}>
          <div className="p-8 lg:p-12">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.55 }}
              >
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-4" style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.22)' }}>
                  <DollarSign size={12} style={{ color: '#f59e0b' }} />
                  <span className="text-[11px] font-black tracking-[0.1em] uppercase" style={{ color: '#f59e0b' }}>For Creators</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-4">
                  Go live. Get paid.{' '}
                  <span style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Keep 70%.</span>
                </h2>
                <p className="text-sm leading-relaxed mb-6" style={{ color: '#6b7280' }}>
                  Turn your conversations into income. Viewers send gifts, you earn real money — no middlemen taking the bulk of your earnings.
                </p>
                <motion.button
                  onClick={() => navigate('/earn')}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2"
                  style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)', color: '#f59e0b' }}
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
                  { label: '70%', sub: 'Creator cut', color: '#f59e0b' },
                  { label: 'Live', sub: 'Real-time gifts', color: '#60a5fa' },
                  { label: '150+', sub: 'Countries', color: '#10b981' },
                  { label: 'Free', sub: 'To start', color: '#38bdf8' },
                ].map(({ label, sub, color }) => (
                  <div key={label} className="p-4 rounded-2xl text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <p className="text-2xl font-black mb-1" style={{ color }}>{label}</p>
                    <p className="text-[11px]" style={{ color: 'rgba(156,163,175,0.7)' }}>{sub}</p>
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
          <p className="text-[11px] font-black tracking-[0.2em] uppercase mb-3" style={{ color: '#10b981' }}>Trust & Safety</p>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Safe by{' '}
            <span style={{ background: 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>default</span>
          </h2>
        </motion.div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: Shield, title: '100% Anonymous', desc: 'No account needed. No data stored. Your sessions vanish the moment you leave.', color: '#2563eb' },
            { icon: Globe, title: 'Human Moderation', desc: 'Our moderation team reviews every report. Violations are acted on, not ignored.', color: '#3b82f6' },
            { icon: Video, title: 'One-Tap Report', desc: 'Tap the flag icon during any chat to report instantly and anonymously.', color: '#10b981' },
            { icon: Lock, title: 'Instant Bans', desc: 'Verified rule-breakers are suspended immediately — no second chances for serious violations.', color: '#0ea5e9' },
          ].map(({ icon: Icon, title, desc, color }, i) => (
            <motion.div
              key={title}
              className="p-5 rounded-2xl flex flex-col gap-3"
              style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.05)' }}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.07, duration: 0.45 }}
              whileHover={{ y: -3, borderColor: `${color}40`, boxShadow: `0 8px 28px ${color}18` }}
            >
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${color}18`, border: `1px solid ${color}28` }}>
                <Icon size={18} style={{ color }} />
              </div>
              <div>
                <p className="text-white font-bold text-sm mb-1">{title}</p>
                <p className="text-[12px] leading-relaxed" style={{ color: '#6b7280' }}>{desc}</p>
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
            <p className="text-[11px] font-black tracking-[0.2em] text-vybe-purple-light uppercase mb-3">
              Got questions?
            </p>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Frequently Asked{' '}
              <span className="text-purple-gradient">Questions</span>
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
                    background: isOpen ? 'linear-gradient(160deg,#0e0e1d 0%,#0b0b19 100%)' : 'rgba(255,255,255,0.03)',
                    border: isOpen ? '1px solid rgba(27,98,245,0.3)' : '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  <button
                    onClick={() => setFaqOpen(isOpen ? null : i)}
                    className="w-full flex items-center justify-between px-5 py-4 text-left gap-4"
                  >
                    <span className={`font-semibold text-sm sm:text-[15px] transition-colors ${isOpen ? 'text-white' : 'text-gray-400'}`}>
                      {item.q}
                    </span>
                    <span
                      className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
                        isOpen ? 'bg-vybe-purple/20 text-vybe-purple-light' : 'text-vybe-muted'
                      }`}
                      style={!isOpen ? { background: 'rgba(255,255,255,0.05)' } : {}}
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
                        <p className="px-5 pb-5 text-vybe-muted text-sm leading-relaxed">{item.a}</p>
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
