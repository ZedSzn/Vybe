import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Camera, Edit2, Save, X, ArrowLeft, Copy, Check, Loader2, Shield, Crown, Zap, Flame, Trophy, MessageCircle, Lock, MessageSquare, Twitter, Star, BadgeCheck, Gem, Sparkles, Music2, Globe, Target, UserPlus, Gift, Heart, Share2 } from 'lucide-react'
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
  { hex: '#00D4FF', name: 'Purple' },
  { hex: '#00D4FF', name: 'Blue'   },
  { hex: '#ec4899', name: 'Pink'   },
  { hex: '#00D4FF', name: 'Gold'   },
  { hex: '#00D4FF', name: 'Green'  },
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
  common:    { label: 'Common',    color: '#888899', bg: 'rgba(156,163,175,0.1)',  border: 'rgba(156,163,175,0.25)'  },
  uncommon:  { label: 'Uncommon',  color: '#4ade80', bg: 'rgba(74,222,128,0.1)',   border: 'rgba(74,222,128,0.25)'   },
  rare:      { label: 'Rare',      color: '#00B8E0', bg: 'rgba(0,184,224,0.1)',   border: 'rgba(0,184,224,0.25)'   },
  epic:      { label: 'Epic',      color: '#c084fc', bg: 'rgba(192,132,252,0.1)',  border: 'rgba(192,132,252,0.25)'  },
  legendary: { label: 'Legendary', color: '#00B8E0', bg: 'rgba(0,184,224,0.12)', border: 'rgba(0,184,224,0.35)'   },
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
    <div className="min-h-screen font-space" style={{ background: '#0a0a0f' }}>
      <Navbar />
      <div className="max-w-2xl mx-auto pt-20 px-4">
        <div className="h-48 rounded-2xl animate-pulse mb-0" style={{ background: 'rgba(255,255,255,0.04)' }} />
        <div style={{ background: '#111118', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20, marginTop: -24, padding: 20 }}>
          <div className="flex gap-4 items-end mb-4" style={{ marginTop: -45 }}>
            <div className="w-[90px] h-[90px] rounded-full animate-pulse flex-shrink-0" style={{ background: 'rgba(255,255,255,0.06)' }} />
          </div>
          <div className="space-y-2">
            <div className="h-6 w-40 rounded-lg animate-pulse" style={{ background: 'rgba(255,255,255,0.06)' }} />
            <div className="h-4 w-24 rounded-lg animate-pulse" style={{ background: 'rgba(255,255,255,0.04)' }} />
          </div>
        </div>
      </div>
    </div>
  )

  if (!profile) return null

  const joinDate = profile.createdAt ? new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : ''
  const activeImage = editing ? editForm.bannerImage : profile.bannerImage
  const bannerPreset = BANNER_PRESETS.find(b => b.id === (editing ? editForm.bannerGradient : profile.bannerGradient)) || BANNER_PRESETS[0]

  return (
    <div className="min-h-screen font-space pb-16" style={{ background: '#0a0a0f' }}>
      <style>{`
        @keyframes vipGlow {
          0%,100% { box-shadow: 0 0 0 3px #00D4FF, 0 0 20px rgba(0,212,255,0.65), 0 0 40px rgba(0,212,255,0.25); }
          50%      { box-shadow: 0 0 0 3px #00D4FF, 0 0 32px rgba(0,212,255,1),    0 0 60px rgba(0,212,255,0.45); }
        }
      `}</style>
      <Navbar />

      {saveError && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl text-sm font-semibold text-red-400 border border-red-500/25 backdrop-blur-sm"
          style={{ background: 'rgba(239,68,68,0.12)', whiteSpace: 'nowrap' }}>
          {saveError}
        </div>
      )}

      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
      <input ref={bannerFileRef} type="file" accept="image/*" className="hidden" onChange={handleBannerChange} />

      <div className="max-w-2xl mx-auto pt-20 px-4 relative z-10">
        {/* Back */}
        <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 mb-4 text-sm transition-colors" style={{ color: 'rgba(255,255,255,0.35)' }}
          onMouseEnter={e => e.currentTarget.style.color = '#fff'} onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.35)'}>
          <ArrowLeft size={14} /> Back
        </button>

        {/* ── Banner ── */}
        <div className="relative h-48 overflow-hidden rounded-2xl" style={{ background: bannerPreset.style }}>
          {activeImage && <img src={activeImage} alt="" className="absolute inset-0 w-full h-full object-cover" />}
          {/* Bottom dark gradient */}
          <div className="absolute bottom-0 left-0 right-0 h-28 pointer-events-none"
            style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 100%)' }} />
          {/* Edit banner button */}
          {isOwn && (
            <button
              onClick={() => editing ? bannerFileRef.current?.click() : (setEditing(true), setSaveError(''))}
              className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition-all"
              style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.15)' }}
              title="Edit banner"
            >
              <Edit2 size={13} className="text-white" />
            </button>
          )}
        </div>

        {/* ── Profile Card ── */}
        <div className="rounded-2xl overflow-hidden" style={{ background: '#111118', border: '1px solid rgba(255,255,255,0.07)', marginTop: -28 }}>
          <div className="px-5 pb-5">

            {/* Avatar + action buttons */}
            <div className="flex items-end justify-between" style={{ marginTop: -46, marginBottom: 14 }}>
              {/* Profile pic */}
              <div className="relative flex-shrink-0">
                <div className="w-[90px] h-[90px] rounded-full overflow-hidden flex items-center justify-center flex-shrink-0"
                  style={{
                    border: '3px solid #00D4FF',
                    background: 'linear-gradient(135deg, rgba(0,212,255,0.15), rgba(124,58,237,0.15))',
                    animation: profile.isVip ? 'vipGlow 2s ease-in-out infinite' : undefined,
                    boxShadow: profile.isVip ? undefined : '0 0 0 3px #00D4FF',
                  }}>
                  {profile.avatar
                    ? <img src={profile.avatar} alt="" className="w-full h-full object-cover" />
                    : <span className="text-3xl font-black text-white">{profile.username?.[0]?.toUpperCase()}</span>
                  }
                </div>
                {profile.isOnline && (
                  <span className="absolute bottom-1.5 right-1.5 w-3.5 h-3.5 rounded-full border-2"
                    style={{ background: '#22c55e', borderColor: '#111118' }} />
                )}
                {isOwn && editing && (
                  <button onClick={() => fileRef.current?.click()}
                    className="absolute inset-0 rounded-full flex items-center justify-center"
                    style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}>
                    <Camera size={20} className="text-white" />
                  </button>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex gap-2 pb-1 flex-wrap justify-end">
                {isOwn ? (
                  <>
                    {!editing ? (
                      <button onClick={() => { setEditing(true); setSaveError('') }}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold text-white transition-all"
                        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(0,212,255,0.3)', backdropFilter: 'blur(12px)' }}>
                        <Edit2 size={13} /> Edit Profile
                      </button>
                    ) : (
                      <button onClick={handleSave} disabled={saving}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold disabled:opacity-60"
                        style={{ background: '#00D4FF', color: '#000' }}>
                        {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                        {saving ? 'Saving…' : 'Save'}
                      </button>
                    )}
                    <button onClick={copyReferral}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold transition-all"
                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.65)' }}>
                      {copied ? <Check size={13} style={{ color: '#00D4FF' }} /> : <Share2 size={13} />}
                      {copied ? 'Copied!' : 'Share'}
                    </button>
                    {editing && (
                      <button onClick={() => setEditing(false)}
                        className="w-9 h-9 rounded-xl flex items-center justify-center"
                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' }}>
                        <X size={14} />
                      </button>
                    )}
                  </>
                ) : (
                  <>
                    <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold"
                      style={{ background: '#00D4FF', color: '#000' }}>
                      <UserPlus size={13} /> Add Friend
                    </button>
                    <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold"
                      style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.25)', color: 'rgba(251,191,36,0.9)' }}>
                      <Sparkles size={13} /> Gift
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Username + country + badges */}
            <div className="mb-3">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-black text-white" style={{ fontSize: 22 }}>{profile.username}</h1>
                {profile.emailVerified && <BadgeCheck size={18} style={{ color: '#00D4FF' }} title="Verified" />}
                {profile.isVip && (
                  <span className="flex items-center gap-0.5 px-2 py-0.5 rounded-md text-[10px] font-black"
                    style={{ background: 'linear-gradient(135deg, #00D4FF, #7C3AED)', color: '#fff' }}>
                    <Crown size={8} /> VIP
                  </span>
                )}
                {!profile.isVip && profile.isPremium && (
                  <span className="flex items-center gap-0.5 px-2 py-0.5 rounded-md text-[10px] font-black"
                    style={{ background: 'rgba(0,212,255,0.12)', color: '#00D4FF', border: '1px solid rgba(0,212,255,0.3)' }}>
                    <Zap size={8} /> Member
                  </span>
                )}
              </div>
              {profile.country && (
                <p className="text-sm mt-0.5" style={{ color: '#666677' }}>
                  {countryFlag(profile.country)} {profile.country}
                </p>
              )}
              {/* Equipped badges */}
              {(profile.equippedBadges || []).length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {(profile.equippedBadges || []).slice(0, 3).map(badgeId => {
                    const def = BADGE_DEFS.find(b => b.id === badgeId)
                    if (!def) return null
                    const rs = RARITY_STYLE[def.rarity]
                    return (
                      <span key={badgeId} className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold"
                        style={{ background: rs.bg, border: `1px solid ${rs.border}`, color: rs.color }}>
                        {def.icon} {def.name}
                      </span>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Stats row */}
            <div className="flex items-stretch rounded-xl overflow-hidden mb-3"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              {[
                { label: 'Chats',   value: (profile.totalChats   || 0).toLocaleString() },
                { label: 'Friends', value: (profile.friendCount  || 0).toLocaleString() },
                { label: 'Earned',  value: (profile.coinsEarned  ?? profile.coins ?? 0).toLocaleString() },
              ].map(({ label, value }, i) => (
                <div key={label} className="flex-1 flex" style={{ position: 'relative' }}>
                  {i > 0 && <div className="absolute left-0 top-3 bottom-3 w-px" style={{ background: 'rgba(255,255,255,0.07)' }} />}
                  <div className="flex-1 flex flex-col items-center py-3">
                    <span className="font-black text-white" style={{ fontSize: 20 }}>{value}</span>
                    <span className="text-[11px] font-medium" style={{ color: '#555566' }}>{label}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Bio */}
            {!editing && (
              <p className="text-sm italic mb-1" style={{ color: profile.bio ? 'rgba(255,255,255,0.5)' : '#333344', lineHeight: 1.6 }}>
                {profile.bio || (isOwn ? 'Add a bio…' : '')}
              </p>
            )}

            {/* ── Edit form ── */}
            {editing && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3 mt-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: '#555566' }}>
                    Bio <span className="normal-case font-normal">(max 100 chars)</span>
                  </label>
                  <textarea
                    value={editForm.bio}
                    onChange={(e) => setEditForm(f => ({ ...f, bio: e.target.value.slice(0, 100) }))}
                    rows={2}
                    placeholder="Tell people about yourself…"
                    className="w-full px-3 py-2.5 rounded-xl text-white text-sm placeholder-white/25 focus:outline-none resize-none"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                  />
                  <p className="text-[10px] text-right mt-0.5" style={{ color: '#444455' }}>{editForm.bio.length}/100</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: '#555566' }}>Gender</label>
                    <select value={editForm.gender} onChange={(e) => setEditForm(f => ({ ...f, gender: e.target.value }))}
                      className="w-full px-3 py-2.5 rounded-xl text-white text-sm focus:outline-none"
                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                      <option value="male">♂ Male</option>
                      <option value="female">♀ Female</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: '#555566' }}>Country</label>
                    <input value={editForm.country} onChange={(e) => setEditForm(f => ({ ...f, country: e.target.value }))}
                      placeholder="e.g. United Kingdom"
                      className="w-full px-3 py-2.5 rounded-xl text-white text-sm placeholder-white/25 focus:outline-none"
                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
                  </div>
                </div>

                {/* Banner presets */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-[10px] font-bold uppercase tracking-wider" style={{ color: '#555566' }}>Banner</label>
                    <button type="button" onClick={() => bannerFileRef.current?.click()}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all"
                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' }}>
                      <Camera size={9} /> Upload Photo
                    </button>
                  </div>
                  {editForm.bannerImage && (
                    <div className="flex items-center gap-2 mb-2 px-3 py-2 rounded-xl" style={{ background: 'rgba(0,212,255,0.07)', border: '1px solid rgba(0,212,255,0.15)' }}>
                      <img src={editForm.bannerImage} alt="" className="w-8 h-8 rounded-lg object-cover flex-shrink-0" />
                      <span className="text-xs flex-1" style={{ color: 'rgba(255,255,255,0.6)' }}>Custom photo</span>
                      <button type="button" onClick={() => { setEditForm(f => ({ ...f, bannerImage: '' })); setProfile(p => ({ ...p, bannerImage: '' })) }}
                        className="transition-colors" style={{ color: '#555566' }}>
                        <X size={12} />
                      </button>
                    </div>
                  )}
                  <div className="grid grid-cols-4 gap-2">
                    {BANNER_PRESETS.map(b => (
                      <button key={b.id} type="button"
                        onClick={() => setEditForm(f => ({ ...f, bannerGradient: b.id === 'default' ? '' : b.id }))}
                        className="relative h-10 rounded-lg overflow-hidden transition-all"
                        style={{
                          background: b.style,
                          boxShadow: (!editForm.bannerGradient && b.id === 'default') || editForm.bannerGradient === b.id ? '0 0 0 2px #00D4FF' : undefined,
                        }}
                        title={b.name}>
                        {((!editForm.bannerGradient && b.id === 'default') || editForm.bannerGradient === b.id) && (
                          <span className="absolute inset-0 flex items-center justify-center">
                            <Check size={12} className="text-white drop-shadow" />
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* ── Badge Collection ── */}
        {(isOwn || (profile.equippedBadges || []).length > 0 || ownedBadgeIds.length > 0) && (
          <div className="mt-4 rounded-2xl p-5" style={{ background: '#111118', border: '1px solid rgba(255,255,255,0.07)' }}>
            <h2 className="text-xs font-black uppercase tracking-widest mb-4" style={{ color: '#555566' }}>Badge Collection</h2>
            <div className="grid grid-cols-2 gap-3">
              {BADGE_DEFS.map(def => {
                const owned = isOwn ? ownedBadgeIds.includes(def.id) : (profile.equippedBadges || []).includes(def.id)
                const equipped = (profile.equippedBadges || []).includes(def.id)
                const rs = RARITY_STYLE[def.rarity]
                return (
                  <div key={def.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all"
                    style={{
                      background: equipped ? 'rgba(124,58,237,0.1)' : owned ? 'rgba(0,212,255,0.05)' : 'rgba(255,255,255,0.02)',
                      border: equipped ? '1px solid rgba(124,58,237,0.35)' : owned ? `1px solid ${rs.border}` : '1px solid rgba(255,255,255,0.05)',
                      opacity: owned || equipped ? 1 : 0.4,
                    }}>
                    <span className="text-2xl flex-shrink-0">{def.icon}</span>
                    <div className="min-w-0">
                      <p className="text-xs font-bold truncate" style={{ color: equipped ? '#c084fc' : owned ? rs.color : '#444455' }}>
                        {def.name}
                      </p>
                      {equipped && <p className="text-[9px] font-black uppercase tracking-wider" style={{ color: 'rgba(192,132,252,0.7)' }}>Equipped</p>}
                      {!equipped && owned && <p className="text-[9px]" style={{ color: '#333344' }}>Owned</p>}
                      {!owned && !equipped && <p className="text-[9px]" style={{ color: '#333344' }}>{def.cost} coins</p>}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Joined date */}
        <p className="text-center text-xs mt-5" style={{ color: '#333344' }}>Joined {joinDate}</p>
      </div>
    </div>
  )
}
