import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Camera, Edit2, Save, X, ArrowLeft, Copy, Check, Loader2, Shield, Crown, Zap, Flame, Trophy, MessageCircle, Twitter, Star, BadgeCheck, Gem, Sparkles, Music2, Globe, Target, Gift, Clock } from 'lucide-react'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import { Skeleton } from '../components/Skeleton'

const COUNTRY_FLAGS = {
  'United States': '🇺🇸', 'United Kingdom': '🇬🇧', 'Canada': '🇨🇦', 'Australia': '🇦🇺',
  'Germany': '🇩🇪', 'France': '🇫🇷', 'Japan': '🇯🇵', 'Brazil': '🇧🇷', 'India': '🇮🇳',
  'Mexico': '🇲🇽', 'Spain': '🇪🇸', 'Italy': '🇮🇹', 'Netherlands': '🇳🇱', 'Sweden': '🇸🇪',
}
const countryFlag = (c) => COUNTRY_FLAGS[c] || '🌍'

const INTERESTS_OPTIONS = [
  { id: 'music',       emoji: '🎵', label: 'Music'       },
  { id: 'gaming',      emoji: '🎮', label: 'Gaming'      },
  { id: 'travel',      emoji: '✈', label: 'Travel'       },
  { id: 'books',       emoji: '📚', label: 'Books'       },
  { id: 'movies',      emoji: '🎬', label: 'Movies'      },
  { id: 'food',        emoji: '🍕', label: 'Food'        },
  { id: 'fitness',     emoji: '💪', label: 'Fitness'     },
  { id: 'art',         emoji: '🎨', label: 'Art'         },
  { id: 'tech',        emoji: '💻', label: 'Tech'        },
  { id: 'sports',      emoji: '⚽', label: 'Sports'      },
  { id: 'nature',      emoji: '🌿', label: 'Nature'      },
  { id: 'photography', emoji: '📸', label: 'Photos'      },
  { id: 'fashion',     emoji: '👗', label: 'Fashion'     },
  { id: 'anime',       emoji: '🌸', label: 'Anime'       },
  { id: 'pets',        emoji: '🐾', label: 'Pets'        },
]

const PRONOUNS_OPTIONS = ['he/him', 'she/her', 'they/them', 'he/they', 'she/they', 'any', 'prefer not to say']

const BANNER_PRESETS = [
  { id: 'default',  name: 'Vybe',     style: 'linear-gradient(135deg, rgba(0,212,255,0.4) 0%, rgba(99,102,241,0.3) 40%, rgba(0,212,255,0.35) 100%)' },
  { id: 'sunset',   name: 'Sunset',   style: 'linear-gradient(135deg, rgba(234,88,12,0.5) 0%, rgba(236,72,153,0.35) 50%, rgba(0,212,255,0.3) 100%)' },
  { id: 'ocean',    name: 'Ocean',    style: 'linear-gradient(135deg, rgba(6,182,212,0.5) 0%, rgba(0,212,255,0.4) 50%, rgba(0,68,102,0.5) 100%)' },
  { id: 'forest',   name: 'Forest',   style: 'linear-gradient(135deg, rgba(0,212,255,0.45) 0%, rgba(0,212,255,0.35) 50%, rgba(6,95,70,0.5) 100%)' },
  { id: 'ember',    name: 'Ember',    style: 'linear-gradient(135deg, rgba(239,68,68,0.5) 0%, rgba(0,212,255,0.3) 50%, rgba(234,88,12,0.4) 100%)' },
  { id: 'aurora',   name: 'Aurora',   style: 'linear-gradient(135deg, rgba(99,102,241,0.5) 0%, rgba(0,212,255,0.3) 40%, rgba(236,72,153,0.35) 100%)' },
  { id: 'midnight', name: 'Midnight', style: 'linear-gradient(135deg, rgba(15,23,42,0.9) 0%, rgba(30,27,75,0.8) 50%, rgba(17,24,39,0.9) 100%)' },
  { id: 'rose',     name: 'Rose',     style: 'linear-gradient(135deg, rgba(244,63,94,0.45) 0%, rgba(251,113,133,0.3) 50%, rgba(190,18,60,0.4) 100%)' },
]

const ACCENT_COLORS = [
  { hex: '#00D4FF', name: 'Cyan'   },
  { hex: '#ec4899', name: 'Pink'   },
  { hex: '#f59e0b', name: 'Gold'   },
  { hex: '#4ade80', name: 'Green'  },
  { hex: '#a78bfa', name: 'Purple' },
  { hex: '#06b6d4', name: 'Teal'   },
]

