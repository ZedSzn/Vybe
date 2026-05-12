import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Camera, Edit2, Save, X, ArrowLeft, Copy, Check, Loader2, Shield, Crown, Zap, Flame, Trophy, MessageCircle, Lock, MessageSquare, Twitter, Star, BadgeCheck, Gem, Sparkles, Music2, Globe, Target } from 'lucide-react'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import { VybeCoin } from '../components/VybeCoin'
import { Skeleton } from '../components/Skeleton'
import EmptyStateIllustration from '../components/EmptyStateIllustration'

const COUNTRY_FLAGS = {
  'United States': '🇺🇸', 'United Kingdom': '🇬🇧', 'Canada': '🇨🇦', 'Australia': '🇦🇺',
  'Germany': '🇩🇪', 'France': '🇫🇷', 'Japan': '🇯🇵', 'Brazil': '🇧🇷', 'India': '🇮🇳',
  'Mexico': '🇲🇽', 'Spain': '🇪🇸', 'Italy': '🇮🇹', 'Netherlands': '🇳🇱', 'Sweden': '🇸🇪',
}
const countryFlag = (c) => COUNTRY_FLAGS[c] || '🌍'

const BANNER_PRESETS = [
  { id: 'default',  name: 'Vybe',     style: 'linear-gradient(135deg, rgba(124,58,237,0.5) 0%, rgba(99,102,241,0.3) 40%, rgba(27,98,245,0.35) 100%)' },
  { id: 'sunset',   name: 'Sunset',   style: 'linear-gradient(135deg, rgba(234,88,12,0.5) 0%, rgba(236,72,153,0.35) 50%, rgba(124,58,237,0.4) 100%)' },
  { id: 'ocean',    name: 'Ocean',    style: 'linear-gradient(135deg, rgba(6,182,212,0.5) 0%, rgba(59,130,246,0.4) 50%, rgba(30,58,138,0.5) 100%)' },
  { id: 'forest',   name: 'Forest',   style: 'linear-gradient(135deg, rgba(16,185,129,0.45) 0%, rgba(5,150,105,0.35) 50%, rgba(6,95,70,0.5) 100%)' },
  { id: 'ember',    name: 'Ember',    style: 'linear-gradient(135deg, rgba(239,68,68,0.5) 0%, rgba(245,158,11,0.4) 50%, rgba(234,88,12,0.4) 100%)' },
  { id: 'aurora',   name: 'Aurora',   style: 'linear-gradient(135deg, rgba(99,102,241,0.5) 0%, rgba(167,139,250,0.4) 40%, rgba(236,72,153,0.35) 100%)' },
  { id: 'midnight', name: 'Midnight', style: 'linear-gradient(135deg, rgba(15,23,42,0.9) 0%, rgba(30,27,75,0.8) 50%, rgba(17,24,39,0.9) 100%)' },
  { id: 'rose',     name: 'Rose',     style: 'linear-gradient(135deg, rgba(244,63,94,0.45) 0%, rgba(251,113,133,0.3) 50%, rgba(190,18,60,0.4) 100%)' },
]

const ACCENT_COLORS = [
  { hex: '#7c3aed', name: 'Purple' },
  { hex: '#1b62f5', name: 'Blue'   },
  { hex: '#ec4899', name: 'Pink'   },
  { hex: '#f59e0b', name: 'Gold'   },
  { hex: '#10b981', name: 'Green'  },
  { hex: '#06b6d4', name: 'Cyan'   },
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
  common:    { label: 'Common',    color: '#9ca3af', bg: 'rgba(156,163,175,0.1)',  border: 'rgba(156,163,175,0.25)'  },
  uncommon:  { label: 'Uncommon',  color: '#4ade80', bg: 'rgba(74,222,128,0.1)',   border: 'rgba(74,222,128,0.25)'   },
  rare:      { label: 'Rare',      color: '#60a5fa', bg: 'rgba(96,165,250,0.1)',   border: 'rgba(96,165,250,0.25)'   },
  epic:      { label: 'Epic',      color: '#c084fc', bg: 'rgba(192,132,252,0.1)',  border: 'rgba(192,132,252,0.25)'  },
  legendary: { label: 'Legendary', color: '#fbbf24', bg: 'rgba(251,191,36,0.12)', border: 'rgba(251,191,36,0.35)'   },
}

