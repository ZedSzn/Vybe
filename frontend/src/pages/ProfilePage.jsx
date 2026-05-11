import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Camera, Edit2, Save, X, ArrowLeft, Copy, Check, Loader2, Shield, Crown, Zap, Flame, Trophy, MessageCircle, Lock, MessageSquare, Twitter, Star, BadgeCheck, Gem, Sparkles, Music2, Globe, Target } from 'lucide-react'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import { VybeCoin } from '../components/VybeCoin'
import { Skeleton } from '../components/Skeleton'

const COUNTRY_FLAGS = {
  'United States': '🇺🇸', 'United Kingdom': '🇬🇧', 'Canada': '🇨🇦', 'Australia': '🇦🇺',
  'Germany': '🇩🇪', 'France': '🇫🇷', 'Japan': '🇯🇵', 'Brazil': '🇧🇷', 'India': '🇮🇳',
  'Mexico': '🇲🇽', 'Spain': '🇪🇸', 'Italy': '🇮🇹', 'Netherlands': '🇳🇱', 'Sweden': '🇸🇪',
}
const countryFlag = (c) => COUNTRY_FLAGS[c] || '🌍'

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
  const { user: me, updateUser } = useAuth()
  const navigate        = useNavigate()
  const isOwn           = String(id) === String(me?.id)

  const [profile,   setProfile]   = useState(null)
  const [loading,   setLoading]   = useState(true)
  const [editing,   setEditing]   = useState(false)
  const [saving,    setSaving]    = useState(false)
  const [saveError, setSaveError] = useState('')
  const [copied,    setCopied]    = useState(false)
  const [referral,  setReferral]  = useState(null)
  const [editForm,  setEditForm]  = useState({ bio: '', gender: 'other', country: '', privacyShowBio: true, privacyShowCountry: true })
  const [ownedBadgeIds, setOwnedBadgeIds] = useState([])

  const fileRef = useRef(null)

  useEffect(() => {
    if (!me && isOwn) { navigate('/auth'); return }
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
          })
          // Secondary fetches — isolated so failures don't redirect away from profile
          axios.get('/api/referral/info').then(r => setReferral(r.data)).catch(() => {})
          axios.get('/api/badges/mine').then(r => setOwnedBadgeIds(r.data.owned || [])).catch(() => {})
        } else {
          const { data } = await axios.get(`/api/user/${id}/profile`)
          setProfile(data.user)
        }
      } catch (err) {
        if (err.response?.status === 401 || err.response?.status === 403) navigate('/auth')
        else navigate('/')
      }
      setLoading(false)
    }
    fetchProfile()
  }, [id]) // eslint-disable-line

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

  const handleSave = async () => {
    setSaving(true)
    try {
      const { data } = await axios.put('/api/user/profile', {
        bio:               editForm.bio,
        gender:            editForm.gender,
        country:           editForm.country,
        privacyShowBio:    editForm.privacyShowBio,
        privacyShowCountry: editForm.privacyShowCountry,
        avatar:            editForm.avatar || profile.avatar,
      })
      setProfile((p) => ({ ...p, ...data.user }))
      if (updateUser) updateUser({ ...me, ...data.user })
      setEditing(false)
    } catch {}
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
          <Skeleton className="h-36 w-full" rounded="rounded-none" />
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
          <div className="h-24 bg-gradient-to-r from-vybe-purple/40 via-purple-600/20 to-blue-800/30 relative">
            {isOwn && editing && (
              <button
                onClick={() => fileRef.current?.click()}
                className="absolute bottom-3 right-3 w-8 h-8 rounded-full bg-black/60 border border-white/20 flex items-center justify-center text-white hover:bg-black/80 transition-colors"
              >
                <Camera size={14} />
              </button>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />

          <div className="px-6 pb-6">
            {/* Avatar */}
            <div className="relative -mt-10 mb-4 w-fit">
              <div
                className="w-20 h-20 rounded-2xl border-4 overflow-hidden bg-gradient-to-br from-vybe-purple to-blue-900 flex items-center justify-center"
                style={{
                  borderColor: profile.borderColor || '#0a0a0f',
                  boxShadow: profile.animatedBorder
                    ? '0 0 0 2px #ec4899, 0 0 0 4px #06b6d4, 0 0 20px rgba(124,58,237,0.6)'
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
                  onClick={() => setEditing(true)}
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
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
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
            {isOwn && (
              <div className="bg-vybe-card border border-vybe-border rounded-2xl p-4 mb-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-black text-white">Badge Collection</h3>
                  <span className="text-xs text-vybe-muted">{ownedBadgeIds.length}/{BADGE_DEFS.length} owned</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {BADGE_DEFS.map(def => {
                    const owned    = ownedBadgeIds.includes(def.id)
                    const equipped = (profile.equippedBadges || []).includes(def.id)
                    const rs       = RARITY_STYLE[def.rarity]
                    const BadgeIcon = BADGE_ICONS[def.id]
                    return (
                      <div
                        key={def.id}
                        onClick={() => !owned && navigate('/wallet?tab=spend')}
                        className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all"
                        style={{
                          background: owned ? rs.bg : 'rgba(255,255,255,0.02)',
                          border:     `1px solid ${owned ? rs.border : 'rgba(255,255,255,0.06)'}`,
                          cursor:     owned ? 'default' : 'pointer',
                          opacity:    owned ? 1 : 0.5,
                          boxShadow:  equipped ? `0 0 10px ${rs.border}` : undefined,
                        }}
                      >
                        {BadgeIcon && (
                          <BadgeIcon size={20} style={{ color: owned ? rs.color : '#4b5563', flexShrink: 0 }} />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold truncate" style={{ color: owned ? rs.color : '#6b7280' }}>{def.name}</p>
                          <p className="text-[10px]" style={{ color: owned ? rs.color + '99' : '#4b5563' }}>
                            {owned ? (equipped ? 'Equipped' : rs.label) : `${def.cost.toLocaleString()} coins`}
                          </p>
                        </div>
                        {owned
                          ? <Check size={13} style={{ color: rs.color, flexShrink: 0 }} />
                          : <Lock  size={11} style={{ color: '#4b5563', flexShrink: 0 }} />
                        }
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Referral section (own profile only) */}
            {isOwn && referral && (
              <div className="bg-vybe-card border border-vybe-border rounded-2xl p-4">
                <h3 className="text-sm font-black text-white mb-1">Your Referral Link</h3>
                <p className="text-vybe-muted text-xs mb-3">
                  Invite friends and both get <span className="inline-flex items-center gap-1 text-yellow-300 font-bold">50 <VybeCoin size={12} /> coins</span> when they sign up.
                  You've invited <span className="text-white font-bold">{referral.referralCount}</span> people.
                </p>
                <div className="flex gap-2">
                  <div className="flex-1 px-3 py-2 bg-vybe-bg border border-vybe-border rounded-xl text-vybe-muted text-xs truncate font-mono">
                    {referral.referralLink}
                  </div>
                  <button
                    onClick={copyReferral}
                    className="px-3 py-2 rounded-xl bg-vybe-purple/20 border border-vybe-purple/30 text-vybe-purple hover:bg-vybe-purple/30 transition-colors"
                  >
                    {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                  </button>
                </div>
                <div className="flex gap-2 mt-3">
                  {[
                    { label: 'WhatsApp', Icon: MessageSquare, url: `https://wa.me/?text=${encodeURIComponent('Join me on Vybe! ' + referral.referralLink)}` },
                    { label: 'Twitter',  Icon: Twitter,       url: `https://twitter.com/intent/tweet?text=${encodeURIComponent('Join me on Vybe! ' + referral.referralLink)}` },
                  ].map(({ label, Icon, url }) => (
                    <a key={label} href={url} target="_blank" rel="noopener noreferrer"
                      className="flex-1 py-2 rounded-xl border border-vybe-border text-vybe-muted hover:text-white hover:border-vybe-purple/40 text-xs text-center font-semibold transition-all flex items-center justify-center gap-1.5">
                      <Icon size={12} />{label}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