const BADGE_DEFS = [
  { id: 'star',         name: 'Rising Star',    icon: '⭐', cost: 200,  desc: 'For those making their mark on Vybe',       rarity: 'common'    },
  { id: 'verified',     name: 'Verified Viber', icon: '✅', cost: 500,  desc: 'Gold checkmark — trusted community member', rarity: 'rare'      },
  { id: 'hot',          name: 'Hot',            icon: '🔥', cost: 300,  desc: "You're trending on Vybe",                   rarity: 'common'    },
  { id: 'royalty',      name: 'Royalty',        icon: '👑', cost: 1000, desc: 'The most prestigious badge on Vybe',        rarity: 'legendary' },
  { id: 'diamond',      name: 'Diamond Member', icon: '💎', cost: 800,  desc: 'Diamond tier — top 1% of Vybe',            rarity: 'epic'      },
  { id: 'rainbow',      name: 'Rainbow',        icon: '🌈', cost: 400,  desc: 'Colorful, vibrant and unmissable',          rarity: 'rare'      },
  { id: 'entertainer',  name: 'Entertainer',    icon: '🎭', cost: 350,  desc: 'For charismatic and entertaining chatters', rarity: 'uncommon'  },
  { id: 'globetrotter', name: 'Globetrotter',   icon: '🌍', cost: 450,  desc: 'Chatted with people from many countries',   rarity: 'rare'      },
  { id: 'flash',        name: 'Flash',          icon: '⚡', cost: 250,  desc: 'Fast connector — always in the action',     rarity: 'uncommon'  },
  { id: 'sharp',        name: 'Sharp',          icon: '🎯', cost: 300,  desc: 'Precision and focus — a premium badge',     rarity: 'common'    },
]

const RARITY_STYLE = {
  common:    { label: 'Common',    color: '#888899', bg: 'rgba(156,163,175,0.1)',  border: 'rgba(156,163,175,0.25)'  },
  uncommon:  { label: 'Uncommon',  color: '#4ade80', bg: 'rgba(74,222,128,0.1)',   border: 'rgba(74,222,128,0.25)'   },
  rare:      { label: 'Rare',      color: '#00B8E0', bg: 'rgba(0,184,224,0.1)',    border: 'rgba(0,184,224,0.25)'    },
  epic:      { label: 'Epic',      color: '#c084fc', bg: 'rgba(192,132,252,0.1)',  border: 'rgba(192,132,252,0.25)'  },
  legendary: { label: 'Legendary', color: '#00B8E0', bg: 'rgba(0,184,224,0.12)',  border: 'rgba(0,184,224,0.35)'    },
}

const BADGE_ICONS = {
  star: Star, verified: BadgeCheck, hot: Flame, royalty: Crown,
  diamond: Gem, rainbow: Sparkles, entertainer: Music2,
  globetrotter: Globe, flash: Zap, sharp: Target,
}

