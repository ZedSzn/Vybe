import { useState, useEffect, useRef, useCallback } from 'react'
import ProfilePill from '../components/ProfilePill'
import { GiftIcon, GIFTS, GIFT_TIERS } from '../components/GiftIcon'
import GiftFireworks from '../components/GiftFireworks'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence, useMotionValue, animate as fmAnimate } from 'framer-motion'
import {
  SkipForward, PhoneOff, Flag, Send, Mic, MicOff, Video, VideoOff,
  MessageSquare, X, ChevronRight, Shield, ShieldCheck, Loader2, Ban, UserX, UserPlus, Camera, Crown, Zap, Edit2,
  ChevronDown, ChevronUp, Lock, Globe, Gift,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { io } from 'socket.io-client'
import SimplePeer from 'simple-peer'
import axios from 'axios'
import Navbar from '../components/Navbar'
import { useAuth } from '../context/AuthContext'
import { useSocket } from '../context/SocketContext'
import VybeCoin from '../components/VybeCoin'
import VybeGlobe from '../components/VybeGlobe'
import { playClick } from '../utils/sounds'

// Glowing "X Gifted" chip — shown next to a person's pill once you've gifted them.
// Remount it (key={amount}) to replay the pop animation on each new gift.
function GiftChip({ amount, compact }) {
  return (
    <motion.div
      initial={{ scale: 0.6, opacity: 0 }}
      animate={{
        scale: [0.6, 1.18, 1],
        opacity: 1,
        boxShadow: [
          '0 0 8px rgba(0,212,255,0.38), 0 0 18px rgba(0,212,255,0.22)',
          '0 0 16px rgba(0,212,255,0.7), 0 0 34px rgba(0,212,255,0.42)',
          '0 0 8px rgba(0,212,255,0.38), 0 0 18px rgba(0,212,255,0.22)',
        ],
      }}
      transition={{
        scale:     { duration: 0.5, ease: [0.34, 1.56, 0.64, 1] },
        opacity:   { duration: 0.3 },
        boxShadow: { duration: 2.4, repeat: Infinity, ease: 'easeInOut' },
      }}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: compact ? 4 : 6,
        padding: compact ? '3px 9px 3px 3px' : '4px 12px 4px 4px', borderRadius: 50,
        background: 'rgba(6,10,22,0.9)',
        border: '1px solid rgba(0,212,255,0.6)',
        fontFamily: "'Sora', system-ui, sans-serif",
        flexShrink: 0,
      }}
    >
      <div style={{
        width: compact ? 18 : 24, height: compact ? 18 : 24, borderRadius: '50%', flexShrink: 0,
        background: 'rgba(0,212,255,0.07)',
        border: '1px solid rgba(0,212,255,0.55)',
        boxShadow: '0 0 6px rgba(0,212,255,0.45), inset 0 0 5px rgba(0,212,255,0.16)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Gift size={compact ? 10 : 13} style={{ color: '#00D4FF', filter: 'drop-shadow(0 0 2px rgba(0,212,255,0.9))' }} />
      </div>
      <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 4, whiteSpace: 'nowrap' }}>
        <span style={{
          color: '#00D4FF', fontSize: compact ? 11 : 12, fontWeight: 800,
          fontVariantNumeric: 'tabular-nums', letterSpacing: '0.01em',
          textShadow: '0 0 6px rgba(0,212,255,0.6)',
        }}>
          {amount.toLocaleString()}
        </span>
        {!compact && <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 11, fontWeight: 600 }}>Gifted</span>}
      </span>
    </motion.div>
  )
}