const BADGE_ICONS = {
  star:         Star,
  verified:     BadgeCheck,
  hot:          Flame,
  royalty:      Crown,
  diamond:      Gem,
  rainbow:      Sparkles,
  entertainer:  Music2,
  globetrotter: Globe,
  flash:        Zap,
  sharp:        Target,
}

function Badge({ icon: Icon, label, color }) {
  return (
    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold ${color}`}>
      {Icon && <Icon size={11} />}{label}
    </div>
  )
}

export default function ProfilePage() {
  const { id }          = useParams()
  const { user: me, updateUser, loading: authLoading } = useAuth()
  const navigate        = useNavigate()
  const isOwn           = !!me && (String(id) === String(me?.id) || String(id) === String(me?._id))

  const [profile,   setProfile]   = useState(null)
  const [loading,   setLoading]   = useState(true)
  const [editing,   setEditing]   = useState(false)
  const [saving,    setSaving]    = useState(false)
  const [saveError, setSaveError] = useState('')
  const [copied,    setCopied]    = useState(false)
  const [referral,  setReferral]  = useState(null)
  const [editForm,  setEditForm]  = useState({ bio: '', gender: 'other', country: '', privacyShowBio: true, privacyShowCountry: true, accentColor: '', bannerGradient: '', bannerImage: '' })
  const [ownedBadgeIds, setOwnedBadgeIds] = useState([])

  const fileRef       = useRef(null)
  const bannerFileRef = useRef(null)

  useEffect(() => {
    // Wait until AuthContext has hydrated from localStorage before making any decisions
    if (authLoading) return
    if (!me) { navigate('/auth'); return }

    const fetchProfile = async () => {
      setLoading(true)
      try {
        if (isOwn) {
          const { data } = await axios.get('/api/user/me')
          setProfile(data.user)
          setEditForm({
            bio:               data.user.bio || '',
            gender:            data.user.gender || 'other',
            country:           data.user.country || '',
            privacyShowBio:    data.user.privacyShowBio ?? true,
            privacyShowCountry: data.user.privacyShowCountry ?? true,
            accentColor:       data.user.accentColor || '',
            bannerGradient:    data.user.bannerGradient || '',
            bannerImage:       data.user.bannerImage || '',
          })
          axios.get('/api/referral/info').then(r => setReferral(r.data)).catch(() => {})
          axios.get('/api/badges/mine').then(r => setOwnedBadgeIds(r.data.owned || [])).catch(() => {})
        } else {
          const { data } = await axios.get(`/api/user/${id}/profile`)
          setProfile(data.user)
        }
      } catch (err) {
        if (err.response?.status === 404) navigate('/')
        else if (err.response?.status === 401 || err.response?.status === 403) navigate('/auth')
        else navigate('/')
      }
      setLoading(false)
    }
    fetchProfile()
  }, [id, authLoading]) // eslint-disable-line

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 500000) { setSaveError('Image must be under 500KB'); setTimeout(() => setSaveError(''), 4000); return }
    const reader = new FileReader()
    reader.onload = (ev) => {
      setProfile((p) => ({ ...p, avatar: ev.target.result }))
      setEditForm((f) => ({ ...f, avatar: ev.target.result }))
    }
    reader.readAsDataURL(file)
  }

  const handleBannerChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2000000) { setSaveError('Banner image must be under 2MB'); setTimeout(() => setSaveError(''), 4000); return }
    const reader = new FileReader()
    reader.onload = (ev) => {
      setProfile((p) => ({ ...p, bannerImage: ev.target.result }))
      setEditForm((f) => ({ ...f, bannerImage: ev.target.result }))
    }
    reader.readAsDataURL(file)
  }

  const handleSave = async () => {
    setSaving(true)
    setSaveError('')
    try {
      const [profileRes] = await Promise.all([
        axios.put('/api/user/profile', {
          bio:               editForm.bio,
          gender:            editForm.gender,
          country:           editForm.country,
          privacyShowBio:    editForm.privacyShowBio,
          privacyShowCountry: editForm.privacyShowCountry,
          avatar:            editForm.avatar || profile.avatar,
          bannerImage:       editForm.bannerImage,
        }),
        axios.put('/api/user/cosmetics', {
          accentColor:    editForm.accentColor,
          bannerGradient: editForm.bannerGradient,
        }).catch(() => {}),
      ])
      const updated = { ...profileRes.data.user, accentColor: editForm.accentColor, bannerGradient: editForm.bannerGradient, bannerImage: editForm.bannerImage }
      setProfile((p) => ({ ...p, ...updated }))
      if (updateUser) updateUser({ ...me, ...updated })
      setEditing(false)
    } catch (err) {
      setSaveError(err.response?.data?.error || 'Failed to save. Please try again.')
    }
    setSaving(false)
  }

  const copyReferral = () => {
    navigator.clipboard?.writeText(referral?.referralLink || '')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) return (
    <div className="min-h-screen animated-bg font-space">
      <Navbar />
      <div className="pt-24 pb-12 px-4 max-w-2xl mx-auto">
        <div className="glass-card rounded-3xl overflow-hidden">
          <Skeleton className="h-32 w-full" rounded="rounded-none" />
          <div className="px-6 pb-6">
            <div className="flex items-end gap-4 -mt-10 mb-5">
              <Skeleton className="w-20 h-20 flex-shrink-0 ring-4 ring-vybe-bg" rounded="rounded-full" />
              <div className="flex-1 pb-1 space-y-2">
                <Skeleton className="h-5 w-36" rounded="rounded" />
                <Skeleton className="h-3.5 w-24" rounded="rounded" />
              </div>
            </div>
            <div className="space-y-3">
              <Skeleton className="h-4 w-full" rounded="rounded" />
              <Skeleton className="h-4 w-3/4" rounded="rounded" />
              <div className="grid grid-cols-3 gap-3 pt-2">
                {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16" rounded="rounded-xl" />)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  if (!profile) return null

  const joinDate = profile.createdAt ? new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : ''

  return (
    <div className="min-h-screen animated-bg font-space">
      <style>{`@keyframes borderPulse { 0%,100%{ box-shadow:0 0 0 2px #ec4899, 0 0 0 4px #06b6d4, 0 0 20px rgba(124,58,237,0.6) } 50%{ box-shadow:0 0 0 2px #06b6d4, 0 0 0 4px #fbbf24, 0 0 28px rgba(124,58,237,0.9) } }`}</style>
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

        {/* Profile card */}
        <div className="glass-card rounded-3xl overflow-hidden">
          {/* Header banner */}
          {(() => {
            const activeImage = editing ? editForm.bannerImage : profile.bannerImage
            const preset = BANNER_PRESETS.find(b => b.id === (editing ? editForm.bannerGradient : profile.bannerGradient)) || BANNER_PRESETS[0]
            return (
              <div className="h-32 relative overflow-hidden transition-all duration-500" style={{ background: preset.style }}>
                {/* Custom banner image */}
                {activeImage && (
                  <img src={activeImage} alt="" className="absolute inset-0 w-full h-full object-cover" />
                )}
                {/* Subtle noise grain overlay for depth */}
                <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'200\' height=\'200\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\'/%3E%3CfeColorMatrix type=\'saturate\' values=\'0\'/%3E%3C/filter%3E%3Crect width=\'200\' height=\'200\' filter=\'url(%23n)\' opacity=\'0.04\'/%3E%3C/svg%3E")', mixBlendMode: 'overlay' }} />
                {/* Upload overlay — only when editing */}
                {isOwn && editing && (
                  <button
                    onClick={() => bannerFileRef.current?.click()}
                    className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 transition-opacity opacity-0 hover:opacity-100"
                    style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(2px)' }}
                  >
                    <Camera size={20} className="text-white drop-shadow" />
                    <span className="text-white text-xs font-bold drop-shadow">Change Banner</span>
                  </button>
                )}
              </div>
            )
          })()}
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          <input ref={bannerFileRef} type="file" accept="image/*" className="hidden" onChange={handleBannerChange} />

          <div className="px-6 pb-6">
            {/* Avatar */}
            <div className="relative -mt-10 mb-4 w-fit">
              <div
                className="w-20 h-20 rounded-2xl border-4 overflow-hidden bg-gradient-to-br from-vybe-purple to-blue-900 flex items-center justify-center"
                style={{
                  borderColor: profile.borderColor || (profile.accentColor ? `${profile.accentColor}55` : '#0a0a0f'),
                  boxShadow: profile.animatedBorder
                    ? '0 0 0 2px #ec4899, 0 0 0 4px #06b6d4, 0 0 20px rgba(124,58,237,0.6)'
                    : profile.accentColor
                      ? `0 0 16px ${profile.accentColor}66`
                      : profile.borderColor
                        ? `0 0 12px ${profile.borderColor}88`
                        : undefined,
                  animation: profile.animatedBorder ? 'borderPulse 2s ease-in-out infinite' : undefined,
                }}
              >
                {profile.avatar ? (
                  <img src={profile.avatar} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl font-black text-white">{profile.username?.[0]?.toUpperCase()}</span>
                )}
              </div>
              {isOwn && editing && (
                <button
                  onClick={() => fileRef.current?.click()}
                  className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-vybe-purple border-2 border-vybe-bg flex items-center justify-center"
                >
                  <Camera size={12} className="text-white" />
                </button>
              )}
              {/* Online indicator */}
              {profile.isOnline && (
                <span className="absolute top-1 right-1 w-3 h-3 rounded-full bg-green-400 border-2 border-vybe-bg" />
              )}
            </div>

            {/* Name + badges */}
            <div className="flex items-start justify-between gap-4 mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-black text-white">{profile.username}</h1>
                  {profile.emailVerified && <span title="Verified" className="text-blue-400"><Shield size={16} /></span>}
                </div>
                <p className="text-vybe-muted text-sm mt-0.5">
                  {profile.country && `${countryFlag(profile.country)} ${profile.country} · `}
                  Joined {joinDate}
                </p>
              </div>
              {isOwn && !editing && (
                <button
                  onClick={() => { setEditing(true); setSaveError('') }}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-vybe-border text-vybe-muted hover:text-white hover:border-vybe-purple/40 text-sm transition-all"
                >
                  <Edit2 size={13} /> Edit
                </button>
              )}
            </div>

            {/* Badges */}
            <div className="flex flex-wrap gap-2 mb-2">
              {profile.isPremium && <Badge icon={Zap}            label="Member"                          color="border-yellow-500/30 text-yellow-400 bg-yellow-500/10" />}
              {profile.isVip     && <Badge icon={Crown}          label="VIP"                             color="border-purple-500/30 text-purple-300 bg-purple-500/10" />}
              {profile.emailVerified && <Badge icon={Shield}     label="Verified"                        color="border-blue-500/30 text-blue-400 bg-blue-500/10" />}
              {(profile.loginStreak ?? 0) >= 7  && <Badge icon={Flame}   label={`${profile.loginStreak}d Streak`} color="border-orange-500/30 text-orange-400 bg-orange-500/10" />}
              {(profile.longestStreak ?? 0) >= 30 && <Badge icon={Trophy} label="Veteran"               color="border-yellow-500/30 text-yellow-300 bg-yellow-500/10" />}
              {(profile.totalChats ?? 0) >= 100  && <Badge icon={MessageCircle} label="Chatter"         color="border-green-500/30 text-green-400 bg-green-500/10" />}
            </div>

            {/* Equipped custom badges */}
            {(profile.equippedBadges || []).length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-4">
                {(profile.equippedBadges || []).map(badgeId => {
                  const def = BADGE_DEFS.find(b => b.id === badgeId)
                  if (!def) return null
                  const rs = RARITY_STYLE[def.rarity]
                  const BadgeIcon = BADGE_ICONS[def.id]
                  return (
                    <span
                      key={badgeId}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold"
                      style={{ background: rs.bg, border: `1px solid ${rs.border}`, color: rs.color }}
                    >
                      {BadgeIcon && <BadgeIcon size={11} />}
                      {def.name}
                    </span>
                  )
                })}
              </div>
            )}

            {/* Bio */}
            {!editing && profile.bio && (
              <p className="text-white/80 text-sm leading-relaxed mb-4 px-1">{profile.bio}</p>
            )}

            {/* Edit form */}
            {editing && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3 mb-4"
              >
                <div>
                  <label className="block text-[10px] font-bold text-vybe-muted uppercase tracking-wider mb-1">Bio <span className="normal-case">(max 100 chars)</span></label>
                  <textarea
                    value={editForm.bio}
                    onChange={(e) => setEditForm((f) => ({ ...f, bio: e.target.value.slice(0, 100) }))}
                    rows={2}
                    placeholder="Tell people about yourself…"
                    className="w-full px-3 py-2.5 bg-vybe-bg border border-vybe-border rounded-xl text-white text-sm placeholder-vybe-muted focus:border-vybe-purple focus:outline-none resize-none"
                  />
                  <p className="text-vybe-muted text-[10px] text-right mt-0.5">{editForm.bio.length}/100</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-vybe-muted uppercase tracking-wider mb-1">Gender</label>
                    <select
                      value={editForm.gender}
                      onChange={(e) => setEditForm((f) => ({ ...f, gender: e.target.value }))}
                      className="w-full px-3 py-2.5 bg-vybe-bg border border-vybe-border rounded-xl text-white text-sm focus:border-vybe-purple focus:outline-none"
                    >
                      <option value="male">♂ Male</option>
                      <option value="female">♀ Female</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-vybe-muted uppercase tracking-wider mb-1">Country</label>
                    <input
                      value={editForm.country}
                      onChange={(e) => setEditForm((f) => ({ ...f, country: e.target.value }))}
                      placeholder="e.g. United States"
                      className="w-full px-3 py-2.5 bg-vybe-bg border border-vybe-border rounded-xl text-white text-sm placeholder-vybe-muted focus:border-vybe-purple focus:outline-none"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  {[
                    { key: 'privacyShowBio',     label: 'Show bio publicly' },
                    { key: 'privacyShowCountry', label: 'Show country publicly' },
                  ].map(({ key, label }) => (
                    <label key={key} className="flex items-center gap-2.5 cursor-pointer">
                      <input type="checkbox" checked={editForm[key]} onChange={(e) => setEditForm((f) => ({ ...f, [key]: e.target.checked }))} className="w-4 h-4 accent-purple-500 rounded" />
                      <span className="text-sm text-vybe-muted">{label}</span>
                    </label>
                  ))}
                </div>

                {/* Banner presets */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-[10px] font-bold text-vybe-muted uppercase tracking-wider">Profile Banner</label>
                    <button
                      type="button"
                      onClick={() => bannerFileRef.current?.click()}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold text-vybe-muted hover:text-white border border-vybe-border hover:border-vybe-purple/40 transition-all"
                    >
                      <Camera size={10} /> Upload Photo
                    </button>
                  </div>
                  {editForm.bannerImage && (
                    <div className="flex items-center gap-2 mb-2 px-3 py-2 rounded-xl border border-vybe-border" style={{ background: 'rgba(124,58,237,0.08)' }}>
                      <img src={editForm.bannerImage} alt="" className="w-8 h-8 rounded-lg object-cover flex-shrink-0" />
                      <span className="text-xs text-white/70 flex-1">Custom photo</span>
                      <button
                        type="button"
                        onClick={() => { setEditForm(f => ({ ...f, bannerImage: '' })); setProfile(p => ({ ...p, bannerImage: '' })) }}
                        className="text-vybe-muted hover:text-red-400 transition-colors"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  )}
                  <div className="grid grid-cols-4 gap-2">
                    {BANNER_PRESETS.map(b => (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => setEditForm(f => ({ ...f, bannerGradient: b.id === 'default' ? '' : b.id }))}
                        className="relative h-10 rounded-lg overflow-hidden transition-all"
                        style={{
                          background: b.style,
                          boxShadow: (editForm.bannerGradient || 'default') === b.id || (!editForm.bannerGradient && b.id === 'default')
                            ? '0 0 0 2px #a78bfa' : undefined,
                          opacity: 1,
                        }}
                        title={b.name}
                      >
                        {((editForm.bannerGradient || 'default') === b.id || (!editForm.bannerGradient && b.id === 'default')) && (
                          <span className="absolute inset-0 flex items-center justify-center">
                            <Check size={12} className="text-white drop-shadow" />
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Accent color */}
                <div>
                  <label className="block text-[10px] font-bold text-vybe-muted uppercase tracking-wider mb-2">Accent Color <span className="normal-case font-normal">(free)</span></label>
                  <div className="flex gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setEditForm(f => ({ ...f, accentColor: '' }))}
                      className="w-7 h-7 rounded-full border-2 transition-all flex items-center justify-center"
                      style={{ background: '#1a1a2e', borderColor: !editForm.accentColor ? '#a78bfa' : 'rgba(255,255,255,0.15)' }}
                      title="None"
                    >
                      {!editForm.accentColor && <Check size={11} className="text-white/60" />}
                    </button>
                    {ACCENT_COLORS.map(c => (
                      <button
                        key={c.hex}
                        type="button"
                        onClick={() => setEditForm(f => ({ ...f, accentColor: c.hex }))}
                        className="w-7 h-7 rounded-full border-2 transition-all"
                        style={{ background: c.hex, borderColor: editForm.accentColor === c.hex ? '#fff' : 'transparent',
                          boxShadow: editForm.accentColor === c.hex ? `0 0 8px ${c.hex}88` : undefined }}
                        title={c.name}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex-1 py-2.5 rounded-xl btn-purple text-white font-black text-sm flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                    {saving ? 'Saving…' : 'Save Changes'}
                  </button>
                  <button
                    onClick={() => setEditing(false)}
                    className="px-4 py-2.5 rounded-xl border border-vybe-border text-vybe-muted hover:text-white text-sm transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>
              </motion.div>
            )}

            {/* Stats grid */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              {[
                { label: 'Chats',  value: profile.totalChats || 0,         Icon: MessageCircle },
                { label: 'Streak', value: `${profile.loginStreak || 0}d`,  Icon: Flame },
                { label: 'Best',   value: `${profile.longestStreak || 0}d`, Icon: Trophy },
              ].map(({ label, value, Icon }) => (
                <div key={label} className="bg-vybe-card border border-vybe-border rounded-2xl p-3 text-center">
                  <div className="flex justify-center mb-1"><Icon size={16} className="text-vybe-purple-light opacity-70" /></div>
                  <p className="text-white font-black text-lg">{value}</p>
                  <p className="text-vybe-muted text-[11px]">{label}</p>
                </div>
              ))}
            </div>

            {/* Badge collection (own profile only) */}

          </div>
        </div>
      </div>
    </div>
  )
}