function SysBadge({ icon: Icon, label, color }) {
  return (
    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold ${color}`}>
      {Icon && <Icon size={11} />}{label}
    </div>
  )
}

const TikTokIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.34 6.34 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.17 8.17 0 0 0 4.78 1.52V6.76a4.84 4.84 0 0 1-1.01-.07z"/>
  </svg>
)

export default function ProfilePage() {
  const { id }          = useParams()
  const { user: me, updateUser, loading: authLoading } = useAuth()
  const navigate        = useNavigate()
  const isOwn           = !!me && (String(id) === String(me?.id) || String(id) === String(me?._id))

  const [profile,       setProfile]       = useState(null)
  const [loading,       setLoading]       = useState(true)
  const [editing,       setEditing]       = useState(false)
  const [saving,        setSaving]        = useState(false)
  const [saveError,     setSaveError]     = useState('')
  const [copied,        setCopied]        = useState(false)
  const [referral,      setReferral]      = useState(null)
  const [ownedBadgeIds, setOwnedBadgeIds] = useState([])
  const [editForm,      setEditForm]      = useState({
    bio: '', displayName: '', pronouns: '', gender: 'other', country: '',
    interests: [], socialLinks: { instagram: '', tiktok: '', twitter: '' },
    privacyShowBio: true, privacyShowCountry: true,
    accentColor: '', bannerGradient: '', bannerImage: '',
  })

  const fileRef       = useRef(null)
  const bannerFileRef = useRef(null)

  useEffect(() => {
    if (authLoading) return
    if (!me) { navigate('/auth'); return }
    const fetch = async () => {
      setLoading(true)
      try {
        if (isOwn) {
          const { data } = await axios.get('/api/user/me')
          setProfile(data.user)
          setEditForm({
            bio:                data.user.bio || '',
            displayName:        data.user.displayName || '',
            pronouns:           data.user.pronouns || '',
            gender:             data.user.gender || 'other',
            country:            data.user.country || '',
            interests:          data.user.interests || [],
            socialLinks:        data.user.socialLinks || { instagram: '', tiktok: '', twitter: '' },
            privacyShowBio:     data.user.privacyShowBio ?? true,
            privacyShowCountry: data.user.privacyShowCountry ?? true,
            accentColor:        data.user.accentColor || '',
            bannerGradient:     data.user.bannerGradient || '',
            bannerImage:        data.user.bannerImage || '',
          })
          axios.get('/api/referral/info').then(r => setReferral(r.data)).catch(() => {})
          axios.get('/api/badges/mine').then(r => setOwnedBadgeIds(r.data.owned || [])).catch(() => {})
        } else {
          const { data } = await axios.get(`/api/user/${id}/profile`)
          setProfile(data.user)
        }
      } catch (err) {
        if (err.response?.status === 404 || err.response?.status === 401 || err.response?.status === 403) navigate('/')
        else navigate('/')
      }
      setLoading(false)
    }
    fetch()
  }, [id, authLoading]) // eslint-disable-line

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 500000) { setSaveError('Image must be under 500KB'); setTimeout(() => setSaveError(''), 4000); return }
    const reader = new FileReader()
    reader.onload = (ev) => {
      setProfile(p => ({ ...p, avatar: ev.target.result }))
      setEditForm(f => ({ ...f, avatar: ev.target.result }))
    }
    reader.readAsDataURL(file)
  }

  const handleBannerChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2000000) { setSaveError('Banner image must be under 2MB'); setTimeout(() => setSaveError(''), 4000); return }
    const reader = new FileReader()
    reader.onload = (ev) => {
      setProfile(p => ({ ...p, bannerImage: ev.target.result }))
      setEditForm(f => ({ ...f, bannerImage: ev.target.result }))
    }
    reader.readAsDataURL(file)
  }

  const toggleInterest = (intId) => {
    setEditForm(f => {
      const cur = f.interests || []
      if (cur.includes(intId)) return { ...f, interests: cur.filter(i => i !== intId) }
      if (cur.length >= 5) return f
      return { ...f, interests: [...cur, intId] }
    })
  }

  const handleSave = async () => {
    setSaving(true); setSaveError('')
    try {
      const [profileRes] = await Promise.all([
        axios.put('/api/user/profile', {
          bio:                editForm.bio,
          displayName:        editForm.displayName,
          pronouns:           editForm.pronouns,
          gender:             editForm.gender,
          country:            editForm.country,
          interests:          editForm.interests,
          socialLinks:        editForm.socialLinks,
          privacyShowBio:     editForm.privacyShowBio,
          privacyShowCountry: editForm.privacyShowCountry,
          avatar:             editForm.avatar || profile.avatar,
          bannerImage:        editForm.bannerImage,
        }),
        axios.put('/api/user/cosmetics', {
          accentColor: editForm.accentColor, bannerGradient: editForm.bannerGradient,
        }).catch(() => {}),
      ])
      const updated = {
        ...profileRes.data.user,
        accentColor:   editForm.accentColor,
        bannerGradient: editForm.bannerGradient,
        bannerImage:   editForm.bannerImage,
        displayName:   editForm.displayName,
        pronouns:      editForm.pronouns,
        interests:     editForm.interests,
        socialLinks:   editForm.socialLinks,
      }
      setProfile(p => ({ ...p, ...updated }))
      if (updateUser) updateUser({ ...me, ...updated })
      setEditing(false)
    } catch (err) {
      setSaveError(err.response?.data?.error || 'Failed to save. Please try again.')
    }
    setSaving(false)
  }

  const copyReferral = () => {
    navigator.clipboard?.writeText(referral?.referralLink || referral?.code || '')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const lastSeenText = (ts) => {
    if (!ts) return null
    const mins = Math.floor((Date.now() - new Date(ts).getTime()) / 60000)
    if (mins < 1) return 'Just now'
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    return `${Math.floor(hrs / 24)}d ago`
  }

  if (loading) return (
    <div className="min-h-screen animated-bg font-space">
      <Navbar />
      <div className="pt-24 pb-12 px-4 max-w-2xl mx-auto">
        <div className="glass-card rounded-3xl overflow-hidden">
          <Skeleton className="h-36 w-full" rounded="rounded-none" />
          <div className="px-6 pb-6">
            <div className="flex items-end gap-4 -mt-12 mb-5">
              <Skeleton className="w-24 h-24 flex-shrink-0" rounded="rounded-2xl" />
              <div className="flex-1 pb-1 space-y-2">
                <Skeleton className="h-5 w-36" rounded="rounded" />
                <Skeleton className="h-3.5 w-24" rounded="rounded" />
              </div>
            </div>
            <div className="space-y-3">
              <Skeleton className="h-4 w-full" rounded="rounded" />
              <Skeleton className="h-4 w-3/4" rounded="rounded" />
              <div className="grid grid-cols-4 gap-2.5 pt-2">
                {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-16" rounded="rounded-xl" />)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  if (!profile) return (
    <div className="min-h-screen animated-bg font-space">
      <Navbar />
      <div className="pt-32 flex flex-col items-center justify-center px-4 text-center">
        <p className="text-white/40 text-sm">Profile not found.</p>
        <button onClick={() => navigate('/')} className="mt-4 px-5 py-2.5 rounded-xl text-sm text-vybe-muted border border-vybe-border hover:text-white transition-colors">Back to Home</button>
      </div>
    </div>
  )

  const joinDate        = profile.createdAt ? new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : ''
  const equippedBadges  = profile.equippedBadges || []
  const profileInterests = profile.interests || []
  const profileSocial   = profile.socialLinks || {}
  const hasSocial       = profileSocial.instagram || profileSocial.tiktok || profileSocial.twitter

  const activeImage  = editing ? editForm.bannerImage : profile.bannerImage
  const preset       = BANNER_PRESETS.find(b => b.id === (editing ? editForm.bannerGradient : profile.bannerGradient)) || BANNER_PRESETS[0]

  return (
    <div className="min-h-screen animated-bg font-space">
      <style>{`@keyframes borderPulse{0%,100%{box-shadow:0 0 0 2px #ec4899,0 0 0 4px #06b6d4,0 0 20px rgba(0,212,255,.5)}50%{box-shadow:0 0 0 2px #06b6d4,0 0 0 4px #00B8E0,0 0 28px rgba(0,212,255,.9)}}`}</style>
      <Navbar />
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-vybe-purple/8 rounded-full blur-3xl" />
      </div>

      {saveError && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl text-sm font-semibold text-red-400 border border-red-500/25 backdrop-blur-sm"
          style={{ background: 'rgba(239,68,68,0.12)', whiteSpace: 'nowrap' }}>
          {saveError}
        </div>
      )}

      <div className="pt-24 pb-12 px-4 max-w-2xl mx-auto relative z-10">
        <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-vybe-muted hover:text-white transition-colors mb-6 text-sm">
          <ArrowLeft size={15} /> Back
        </button>

        <div className="glass-card rounded-3xl overflow-hidden">
          {/* Banner */}
          <div className="h-36 relative overflow-hidden transition-all duration-500" style={{ background: preset.style }}>
            {activeImage && <img src={activeImage} alt="" className="absolute inset-0 w-full h-full object-cover" />}
            <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'200\' height=\'200\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\'/%3E%3CfeColorMatrix type=\'saturate\' values=\'0\'/%3E%3C/filter%3E%3Crect width=\'200\' height=\'200\' filter=\'url(%23n)\' opacity=\'0.04\'/%3E%3C/svg%3E")', mixBlendMode: 'overlay' }} />
            {isOwn && editing && (
              <button onClick={() => bannerFileRef.current?.click()}
                className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 opacity-0 hover:opacity-100 transition-opacity"
                style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(2px)' }}>
                <Camera size={20} className="text-white drop-shadow" />
                <span className="text-white text-xs font-bold drop-shadow">Change Banner</span>
              </button>
            )}
          </div>

          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          <input ref={bannerFileRef} type="file" accept="image/*" className="hidden" onChange={handleBannerChange} />

          <div className="px-6 pb-8">
            {/* Avatar row */}
            <div className="flex items-end justify-between -mt-12 mb-5">
              <div className="relative">
                <div
                  className="w-24 h-24 rounded-2xl border-4 overflow-hidden bg-gradient-to-br from-vybe-purple to-cyan-400 flex items-center justify-center flex-shrink-0"
                  style={{
                    borderColor: profile.borderColor || (profile.accentColor ? `${profile.accentColor}55` : '#0a0a0f'),
                    boxShadow: profile.animatedBorder
                      ? '0 0 0 2px #ec4899,0 0 0 4px #06b6d4,0 0 20px rgba(0,212,255,.5)'
                      : profile.accentColor ? `0 0 16px ${profile.accentColor}66`
                      : profile.borderColor ? `0 0 12px ${profile.borderColor}88` : undefined,
                    animation: profile.animatedBorder ? 'borderPulse 2s ease-in-out infinite' : undefined,
                  }}
                >
                  {profile.avatar
                    ? <img src={profile.avatar} alt="" className="w-full h-full object-cover" />
                    : <span className="text-3xl font-black text-white">{profile.username?.[0]?.toUpperCase()}</span>}
                </div>
                {isOwn && editing && (
                  <button onClick={() => fileRef.current?.click()}
                    className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-vybe-purple border-2 border-vybe-bg flex items-center justify-center">
                    <Camera size={13} className="text-white" />
                  </button>
                )}
                {profile.isOnline && (
                  <span className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-cyan-500 border-2 border-vybe-bg" title="Online" />
                )}
              </div>
              <div className="flex items-center gap-2 mb-1">
                {!isOwn && (
                  <button onClick={() => navigate('/wallet')}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold transition-opacity hover:opacity-80"
                    style={{ background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.25)', color: '#00B8E0' }}>
                    <Gift size={14} /> Send Gift
                  </button>
                )}
                {isOwn && !editing && (
                  <button onClick={() => { setEditing(true); setSaveError('') }}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-vybe-border text-vybe-muted hover:text-white hover:border-vybe-purple/40 text-sm transition-all">
                    <Edit2 size={13} /> Edit Profile
                  </button>
                )}
              </div>
            </div>

            {/* Name + pronouns */}
            <div className="mb-3">
              {profile.displayName && (
                <h1 className="text-2xl font-black text-white leading-tight">{profile.displayName}</h1>
              )}
              <div className="flex items-center flex-wrap gap-2 mt-0.5">
                <span className={profile.displayName ? 'text-base font-semibold text-white/50' : 'text-2xl font-black text-white'}>
                  {profile.displayName ? `@${profile.username}` : profile.username}
                </span>
                {profile.emailVerified && <Shield size={15} className="text-cyan-400" title="Verified" />}
                {profile.pronouns && (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold"
                    style={{ background: 'rgba(255,255,255,0.06)', color: '#888899', border: '1px solid rgba(255,255,255,0.1)' }}>
                    {profile.pronouns}
                  </span>
                )}
              </div>
              <p className="text-vybe-muted text-sm mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                {profile.country && <span>{countryFlag(profile.country)} {profile.country}</span>}
                {profile.country && joinDate && <span className="opacity-30">·</span>}
                {joinDate && <span>Joined {joinDate}</span>}
                {profile.isOnline ? (
                  <><span className="opacity-30">·</span><span className="flex items-center gap-1.5"><span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" /><span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400" /></span><span className="text-cyan-400 font-semibold text-xs">Online now</span></span></>
                ) : profile.lastSeen ? (
                  <><span className="opacity-30">·</span><span className="flex items-center gap-1"><Clock size={11} />{lastSeenText(profile.lastSeen)}</span></>
                ) : null}
              </p>
            </div>

            {/* System badges */}
            <div className="flex flex-wrap gap-2 mb-2">
              {profile.isPremium && !profile.isVip && <SysBadge icon={Zap}           label="Basic"                              color="border-cyan-400/30 text-cyan-400 bg-cyan-400/10" />}
              {profile.isVip                         && <SysBadge icon={Crown}         label="VIP"                                color="border-yellow-500/30 text-cyan-400 bg-cyan-500/10" />}
              {profile.emailVerified                 && <SysBadge icon={Shield}        label="Verified"                           color="border-cyan-400/30 text-cyan-400 bg-cyan-400/10" />}
              {(profile.loginStreak ?? 0) >= 7       && <SysBadge icon={Flame}         label={`${profile.loginStreak}d Streak`}   color="border-orange-500/30 text-orange-400 bg-orange-500/10" />}
              {(profile.longestStreak ?? 0) >= 30    && <SysBadge icon={Trophy}        label="Veteran"                            color="border-yellow-500/30 text-cyan-300 bg-cyan-500/10" />}
              {(profile.totalChats ?? 0) >= 100      && <SysBadge icon={MessageCircle} label="Chatter"                            color="border-cyan-400/30 text-cyan-400 bg-cyan-500/10" />}
            </div>

            {/* Equipped custom badges */}
            {equippedBadges.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-4">
                {equippedBadges.map(bid => {
                  const def = BADGE_DEFS.find(b => b.id === bid); if (!def) return null
                  const rs = RARITY_STYLE[def.rarity]; const Ic = BADGE_ICONS[def.id]
                  return (
                    <span key={bid} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold"
                      style={{ background: rs.bg, border: `1px solid ${rs.border}`, color: rs.color }}>
                      {Ic && <Ic size={11} />}{def.name}
                    </span>
                  )
                })}
              </div>
            )}

            {/* Bio */}
            {!editing && profile.bio && (
              <p className="text-white/80 text-sm leading-relaxed mb-4 px-1">{profile.bio}</p>
            )}

            {/* Interests */}
            {!editing && profileInterests.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {profileInterests.map(intId => {
                  const opt = INTERESTS_OPTIONS.find(o => o.id === intId); if (!opt) return null
                  return (
                    <span key={intId} className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
                      style={{ background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.18)', color: '#00B8E0' }}>
                      {opt.emoji} {opt.label}
                    </span>
                  )
                })}
              </div>
            )}

            {/* Social links */}
            {!editing && hasSocial && (
              <div className="flex flex-wrap items-center gap-2 mb-5">
                {profileSocial.instagram && (
                  <a href={`https://instagram.com/${profileSocial.instagram}`} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold hover:opacity-80 transition-opacity"
                    style={{ background: 'rgba(236,72,153,0.1)', border: '1px solid rgba(236,72,153,0.2)', color: '#ec4899' }}>
                    IG @{profileSocial.instagram}
                  </a>
                )}
                {profileSocial.tiktok && (
                  <a href={`https://tiktok.com/@${profileSocial.tiktok}`} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold hover:opacity-80 transition-opacity"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0' }}>
                    <TikTokIcon size={11} /> @{profileSocial.tiktok}
                  </a>
                )}
                {profileSocial.twitter && (
                  <a href={`https://twitter.com/${profileSocial.twitter}`} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold hover:opacity-80 transition-opacity"
                    style={{ background: 'rgba(29,161,242,0.1)', border: '1px solid rgba(29,161,242,0.2)', color: '#1da1f2' }}>
                    <Twitter size={11} /> @{profileSocial.twitter}
                  </a>
                )}
              </div>
            )}

            {/* Edit form */}
            {editing && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 mb-6 mt-2">
                {/* Display Name */}
                <div>
                  <label className="block text-[10px] font-bold text-vybe-muted uppercase tracking-wider mb-1">Display Name</label>
                  <input value={editForm.displayName}
                    onChange={e => setEditForm(f => ({ ...f, displayName: e.target.value.slice(0, 30) }))}
                    placeholder="Your display name (optional)"
                    className="w-full px-3 py-2.5 bg-vybe-bg border border-vybe-border rounded-xl text-white text-sm placeholder-vybe-muted focus:border-vybe-purple focus:outline-none" />
                </div>

                {/* Pronouns + Gender */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-vybe-muted uppercase tracking-wider mb-1">Pronouns</label>
                    <select value={editForm.pronouns} onChange={e => setEditForm(f => ({ ...f, pronouns: e.target.value }))}
                      className="w-full px-3 py-2.5 bg-vybe-bg border border-vybe-border rounded-xl text-white text-sm focus:border-vybe-purple focus:outline-none">
                      <option value="">Not specified</option>
                      {PRONOUNS_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-vybe-muted uppercase tracking-wider mb-1">Gender</label>
                    <select value={editForm.gender} onChange={e => setEditForm(f => ({ ...f, gender: e.target.value }))}
                      className="w-full px-3 py-2.5 bg-vybe-bg border border-vybe-border rounded-xl text-white text-sm focus:border-vybe-purple focus:outline-none">
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                {/* Bio */}
                <div>
                  <label className="block text-[10px] font-bold text-vybe-muted uppercase tracking-wider mb-1">Bio <span className="normal-case font-normal">(max 100)</span></label>
                  <textarea value={editForm.bio}
                    onChange={e => setEditForm(f => ({ ...f, bio: e.target.value.slice(0, 100) }))}
                    rows={2} placeholder="Tell people about yourself..."
                    className="w-full px-3 py-2.5 bg-vybe-bg border border-vybe-border rounded-xl text-white text-sm placeholder-vybe-muted focus:border-vybe-purple focus:outline-none resize-none" />
                  <p className="text-vybe-muted text-[10px] text-right mt-0.5">{editForm.bio.length}/100</p>
                </div>

                {/* Country */}
                <div>
                  <label className="block text-[10px] font-bold text-vybe-muted uppercase tracking-wider mb-1">Country</label>
                  <input value={editForm.country}
                    onChange={e => setEditForm(f => ({ ...f, country: e.target.value }))}
                    placeholder="e.g. United Kingdom"
                    className="w-full px-3 py-2.5 bg-vybe-bg border border-vybe-border rounded-xl text-white text-sm placeholder-vybe-muted focus:border-vybe-purple focus:outline-none" />
                </div>

                {/* Interests */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-[10px] font-bold text-vybe-muted uppercase tracking-wider">Interests <span className="normal-case font-normal">(max 5)</span></label>
                    <span className="text-[10px] text-vybe-muted">{(editForm.interests || []).length}/5</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {INTERESTS_OPTIONS.map(opt => {
                      const sel = (editForm.interests || []).includes(opt.id)
                      const maxed = !sel && (editForm.interests || []).length >= 5
                      return (
                        <button key={opt.id} type="button" onClick={() => toggleInterest(opt.id)} disabled={maxed}
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all disabled:opacity-40"
                          style={{
                            background: sel ? 'rgba(0,212,255,0.15)' : 'rgba(255,255,255,0.04)',
                            border: `1px solid ${sel ? 'rgba(0,212,255,0.4)' : 'rgba(255,255,255,0.1)'}`,
                            color: sel ? '#00D4FF' : '#888899',
                          }}>
                          {opt.emoji} {opt.label}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Social links */}
                <div>
                  <label className="block text-[10px] font-bold text-vybe-muted uppercase tracking-wider mb-2">Social Links</label>
                  <div className="space-y-2">
                    {[
                      { key: 'instagram', label: 'Instagram', color: '#ec4899' },
                      { key: 'tiktok',    label: 'TikTok',    color: '#e2e8f0' },
                      { key: 'twitter',   label: 'Twitter',   color: '#1da1f2' },
                    ].map(({ key, label, color }) => (
                      <div key={key} className="flex items-center gap-2">
                        <span className="text-[10px] font-bold w-16 flex-shrink-0" style={{ color }}>{label}</span>
                        <div className="flex-1 flex items-center bg-vybe-bg border border-vybe-border rounded-xl overflow-hidden focus-within:border-vybe-purple/60 transition-colors">
                          <span className="px-3 text-vybe-muted text-sm">@</span>
                          <input value={(editForm.socialLinks || {})[key] || ''}
                            onChange={e => setEditForm(f => ({ ...f, socialLinks: { ...(f.socialLinks || {}), [key]: e.target.value } }))}
                            placeholder="username"
                            className="flex-1 py-2 pr-3 bg-transparent text-white text-sm placeholder-vybe-muted focus:outline-none" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Privacy toggles */}
                <div className="space-y-2">
                  {[
                    { key: 'privacyShowBio',     label: 'Show bio publicly' },
                    { key: 'privacyShowCountry', label: 'Show country publicly' },
                  ].map(({ key, label }) => (
                    <label key={key} className="flex items-center gap-2.5 cursor-pointer">
                      <input type="checkbox" checked={editForm[key]}
                        onChange={e => setEditForm(f => ({ ...f, [key]: e.target.checked }))}
                        className="w-4 h-4 accent-purple-500 rounded" />
                      <span className="text-sm text-vybe-muted">{label}</span>
                    </label>
                  ))}
                </div>

                {/* Banner presets */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-[10px] font-bold text-vybe-muted uppercase tracking-wider">Profile Banner</label>
                    <button type="button" onClick={() => bannerFileRef.current?.click()}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold text-vybe-muted hover:text-white border border-vybe-border hover:border-vybe-purple/40 transition-all">
                      <Camera size={10} /> Upload Photo
                    </button>
                  </div>
                  {editForm.bannerImage && (
                    <div className="flex items-center gap-2 mb-2 px-3 py-2 rounded-xl border border-vybe-border" style={{ background: 'rgba(0,212,255,0.07)' }}>
                      <img src={editForm.bannerImage} alt="" className="w-8 h-8 rounded-lg object-cover flex-shrink-0" />
                      <span className="text-xs text-white/70 flex-1">Custom photo</span>
                      <button type="button" onClick={() => { setEditForm(f => ({ ...f, bannerImage: '' })); setProfile(p => ({ ...p, bannerImage: '' })) }}
                        className="text-vybe-muted hover:text-red-400 transition-colors">
                        <X size={12} />
                      </button>
                    </div>
                  )}
                  <div className="grid grid-cols-4 gap-2">
                    {BANNER_PRESETS.map(b => {
                      const active = (editForm.bannerGradient || 'default') === b.id || (!editForm.bannerGradient && b.id === 'default')
                      return (
                        <button key={b.id} type="button"
                          onClick={() => setEditForm(f => ({ ...f, bannerGradient: b.id === 'default' ? '' : b.id }))}
                          className="relative h-10 rounded-lg overflow-hidden transition-all"
                          style={{ background: b.style, boxShadow: active ? '0 0 0 2px #a78bfa' : undefined }}
                          title={b.name}>
                          {active && <span className="absolute inset-0 flex items-center justify-center"><Check size={12} className="text-white drop-shadow" /></span>}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Accent color */}
                <div>
                  <label className="block text-[10px] font-bold text-vybe-muted uppercase tracking-wider mb-2">Accent Color</label>
                  <div className="flex gap-2 flex-wrap">
                    <button type="button" onClick={() => setEditForm(f => ({ ...f, accentColor: '' }))}
                      className="w-7 h-7 rounded-full border-2 transition-all flex items-center justify-center"
                      style={{ background: '#1a1a2e', borderColor: !editForm.accentColor ? '#a78bfa' : 'rgba(255,255,255,0.15)' }}>
                      {!editForm.accentColor && <Check size={11} className="text-white/60" />}
                    </button>
                    {ACCENT_COLORS.map(c => (
                      <button key={c.name} type="button" onClick={() => setEditForm(f => ({ ...f, accentColor: c.hex }))}
                        className="w-7 h-7 rounded-full border-2 transition-all"
                        style={{ background: c.hex, borderColor: editForm.accentColor === c.hex ? '#fff' : 'transparent',
                          boxShadow: editForm.accentColor === c.hex ? `0 0 8px ${c.hex}88` : undefined }}
                        title={c.name} />
                    ))}
                  </div>
                </div>

                {/* Save / cancel */}
                <div className="flex gap-2 pt-1">
                  <button onClick={handleSave} disabled={saving}
                    className="flex-1 py-2.5 rounded-xl btn-purple text-white font-black text-sm flex items-center justify-center gap-2 disabled:opacity-60">
                    {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button onClick={() => setEditing(false)}
                    className="px-4 py-2.5 rounded-xl border border-vybe-border text-vybe-muted hover:text-white text-sm transition-colors">
                    <X size={14} />
                  </button>
                </div>
              </motion.div>
            )}

            {/* Stats grid */}
            <div className="grid grid-cols-4 gap-2 mb-5">
              {[
                { label: 'Chats',     value: profile.totalChats || 0,                                      Icon: MessageCircle },
                { label: 'Streak',    value: `${profile.loginStreak || 0}d`,                               Icon: Flame         },
                { label: 'Countries', value: profile.countriesCount || profile.uniqueCountries || 0,       Icon: Globe         },
                { label: 'Gifts',     value: profile.giftsReceived || 0,                                   Icon: Gift          },
              ].map(({ label, value, Icon }) => (
                <div key={label} className="bg-vybe-card border border-vybe-border rounded-2xl p-2.5 text-center">
                  <div className="flex justify-center mb-1"><Icon size={14} className="text-vybe-purple-light opacity-70" /></div>
                  <p className="text-white font-black text-base leading-none mb-0.5">{value}</p>
                  <p className="text-vybe-muted text-[10px]">{label}</p>
                </div>
              ))}
            </div>

            {/* Badge collection (own profile) */}
            {isOwn && ownedBadgeIds.length > 0 && (
              <div className="mb-5">
                <h3 className="text-sm font-black text-white mb-3 flex items-center gap-2">
                  <Sparkles size={14} className="text-cyan-400" /> Badge Collection
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {BADGE_DEFS.filter(b => ownedBadgeIds.includes(b.id)).map(def => {
                    const rs = RARITY_STYLE[def.rarity]; const Ic = BADGE_ICONS[def.id]
                    const equipped = equippedBadges.includes(def.id)
                    return (
                      <div key={def.id} className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl"
                        style={{ background: rs.bg, border: `1px solid ${rs.border}` }}>
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ background: `${rs.color}20`, border: `1px solid ${rs.border}` }}>
                          {Ic ? <Ic size={16} style={{ color: rs.color }} /> : <span className="text-base">{def.icon}</span>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold truncate" style={{ color: rs.color }}>{def.name}</p>
                          <p className="text-[10px] text-vybe-muted">{rs.label}</p>
                        </div>
                        {equipped && (
                          <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full flex-shrink-0"
                            style={{ background: 'rgba(0,212,255,0.15)', color: '#00B8E0', border: '1px solid rgba(0,212,255,0.25)' }}>
                            ON
                          </span>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Referral (own profile only) */}
            {isOwn && referral && (
              <div className="rounded-2xl p-4" style={{ background: 'rgba(0,212,255,0.06)', border: '1px solid rgba(0,212,255,0.14)' }}>
                <p className="text-[10px] font-bold text-vybe-muted uppercase tracking-wider mb-2">Your Referral Code</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-sm font-black text-cyan-400 tracking-widest">{referral.code || referral.referralCode}</code>
                  <button onClick={copyReferral}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                    style={{
                      background: copied ? 'rgba(74,222,128,0.15)' : 'rgba(0,212,255,0.1)',
                      border: `1px solid ${copied ? 'rgba(74,222,128,0.3)' : 'rgba(0,212,255,0.25)'}`,
                      color: copied ? '#4ade80' : '#00B8E0',
                    }}>
                    {copied ? <Check size={12} /> : <Copy size={12} />} {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                {referral.referralLink && (
                  <p className="text-[11px] text-vybe-muted mt-1.5 truncate">{referral.referralLink}</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