// Uncontrolled input — reads DOM value directly so React re-renders never interfere
function FloatingChat({ messages, partnerMessages, messagesEndRef, onSend, status, chatTab, onTabChange, unread, partnerUnread, showPartnerTab }) {
  const inputRef = useRef(null)
  const activeMessages = chatTab === 'partner' ? partnerMessages : messages

  const send = () => {
    const val = inputRef.current?.value?.trim()
    if (!val || status !== 'matched') return
    onSend(val, chatTab)
    if (inputRef.current) inputRef.current.value = ''
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      send()
    }
  }

  return (
    <>
      {showPartnerTab && (
        <div style={{ flexShrink: 0, display: 'flex', gap: 4, padding: '8px 10px 0' }}>
          {[
            { id: 'all',     label: 'All',     count: unread },
            { id: 'partner', label: 'Partner', count: partnerUnread },
          ].map((t) => {
            const active = chatTab === t.id
            return (
              <button key={t.id} type="button" onClick={() => onTabChange(t.id)}
                style={{ flex: 1, position: 'relative', padding: '6px 10px', borderRadius: 12, border: 'none', cursor: 'pointer',
                  background: active ? 'rgba(0,212,255,0.16)' : 'rgba(255,255,255,0.04)',
                  color: active ? '#7df0ff' : 'rgba(255,255,255,0.6)',
                  fontSize: 11, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                {t.label}
                {t.count > 0 && !active && (
                  <span style={{ position: 'absolute', top: 4, right: 8, width: 7, height: 7, borderRadius: '50%', background: '#00D4FF', boxShadow: '0 0 6px rgba(0,212,255,0.7)' }} />
                )}
              </button>
            )
          })}
        </div>
      )}
      <div style={{ overflowY: 'auto', padding: '10px 12px 4px', display: 'flex', flexDirection: 'column', gap: 6, minHeight: 0 }}>
        {activeMessages.length === 0 && chatTab === 'partner' && (
          <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.35)', fontSize: 11, padding: '12px 4px', lineHeight: 1.5 }}>
            Only your duo partner sees these messages.<br />Coordinate freely.
          </div>
        )}
        {activeMessages.map((msg, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: msg.from === 'me' ? 'flex-end' : 'flex-start' }}>
            <div style={{
              padding: '7px 11px', fontSize: 13, lineHeight: 1.45, color: 'white', maxWidth: '75%', wordBreak: 'break-word',
              ...(msg.from === 'me'
                ? { background: 'rgba(0,212,255,0.15)', border: '1px solid rgba(0,212,255,0.2)', borderRadius: '18px 18px 4px 18px' }
                : { background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '18px 18px 18px 4px' }
              ),
            }}>{msg.text}</div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div style={{ flexShrink: 0, padding: '6px 10px 10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: chatTab === 'partner' ? '1px solid rgba(0,212,255,0.3)' : '1px solid rgba(255,255,255,0.12)', borderRadius: 50, padding: '5px 6px 5px 14px', gap: 8 }}>
          <input
            ref={inputRef}
            type="text"
            className="chat-input"
            defaultValue=""
            onKeyDown={handleKeyDown}
            placeholder={chatTab === 'partner' ? 'Message your partner…' : 'Say something...'}
            disabled={status !== 'matched'}
            style={{ flex: 1, background: 'transparent', color: 'white', fontSize: 13, border: 'none', outline: 'none', boxShadow: 'none', opacity: status !== 'matched' ? 0.4 : 1 }}
          />
          <button
            onClick={send}
            style={{ width: 30, height: 30, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#00D4FF', color: '#000', border: 'none', cursor: 'pointer', flexShrink: 0, opacity: status !== 'matched' ? 0.4 : 1 }}
          >
            <Send size={12} />
          </button>
        </div>
      </div>
    </>
  )
}

// Reads the RMS mic level from a stream every frame and returns a 0..1
// number. Lets the UI show a "I can hear you" pulse so users can verify
// their microphone actually works.
function useMicLevel(streamRef, enabled) {
  const [level, setLevel] = useState(0)
  useEffect(() => {
    if (!enabled) { setLevel(0); return }
    let audioCtx, source, analyser, raf
    let cancelled = false
    let retries = 0
    const setup = () => {
      if (cancelled) return
      const stream = streamRef.current
      const track  = stream?.getAudioTracks?.()[0]
      if (!track) {
        // Stream may not be ready yet — try again shortly.
        if (retries++ < 30) setTimeout(setup, 200)
        return
      }
      try {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)()
        if (audioCtx.state === 'suspended') audioCtx.resume().catch(() => {})
        source   = audioCtx.createMediaStreamSource(stream)
        analyser = audioCtx.createAnalyser()
        analyser.fftSize = 256
        analyser.smoothingTimeConstant = 0.55
        source.connect(analyser)
        const buf = new Uint8Array(analyser.frequencyBinCount)
        const tick = () => {
          if (cancelled) return
          analyser.getByteTimeDomainData(buf)
          let sum = 0
          for (let i = 0; i < buf.length; i++) {
            const v = (buf[i] - 128) / 128
            sum += v * v
          }
          // Boost the RMS a little so normal-voice volume gives a clear visual
          setLevel(Math.min(1, Math.sqrt(sum / buf.length) * 5))
          raf = requestAnimationFrame(tick)
        }
        tick()
      } catch {}
    }
    setup()
    return () => {
      cancelled = true
      cancelAnimationFrame(raf)
      try { source?.disconnect() } catch {}
      try { audioCtx?.close()    } catch {}
    }
  }, [enabled]) // streamRef is stable from useRef
  return level
}

// Concentric cyan rings that expand from the avatar as the mic picks up
// audio — gives an obvious visual confirmation that the mic works.
function MicSpikes({ level = 0, size = 52 }) {
  if (level < 0.03) return null
  return (
    <>
      {[0, 1, 2].map((i) => {
        const baseScale = 1 + i * 0.18
        const grow      = level * (0.5 + i * 0.4)
        return (
          <div
            key={i}
            style={{
              position: 'absolute', inset: 0,
              width: size, height: size,
              borderRadius: '50%',
              border: '2px solid rgba(0,212,255,0.6)',
              transform: `scale(${baseScale + grow})`,
              opacity: Math.max(0, 0.6 - i * 0.18),
              transition: 'transform 75ms linear, opacity 160ms ease-out',
              willChange: 'transform, opacity',
              pointerEvents: 'none',
            }}
          />
        )
      })}
    </>
  )
}

// "Camera off" placeholder — your own tile when the camera is off or absent.
// Mirrors the partner tile's connecting state so the two read as siblings.
function CameraOffView({ user, micLevel = 0 }) {
  return <TilePlaceholder avatarUrl={user?.avatar} name={user?.username || 'Y'} micLevel={micLevel} />
}

// Centered avatar placeholder for any grid tile without a video stream —
// used for the camera-off self tile and for camera-off strangers/partner.
// Default size 64 matches the user's own avatar preview on MainPage so the
// avatar feels consistent everywhere in the app.
function TilePlaceholder({ avatarUrl, name, label = 'Camera off', size = 64, hideLabel = true, micLevel = 0 }) {
  // Anything 60px+ gets the layered cyan glow ring to match MainPage's preview.
  const big       = size >= 60
  const initial   = name?.[0]?.toUpperCase() || '?'
  const ringStyle = big
    ? { border: '2px solid rgba(0,212,255,0.35)', boxShadow: '0 0 0 10px rgba(0,212,255,0.06), 0 0 48px rgba(0,212,255,0.12)' }
    : { border: '2px solid rgba(0,212,255,0.35)' }
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2" style={{ zIndex: 5 }}>
      <div style={{ position: 'relative', width: size, height: size }}>
        {avatarUrl ? (
          <img src={avatarUrl} alt="" style={{ position: 'relative', width: size, height: size, borderRadius: '50%', objectFit: 'cover', ...ringStyle }} />
        ) : (
          <div style={{ position: 'relative', width: size, height: size, borderRadius: '50%', background: 'linear-gradient(135deg, rgba(0,212,255,0.2), rgba(124,58,237,0.2))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: Math.max(14, Math.round(size * 0.4)), fontWeight: 900, color: '#00D4FF', ...ringStyle }}>
            {initial}
          </div>
        )}
      </div>
      {!hideLabel && <p className="text-[10px] font-semibold" style={{ color: 'rgba(160,170,190,0.7)' }}>{label}</p>}
    </div>
  )
}

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

const CHAT_COUNTRIES = [
  'Afghanistan','Albania','Algeria','Angola','Argentina','Armenia','Australia','Austria','Azerbaijan',
  'Bahrain','Bangladesh','Belgium','Bolivia','Bosnia & Herzegovina','Brazil','Bulgaria',
  'Cambodia','Cameroon','Canada','Chile','China','Colombia','Congo','Costa Rica','Croatia','Cuba',
  'Czech Republic','Denmark','Dominican Republic','Ecuador','Egypt','El Salvador','Ethiopia',
  'Finland','France','Georgia','Germany','Ghana','Greece','Guatemala','Haiti','Honduras',
  'Hong Kong','Hungary','Iceland','India','Indonesia','Iran','Iraq','Ireland','Israel','Italy',
  'Jamaica','Japan','Jordan','Kazakhstan','Kenya','Kuwait','Kyrgyzstan','Laos','Lebanon',
  'Libya','Lithuania','Malaysia','Mali','Mexico','Moldova','Mongolia','Morocco','Mozambique',
  'Myanmar','Nepal','Netherlands','New Zealand','Nigeria','North Macedonia','Norway','Oman',
  'Pakistan','Panama','Papua New Guinea','Paraguay','Peru','Philippines','Poland','Portugal',
  'Puerto Rico','Qatar','Romania','Russia','Rwanda','Saudi Arabia','Senegal','Serbia',
  'Sierra Leone','Singapore','Slovakia','Somalia','South Africa','South Korea','South Sudan',
  'Spain','Sri Lanka','Sudan','Sweden','Switzerland','Syria','Taiwan','Tajikistan','Tanzania',
  'Thailand','Tunisia','Turkey','Turkmenistan','Uganda','Ukraine','United Arab Emirates',
  'United Kingdom','United States','Uruguay','Uzbekistan','Venezuela','Vietnam','Yemen',
  'Zambia','Zimbabwe',
]

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
  const { user, updateUser } = useAuth()
  const { myCountry } = useSocket()
  // Custom image shown in place of the camera when no webcam is available.
  const camBgImage  = user?.cameraBackground === 'custom' ? (user?.cameraBackgroundImage || null) : null

  const prefs = location.state || { mode: 'solo', filterGender: null, filterCountry: '' }

  const [status,           setStatus]           = useState('init')
  const [banReason,        setBanReason]        = useState('')
  const [banType,          setBanType]          = useState(null)
  const [banExpiresAt,     setBanExpiresAt]     = useState(null)
  const [unbanLoading,     setUnbanLoading]     = useState(false)
  const [messages,         setMessages]         = useState([])
  const [partnerMessages,  setPartnerMessages]  = useState([]) // duo-only side channel — never seen by opponents
  const [chatTab,          setChatTab]          = useState('all') // 'all' (room chat) | 'partner' (duo only)
  const [partnerUnread,    setPartnerUnread]    = useState(0)
  const [showChat,         setShowChat]         = useState(false)
  const [isMuted,          setIsMuted]          = useState(false)
  const [uiHidden,         setUiHidden]         = useState(false)
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
  const [botPeerIds,       setBotPeerIds]       = useState(null) // dev-bot match: { mates, opponents } — bots have no streams
  const [persistentMateId, setPersistentMateId] = useState(null) // squad mate socket ID, persists through re-searches
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
  const [blockLoading,   setBlockLoading]     = useState(false)
  const [friendReqSent,  setFriendReqSent]    = useState(false)
  const [friendReqLoad,  setFriendReqLoad]    = useState(false)
  const [coins,          setCoins]            = useState(user?.coins ?? 0)
  const [cashableCoins,  setCashableCoins]    = useState(user?.cashableCoins ?? 0)
  const [tipFeedback,    setTipFeedback]      = useState(null) // shared feedback toast (errors etc.)
  const [giftPopup,      setGiftPopup]        = useState(null) // brief gift card over the chat panel
  const [giftsReceived,  setGiftsReceived]    = useState(0)    // cumulative coins gifted to me this match
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
  const [giftAnimations,   setGiftAnimations]   = useState([])   // [{ id, giftId, target: 'stranger'|'partner' }]
  // Gift events now surface as chat messages instead of per-tile chips,
  // so this stays empty — the chip JSX is kept dormant for easy revival.
  const [giftedBySocket]   = useState({})
  const [showGift,         setShowGift]         = useState(false) // "Send Coins" modal open
  const [giftRecipient,    setGiftRecipient]    = useState(null) // socketId of the chosen gift recipient
  const [selectedGiftId,   setSelectedGiftId]   = useState(null)
  const [customAmount,     setCustomAmount]     = useState('')
  const [giftSending,      setGiftSending]      = useState(false)
  const [partnerCountry,   setPartnerCountry]   = useState(null)
  const [chatFilterGender,  setChatFilterGender]  = useState(prefs.filterGender === 'male' || prefs.filterGender === 'female' ? prefs.filterGender : 'both')
  const [chatFilterCountry, setChatFilterCountry] = useState(prefs.filterCountry || '')
  const [showGenderDrop,    setShowGenderDrop]    = useState(false)
  const [showChatCountryDrop, setShowChatCountryDrop] = useState(false)
  const [chatCountrySearch, setChatCountrySearch] = useState('')

  const searchTimerRef   = useRef(null)
  const searchTextTimer  = useRef(null)
  const reconnectTimer   = useRef(null)
  const matchFlashTimer  = useRef(null)
  const statusRef        = useRef(status)
  const chatTabRef       = useRef('all')
  const showChatRef      = useRef(false)

  const SEARCH_TEXTS = [
    'Finding your next Vybe',
    'Connecting you',
    'Almost there',
    'Looking for the perfect match',
    'Hang tight',
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
  const squadMatesRef   = useRef([])           // persists through re-renders for use in callbacks
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
      axios.get('/api/me/balance').then(({ data }) => {
        setCoins(data.coins ?? 0)
        setCashableCoins(data.cashableCoins ?? 0)
      }).catch(() => {
        if (user?.coins !== undefined) setCoins(user.coins)
      })
    }
  }, []) // eslint-disable-line

  // Keep the global user balance in sync so the navbar reflects spends
  // (gifts, boosts) the instant they happen — not only after leaving the page.
  useEffect(() => {
    if (user && user.coins !== coins) updateUser({ ...user, coins })
  }, [coins]) // eslint-disable-line

  useEffect(() => { prefsRef.current  = prefs   }, [prefs])
  useEffect(() => { partnerSockRef.current = partnerSock }, [partnerSock])
  useEffect(() => { partnerUidRef.current  = partnerUid  }, [partnerUid])
  useEffect(() => { statusRef.current = status }, [status])
  useEffect(() => { squadMatesRef.current = squadMates }, [squadMates])
  useEffect(() => { chatTabRef.current = chatTab }, [chatTab])
  useEffect(() => { showChatRef.current = showChat }, [showChat])

  // Gift popup auto-dismiss — owned by React so the timer is bound to the
  // popup state itself. If the popup is shown, this fires after 4.2s; if the
  // component unmounts, hot-reloads, or a new gift arrives mid-display, the
  // cleanup clears the timer. Previously this lived inside the socket handler
  // and could leak (StrictMode double-mount, background-tab throttling), so a
  // sender's popup would sometimes stick on screen indefinitely.
  useEffect(() => {
    if (!giftPopup) return
    const t = setTimeout(() => setGiftPopup(null), 4200)
    return () => clearTimeout(t)
  }, [giftPopup])

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
      setPartnerMessages([])
      setPartnerUnread(0)
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
    setPersistentMateId(null)
    setPartnerSock(null)
    setPartnerUid(null)
    setPartnerAvatar(null)
    setPartnerIsVip(false)
    setPartnerIsPremium(false)
    setPartnerEmailVerified(false)
    setPartnerCountry(null)
    setGiftAnimations([])
  }

  // Destroy only opponent peers — preserves squad mate peer/stream during re-searching
  const destroyOpponentPeers = () => {
    const mates = new Set(squadMatesRef.current)
    Object.entries(peersRef.current).forEach(([sid, p]) => {
      if (!mates.has(sid)) { try { p.destroy() } catch {}; delete peersRef.current[sid] }
    })
    setRemoteStreams((prev) => {
      const next = {}
      mates.forEach((id) => { if (prev[id]) next[id] = prev[id] })
      return next
    })
    setPartnerSock(null)
    setPartnerUid(null)
    setPartnerAvatar(null)
    setPartnerIsVip(false)
    setPartnerIsPremium(false)
    setPartnerEmailVerified(false)
    setPartnerCountry(null)
    setGiftAnimations([])
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
        findMatch(socket)
      })

      socket.on('you-are-banned', ({ reason, banType: bt, banExpiresAt: bea }) => {
        if (!mounted) return
        setBanReason(reason || 'Your account has been suspended.')
        setBanType(bt || null)
        setBanExpiresAt(bea ? new Date(bea) : null)
        setStatus('banned')
      })

      socket.on('waiting', () => { if (mounted) setStatus('searching') })

      socket.on('match-found', ({ room, peers, squadMates: mates, isInitiator, partnerId, partnerUserId, partnerUsername: pUsername, partnerAvatar: pAvatar, partnerIsPremium: pIsPremium, partnerIsVip: pIsVip, partnerEmailVerified: pEmailVerified, partnerCountry: pCountry }) => {
        if (!mounted) return

        // Destroy opponent peers only — preserve any existing squad mate peers
        const existingMates = new Set(squadMatesRef.current)
        Object.entries(peersRef.current).forEach(([sid, p]) => {
          if (!existingMates.has(sid)) { try { p.destroy() } catch {}; delete peersRef.current[sid] }
        })
        setRemoteStreams((prev) => {
          const next = {}
          existingMates.forEach((id) => { if (prev[id]) next[id] = prev[id] })
          return next
        })

        setRoomId(room)
        setMessages([])
        setElapsed(0)
        setReportSent(false)
        setStatus('matched')
        const newMates = mates || []
        setSquadMates(newMates)
        if (newMates[0]) setPersistentMateId(newMates[0])
        setPartnerUsername(pUsername || null)
        setPartnerAvatar(pAvatar || null)
        setPartnerIsVip(pIsVip || false)
        setPartnerIsPremium(pIsPremium || false)
        setPartnerEmailVerified(pEmailVerified || false)
        setPartnerCountry(pCountry || null)
        setGiftAnimations([])
        setGiftsReceived(0)
        setGiftPopup(null) // belt-and-braces: never carry an old popup into a new match
        setFriendReqSent(false)
        setMatchFlash(true)
        clearTimeout(matchFlashTimer.current)
        matchFlashTimer.current = setTimeout(() => setMatchFlash(false), 1200)

        // Support both new format (peers array) and legacy 1v1 format
        const peersToCreate = (peers && peers.length > 0)
          ? peers
          : (partnerId ? [{ socketId: partnerId, isInitiator }] : [])

        // Set partner sock to first opponent for reporting
        const opponents = peersToCreate.filter((p) => !(newMates).includes(p.socketId))
        if (opponents.length > 0) {
          setPartnerSock(opponents[0].socketId)
          setPartnerUid(partnerUserId || null)
        }

        // Dev-bot matches produce no WebRTC streams, so the grid (which is
        // stream-derived) would render empty. Track the bot peer IDs directly
        // so the layout still fills — real matches leave this null.
        const isBotMatch = peersToCreate.some((p) => String(p.socketId).startsWith('dev_bot_'))
        setBotPeerIds(isBotMatch ? { mates: newMates, opponents: opponents.map((o) => o.socketId) } : null)

        for (const { socketId: peerId, isInitiator: init } of peersToCreate) {
          // Skip squad mate peers that already have an established connection
          if (newMates.includes(peerId) && peersRef.current[peerId]) continue
          createPeerForSocket(socket, peerId, init)
        }
      })

      // Squad mate pre-connection: establish WebRTC with partner before stranger match
      socket.on('squad-peer-ready', ({ mates }) => {
        if (!mounted) return
        setSquadMates(mates)
        if (mates[0]) setPersistentMateId(mates[0])
        for (const mateId of mates) {
          if (!peersRef.current[mateId]) {
            createPeerForSocket(socket, mateId, socket.id > mateId)
          }
        }
      })

      // Duo skip: squad mate re-searches but keeps partner connection alive
      socket.on('duo-requeue', () => {
        if (!mounted) return
        destroyOpponentPeers()
        setMessages([])
        setReportSent(false)
        setBotPeerIds(null)
        setStatus('searching')
        findMatch(socket)
      })

      // Duo partner ended: navigate home after brief message
      socket.on('duo-partner-ended', () => {
        if (!mounted) return
        setTipFeedback({ type: 'error', msg: 'Your partner ended the chat' })
        setTimeout(() => navigate('/', { state: { fromDuoChat: true } }), 2200)
      })

      // Route WebRTC signals to the correct peer using `from`
      socket.on('webrtc-offer',         ({ offer,     from }) => { if (peersRef.current[from]) try { peersRef.current[from].signal(offer)     } catch {} })
      socket.on('webrtc-answer',        ({ answer,    from }) => { if (peersRef.current[from]) try { peersRef.current[from].signal(answer)    } catch {} })
      socket.on('webrtc-ice-candidate', ({ candidate, from }) => { if (peersRef.current[from]) try { peersRef.current[from].signal(candidate) } catch {} })

      socket.on('chat-message', ({ message, timestamp }) => {
        if (!mounted) return
        setMessages((prev) => [...prev, { text: message, from: 'stranger', timestamp }])
        // Skip the unread bump if the panel is already showing the All tab
        if (!showChatRef.current || chatTabRef.current !== 'all') setUnread((n) => n + 1)
      })

      // Partner-only message — squad mate sent through the side channel
      socket.on('partner-chat-message', ({ message, timestamp }) => {
        if (!mounted) return
        setPartnerMessages((prev) => [...prev, { text: message, from: 'partner', timestamp }])
        if (!showChatRef.current || chatTabRef.current !== 'partner') setPartnerUnread((n) => n + 1)
      })

      const handlePartnerGone = () => {
        if (!mounted) return
        if (squadMatesRef.current.length > 0) {
          // In duo mode: keep squad mate connection, only clear opponent state
          destroyOpponentPeers()
        } else {
          // No mate left — partner-only chat is meaningless without them.
          destroyAllPeers()
          setPartnerMessages([])
          setPartnerUnread(0)
          if (chatTabRef.current === 'partner') setChatTab('all')
        }
        setMessages([])
        setReportSent(false)
        setBotPeerIds(null)
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

      // Gift broadcast — every participant in the room sees the animation
      socket.on('gift_received', ({ giftId, giftName, coins: giftCoins, senderId, senderUsername, recipientSocketId }) => {
        if (!mounted) return
        const id = Date.now() + Math.random()
        // Capture the recipient's video panel so the gift can fly to it.
        let target = null
        const el = remoteVideoRefs.current[recipientSocketId]
        if (el) {
          const r = el.getBoundingClientRect()
          if (r.width > 4 && r.height > 4) {
            target = { cx: r.left + r.width / 2, cy: r.top + r.height / 2, w: r.width, h: r.height }
          }
        }
        setGiftAnimations((prev) => [...prev, { id, giftId, coins: giftCoins, target }])
        setTimeout(() => setGiftAnimations((prev) => prev.filter((a) => a.id !== id)), 4000)
        // Credit my cashable balance if I'm the recipient
        if (recipientSocketId === socketRef.current?.id && giftCoins) {
          setCashableCoins((c) => c + giftCoins)
          setGiftsReceived((n) => n + Number(giftCoins || 0))
        }
        // Brief gift popup over the chat panel — not kept in chat history.
        const iAmSender   = String(senderId) === String(user?.id)
        const senderLabel = iAmSender ? 'You' : (senderUsername || 'Someone')
        let recipientLabel = 'a stranger'
        if (recipientSocketId === socketRef.current?.id)            recipientLabel = 'you'
        else if (squadMatesRef.current.includes(recipientSocketId)) recipientLabel = 'your partner'
        setGiftPopup({ id, giftId, who: `${senderLabel} sent ${recipientLabel}`, giftName, coins: Number(giftCoins || 0) })
        // Dismissal is owned by a useEffect on giftPopup (see below) so the
        // timer can't leak across StrictMode re-mounts, HMR, or background-tab
        // throttling — every popup is guaranteed to clear itself.
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
    if (squadMatesRef.current.length > 0) {
      destroyOpponentPeers()
    } else {
      // No squad mate — clear the partner-only chat too.
      destroyAllPeers()
      setPartnerMessages([])
      setPartnerUnread(0)
      if (chatTabRef.current === 'partner') setChatTab('all')
    }
    setMessages([])
    setReportSent(false)
    setBotPeerIds(null)
    setGiftPopup(null) // never leave a stale gift popup on screen across matches
    setStatus('searching')
    socketRef.current?.emit('skip')
    if (socketRef.current?.connected) findMatch(socketRef.current)
  }

  const handleChatGender = (val) => {
    if (val !== 'both' && !user?.isPremium && !user?.isVip) { navigate('/subscription'); return }
    setChatFilterGender(val)
    prefsRef.current = { ...prefsRef.current, filterGender: val === 'both' ? null : val }
    setShowGenderDrop(false)
  }

  const handleChatCountry = (val) => {
    if (!user?.isVip) { navigate('/subscription'); return }
    setChatFilterCountry(val)
    prefsRef.current = { ...prefsRef.current, filterCountry: val }
    setShowChatCountryDrop(false)
    setChatCountrySearch('')
  }

  // Open the "Send Coins" modal (recipient defaults to the stranger, falling
  // back through every known recipient source so a real partner or a stale
  // last-known socket is still giftable when the stream-derived lists are
  // briefly empty).
  const resolveGiftRecipient = () =>
    opponentSocketIds[0]
    || mateSocketIds[0]
    || squadMates[0]
    || persistentMateId
    || partnerSock
    || null
  const openGiftFlow = () => {
    if (status !== 'matched') return
    setGiftRecipient(resolveGiftRecipient())
    setSelectedGiftId(null)
    setCustomAmount('')
    setShowGift(true)
  }

  const sendGift = async () => {
    if (giftSending) return
    const sel = GIFTS.find((g) => g.id === selectedGiftId)
    const amount = sel ? sel.coins : (parseInt(customAmount, 10) || 0)
    if (amount < 10) {
      setTipFeedback({ type: 'error', msg: 'Pick a gift or enter at least 10 coins' })
      setTimeout(() => setTipFeedback(null), 3000); return
    }
    if (amount > coins) {
      setTipFeedback({ type: 'error', msg: 'Not enough coins' })
      setTimeout(() => setTipFeedback(null), 3000); return
    }
    const recipientSocketId = giftRecipient || resolveGiftRecipient()
    if (!recipientSocketId) {
      setTipFeedback({ type: 'error', msg: 'No one to gift right now' })
      setTimeout(() => setTipFeedback(null), 3000); return
    }
    setGiftSending(true)
    try {
      const { data } = await axios.post('/api/user/send-gift', {
        recipientId: recipientSocketId,
        giftId: sel ? sel.id : 'custom',
        coins: amount,
        room: roomId,
      })
      if (data?.coins !== undefined) setCoins(data.coins)
      setShowGift(false)
    } catch (err) {
      setTipFeedback({ type: 'error', msg: err.response?.data?.error || 'Gift failed' })
      setTimeout(() => setTipFeedback(null), 3500)
    }
    setGiftSending(false)
  }

  const handleEnd = () => {
    socketRef.current?.emit('end-chat')
    // In a duo, tell the home page so it opens straight in Duo mode
    // (the squad stays alive) instead of flashing the solo layout.
    const inDuo = prefs.mode === 'squad' && !!prefs.squadId
    navigate('/', inDuo ? { state: { fromDuoChat: true } } : undefined)
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

  const handleSend = useCallback((text, tab = 'all') => {
    if (!text || !roomId || status !== 'matched') return
    const now = Date.now()
    if (tab === 'partner') {
      setPartnerMessages((prev) => [...prev, { text, from: 'me', timestamp: now }])
      socketRef.current?.emit('partner-chat-message', { message: text })
    } else {
      setMessages((prev) => [...prev, { text, from: 'me', timestamp: now }])
      socketRef.current?.emit('chat-message', { message: text, room: roomId })
    }
  }, [roomId, status])

  const setActiveTab = (tab) => {
    setChatTab(tab)
    if (tab === 'all') setUnread(0)
    else setPartnerUnread(0)
  }

  const toggleMute = () => {
    const newMuted = !isMuted
    // Mute the local mic track if we have one
    localStreamRef.current?.getAudioTracks().forEach((t) => { t.enabled = !newMuted })
    // Also update any peer connection senders directly (stays in sync after camera flips)
    Object.values(peersRef.current).forEach((peer) => {
      peer._pc?.getSenders().forEach((s) => { if (s.track?.kind === 'audio') s.track.enabled = !newMuted })
    })
    // Always reflect the state so the button gives feedback even without a mic
    setIsMuted(newMuted)
  }

  const toggleVideo = () => {
    const track = localStreamRef.current?.getVideoTracks()[0]
    if (track) { track.enabled = !track.enabled; setVideoOff(!track.enabled) }
  }

  // Mic-level visualizer for the user's avatar — only runs while the camera
  // is off (that's when the avatar is shown). Lets the user confirm the mic
  // works by speaking and seeing pulses ripple out of their avatar.
  const micLevel = useMicLevel(localStreamRef, (!hasCamera || videoOff) && !isMuted && status !== 'init')

  const toggleChat = () => {
    setShowChat((v) => {
      if (!v) {
        // Opening — clear the unread on the tab the user is about to see.
        if (chatTab === 'partner') setPartnerUnread(0)
        else                       setUnread(0)
      }
      return !v
    })
  }

  // Derive opponent vs squad-mate video entries.
  // Layout-wise, we treat any mode==='squad' navigation as a duo session so the
  // 3-panel grid shows during the very first search — before the server has
  // returned the squad mate. In production the MainPage Start CTA always
  // forwards prefs.squadId; in dev the bot-duo shortcut omits it, so we also
  // accept mode==='squad' alone in DEV. (The stricter inDuo check used by
  // handleEnd still requires a real squadId so we don't navigate back into
  // duo mode after a solo-bot session.)
  const isSquadSession     = prefs.mode === 'squad' && (!!prefs.squadId || import.meta.env.DEV)
  const allRemoteEntries   = Object.keys(remoteStreams)
  const opponentSocketIds  = botPeerIds ? botPeerIds.opponents : allRemoteEntries.filter((sid) => !squadMates.includes(sid))
  const mateSocketIds      = botPeerIds ? botPeerIds.mates     : allRemoteEntries.filter((sid) => squadMates.includes(sid))
  // isDuoMode is sticky across skips — once you're in a duo session it stays
  // duo until you fully leave. Without `persistentMateId` in this OR, the
  // moment after a skip (when mateSocketIds briefly empties, or in dev-bot mode
  // where mates never produce a real stream) would collapse the layout back to
  // solo and the duo partner tile would visibly disappear until the next match.
  const isDuoMode          = isSquadSession || mateSocketIds.length > 0 || !!persistentMateId
  // 2v2 only applies to a live match — while searching we fall back to the
  // 3-panel duo layout so you + your partner stay on screen.
  const is2v2              = isDuoMode && status === 'matched' && opponentSocketIds.length >= 2

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

        {/* Gift fireworks — full-screen celebration, both layouts */}
        <GiftFireworks anims={giftAnimations} />

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
            <div className="fixed top-4 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none">
              <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                className="max-w-sm w-full pointer-events-auto">
                <div className="bg-cyan-500/15 border border-yellow-500/40 rounded-2xl px-5 py-4 flex items-start gap-3 backdrop-blur-sm">
                  <Shield size={16} className="text-cyan-400 mt-0.5 flex-shrink-0" />
                  <div><p className="text-cyan-300 text-xs font-black uppercase tracking-wider mb-1">Admin Warning</p><p className="text-white text-sm">{adminWarning}</p></div>
                  <button onClick={() => setAdminWarning('')} className="text-white/40 hover:text-white ml-auto"><X size={14} /></button>
                </div>
              </motion.div>
            </div>
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


        {/* Tip/gift feedback toast */}
        <AnimatePresence>
          {tipFeedback && (
            <div className="fixed top-16 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none">
              <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
                className="px-5 py-3 rounded-2xl text-sm font-semibold backdrop-blur-sm whitespace-nowrap pointer-events-auto max-w-[calc(100vw-32px)]"
                style={{ background: tipFeedback.type === 'success' ? 'rgba(0,212,255,0.15)' : 'rgba(239,68,68,0.15)', border: `1px solid ${tipFeedback.type === 'success' ? 'rgba(0,212,255,0.3)' : 'rgba(239,68,68,0.3)'}`, color: tipFeedback.type === 'success' ? '#4ade80' : '#f87171' }}>
                {tipFeedback.msg}
              </motion.div>
            </div>
          )}
        </AnimatePresence>


        {/* Send Coins modal */}
        <AnimatePresence>
          {showGift && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[55] flex items-end justify-center"
              style={{ background: 'rgba(0,0,0,0.72)' }} onClick={() => setShowGift(false)}>
              <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 32, stiffness: 340 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-sm"
                style={{ background: 'rgba(13,13,24,0.98)', backdropFilter: 'blur(30px)', WebkitBackdropFilter: 'blur(30px)', border: '1px solid rgba(0,212,255,0.2)', borderRadius: '22px 22px 0 0', padding: '8px 16px max(16px, env(safe-area-inset-bottom, 0px))', fontFamily: "'Sora', system-ui, sans-serif", maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>

                {/* Grab handle */}
                <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.18)', margin: '0 auto 10px' }} />

                {/* Header */}
                <div className="flex items-start justify-between" style={{ marginBottom: 12 }}>
                  <div>
                    <p style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>Send Coins</p>
                    <p style={{ color: '#888899', fontWeight: 400, fontSize: 11, marginTop: 2 }}>Coins added to their cashable balance</p>
                  </div>
                  <button onClick={() => setShowGift(false)} className="text-white/40 hover:text-white"><X size={16} /></button>
                </div>

                {/* Recipient picker — shown whenever there's more than one person to gift.
                    Mates come from squadMates so the duo partner is always giftable,
                    even before their video stream has connected. */}
                {(() => {
                  const mateIds = squadMates.length ? squadMates : (persistentMateId ? [persistentMateId] : [])
                  const giftTargets = [
                    ...opponentSocketIds.map((sid, i) => ({
                      sid,
                      label: opponentSocketIds.length > 1 ? `Stranger ${i + 1}` : (partnerUsername || 'Stranger'),
                      avatar: i === 0 ? partnerAvatar : null,
                    })),
                    ...mateIds.map((sid, i) => ({ sid, label: mateIds.length > 1 ? `Partner ${i + 1}` : 'Partner', avatar: null })),
                  ]
                  if (giftTargets.length < 2) return null
                  return (
                    <div style={{ marginBottom: 12 }}>
                      <p style={{ color: '#666677', fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 6 }}>Send to</p>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {giftTargets.map((t) => {
                          const sel = giftRecipient === t.sid
                          return (
                            <button key={t.sid} type="button" onClick={() => setGiftRecipient(t.sid)}
                              style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '6px 12px 6px 6px', borderRadius: 50, background: sel ? 'rgba(0,212,255,0.12)' : 'rgba(255,255,255,0.04)', border: sel ? '1.5px solid #00D4FF' : '1.5px solid rgba(255,255,255,0.08)', cursor: 'pointer' }}>
                              {t.avatar
                                ? <img src={t.avatar} alt="" style={{ width: 24, height: 24, borderRadius: '50%', objectFit: 'cover' }} />
                                : <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'linear-gradient(135deg, #00D4FF, #7C3AED)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 900, color: '#0a0a0f' }}>{t.label[0]}</div>}
                              <span style={{ color: sel ? '#fff' : '#9a9aab', fontSize: 12, fontWeight: 700 }}>{t.label}</span>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )
                })()}

                {/* Gift list — grouped by tier */}
                <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                  {GIFT_TIERS.map((tier) => (
                    <div key={tier}>
                      <p style={{ color: '#666677', fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', margin: '8px 0 6px' }}>{tier}</p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {GIFTS.filter((g) => g.tier === tier).map((g) => {
                          const selected = selectedGiftId === g.id
                          return (
                            <button key={g.id} type="button"
                              onClick={() => { setSelectedGiftId(g.id); setCustomAmount('') }}
                              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 12, background: selected ? 'rgba(0,212,255,0.1)' : 'rgba(255,255,255,0.03)', border: selected ? '1px solid #00D4FF' : '1px solid rgba(255,255,255,0.07)', cursor: 'pointer', width: '100%', textAlign: 'left' }}>
                              <div style={{ width: 40, height: 40, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0f', border: '1px solid #1a1a2e', borderRadius: 10 }}>
                                <GiftIcon id={g.id} size={28} />
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <p style={{ color: '#fff', fontWeight: 700, fontSize: 13, lineHeight: 1.25 }}>{g.name}</p>
                                <p style={{ color: '#888899', fontWeight: 400, fontSize: 10.5, lineHeight: 1.25 }}>{g.subtitle}</p>
                              </div>
                              <span style={{ display: 'flex', alignItems: 'center', gap: 3, padding: '4px 9px', borderRadius: 50, background: 'rgba(0,212,255,0.12)', border: '1px solid rgba(0,212,255,0.25)', color: '#00D4FF', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                                <VybeCoin size={10} />{g.coins.toLocaleString()}
                              </span>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Custom amount */}
                <input
                  type="number" inputMode="numeric" min="10" value={customAmount} placeholder="Custom amount"
                  onChange={(e) => { setCustomAmount(e.target.value); setSelectedGiftId(null) }}
                  style={{ width: '100%', marginTop: 10, background: 'rgba(255,255,255,0.05)', border: customAmount ? '1px solid #00D4FF' : '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 14px', fontSize: 14, color: '#fff', outline: 'none', fontFamily: "'Sora', system-ui, sans-serif" }}
                />

                {/* Balance + send */}
                <p style={{ color: '#888899', fontSize: 11, textAlign: 'center', margin: '10px 0 8px' }}>
                  Your balance: {coins.toLocaleString()} coins
                </p>
                {(() => {
                  const sel = GIFTS.find((g) => g.id === selectedGiftId)
                  const amt = sel ? sel.coins : (parseInt(customAmount, 10) || 0)
                  const hasAmount = amt >= 10
                  const broke   = hasAmount && amt > coins
                  const canSend = hasAmount && !broke && !giftSending
                  return (
                    <>
                      <button type="button" disabled={!canSend}
                        onClick={() => { if (canSend) sendGift() }}
                        style={{ width: '100%', padding: '12px 0', borderRadius: 50, background: '#00D4FF', color: '#0a0a0f', fontWeight: 700, fontSize: 14, fontFamily: "'Sora', system-ui, sans-serif", border: 'none', cursor: canSend ? 'pointer' : 'not-allowed', opacity: canSend ? 1 : 0.4 }}>
                        {giftSending ? 'Sending…'
                          : !hasAmount ? 'Select a gift'
                          : sel ? `Send ${sel.name} · ${sel.coins.toLocaleString()} coins`
                          : `Send ${amt.toLocaleString()} coins`}
                      </button>
                      <button type="button"
                        onClick={() => { setShowGift(false); navigate('/coins?from=chat') }}
                        style={{ width: '100%', marginTop: 8, padding: '10px 0', borderRadius: 50, background: 'transparent', color: '#00D4FF', fontWeight: 700, fontSize: 13, fontFamily: "'Sora', system-ui, sans-serif", border: '1px solid rgba(0,212,255,0.35)', cursor: 'pointer' }}>
                        Buy coins
                      </button>
                    </>
                  )
                })()}
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

        {/* ── MOBILE: Fullscreen immersive camera ── */}
        <div ref={pipContainerRef} className="lg:hidden fixed inset-0 z-[1] overflow-hidden" style={{ background: 'linear-gradient(135deg, #0a0a1a 0%, #0d1020 50%, #080d18 100%)' }}>

          {/* Fullscreen background: stranger video OR searching state */}
          {status === 'searching' ? (
            <div className="absolute flex flex-col items-center justify-center px-6" style={{ top: 0, left: 0, right: 0, height: '50%', gap: 16, background: 'linear-gradient(135deg, #0a0a1a 0%, #0d1020 50%, #080d18 100%)' }}>
              {/* Globe — fixed container so rings stay within bounds */}
              <div className="relative flex items-center justify-center flex-shrink-0" style={{ width: 240, height: 240 }}>
                <motion.div className="absolute rounded-full" style={{ width: 232, height: 232, border: '1.5px solid #00D4FF' }} animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }} />
                <motion.div className="absolute rounded-full" style={{ width: 210, height: 210, border: '1px solid rgba(0,212,255,0.4)' }} animate={{ opacity: [0.3, 0.7, 0.3] }} transition={{ duration: 2.5, delay: 0.5, repeat: Infinity, ease: 'easeInOut' }} />
                <VybeGlobe size={180} />
              </div>
              <div className="text-center relative z-10 flex flex-col items-center" style={{ gap: 10 }}>
                <AnimatePresence mode="wait">
                  <motion.p key={searchTextIdx} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} transition={{ duration: 0.3 }} className="text-lg" style={{ color: '#00D4FF', fontWeight: 600, letterSpacing: '-0.01em' }}>
                    {SEARCH_TEXTS[searchTextIdx]}
                    <AnimatedDots />
                  </motion.p>
                </AnimatePresence>
                <AnimatePresence mode="wait">
                  <motion.p key={tipIdx} initial={{ opacity: 0, y: 3 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -3 }} transition={{ duration: 0.4 }} className="text-[11px]" style={{ color: '#555566' }}>
                    {TIPS[tipIdx % TIPS.length]}
                  </motion.p>
                </AnimatePresence>
                <AnimatePresence>
                  {searchElapsed >= 25 && (
                    <motion.p
                      initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      transition={{ duration: 0.5 }}
                      className="text-[11px] leading-relaxed max-w-[260px] mt-1"
                      style={{ color: '#7a7a8c' }}
                    >
                      It's quiet right now — we'll connect you the moment someone joins. Vybe gets busiest on evenings &amp; weekends.
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
            </div>
          ) : opponentSocketIds.length === 0 ? (
            <div className="absolute flex flex-col items-center justify-center gap-3" style={{ top: 0, left: 0, right: 0, height: '50%', background: 'linear-gradient(135deg, #0a0a1a 0%, #0d1020 50%, #080d18 100%)' }}>
              {status === 'matched' ? (
                <>
                  {partnerAvatar ? (
                    <img src={partnerAvatar} style={{ width: 52, height: 52, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(0,212,255,0.35)' }} />
                  ) : (
                    <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'linear-gradient(135deg, rgba(0,212,255,0.2), rgba(124,58,237,0.2))', border: '2px solid rgba(0,212,255,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 900, color: '#00D4FF' }}>
                      {(partnerUsername || 'S')[0].toUpperCase()}
                    </div>
                  )}
                </>
              ) : null}
            </div>
          ) : is2v2 ? (
            /* 2V2 MOBILE: Full-screen 2×2 grid */
            <div className="absolute inset-0" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', background: 'linear-gradient(135deg, #0a0a1a 0%, #0d1020 50%, #080d18 100%)' }}>
              {/* TOP LEFT: Stranger 1 */}
              <div className="relative overflow-hidden" style={{ borderBottom: '1px solid rgba(0,212,255,0.2)', borderRight: '1px solid rgba(0,212,255,0.2)' }}>
                <video ref={(el) => { remoteVideoRefs.current[opponentSocketIds[0]] = el }} autoPlay playsInline className="w-full h-full object-cover" />
                {!remoteStreams[opponentSocketIds[0]] && <TilePlaceholder avatarUrl={partnerAvatar} name={partnerUsername || 'Stranger'} />}
                <div className="absolute" style={{ top: 8, left: 8, zIndex: 10 }}>
                  <ProfilePill
                    username={partnerUsername || 'Stranger'}
                    avatarUrl={partnerAvatar}
                    isOnline
                    isVerified={!!partnerEmailVerified}
                    isVip={!!partnerIsVip}
                    isPremium={!!partnerIsPremium}
                    country={partnerCountry}
                    friendStatus={(!user || !partnerUid) ? 'self' : friendReqSent ? 'pending' : 'none'}
                    onAddFriend={handleAddFriend}
                  />
                </div>
                {giftedBySocket[opponentSocketIds[0]] > 0 && (
                  <div className="absolute" style={{ bottom: 8, left: 8, zIndex: 10 }}>
                    <GiftChip key={giftedBySocket[opponentSocketIds[0]]} amount={giftedBySocket[opponentSocketIds[0]]} />
                  </div>
                )}
              </div>
              {/* TOP RIGHT: Stranger 2 */}
              <div className="relative overflow-hidden" style={{ borderBottom: '1px solid rgba(0,212,255,0.2)' }}>
                <video ref={(el) => { remoteVideoRefs.current[opponentSocketIds[1]] = el }} autoPlay playsInline className="w-full h-full object-cover" />
                {!remoteStreams[opponentSocketIds[1]] && <TilePlaceholder name="Stranger" />}
                <div className="absolute" style={{ top: 8, left: 8, zIndex: 10 }}>
                  <ProfilePill username="Stranger" isOnline isVerified={false} friendStatus="self" />
                </div>
                {giftedBySocket[opponentSocketIds[1]] > 0 && (
                  <div className="absolute" style={{ bottom: 8, left: 8, zIndex: 10 }}>
                    <GiftChip key={giftedBySocket[opponentSocketIds[1]]} amount={giftedBySocket[opponentSocketIds[1]]} />
                  </div>
                )}
              </div>
              {/* BOTTOM LEFT: Your camera */}
              <div className="relative overflow-hidden" style={{ borderRight: '1px solid rgba(0,212,255,0.2)' }}>
                <video
                  ref={(el) => {
                    if (el && localStreamRef.current) {
                      el.srcObject = localStreamRef.current
                      el.play().catch(() => {})
                    }
                  }}
                  autoPlay muted playsInline className="w-full h-full object-cover"
                />
                {!hasCamera && (camBgImage
                  ? <img src={camBgImage} alt="" className="absolute inset-0 w-full h-full object-cover" />
                  : <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, #0a0a1a 0%, #0d1020 50%, #080d18 100%)' }} />)}
                {videoOff && hasCamera && <div className="absolute inset-0 bg-black/80" />}
                {(!hasCamera || videoOff) && <CameraOffView user={user} micLevel={micLevel} />}
                <div className="absolute" style={{ top: 8, left: 8, zIndex: 10 }}>
                  <ProfilePill
                    username={user ? user.username : 'You'}
                    avatarUrl={user?.avatar}
                    isOnline
                    isVerified={!!user?.emailVerified}
                    isVip={!!user?.isVip}
                    isPremium={!!user?.isPremium}
                    country={myCountry}
                    accentColor={user?.accentColor}
                    bannerGradient={user?.bannerGradient}
                    friendStatus="self"
                  />
                </div>
              </div>
              {/* BOTTOM RIGHT: Duo partner */}
              <div className="relative overflow-hidden">
                {mateSocketIds[0] ? (
                  <>
                    <video ref={(el) => { remoteVideoRefs.current[mateSocketIds[0]] = el }} autoPlay playsInline className="w-full h-full object-cover" />
                    {!remoteStreams[mateSocketIds[0]] && <TilePlaceholder name="Partner" />}
                    <div className="absolute" style={{ top: 8, left: 8, zIndex: 10 }}>
                      <ProfilePill username="Partner" isOnline isVerified={false} friendStatus="self" />
                    </div>
                    {giftedBySocket[mateSocketIds[0]] > 0 && (
                      <div className="absolute" style={{ top: 46, left: 8, zIndex: 10 }}>
                        <GiftChip key={giftedBySocket[mateSocketIds[0]]} amount={giftedBySocket[mateSocketIds[0]]} />
                      </div>
                    )}
                  </>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-2 px-3 text-center">
                    <div className="rounded-full flex items-center justify-center" style={{ width: 40, height: 40, background: 'rgba(0,212,255,0.07)', border: '1.5px dashed rgba(0,212,255,0.3)' }}>
                      <Loader2 size={15} className="animate-spin" style={{ color: 'rgba(0,184,224,0.7)' }} />
                    </div>
                    <p className="text-[10px] font-semibold" style={{ color: 'rgba(160,170,190,0.7)' }}>Partner connecting…</p>
                  </div>
                )}
              </div>
            </div>
          ) : isDuoMode ? (
            /* DUO MODE: Stranger in top half only */
            <motion.div key={opponentSocketIds.join(',')} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }} className="absolute overflow-hidden" style={{ top: 0, left: 0, right: 0, height: '50%' }}>
              <video
                ref={(el) => { remoteVideoRefs.current[opponentSocketIds[0]] = el }}
                autoPlay playsInline
                className="w-full h-full object-cover"
              />
            </motion.div>
          ) : (
            /* SOLO MODE: stranger(s) fill the top half. When matched against
                a duo (2 opponents), they sit side-by-side instead of one
                big + one PiP — clearer "me vs them as a pair" framing. */
            <motion.div key={opponentSocketIds.join(',')} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }} className="absolute overflow-hidden flex" style={{ top: 0, left: 0, right: 0, height: '50%', background: 'linear-gradient(135deg, #0a0a1a 0%, #0d1020 50%, #080d18 100%)' }}>
              {opponentSocketIds.map((sid, idx) => {
                const isFirst = idx === 0
                const fallbackName = isFirst ? (partnerUsername || 'Stranger') : 'Stranger'
                const fallbackAvatar = isFirst ? partnerAvatar : null
                // When matched against a duo (2 strangers), each tile carries
                // its own pill — the global "Partner info" overlay is suppressed
                // for this case so we don't end up with one labelled and one bare.
                const showInlinePill = status === 'matched' && opponentSocketIds.length > 1
                return (
                  <div key={sid} className={`relative flex-1 overflow-hidden ${idx > 0 ? 'border-l border-white/10' : ''}`}>
                    <video
                      ref={(el) => { remoteVideoRefs.current[sid] = el }}
                      autoPlay playsInline
                      className="w-full h-full object-cover"
                    />
                    {!remoteStreams[sid] && (
                      <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0a0a1a 0%, #0d1020 50%, #080d18 100%)' }}>
                        {fallbackAvatar ? (
                          <img src={fallbackAvatar} style={{ width: 52, height: 52, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(0,212,255,0.35)' }} />
                        ) : (
                          <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'linear-gradient(135deg, rgba(0,212,255,0.2), rgba(124,58,237,0.2))', border: '2px solid rgba(0,212,255,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 900, color: '#00D4FF' }}>
                            {fallbackName[0].toUpperCase()}
                          </div>
                        )}
                      </div>
                    )}
                    {showInlinePill && (
                      <div className="absolute" style={{ top: 'max(12px, env(safe-area-inset-top, 0px) + 10px)', left: 12, zIndex: 10 }}>
                        <ProfilePill
                          username={fallbackName}
                          avatarUrl={fallbackAvatar}
                          isOnline
                          isVerified={isFirst ? !!partnerEmailVerified : false}
                          isVip={isFirst ? !!partnerIsVip : false}
                          country={isFirst ? partnerCountry : (partnerCountry || 'US')}
                          friendStatus="self"
                        />
                      </div>
                    )}
                  </div>
                )
              })}
            </motion.div>
          )}

          {/* DUO MODE: Bottom half — your camera (left) + duo partner (right) — 3-panel; shown while searching too */}
          {isDuoMode && !is2v2 && (status === 'searching' || status === 'matched') && (
            <>
              <div className="absolute z-[4] inset-x-0" style={{ top: 'calc(50% - 0.5px)', height: 1, background: 'rgba(0,212,255,0.2)' }} />
              <div className="absolute z-[2] flex overflow-hidden" style={{ top: '50%', left: 0, right: 0, bottom: 0, background: 'linear-gradient(135deg, #0a0a1a 0%, #0d1020 50%, #080d18 100%)' }}>
                {/* Left: Your camera */}
                <div className="relative flex-1 overflow-hidden">
                  <video
                    ref={(el) => {
                      if (el && localStreamRef.current) {
                        el.srcObject = localStreamRef.current
                        el.play().catch(() => {})
                      }
                    }}
                    autoPlay muted playsInline className="w-full h-full object-cover"
                  />
                  {!hasCamera && (camBgImage
                  ? <img src={camBgImage} alt="" className="absolute inset-0 w-full h-full object-cover" />
                  : <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, #0a0a1a 0%, #0d1020 50%, #080d18 100%)' }} />)}
                  {videoOff && hasCamera && <div className="absolute inset-0 bg-black/80" />}
                  {(!hasCamera || videoOff) && <CameraOffView user={user} micLevel={micLevel} />}
                  <div className="absolute" style={{ top: 8, left: 8, zIndex: 10 }}>
                    <ProfilePill
                      username={user ? user.username : 'You'}
                      avatarUrl={user?.avatar}
                      isOnline
                      isVerified={!!user?.emailVerified}
                      isVip={!!user?.isVip}
                      isPremium={!!user?.isPremium}
                      country={myCountry}
                      accentColor={user?.accentColor}
                      bannerGradient={user?.bannerGradient}
                      friendStatus="self"
                    />
                  </div>
                </div>
                {/* Vertical divider */}
                <div style={{ width: 1, background: 'rgba(0,212,255,0.2)', flexShrink: 0 }} />
                {/* Right: Duo partner */}
                <div className="relative flex-1 overflow-hidden">
                  {mateSocketIds[0] ? (
                    <>
                      <video ref={(el) => { remoteVideoRefs.current[mateSocketIds[0]] = el }} autoPlay playsInline className="w-full h-full object-cover" />
                      <div className="absolute" style={{ top: 8, left: 8, zIndex: 10 }}>
                        <ProfilePill username="Partner" isOnline isVerified={false} friendStatus="self" />
                      </div>
                      {giftedBySocket[mateSocketIds[0]] > 0 && (
                        <div className="absolute" style={{ top: 46, left: 8, zIndex: 10 }}>
                          <GiftChip key={giftedBySocket[mateSocketIds[0]]} amount={giftedBySocket[mateSocketIds[0]]} />
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-2 px-3 text-center">
                      <div className="rounded-full flex items-center justify-center" style={{ width: 40, height: 40, background: 'rgba(0,212,255,0.07)', border: '1.5px dashed rgba(0,212,255,0.3)' }}>
                        <Loader2 size={15} className="animate-spin" style={{ color: 'rgba(0,184,224,0.7)' }} />
                      </div>
                      <p className="text-[10px] font-semibold" style={{ color: 'rgba(160,170,190,0.7)' }}>Partner connecting…</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* SOLO MODE: Bottom half — your camera (split-screen, like other video-chat apps) */}
          {!isDuoMode && (status === 'searching' || status === 'matched') && (
            <>
              <div className="absolute z-[4] inset-x-0" style={{ top: 'calc(50% - 0.5px)', height: 1, background: 'rgba(0,212,255,0.2)' }} />
              <div className="absolute z-[2] overflow-hidden" style={{ top: '50%', left: 0, right: 0, bottom: 0, background: 'linear-gradient(135deg, #0a0a1a 0%, #0d1020 50%, #080d18 100%)' }}>
                <video
                  ref={(el) => { if (el && localStreamRef.current) { el.srcObject = localStreamRef.current; el.play().catch(() => {}) } }}
                  autoPlay muted playsInline className="w-full h-full object-cover"
                />
                {!hasCamera && (camBgImage
                  ? <img src={camBgImage} alt="" className="absolute inset-0 w-full h-full object-cover" />
                  : <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, #0a0a1a 0%, #0d1020 50%, #080d18 100%)' }} />)}
                {videoOff && hasCamera && <div className="absolute inset-0 bg-black/80" />}
                {(!hasCamera || videoOff) && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ zIndex: 5 }}>
                    {user?.avatar ? (
                      <img src={user.avatar} alt="" style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(0,212,255,0.35)' }} />
                    ) : (
                      <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg, rgba(0,212,255,0.2), rgba(124,58,237,0.2))', border: '2px solid rgba(0,212,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 900, color: '#00D4FF' }}>
                        {user?.username?.[0]?.toUpperCase() || 'Y'}
                      </div>
                    )}
                  </div>
                )}
                {/* Your profile pill — top-left of your half */}
                <div className="absolute" style={{ top: 12, left: 12, zIndex: 10 }}>
                  <ProfilePill
                    username={user ? user.username : 'You'}
                    avatarUrl={user?.avatar}
                    isOnline
                    isVerified={!!user?.emailVerified}
                    isVip={!!user?.isVip}
                    isPremium={!!user?.isPremium}
                    country={myCountry}
                    accentColor={user?.accentColor}
                    bannerGradient={user?.bannerGradient}
                    friendStatus="self"
                  />
                </div>
              </div>
            </>
          )}

          {/* Top gradient overlay */}
          <div className="absolute inset-x-0 top-0 h-36 pointer-events-none z-[3]" style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, transparent 100%)' }} />
          {/* Bottom gradient overlay */}
          <div className="absolute inset-x-0 bottom-0 h-52 pointer-events-none z-[3]" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.72) 0%, transparent 100%)' }} />

          {/* Partner info — top left (2v2 tiles carry their own pills).
              Uses the shared ProfilePill so the bot/stranger gets the same
              avatar + verified + VIP crown treatment as your own pill. */}
          <AnimatePresence>
            {status === 'matched' && !is2v2 && opponentSocketIds.length <= 1 && (
              <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.25 }}
                className="absolute z-[6] flex items-center gap-2"
                style={{ top: 'max(12px, env(safe-area-inset-top, 0px) + 10px)', left: 12 }}>
                <ProfilePill
                  username={partnerUsername || 'Stranger'}
                  avatarUrl={partnerAvatar}
                  isOnline
                  isVerified={!!partnerEmailVerified}
                  isVip={!!partnerIsVip}
                  isPremium={!!partnerIsPremium}
                  country={partnerCountry}
                  friendStatus={(!user || !partnerUid) ? 'self' : friendReqSent ? 'pending' : 'none'}
                  onAddFriend={handleAddFriend}
                />
                {giftedBySocket[partnerSock] > 0 && (
                  <GiftChip key={giftedBySocket[partnerSock]} amount={giftedBySocket[partnerSock]} />
                )}
              </motion.div>
            )}
          </AnimatePresence>


          {/* Mobile — Leave button while searching (no full control bar yet) */}
          {status === 'searching' && (
            <div className="absolute z-[7] flex justify-center" style={{ bottom: 'max(20px, calc(env(safe-area-inset-bottom, 0px) + 14px))', left: 12, right: 12 }}>
              <motion.button onClick={handleEnd} whileTap={{ scale: 0.95 }}
                className="flex items-center justify-center gap-2"
                style={{ padding: '11px 30px', borderRadius: 24, background: 'rgba(239,68,68,0.16)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid rgba(239,68,68,0.4)', color: '#f87171', fontWeight: 700, fontSize: 14 }}>
                <PhoneOff size={15} /> Leave
              </motion.button>
            </div>
          )}

          {/* Hide / show UI toggle — sits just above the control bar.
              Lets the user clear the screen for a distraction-free view. */}
          {status === 'matched' && (
            <div className="absolute z-[8] flex justify-center pointer-events-none"
              style={{
                left: 0, right: 0,
                bottom: uiHidden
                  ? 'max(20px, calc(env(safe-area-inset-bottom, 0px) + 14px))'
                  : 'max(74px, calc(env(safe-area-inset-bottom, 0px) + 68px))',
                transition: 'bottom 300ms cubic-bezier(0.22,1,0.36,1)',
              }}>
              <motion.button
                onClick={() => setUiHidden((v) => !v)}
                whileTap={{ scale: 0.88 }}
                className="pointer-events-auto flex items-center justify-center"
                style={{ height: 26, padding: '0 14px', borderRadius: 13, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.14)', color: 'rgba(255,255,255,0.7)' }}>
                {uiHidden ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
              </motion.button>
            </div>
          )}

          {/* Mobile control bar — one row, centered */}
          {status === 'matched' && (
            <motion.div className="absolute z-[7] flex items-center justify-center gap-2"
              animate={{ y: uiHidden ? 96 : 0, opacity: uiHidden ? 0 : 1 }}
              transition={{ type: 'spring', damping: 30, stiffness: 320 }}
              style={{ bottom: 'max(20px, calc(env(safe-area-inset-bottom, 0px) + 14px))', left: 12, right: 12, pointerEvents: uiHidden ? 'none' : 'auto' }}>
              {/* Report */}
              <motion.button
                onClick={() => !reportSent && setShowReport(true)}
                whileTap={!reportSent ? { scale: 0.9 } : {}}
                className="flex-shrink-0 flex items-center justify-center"
                style={{ width: 42, height: 42, borderRadius: '50%', background: reportSent ? 'rgba(0,212,255,0.12)' : 'rgba(0,0,0,0.5)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: reportSent ? '1px solid rgba(0,212,255,0.3)' : '1px solid rgba(255,255,255,0.12)', color: reportSent ? '#00D4FF' : 'rgba(255,255,255,0.7)' }}>
                {reportSent ? <ShieldCheck size={16} /> : <Flag size={16} />}
              </motion.button>
              {/* Mic */}
              <motion.button onClick={toggleMute} whileTap={{ scale: 0.9 }}
                className="flex-shrink-0 flex items-center justify-center"
                style={{ width: 42, height: 42, borderRadius: '50%', background: isMuted ? 'rgba(239,68,68,0.85)' : 'rgba(0,0,0,0.5)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: isMuted ? '1px solid rgba(239,68,68,0.6)' : '1px solid rgba(255,255,255,0.12)', color: 'white' }}>
                {isMuted ? <MicOff size={16} /> : <Mic size={16} />}
              </motion.button>
              {/* Leave */}
              <motion.button onClick={handleEnd} whileTap={{ scale: 0.9 }}
                className="flex-shrink-0 flex items-center justify-center"
                style={{ width: 42, height: 42, borderRadius: '50%', background: 'rgba(239,68,68,0.16)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid rgba(239,68,68,0.4)', color: '#f87171' }}>
                <PhoneOff size={16} />
              </motion.button>
              {/* Skip — primary */}
              <motion.button
                onClick={handleSkip}
                whileTap={{ scale: 0.97 }}
                className="flex-shrink-0 flex items-center justify-center gap-1.5"
                style={{ width: 112, height: 42, borderRadius: 24, background: 'linear-gradient(140deg, #1a3a8f 0%, #00D4FF 55%, #00B8E0 100%)', boxShadow: '0 0 18px rgba(0,212,255,0.35)', color: 'white', fontWeight: 800, fontSize: 15 }}>
                <SkipForward size={16} /> Skip
              </motion.button>
              {/* Gift */}
              {user && (
                <motion.button onClick={openGiftFlow} whileTap={{ scale: 0.9 }}
                  className="flex-shrink-0 flex items-center justify-center"
                  style={{ width: 42, height: 42, borderRadius: '50%', background: 'rgba(0,212,255,0.14)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid rgba(0,212,255,0.3)', color: '#00D4FF' }}>
                  <Gift size={17} />
                </motion.button>
              )}
              {/* Chat */}
              <motion.button onClick={toggleChat} whileTap={{ scale: 0.9 }}
                className="flex-shrink-0 flex items-center justify-center relative"
                style={{ width: 42, height: 42, borderRadius: '50%', background: showChat ? 'rgba(0,212,255,0.15)' : 'rgba(0,0,0,0.5)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: showChat ? '1px solid rgba(0,212,255,0.35)' : '1px solid rgba(255,255,255,0.12)', color: showChat ? '#00D4FF' : 'white' }}>
                <MessageSquare size={16} />
                {(unread + partnerUnread) > 0 && !showChat && (
                  <span style={{ position: 'absolute', top: 2, right: 2, width: 8, height: 8, background: '#00D4FF', borderRadius: '50%' }} />
                )}
              </motion.button>
            </motion.div>
          )}


          {/* ── DUO MODE: squad-mate floating PiP — hidden in duo mode (partner shown in bottom panel) ── */}
          {!isDuoMode && (
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
          )}

        </div>


        {/* ══════════════════════════════════════════════════════════
            DESKTOP LAYOUT
        ══════════════════════════════════════════════════════════ */}
        <div className="hidden lg:block" style={{ width: '100%', background: '#0a0a0f' }}>
          <Navbar onPremiumClick={() => {}} />
          {/* Chat area expands to fill the whole space when the UI is hidden. */}
          <div className="flex" style={{ position: 'fixed', top: 64, left: 0, right: 0, bottom: uiHidden ? 0 : 64, overflow: 'hidden', transition: 'bottom 300ms cubic-bezier(0.22,1,0.36,1)' }}>
          {is2v2 ? (
            /* ── 2V2: 2×2 CSS Grid — fills the chat area so there's no
                  dead space on the sides. ── */
            <motion.div
              key="2v2-grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35 }}
              style={{ flex: 1, display: 'grid', padding: 8, gap: 8, gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', minHeight: 0 }}
            >
              {/* TOP LEFT: Stranger 1 — full ProfilePill, label-less center avatar */}
              <div className="relative overflow-hidden" style={{ borderRadius: 20, background: 'linear-gradient(135deg, #0a0a1a 0%, #0d1020 50%, #080d18 100%)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <video ref={(el) => { remoteVideoRefs.current[opponentSocketIds[0]] = el }} autoPlay playsInline className="w-full h-full object-cover" />
                {!remoteStreams[opponentSocketIds[0]] && status === 'matched' && (
                  <TilePlaceholder avatarUrl={partnerAvatar} name={partnerUsername || 'Stranger'} hideLabel />
                )}
                {status === 'matched' && (
                  <div className="absolute flex items-center gap-2" style={{ top: 12, left: 12, zIndex: 10 }}>
                    <ProfilePill
                      username={partnerUsername || 'Stranger'}
                      avatarUrl={partnerAvatar}
                      isOnline
                      isVerified={!!partnerEmailVerified}
                      isVip={!!partnerIsVip}
                      isPremium={!!partnerIsPremium}
                      country={partnerCountry}
                      friendStatus={(!user || !partnerUid) ? 'self' : friendReqSent ? 'pending' : 'none'}
                      onAddFriend={handleAddFriend}
                    />
                    {giftedBySocket[opponentSocketIds[0]] > 0 && (
                      <GiftChip key={giftedBySocket[opponentSocketIds[0]]} amount={giftedBySocket[opponentSocketIds[0]]} />
                    )}
                  </div>
                )}
                <div className="absolute bottom-0 left-0 right-0 pointer-events-none" style={{ height: 60, background: 'linear-gradient(to top, rgba(0,0,0,0.25) 0%, transparent 100%)' }} />
              </div>

              {/* TOP RIGHT: Stranger 2 — generic ProfilePill (server doesn't send #2's profile yet) */}
              <div className="relative overflow-hidden" style={{ borderRadius: 20, background: 'linear-gradient(135deg, #0a0a1a 0%, #0d1020 50%, #080d18 100%)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <video ref={(el) => { remoteVideoRefs.current[opponentSocketIds[1]] = el }} autoPlay playsInline className="w-full h-full object-cover" />
                {!remoteStreams[opponentSocketIds[1]] && status === 'matched' && (
                  <TilePlaceholder name="Stranger" hideLabel />
                )}
                {status === 'matched' && (
                  <div className="absolute flex items-center gap-2" style={{ top: 12, left: 12, zIndex: 10 }}>
                    <ProfilePill username="Stranger" isOnline isVerified={false} friendStatus="self" />
                    {giftedBySocket[opponentSocketIds[1]] > 0 && (
                      <GiftChip key={giftedBySocket[opponentSocketIds[1]]} amount={giftedBySocket[opponentSocketIds[1]]} />
                    )}
                  </div>
                )}
                <div className="absolute bottom-0 left-0 right-0 pointer-events-none" style={{ height: 60, background: 'linear-gradient(to top, rgba(0,0,0,0.25) 0%, transparent 100%)' }} />
              </div>

              {/* BOTTOM LEFT: Your camera — label-less center, ProfilePill already shared */}
              <div className="relative overflow-hidden" style={{ borderRadius: 20, background: 'linear-gradient(135deg, #0a0a1a 0%, #0d1020 50%, #080d18 100%)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <video ref={localVideoDesktopRef} autoPlay muted playsInline className="w-full h-full object-cover" />
                {!hasCamera && (camBgImage
                  ? <img src={camBgImage} alt="" className="absolute inset-0 w-full h-full object-cover" />
                  : <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, #0a0a1a 0%, #0d1020 50%, #080d18 100%)' }} />)}
                {videoOff && hasCamera && <div className="absolute inset-0 bg-black/80" />}
                {(!hasCamera || videoOff) && (
                  <TilePlaceholder avatarUrl={user?.avatar} name={user?.username || 'Y'} hideLabel micLevel={micLevel} />
                )}
                <div className="absolute" style={{ top: 12, left: 12, zIndex: 10 }}>
                  <ProfilePill
                    username={user ? user.username : 'You'}
                    avatarUrl={user?.avatar}
                    isOnline
                    isVerified={!!user?.emailVerified}
                    isVip={!!user?.isVip}
                    isPremium={!!user?.isPremium}
                    country={myCountry}
                    accentColor={user?.accentColor}
                    bannerGradient={user?.bannerGradient}
                    friendStatus="self"
                  />
                </div>
                <div className="absolute bottom-0 left-0 right-0 pointer-events-none" style={{ height: 60, background: 'linear-gradient(to top, rgba(0,0,0,0.25) 0%, transparent 100%)' }} />
              </div>

              {/* BOTTOM RIGHT: Duo partner camera — placeholder fills the centre until their stream arrives */}
              <div className="relative overflow-hidden" style={{ borderRadius: 20, background: 'linear-gradient(135deg, #0a0a1a 0%, #0d1020 50%, #080d18 100%)', border: '1px solid rgba(255,255,255,0.06)' }}>
                {mateSocketIds[0] ? (
                  <>
                    <video ref={(el) => { remoteVideoRefs.current[mateSocketIds[0]] = el }} autoPlay playsInline className="w-full h-full object-cover" />
                    {!remoteStreams[mateSocketIds[0]] && (
                      <TilePlaceholder name="Partner" hideLabel />
                    )}
                    <div className="absolute flex items-center gap-2" style={{ top: 12, left: 12, zIndex: 10 }}>
                      <ProfilePill username="Partner" isOnline isVerified={false} friendStatus="self" />
                      {giftedBySocket[mateSocketIds[0]] > 0 && (
                        <GiftChip key={giftedBySocket[mateSocketIds[0]]} amount={giftedBySocket[mateSocketIds[0]]} />
                      )}
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 pointer-events-none" style={{ height: 60, background: 'linear-gradient(to top, rgba(0,0,0,0.25) 0%, transparent 100%)' }} />
                  </>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.18)' }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(0,212,255,0.4)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    </div>
                    <p className="text-[10px] font-medium" style={{ color: 'rgba(255,255,255,0.22)' }}>Duo partner connecting…</p>
                  </div>
                )}
              </div>
            </motion.div>
          ) : (
          <div className="flex-1 flex min-h-0" style={{ padding: 8, gap: 8 }}>

              {/* Stranger video */}
              <div className="flex-1 min-h-0 min-w-0" style={{ position: 'relative', overflow: 'hidden', borderRadius: 20, background: 'linear-gradient(135deg, #0a0a1a 0%, #0d1020 50%, #080d18 100%)', border: '1px solid rgba(255,255,255,0.06)' }}>
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
                        <motion.div key={searchTextIdx} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} transition={{ duration: 0.3 }}>
                          <p className="text-xl" style={{ color: '#00D4FF', fontWeight: 600, letterSpacing: '-0.01em' }}>
                            {SEARCH_TEXTS[searchTextIdx]}
                            <AnimatedDots />
                          </p>
                        </motion.div>
                      </AnimatePresence>
                      <AnimatePresence mode="wait">
                        <motion.p key={tipIdx} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.4 }} className="text-[12px]" style={{ color: '#555566' }}>
                          {TIPS[tipIdx % TIPS.length]}
                        </motion.p>
                      </AnimatePresence>
                      <AnimatePresence>
                        {searchElapsed >= 25 && (
                          <motion.p
                            initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                            transition={{ duration: 0.5 }}
                            className="text-[12px] leading-relaxed max-w-[320px] mt-1"
                            style={{ color: '#7a7a8c' }}
                          >
                            It's quiet right now — we'll connect you the moment someone joins. Vybe gets busiest on evenings &amp; weekends.
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                ) : opponentSocketIds.length === 0 ? (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-3">
                    {status === 'matched' ? (
                      <>
                        {partnerAvatar ? (
                          <img src={partnerAvatar} style={{ width: 88, height: 88, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(0,212,255,0.35)', boxShadow: '0 0 0 10px rgba(0,212,255,0.06), 0 0 48px rgba(0,212,255,0.12)' }} />
                        ) : (
                          <div style={{ width: 88, height: 88, borderRadius: '50%', background: 'linear-gradient(135deg, rgba(0,212,255,0.15), rgba(124,58,237,0.15))', border: '2px solid rgba(0,212,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 34, fontWeight: 900, color: '#00D4FF', boxShadow: '0 0 40px rgba(0,212,255,0.1)' }}>
                            {(partnerUsername || 'S')[0].toUpperCase()}
                          </div>
                        )}
                        <div style={{ textAlign: 'center' }}>
                          <p style={{ color: 'white', fontWeight: 700, fontSize: 16, marginBottom: 3, lineHeight: 1 }}>{partnerUsername || 'Stranger'}</p>
                          {partnerCountry && <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 4, lineHeight: 1 }}>{partnerCountry}</p>}
                        </div>
                      </>
                    ) : null}
                  </div>
                ) : (() => {
                  // Solo + 2 opponents → stack strangers vertically (top/bottom)
                  // so the user's camera on the right gets the full height too.
                  const stackVertical = opponentSocketIds.length > 1
                  return (
                    <motion.div
                      key={opponentSocketIds.join(',')}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.4, ease: 'easeOut' }}
                      className={`w-full h-full flex ${stackVertical ? 'flex-col' : ''}`}
                    >
                      {opponentSocketIds.map((sid, idx) => {
                        const divider = idx > 0 && (stackVertical ? 'border-t border-white/10' : 'border-l border-white/10')
                        const isFirst = idx === 0
                        return (
                          <div key={sid} className={`relative flex-1 overflow-hidden ${divider || ''}`}>
                            <video ref={(el) => { remoteVideoRefs.current[sid] = el }} autoPlay playsInline className="w-full h-full object-cover" />
                            {!remoteStreams[sid] && (
                              <TilePlaceholder
                                avatarUrl={isFirst ? partnerAvatar : null}
                                name={isFirst ? (partnerUsername || 'Stranger') : 'Stranger'}
                               
                                hideLabel
                              />
                            )}
                            {/* Per-tile pill when stacked, so the second opponent in a
                                solo-vs-duo match isn't left identity-less. The server
                                only sends one partner's profile data, so opponent #2
                                gets a generic 'Stranger' pill. */}
                            {stackVertical && status === 'matched' && (
                              <div className="absolute flex items-center gap-2" style={{ top: 16, left: 16, zIndex: 10 }}>
                                <ProfilePill
                                  username={isFirst ? (partnerUsername || 'Stranger') : 'Stranger'}
                                  avatarUrl={isFirst ? partnerAvatar : undefined}
                                  isOnline={!!remoteStreams[sid] || isFirst}
                                  isVerified={isFirst ? !!partnerEmailVerified : false}
                                  isVip={isFirst ? !!partnerIsVip : false}
                                  country={isFirst ? partnerCountry : undefined}
                                  friendStatus={isFirst && user && partnerUid ? (friendReqSent ? 'pending' : 'none') : 'self'}
                                  onAddFriend={isFirst ? handleAddFriend : undefined}
                                />
                                {giftedBySocket[sid] > 0 && (
                                  <GiftChip key={giftedBySocket[sid]} amount={giftedBySocket[sid]} />
                                )}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </motion.div>
                  )
                })()}

                {/* Partner identity overlay — only when there's a single opponent.
                    Stacked-duo layout renders its own per-tile pills above. */}
                <AnimatePresence>
                  {status === 'matched' && opponentSocketIds.length <= 1 && (
                    <motion.div
                      initial={{ opacity: 0, y: -6, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -4, scale: 0.97 }}
                      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                      className="absolute flex items-center gap-2" style={{ top: 16, left: 16, zIndex: 10 }}>
                      <ProfilePill
                        username={partnerUsername || 'Stranger'}
                        avatarUrl={partnerAvatar}
                        isOnline
                        isVerified={!!partnerEmailVerified}
                        isVip={!!partnerIsVip}
                        isPremium={!!partnerIsPremium}
                        country={partnerCountry}
                        friendStatus={(!user || !partnerUid) ? 'self' : friendReqSent ? 'pending' : 'none'}
                        onAddFriend={handleAddFriend}
                      />
                      {giftedBySocket[partnerSock] > 0 && (
                        <GiftChip key={giftedBySocket[partnerSock]} amount={giftedBySocket[partnerSock]} />
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Bottom fade */}
                <div className="absolute bottom-0 left-0 right-0 pointer-events-none z-[5]" style={{ height: 80, background: 'linear-gradient(to top, rgba(0,0,0,0.25) 0%, transparent 100%)' }} />
              </div>

              {/* Your video / Duo mode right panels — desktop only */}
              {isDuoMode ? (
                <div className="relative flex-1 overflow-hidden min-h-0 min-w-0" style={{ borderRadius: 20, background: 'linear-gradient(135deg, #0a0a1a 0%, #0d1020 50%, #080d18 100%)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  {/* TOP: Your camera — absolute top half */}
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: '50%', overflow: 'hidden', borderRadius: '20px 20px 0 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <video ref={localVideoDesktopRef} autoPlay muted playsInline style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                    {!hasCamera && (camBgImage
                      ? <img src={camBgImage} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, #0a0a1a 0%, #0d1020 50%, #080d18 100%)' }} />)}
                    {videoOff && hasCamera && <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)' }} />}
                    {(!hasCamera || videoOff) && (
                      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, zIndex: 5 }}>
                        {user?.avatar ? (
                          <img src={user.avatar} alt="" style={{ width: 52, height: 52, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(0,212,255,0.35)', boxShadow: '0 0 0 8px rgba(0,212,255,0.06), 0 0 32px rgba(0,212,255,0.12)' }} />
                        ) : (
                          <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'linear-gradient(135deg, rgba(0,212,255,0.15), rgba(124,58,237,0.15))', border: '2px solid rgba(0,212,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 900, color: '#00D4FF' }}>
                            {user?.username?.[0]?.toUpperCase() || 'Y'}
                          </div>
                        )}
                      </div>
                    )}
                    <div style={{ position: 'absolute', top: 12, left: 12, zIndex: 10 }}>
                      <ProfilePill
                        username={user ? user.username : 'You'}
                        avatarUrl={user?.avatar}
                        isOnline
                        isVerified={!!user?.emailVerified}
                        isVip={!!user?.isVip}
                        isPremium={!!user?.isPremium}
                        country={myCountry}
                        accentColor={user?.accentColor}
                        bannerGradient={user?.bannerGradient}
                        friendStatus="self"
                      />
                    </div>
                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 60, background: 'linear-gradient(to top, rgba(0,0,0,0.25) 0%, transparent 100%)', pointerEvents: 'none' }} />
                  </div>
                  {/* BOTTOM: Duo partner camera — absolute bottom half */}
                  <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, bottom: 0, overflow: 'hidden', borderRadius: '0 0 20px 20px', background: 'linear-gradient(135deg, #0a0a1a 0%, #0d1020 50%, #080d18 100%)' }}>
                    {/* Always render video element so stream attaches immediately when available */}
                    {(() => {
                      const mateId = mateSocketIds[0] || persistentMateId
                      const hasStream = !!remoteStreams[mateId]
                      return (
                        <>
                          {mateId && (
                            <video ref={(el) => { if (mateId) remoteVideoRefs.current[mateId] = el }} autoPlay playsInline
                              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: hasStream ? 1 : 0, transition: 'opacity 0.4s ease' }} />
                          )}
                          {!hasStream && (
                            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                              <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 40% 35%, rgba(0,212,255,0.07) 0%, transparent 65%)', pointerEvents: 'none' }} />
                              <motion.div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                                <motion.div style={{ position: 'absolute', width: 72, height: 72, borderRadius: '50%', border: '1px solid rgba(0,212,255,0.15)' }}
                                  animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.1, 0.5] }} transition={{ duration: 3, repeat: Infinity }} />
                                <motion.div style={{ position: 'absolute', width: 54, height: 54, borderRadius: '50%', border: '1px solid rgba(0,212,255,0.1)' }}
                                  animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.05, 0.3] }} transition={{ duration: 3, repeat: Infinity, delay: 0.4 }} />
                              </motion.div>
                              <div style={{ position: 'relative', zIndex: 1, width: 44, height: 44, borderRadius: '50%', background: 'rgba(0,212,255,0.1)', border: '1.5px solid rgba(0,212,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 900, color: '#00D4FF' }}>
                                D
                              </div>
                              <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.28)', margin: 0, position: 'relative', zIndex: 1 }}>Partner connecting…</p>
                            </div>
                          )}
                          {/* Duo partner pill */}
                          <div style={{ position: 'absolute', top: 12, left: 12, zIndex: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <ProfilePill
                              username="Partner"
                              isOnline={hasStream}
                              isVerified={false}
                              friendStatus="self"
                            />
                            {giftedBySocket[mateId] > 0 && (
                              <GiftChip key={giftedBySocket[mateId]} amount={giftedBySocket[mateId]} />
                            )}
                          </div>
                          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 60, background: 'linear-gradient(to top, rgba(0,0,0,0.25) 0%, transparent 100%)', pointerEvents: 'none' }} />
                        </>
                      )
                    })()}
                  </div>
                </div>
              ) : (
                <div className="flex-1 min-h-0 min-w-0" style={{ position: 'relative', overflow: 'hidden', borderRadius: 20, background: 'linear-gradient(135deg, #0a0a1a 0%, #0d1020 50%, #080d18 100%)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <video ref={localVideoDesktopRef} autoPlay muted playsInline className="w-full h-full object-cover" />

                  {!hasCamera && (camBgImage
                  ? <img src={camBgImage} alt="" className="absolute inset-0 w-full h-full object-cover" />
                  : <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, #0a0a1a 0%, #0d1020 50%, #080d18 100%)' }} />)}
                  {videoOff && hasCamera && <div className="absolute inset-0 bg-black/80" />}

                  {(!hasCamera || videoOff) && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3" style={{ zIndex: 5 }}>
                      <div style={{ position: 'relative', width: 88, height: 88 }}>
                        {user?.avatar ? (
                          <img src={user.avatar} alt="" style={{ position: 'relative', width: 88, height: 88, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(0,212,255,0.35)', boxShadow: '0 0 0 10px rgba(0,212,255,0.06), 0 0 48px rgba(0,212,255,0.12)' }} />
                        ) : (
                          <div style={{ position: 'relative', width: 88, height: 88, borderRadius: '50%', background: 'linear-gradient(135deg, rgba(0,212,255,0.15), rgba(124,58,237,0.15))', border: '2px solid rgba(0,212,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 34, fontWeight: 900, color: '#00D4FF', boxShadow: '0 0 40px rgba(0,212,255,0.1)' }}>
                            {user?.username ? user.username[0].toUpperCase() : 'Y'}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Your profile pill — top left, banner-styled, always shown */}
                  <div className="absolute" style={{ top: 16, left: 16, zIndex: 10 }}>
                    <ProfilePill
                      username={user ? user.username : 'You'}
                      avatarUrl={user?.avatar}
                      isOnline
                      isVerified={!!user?.emailVerified}
                      isVip={!!user?.isVip}
                      isPremium={!!user?.isPremium}
                      country={myCountry}
                      accentColor={user?.accentColor}
                      bannerGradient={user?.bannerGradient}
                      friendStatus="self"
                    />
                  </div>

                  {/* Chat overlay — inside right panel */}
                  <AnimatePresence>
                    {showChat && status === 'matched' && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                        className="flex flex-col"
                        style={{ position: 'absolute', bottom: 16, right: 16, width: 260, maxHeight: '50vh', zIndex: 30, background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, overflow: 'hidden' }}>
                        <FloatingChat messages={messages} partnerMessages={partnerMessages} messagesEndRef={messagesEndRef} onSend={handleSend} status={status} chatTab={chatTab} onTabChange={setActiveTab} unread={unread} partnerUnread={partnerUnread} showPartnerTab={isDuoMode} />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Bottom fade */}
                  <div className="absolute bottom-0 left-0 right-0 pointer-events-none z-[5]" style={{ height: 80, background: 'linear-gradient(to top, rgba(0,0,0,0.25) 0%, transparent 100%)' }} />
                </div>
              )}

          </div>
          )}
          </div>
          {/* Gender dropdown above bar */}
          <AnimatePresence>
            {showGenderDrop && (
              <motion.div
                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}
                transition={{ duration: 0.14 }}
                style={{ position: 'fixed', bottom: 72, left: '50%', transform: 'translateX(-220px)', zIndex: 9999, background: 'rgb(16,16,28)', border: '1px solid rgba(0,212,255,0.2)', borderRadius: 14, overflow: 'hidden', minWidth: 160, boxShadow: '0 -12px 40px rgba(0,0,0,0.7)' }}>
                {[['Both', 'both', true], ['Male', 'male', false], ['Female', 'female', false]].map(([label, val, free]) => (
                  <motion.button key={val} onClick={() => handleChatGender(val)}
                    whileHover={{ background: chatFilterGender === val ? 'rgba(0,212,255,0.2)' : 'rgba(255,255,255,0.08)' }}
                    style={{ width: '100%', textAlign: 'left', padding: '11px 16px', background: chatFilterGender === val ? 'rgba(0,212,255,0.15)' : 'transparent', border: 'none', cursor: 'pointer', fontSize: 13, color: chatFilterGender === val ? '#00D4FF' : 'rgba(255,255,255,0.8)', fontWeight: chatFilterGender === val ? 700 : 400, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                    {label}
                    {!free && !user?.isPremium && !user?.isVip && <Lock size={11} style={{ opacity: 0.4, flexShrink: 0 }} />}
                  </motion.button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Country dropdown above bar */}
          <AnimatePresence>
            {showChatCountryDrop && (
              <motion.div
                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}
                transition={{ duration: 0.14 }}
                style={{ position: 'fixed', bottom: 72, left: '50%', transform: 'translateX(-60px)', zIndex: 9999, background: 'rgb(16,16,28)', border: '1px solid rgba(0,212,255,0.2)', borderRadius: 14, overflow: 'hidden', width: 220, boxShadow: '0 -12px 40px rgba(0,0,0,0.7)' }}>
                <div style={{ padding: '8px 10px 6px', borderBottom: '1px solid rgba(0,212,255,0.1)' }}>
                  <input autoFocus value={chatCountrySearch} onChange={e => setChatCountrySearch(e.target.value)}
                    placeholder="Search country..."
                    style={{ width: '100%', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(0,212,255,0.14)', outline: 'none', color: 'white', fontSize: 12, padding: '6px 10px', borderRadius: 8, letterSpacing: '-0.01em' }} />
                </div>
                <div style={{ overflowY: 'auto', maxHeight: 200 }}>
                  {!chatCountrySearch && (
                    <motion.button onClick={() => handleChatCountry('')}
                      whileHover={{ background: 'rgba(0,212,255,0.1)' }}
                      style={{ width: '100%', textAlign: 'left', padding: '9px 14px', background: chatFilterCountry === '' ? 'rgba(0,212,255,0.12)' : 'transparent', border: 'none', cursor: 'pointer', fontSize: 12, color: chatFilterCountry === '' ? '#00D4FF' : 'rgba(160,180,255,0.7)', fontWeight: chatFilterCountry === '' ? 700 : 400, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Globe size={11} style={{ flexShrink: 0 }} /> Any country
                    </motion.button>
                  )}
                  {CHAT_COUNTRIES.filter(c => c.toLowerCase().includes(chatCountrySearch.toLowerCase())).map(c => (
                    <motion.button key={c} onClick={() => handleChatCountry(c)}
                      whileHover={{ background: 'rgba(0,212,255,0.1)' }}
                      style={{ width: '100%', textAlign: 'left', padding: '8px 14px', background: chatFilterCountry === c ? 'rgba(0,212,255,0.12)' : 'transparent', border: 'none', cursor: 'pointer', fontSize: 12, color: chatFilterCountry === c ? 'white' : 'rgba(200,215,255,0.7)', fontWeight: chatFilterCountry === c ? 700 : 400 }}>
                      {c}
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Desktop hide/show UI toggle — sits above the bar, stays put when
              the bar slides away so you can always bring it back. */}
          <button
            onClick={() => setUiHidden((v) => !v)}
            style={{
              position: 'fixed',
              left: '50%', transform: 'translateX(-50%)',
              bottom: uiHidden ? 16 : 76,
              height: 28, padding: '0 14px',
              borderRadius: 14,
              background: 'rgba(10,10,20,0.85)',
              backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
              border: '1px solid rgba(255,255,255,0.14)',
              color: 'rgba(255,255,255,0.7)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
              transition: 'bottom 300ms cubic-bezier(0.22,1,0.36,1)',
              zIndex: 52,
            }}>
            {uiHidden ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </button>

          {/* Desktop bottom bar */}
          <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, height: 64, background: 'rgba(10,10,20,0.9)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', borderTop: '1px solid rgba(255,255,255,0.06)', padding: '0 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 50, transform: `translateY(${uiHidden ? '100%' : '0'})`, opacity: uiHidden ? 0 : 1, transition: 'transform 300ms cubic-bezier(0.22,1,0.36,1), opacity 250ms ease', pointerEvents: uiHidden ? 'none' : 'auto' }}>

            {/* Far left: Report + mute + transient gift indicator */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <motion.button
                onClick={() => status === 'matched' && !reportSent && setShowReport(true)}
                whileHover={!reportSent && status === 'matched' ? { background: 'rgba(255,255,255,0.12)' } : {}}
                whileTap={!reportSent && status === 'matched' ? { scale: 0.93 } : {}}
                style={{ height: 40, display: 'flex', alignItems: 'center', gap: 6, padding: '0 18px', borderRadius: 50, background: reportSent ? 'rgba(0,212,255,0.08)' : 'rgba(255,255,255,0.06)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', border: reportSent ? '1px solid rgba(0,212,255,0.2)' : '1px solid rgba(255,255,255,0.10)', color: reportSent ? '#00D4FF' : 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: 600, cursor: !reportSent && status === 'matched' ? 'pointer' : 'default', transition: 'all 150ms ease', flexShrink: 0 }}>
                {reportSent ? <><ShieldCheck size={13} style={{ marginRight: 4 }} />Reported</> : <><Flag size={13} />Report</>}
              </motion.button>
              {/* Mute toggle — matches the mobile one. Red fill while muted. */}
              <motion.button
                onClick={toggleMute}
                whileHover={{ background: isMuted ? 'rgba(239,68,68,0.95)' : 'rgba(255,255,255,0.12)' }}
                whileTap={{ scale: 0.93 }}
                title={isMuted ? 'Unmute' : 'Mute'}
                style={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 50, background: isMuted ? 'rgba(239,68,68,0.85)' : 'rgba(255,255,255,0.06)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', border: isMuted ? '1px solid rgba(239,68,68,0.6)' : '1px solid rgba(255,255,255,0.10)', color: 'white', cursor: 'pointer', transition: 'background 150ms ease', flexShrink: 0 }}>
                {isMuted ? <MicOff size={15} /> : <Mic size={15} />}
              </motion.button>
              {/* Inline running total — coins gifted to you this match. Stays
                  visible while you're in the chat, animates on each new gift. */}
              <AnimatePresence>
                {giftsReceived > 0 && (
                  <motion.div
                    key="gift-total-chip"
                    initial={{ opacity: 0, x: -12, scale: 0.92 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: -8, scale: 0.94 }}
                    transition={{ type: 'spring', damping: 26, stiffness: 320 }}
                    style={{ height: 40, display: 'flex', alignItems: 'center', gap: 8, padding: '0 14px', borderRadius: 50, background: 'rgba(0,212,255,0.14)', border: '1px solid rgba(0,212,255,0.4)', boxShadow: '0 0 18px rgba(0,212,255,0.25)' }}>
                    <Gift size={15} style={{ color: '#00D4FF', filter: 'drop-shadow(0 0 4px rgba(0,212,255,0.8))', flexShrink: 0 }} />
                    <motion.span
                      key={giftsReceived}
                      initial={{ scale: 1.15 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', damping: 18, stiffness: 380 }}
                      style={{ color: '#7df0ff', fontSize: 13, fontWeight: 800, textShadow: '0 0 8px rgba(0,212,255,0.5)', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                      {giftsReceived.toLocaleString()} coins received
                    </motion.span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Center: Coins | Gender | Country | Skip */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>

              {/* Send Gift */}
              <motion.button
                onClick={openGiftFlow}
                whileHover={status === 'matched' ? { background: 'rgba(0,212,255,0.18)' } : {}}
                whileTap={status === 'matched' ? { scale: 0.93 } : {}}
                style={{ height: 40, display: 'flex', alignItems: 'center', gap: 6, padding: '0 16px', borderRadius: 50, background: 'rgba(0,212,255,0.1)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', border: '1px solid rgba(0,212,255,0.25)', color: '#00D4FF', fontSize: 13, fontWeight: 700, cursor: status === 'matched' ? 'pointer' : 'default', opacity: status === 'matched' ? 1 : 0.4, transition: 'background 150ms ease', flexShrink: 0 }}>
                <Gift size={14} /> Gift
              </motion.button>

              {/* Gender */}
              <motion.button
                onClick={() => { setShowGenderDrop(v => !v); setShowChatCountryDrop(false) }}
                whileTap={{ scale: 0.95 }}
                style={{ height: 40, display: 'flex', alignItems: 'center', gap: 6, padding: '0 16px', borderRadius: 50, background: chatFilterGender !== 'both' ? 'rgba(0,212,255,0.12)' : 'rgba(255,255,255,0.06)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', border: chatFilterGender !== 'both' ? '1px solid rgba(0,212,255,0.3)' : '1px solid rgba(255,255,255,0.10)', color: chatFilterGender !== 'both' ? '#00D4FF' : 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 150ms ease', flexShrink: 0 }}>
                {chatFilterGender === 'both' ? 'Both' : chatFilterGender === 'male' ? 'Male' : 'Female'}
                <ChevronDown size={12} style={{ transition: 'transform 150ms', transform: showGenderDrop ? 'rotate(180deg)' : 'none', flexShrink: 0 }} />
              </motion.button>

              {/* Country */}
              <motion.button
                onClick={() => { setShowChatCountryDrop(v => !v); setShowGenderDrop(false) }}
                whileTap={{ scale: 0.95 }}
                style={{ height: 40, display: 'flex', alignItems: 'center', gap: 6, padding: '0 16px', borderRadius: 50, background: chatFilterCountry ? 'rgba(0,212,255,0.12)' : 'rgba(255,255,255,0.06)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', border: chatFilterCountry ? '1px solid rgba(0,212,255,0.3)' : '1px solid rgba(255,255,255,0.10)', color: chatFilterCountry ? '#00D4FF' : 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 150ms ease', whiteSpace: 'nowrap', flexShrink: 0 }}>
                {user?.isVip ? <Globe size={12} style={{ flexShrink: 0 }} /> : <Lock size={12} style={{ opacity: 0.5, flexShrink: 0 }} />}
                {chatFilterCountry || 'Any Country'}
                <ChevronDown size={12} style={{ transition: 'transform 150ms', transform: showChatCountryDrop ? 'rotate(180deg)' : 'none', flexShrink: 0 }} />
              </motion.button>

              {/* Skip */}
              <motion.button
                onClick={status === 'matched' ? handleSkip : undefined}
                whileHover={status === 'matched' ? { scale: 1.04 } : {}}
                whileTap={status === 'matched' ? { scale: 0.93 } : {}}
                style={{ height: 40, padding: '0 28px', borderRadius: 50, background: status === 'matched' ? '#00D4FF' : 'rgba(0,212,255,0.1)', color: status === 'matched' ? '#0a0a0f' : 'rgba(0,212,255,0.3)', fontSize: 14, fontWeight: 700, border: 'none', cursor: status === 'matched' ? 'pointer' : 'default', boxShadow: status === 'matched' ? '0 0 24px rgba(0,212,255,0.4)' : 'none', transition: 'all 150ms ease', flexShrink: 0 }}>
                Skip
              </motion.button>

              {/* Cancel & Leave */}
              <motion.button
                onClick={() => {
                  destroyAllPeers()
                  socketRef.current?.emit('skip')
                  socketRef.current?.disconnect()
                  navigate('/')
                }}
                whileHover={{ background: 'rgba(255,50,50,0.25)', border: '1px solid rgba(255,50,50,0.5)' }}
                whileTap={{ scale: 0.93 }}
                style={{ height: 40, padding: '0 20px', borderRadius: 50, background: 'rgba(255,50,50,0.15)', border: '1px solid rgba(255,50,50,0.3)', color: '#FF4444', fontSize: 13, fontWeight: 600, cursor: 'pointer', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', transition: 'all 150ms ease', flexShrink: 0 }}>
                Leave
              </motion.button>
            </div>

            {/* Far right: Chat */}
            <motion.button
              onClick={toggleChat}
              whileHover={{ background: showChat ? 'rgba(0,212,255,0.22)' : 'rgba(255,255,255,0.12)' }}
              whileTap={{ scale: 0.93 }}
              style={{ position: 'relative', height: 40, display: 'flex', alignItems: 'center', gap: 6, padding: '0 18px', borderRadius: 50, background: showChat ? 'rgba(0,212,255,0.15)' : 'rgba(255,255,255,0.06)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', border: showChat ? '1px solid rgba(0,212,255,0.35)' : '1px solid rgba(255,255,255,0.10)', color: showChat ? '#00D4FF' : 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 150ms ease', flexShrink: 0 }}>
              <MessageSquare size={13} />
              Chat
              {(unread + partnerUnread) > 0 && !showChat && (
                <span style={{ position: 'absolute', top: -3, right: -3, width: 8, height: 8, background: '#00D4FF', borderRadius: '50%' }} />
              )}
            </motion.button>
          </div>
        </div>


        {/* ── Mobile chat floating overlay ── */}
        <AnimatePresence>
          {showChat && status === 'matched' && (
            <motion.div
              className="lg:hidden fixed z-[35] flex flex-col"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              style={{
                position: 'fixed',
                bottom: 80,
                left: 16,
                right: 16,
                maxHeight: 240,
                background: 'rgba(0,0,0,0.3)',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 20,
                overflow: 'hidden',
                zIndex: 40,
              }}
            >
              <FloatingChat messages={messages} partnerMessages={partnerMessages} messagesEndRef={messagesEndRef} onSend={handleSend} status={status} chatTab={chatTab} onTabChange={setActiveTab} unread={unread} partnerUnread={partnerUnread} showPartnerTab={isDuoMode} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Gift popup — brief arrival card on both mobile and desktop.
            A persistent running total also lives in the desktop bottom bar. */}
        <AnimatePresence>
          {giftPopup && (
            <div className="fixed inset-x-0 flex justify-center px-4 pointer-events-none"
              style={{
                bottom: uiHidden
                  ? 'max(48px, calc(env(safe-area-inset-bottom, 0px) + 44px))'
                  : 'max(112px, calc(env(safe-area-inset-bottom, 0px) + 108px))',
                zIndex: 44,
                transition: 'bottom 300ms cubic-bezier(0.22,1,0.36,1)',
              }}>
            <motion.div
              key={giftPopup.id}
              className="flex items-center gap-3 pointer-events-auto w-full max-w-sm cursor-pointer"
              onClick={() => setGiftPopup(null)} // tap/click to dismiss as a manual escape hatch
              initial={{ opacity: 0, y: 14, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.97 }}
              transition={{ type: 'spring', damping: 25, stiffness: 320 }}
              style={{
                padding: '12px 14px', borderRadius: 18,
                background: 'rgba(8,12,24,0.94)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(0,212,255,0.4)',
                boxShadow: '0 12px 38px rgba(0,0,0,0.6), 0 0 28px rgba(0,212,255,0.18)',
              }}
            >
              <div style={{ flexShrink: 0, width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <GiftIcon id={giftPopup.giftId} size={42} />
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <p style={{ color: '#8a90a6', fontSize: 11, fontWeight: 600, lineHeight: 1.3 }}>{giftPopup.who}</p>
                <p style={{ color: '#fff', fontSize: 14, fontWeight: 800, lineHeight: 1.3 }}>{giftPopup.giftName}</p>
                <p style={{ color: '#00D4FF', fontSize: 12, fontWeight: 700, lineHeight: 1.3, textShadow: '0 0 8px rgba(0,212,255,0.5)' }}>
                  {giftPopup.coins.toLocaleString()} coins
                </p>
              </div>
            </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* ── Report modal ── */}
        <AnimatePresence>
          {showReport && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/65 z-[54]" onClick={() => setShowReport(false)} />
              <div className="fixed inset-0 z-[56] flex items-center justify-center p-4 pointer-events-none">
              <motion.div initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.92 }} transition={{ type: 'spring', damping: 26, stiffness: 320 }}
                onClick={(e) => e.stopPropagation()}
                className="pointer-events-auto w-[min(320px,90vw)] bg-vybe-bg2 border border-vybe-border rounded-2xl p-5 shadow-purple">
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
              </div>
            </>
          )}
        </AnimatePresence>

    </div>
  )
}
