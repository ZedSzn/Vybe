import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { VybeCoin } from '../components/VybeCoin'
import {
  Gift, CalendarDays, Flame, MessageCircle, Users, TrendingUp, TrendingDown,
  Star, BadgeCheck, Crown, Gem, Sparkles, Music2, Globe, Zap, Target,
  ThumbsUp, Heart, DollarSign, Check,
} from 'lucide-react'

const PACKAGES = [
  { id: 'coins_100',  coins: 100,  amountUsd: 1.49,  label: '100 Coins',   popular: false },
  { id: 'coins_500',  coins: 500,  amountUsd: 5.99,  label: '500 Coins',   popular: false },
  { id: 'coins_1200', coins: 1200, amountUsd: 11.99, label: '1,200 Coins', popular: true  },
  { id: 'coins_3000', coins: 3000, amountUsd: 24.99, label: '3,000 Coins', popular: false },
  { id: 'coins_7000', coins: 7000, amountUsd: 49.99, label: '7,000 Coins', popular: false },
]

const EARN_METHODS = [
  { Icon: Gift,          label: 'Sign up bonus',  desc: '100 coins free on registration',  color: '#a78bfa' },
  { Icon: CalendarDays,  label: 'Daily login',    desc: '10 coins every day you log in',   color: '#60a5fa' },
  { Icon: Flame,         label: '3-day streak',   desc: '+30 bonus coins',                 color: '#fb923c' },
  { Icon: Flame,         label: '7-day streak',   desc: '+100 bonus coins',                color: '#f97316' },
  { Icon: Flame,         label: '30-day streak',  desc: '+500 bonus coins',                color: '#ef4444' },
  { Icon: MessageCircle, label: 'Every 10 chats', desc: '5 coins per milestone',           color: '#4ade80' },
  { Icon: Users,         label: 'Refer a friend', desc: '50 coins when they sign up',      color: '#38bdf8' },
  { Icon: TrendingUp,    label: 'Receive a tip',  desc: 'Goes to your Earn Balance only',  color: '#fbbf24' },
]

const BADGE_DEFS = [
  { id: 'star',         name: 'Rising Star',    Icon: Star,       cost: 200,  desc: 'For those making their mark on Vybe',       rarity: 'common'    },
  { id: 'verified',     name: 'Verified Viber', Icon: BadgeCheck, cost: 500,  desc: 'Gold checkmark — trusted community member', rarity: 'rare'      },
  { id: 'hot',          name: 'Hot',            Icon: Flame,      cost: 300,  desc: "You're trending on Vybe",                   rarity: 'common'    },
  { id: 'royalty',      name: 'Royalty',        Icon: Crown,      cost: 1000, desc: 'The most prestigious badge on Vybe',        rarity: 'legendary' },
  { id: 'diamond',      name: 'Diamond Member', Icon: Gem,        cost: 800,  desc: 'Diamond tier — top 1% of Vybe',            rarity: 'epic'      },
  { id: 'rainbow',      name: 'Rainbow',        Icon: Sparkles,   cost: 400,  desc: 'Colorful, vibrant and unmissable',          rarity: 'rare'      },
  { id: 'entertainer',  name: 'Entertainer',    Icon: Music2,     cost: 350,  desc: 'For charismatic and entertaining chatters', rarity: 'uncommon'  },
  { id: 'globetrotter', name: 'Globetrotter',   Icon: Globe,      cost: 450,  desc: 'Chatted with people from many countries',   rarity: 'rare'      },
  { id: 'flash',        name: 'Flash',          Icon: Zap,        cost: 250,  desc: 'Fast connector — always in the action',     rarity: 'uncommon'  },
  { id: 'sharp',        name: 'Sharp',          Icon: Target,     cost: 300,  desc: 'Precision and focus — a premium badge',     rarity: 'common'    },
]

const RARITY_STYLE = {
  common:    { label: 'Common',    color: '#9ca3af', bg: 'rgba(156,163,175,0.1)',  border: 'rgba(156,163,175,0.2)'  },
  uncommon:  { label: 'Uncommon',  color: '#4ade80', bg: 'rgba(74,222,128,0.1)',   border: 'rgba(74,222,128,0.2)'   },
  rare:      { label: 'Rare',      color: '#60a5fa', bg: 'rgba(96,165,250,0.1)',   border: 'rgba(96,165,250,0.2)'   },
  epic:      { label: 'Epic',      color: '#c084fc', bg: 'rgba(192,132,252,0.1)',  border: 'rgba(192,132,252,0.2)'  },
  legendary: { label: 'Legendary', color: '#fbbf24', bg: 'rgba(251,191,36,0.12)', border: 'rgba(251,191,36,0.3)'   },
}

const BORDER_COLORS = [
  { hex: '#7c3aed', name: 'Purple'  },
  { hex: '#1b62f5', name: 'Blue'    },
  { hex: '#ec4899', name: 'Pink'    },
  { hex: '#f59e0b', name: 'Gold'    },
  { hex: '#10b981', name: 'Green'   },
  { hex: '#ef4444', name: 'Red'     },
  { hex: '#06b6d4', name: 'Cyan'    },
  { hex: '#ffffff', name: 'White'   },
]

const GIFTS_LIST = [
  { id: 'like',    name: 'Like',    Icon: ThumbsUp, cost: 10,  color: '#60a5fa' },
  { id: 'heart',   name: 'Heart',   Icon: Heart,    cost: 25,  color: '#f43f5e' },
  { id: 'fire',    name: 'Fire',    Icon: Flame,    cost: 50,  color: '#f97316' },
  { id: 'diamond', name: 'Diamond', Icon: Gem,      cost: 150, color: '#06b6d4' },
  { id: 'crown',   name: 'Crown',   Icon: Crown,    cost: 300, color: '#fbbf24' },
]

const TX_TYPE_LABELS = {
  signup:        { label: 'Sign-up bonus',    color: 'text-green-400'  },
  bonus:         { label: 'Login bonus',      color: 'text-green-400'  },
  streak:        { label: 'Streak bonus',     color: 'text-orange-400' },
  referral:      { label: 'Referral',         color: 'text-blue-400'   },
  ad:            { label: 'Ad reward',        color: 'text-green-400'  },
  chat_reward:   { label: 'Chat reward',      color: 'text-green-400'  },
  purchase:      { label: 'Coin purchase',    color: 'text-blue-400'   },
  tip_received:  { label: 'Tip received',     color: 'text-yellow-400' },
  tip_sent:      { label: 'Tip sent',         color: 'text-red-400'    },
  gift:          { label: 'Gift sent',        color: 'text-red-400'    },
  badge:         { label: 'Badge purchase',   color: 'text-purple-400' },
  border:        { label: 'Border style',     color: 'text-purple-400' },
  cashout:       { label: 'Cash out',         color: 'text-purple-400' },
  cashout_refund:{ label: 'Cashout refund',   color: 'text-green-400'  },
}

const CoinBadge = ({ size = 18 }) => <VybeCoin size={size} />

function TabBtn({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 sm:px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${active ? 'bg-vybe-purple text-white' : 'text-vybe-muted hover:text-white'}`}
    >
      {children}
    </button>
  )
}

function Tooltip({ text }) {
  const [show, setShow] = useState(false)
  return (
    <span className="relative inline-flex items-center ml-1 cursor-help" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      <span className="w-3.5 h-3.5 rounded-full border border-white/20 text-[9px] flex items-center justify-center text-white/40 font-black">?</span>
      {show && (
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 w-52 text-[11px] text-white/80 bg-[#1a1a2e] border border-white/10 rounded-xl px-3 py-2 z-50 leading-relaxed pointer-events-none">
          {text}
        </span>
      )}
    </span>
  )
}

export default function WalletPage() {
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [tab, setTab]                   = useState('overview')
  const [coins, setCoins]               = useState(user?.coins ?? 0)
  const [cashableCoins, setCashableCoins] = useState(user?.cashableCoins ?? 0)
  const [history, setHistory]           = useState([])
  const [histLoading, setHistLoading]   = useState(false)
  const [referralInfo, setReferralInfo] = useState(null)
  const [cashouts, setCashouts]         = useState([])
  const [tipsEarned, setTipsEarned]     = useState(0)
  const [paypalEmail, setPaypalEmail]   = useState('')
  const [paypalSaving, setPaypalSaving] = useState(false)
  const [cashoutAmount, setCashoutAmount] = useState('')
  const [cashoutLoading, setCashoutLoading] = useState(false)
  const [buyLoading, setBuyLoading]     = useState(null)
  const [successMsg, setSuccessMsg]     = useState('')
  const [errorMsg, setErrorMsg]         = useState('')
  const [copied, setCopied]             = useState(false)

  useEffect(() => {
    if (authLoading) return
    if (!user) { navigate('/auth'); return }
    const success = searchParams.get('success')
    const purchasedCoins = searchParams.get('coins')
    if (success && purchasedCoins) setSuccessMsg(`${Number(purchasedCoins).toLocaleString()} coins added to your wallet!`)
    const tabParam = searchParams.get('tab')
    if (tabParam) setTab(tabParam)
  }, [user, authLoading, navigate, searchParams])

  // Stable refreshCoins — no user/updateUser dependency to avoid infinite loops
  const refreshCoins = useCallback(async () => {
    try {
      const { data } = await axios.get('/api/user/me')
      setCoins(data.user.coins ?? 0)
      setCashableCoins(data.user.cashableCoins ?? 0)
      setTipsEarned(data.user.tipsEarned ?? 0)
      setPaypalEmail(data.user.paypalEmail ?? '')
    } catch {}
  }, []) // intentionally empty — reads from API, not state

  useEffect(() => { refreshCoins() }, [refreshCoins])

  const loadHistory = useCallback(async () => {
    setHistLoading(true)
    try {
      const { data } = await axios.get('/api/user/coins/history')
      setHistory(data.history || [])
      setCoins(data.coins ?? 0)
      setCashableCoins(data.cashableCoins ?? 0)
    } catch {}
    setHistLoading(false)
  }, [])

  const loadReferral = useCallback(async () => {
    try {
      const { data } = await axios.get('/api/referral/info')
      setReferralInfo(data)
    } catch {}
  }, [])

  const loadCashouts = useCallback(async () => {
    try {
      const { data } = await axios.get('/api/cashout/my-requests')
      setCashouts(data.requests || [])
    } catch {}
  }, [])

  useEffect(() => {
    if (tab === 'history')  loadHistory()
    if (tab === 'referral') loadReferral()
    if (tab === 'cashout')  { loadCashouts(); refreshCoins() }
  }, [tab]) // only re-fire when tab changes

  const handleBuy = async (pkg) => {
    setBuyLoading(pkg.id)
    setErrorMsg('')
    try {
      const { data } = await axios.post('/api/coins/buy', { packageId: pkg.id })
      window.location.href = data.url
    } catch (e) {
      setErrorMsg(e.response?.data?.error || 'Payment unavailable. Configure Stripe in the backend .env.')
      setBuyLoading(null)
    }
  }

  const handleSavePaypal = async () => {
    if (!paypalEmail) return
    setPaypalSaving(true)
    setErrorMsg('')
    try {
      await axios.put('/api/user/paypal-email', { paypalEmail })
      setSuccessMsg('PayPal email saved!')
    } catch (e) { setErrorMsg(e.response?.data?.error || 'Failed to save') }
    setPaypalSaving(false)
  }

  const handleCashout = async () => {
    const amount = parseInt(cashoutAmount, 10)
    if (!amount || amount < 1000) { setErrorMsg('Minimum cash out is 1,000 cashable coins'); return }
    if (amount > cashableCoins) { setErrorMsg(`You only have ${cashableCoins.toLocaleString()} cashable coins`); return }
    setCashoutLoading(true)
    setErrorMsg('')
    try {
      await axios.post('/api/cashout/request', { coinsAmount: amount })
      setSuccessMsg(`Cash out request submitted for ${amount.toLocaleString()} coins ($${((amount / 1000) * 4.20).toFixed(2)})`)
      setCashoutAmount('')
      loadCashouts()
      refreshCoins()
    } catch (e) { setErrorMsg(e.response?.data?.error || 'Failed to submit request') }
    setCashoutLoading(false)
  }

  const [ownedBadges,    setOwnedBadges]    = useState([])
  const [equippedBadges, setEquippedBadges] = useState([])
  const [badgeBuying,    setBadgeBuying]    = useState(null)
  const [borderColor,    setBorderColor]    = useState('')
  const [animatedBorder, setAnimatedBorder] = useState(false)
  const [borderSaving,   setBorderSaving]   = useState(false)

  const loadBadges = useCallback(async () => {
    try {
      const { data } = await axios.get('/api/badges/mine')
      setOwnedBadges(data.owned || [])
      setEquippedBadges(data.equipped || [])
      setCoins(data.coins ?? coins)
    } catch {}
  }, []) // eslint-disable-line

  useEffect(() => {
    if (tab === 'spend') loadBadges()
  }, [tab]) // eslint-disable-line

  useEffect(() => {
    setBorderColor(user?.borderColor || '')
    setAnimatedBorder(user?.animatedBorder || false)
  }, [user?.borderColor, user?.animatedBorder])

  const handleBuyBadge = async (badge) => {
    setBadgeBuying(badge.id)
    setErrorMsg('')
    try {
      const { data } = await axios.post('/api/badges/buy', { badgeId: badge.id })
      setCoins(data.coins)
      setOwnedBadges(prev => [...prev, badge.id])
      setSuccessMsg(`${badge.name} badge unlocked!`)
    } catch (e) { setErrorMsg(e.response?.data?.error || 'Purchase failed') }
    setBadgeBuying(null)
  }

  const handleToggleEquip = async (badgeId) => {
    const next = equippedBadges.includes(badgeId)
      ? equippedBadges.filter(b => b !== badgeId)
      : equippedBadges.length < 3 ? [...equippedBadges, badgeId] : equippedBadges
    if (next === equippedBadges) { setErrorMsg('You can only equip 3 badges at once. Unequip one first.'); return }
    setEquippedBadges(next)
    try {
      await axios.put('/api/badges/equip', { equippedBadges: next })
    } catch (e) { setErrorMsg(e.response?.data?.error || 'Failed to update'); setEquippedBadges(equippedBadges) }
  }

  const handleSaveBorder = async (newColor, newAnimated) => {
    setBorderSaving(true)
    setErrorMsg('')
    try {
      const { data } = await axios.put('/api/user/border', { borderColor: newColor, animatedBorder: newAnimated })
      setCoins(data.coins)
      setBorderColor(data.borderColor)
      setAnimatedBorder(data.animatedBorder)
      setSuccessMsg('Profile border updated!')
    } catch (e) { setErrorMsg(e.response?.data?.error || 'Failed to update border') }
    setBorderSaving(false)
  }

  const copyReferral = () => {
    if (referralInfo?.referralLink) {
      navigator.clipboard.writeText(referralInfo.referralLink).then(() => {
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      })
    }
  }

  const statusBadge = (s) => ({
    pending:  'bg-yellow-500/15 text-yellow-400 border-yellow-500/25',
    approved: 'bg-green-500/15 text-green-400 border-green-500/25',
    rejected: 'bg-red-500/15 text-red-400 border-red-500/25',
  }[s] || '')

  const cardCls = 'rounded-2xl p-5 border border-vybe-border'
  const cardStyle = { background: 'linear-gradient(160deg, #0d0d1c 0%, #09091a 100%)' }
  const inputCls = 'w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-white/30 outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30 transition-colors'

  const canCashout = cashableCoins >= 1000

  return (
    <div className="min-h-screen bg-vybe-bg flex flex-col font-space">
      <Navbar />
      <main className="flex-1 pt-20 pb-16 px-4 max-w-4xl mx-auto w-full">

        {/* Header — dual balance display */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-white tracking-tight mb-1">Coin Wallet</h1>
          <p className="text-vybe-muted text-sm mb-5">Earn, spend, and cash out your coins</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Spend Balance */}
            <div className="flex items-center gap-3 px-5 py-4 rounded-2xl border border-blue-500/25" style={{ background: 'rgba(27,98,245,0.07)' }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(27,98,245,0.15)' }}>
                <CoinBadge size={22} />
              </div>
              <div>
                <div className="flex items-center gap-1">
                  <p className="text-xs font-bold text-blue-400/80 uppercase tracking-wider">Spend Balance</p>
                  <Tooltip text="Earned from login, streaks, purchases, and referrals. Use for gifts and features." />
                </div>
                <p className="text-2xl font-extrabold text-white">{coins.toLocaleString()}</p>
                <p className="text-blue-400/50 text-[11px]">spendable coins</p>
              </div>
            </div>

            {/* Earn Balance */}
            <div className="flex items-center gap-3 px-5 py-4 rounded-2xl border border-yellow-500/30" style={{ background: 'rgba(234,179,8,0.07)' }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(234,179,8,0.12)' }}>
                <DollarSign size={20} className="text-yellow-400" />
              </div>
              <div>
                <div className="flex items-center gap-1">
                  <p className="text-xs font-bold text-yellow-400/80 uppercase tracking-wider">Earn Balance</p>
                  <Tooltip text="Tips received from other users. Can only be cashed out — cannot be spent on gifts or features." />
                </div>
                <p className="text-2xl font-extrabold text-yellow-300">{cashableCoins.toLocaleString()}</p>
                <p className="text-yellow-400/50 text-[11px]">≈ ${((cashableCoins / 1000) * 4.20).toFixed(2)} cashable</p>
              </div>
            </div>
          </div>
        </div>

        {/* Success / Error banners */}
        <AnimatePresence>
          {successMsg && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="mb-4 px-5 py-3 rounded-xl text-sm text-green-400 border border-green-500/25 flex items-center justify-between"
              style={{ background: 'rgba(34,197,94,0.08)' }}>
              {successMsg}
              <button onClick={() => setSuccessMsg('')} className="text-green-400/50 hover:text-green-400 ml-4">✕</button>
            </motion.div>
          )}
          {errorMsg && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="mb-4 px-5 py-3 rounded-xl text-sm text-red-400 border border-red-500/25 flex items-center justify-between"
              style={{ background: 'rgba(239,68,68,0.08)' }}>
              {errorMsg}
              <button onClick={() => setErrorMsg('')} className="text-red-400/50 hover:text-red-400 ml-4">✕</button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tabs */}
        <div className="flex flex-wrap items-center gap-1 mb-6 bg-white/3 rounded-2xl p-1">
          {[
            ['overview', 'Overview'],
            ['spend',    'Spend Coins'],
            ['buy',      'Buy Coins'],
            ['history',  'History'],
            ['referral', 'Refer'],
            ['cashout',  'Cash Out'],
          ].map(([t, label]) => (
            <TabBtn key={t} active={tab === t} onClick={() => setTab(t)}>{label}</TabBtn>
          ))}
        </div>

        {/* ── OVERVIEW ─────────────────────────────────────────── */}
        {tab === 'overview' && (
          <div className="grid gap-5">
            <div className={cardCls} style={cardStyle}>
              <h2 className="text-white font-bold text-base mb-4">Ways to Earn Spend Coins</h2>
              <div className="grid sm:grid-cols-2 gap-3">
                {EARN_METHODS.map((m, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/4 border border-white/6">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${m.color}18` }}>
                      <m.Icon size={16} style={{ color: m.color }} />
                    </div>
                    <div>
                      <p className="text-white text-sm font-semibold">{m.label}</p>
                      <p className="text-vybe-muted text-xs">{m.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl p-5 border border-yellow-500/20" style={{ background: 'rgba(234,179,8,0.04)' }}>
              <p className="text-yellow-300 font-bold text-sm mb-1">How Earn Balance works</p>
              <p className="text-vybe-muted text-xs leading-relaxed">
                Tips received during video chat go to your Earn Balance (70% cut). Earn Balance can <span className="text-white font-semibold">only be cashed out</span> — it cannot be spent on badges or gifts. Minimum cash out is 1,000 coins.
              </p>
            </div>

            <div className={cardCls} style={cardStyle}>
              <p className="text-white font-bold text-sm mb-1">Ways to spend coins</p>
              <p className="text-vybe-muted text-xs mb-4">Go to the <button className="text-vybe-purple-light underline" onClick={() => setTab('spend')}>Spend Coins</button> tab to buy badges, customise your profile, and send gifts.</p>
              <div className="flex flex-wrap gap-2">
                {[{ l:'Custom Badges', c:'200–1000 coins'}, {l:'Profile Border', c:'150 coins'}, {l:'Animated Border', c:'400 coins'}, {l:'Gifts in Chat', c:'10–300 coins'}].map(i => (
                  <span key={i.l} className="px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)', color: 'rgba(167,139,250,0.9)' }}>
                    {i.l} <span className="opacity-60">· {i.c}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── SPEND COINS ──────────────────────────────────────── */}
        {tab === 'spend' && (
          <div className="grid gap-6">

            {/* Badge Shop */}
            <div className={cardCls} style={cardStyle}>
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-white font-black text-base">Badge Shop</h2>
                <span className="text-vybe-muted text-xs">{equippedBadges.length}/3 equipped</span>
              </div>
              <p className="text-vybe-muted text-xs mb-5">Purchase badges permanently. Equip up to 3 to display on your profile and during chats.</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {BADGE_DEFS.map(badge => {
                  const owned    = ownedBadges.includes(badge.id)
                  const equipped = equippedBadges.includes(badge.id)
                  const rStyle   = RARITY_STYLE[badge.rarity]
                  const isLegendary = badge.rarity === 'legendary' || badge.rarity === 'epic'
                  return (
                    <motion.div
                      key={badge.id}
                      whileHover={{ scale: 1.02 }}
                      className="relative flex flex-col items-center text-center p-4 rounded-2xl"
                      style={{
                        background: owned ? 'rgba(124,58,237,0.1)' : 'rgba(255,255,255,0.03)',
                        border: equipped ? '1px solid rgba(124,58,237,0.6)' : owned ? `1px solid ${rStyle.border}` : '1px solid rgba(255,255,255,0.07)',
                        boxShadow: equipped ? '0 0 14px rgba(124,58,237,0.25)' : isLegendary && owned ? `0 0 12px ${rStyle.border}` : 'none',
                      }}
                    >
                      {equipped && (
                        <span className="absolute top-2 right-2 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black text-white" style={{ background: '#7c3aed' }}>✓</span>
                      )}
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-2" style={{ background: rStyle.bg, border: `1px solid ${rStyle.border}` }}>
                        <badge.Icon size={24} style={{ color: rStyle.color }} />
                      </div>
                      <p className="text-white text-xs font-black mb-0.5 leading-tight">{badge.name}</p>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full mb-2" style={{ background: rStyle.bg, color: rStyle.color }}>{rStyle.label}</span>
                      <p className="text-vybe-muted text-[10px] leading-relaxed mb-3">{badge.desc}</p>
                      {owned ? (
                        <button
                          onClick={() => handleToggleEquip(badge.id)}
                          className="w-full py-1.5 rounded-lg text-[11px] font-bold transition-all"
                          style={equipped
                            ? { background: 'rgba(124,58,237,0.2)', color: 'rgba(167,139,250,1)', border: '1px solid rgba(124,58,237,0.4)' }
                            : { background: 'rgba(255,255,255,0.06)', color: 'rgba(200,200,220,0.8)', border: '1px solid rgba(255,255,255,0.1)' }
                          }
                        >
                          {equipped ? 'Unequip' : 'Equip'}
                        </button>
                      ) : (
                        <button
                          onClick={() => handleBuyBadge(badge)}
                          disabled={badgeBuying === badge.id || coins < badge.cost}
                          className="w-full py-1.5 rounded-lg text-[11px] font-bold text-white disabled:opacity-40 transition-all"
                          style={{ background: coins >= badge.cost ? 'linear-gradient(135deg,#7c3aed,#a855f7)' : 'rgba(255,255,255,0.06)' }}
                        >
                          {badgeBuying === badge.id ? '…' : (
                            <span className="flex items-center justify-center gap-1"><CoinBadge size={10} />{badge.cost}</span>
                          )}
                        </button>
                      )}
                    </motion.div>
                  )
                })}
              </div>
            </div>

            {/* Profile Border */}
            <div className={cardCls} style={cardStyle}>
              <h2 className="text-white font-black text-base mb-1">Profile Border</h2>
              <p className="text-vybe-muted text-xs mb-4">Customise the ring around your profile picture. One-time cost per change.</p>

              <p className="text-xs font-bold text-vybe-muted uppercase tracking-wider mb-2">Border Colour <span className="normal-case text-yellow-300 font-semibold ml-1">150 coins</span></p>
              <div className="flex flex-wrap gap-2 mb-4">
                <button
                  onClick={() => handleSaveBorder('', animatedBorder)}
                  disabled={borderSaving}
                  className="w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-all"
                  style={{ borderColor: borderColor === '' ? '#7c3aed' : 'rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)' }}
                  title="No border"
                >✕</button>
                {BORDER_COLORS.map(c => (
                  <button
                    key={c.hex}
                    onClick={() => handleSaveBorder(c.hex, animatedBorder)}
                    disabled={borderSaving || borderColor === c.hex}
                    className="w-8 h-8 rounded-full border-2 transition-all disabled:scale-110"
                    style={{ background: c.hex, borderColor: borderColor === c.hex ? '#fff' : 'transparent', opacity: borderColor === c.hex ? 1 : 0.7 }}
                    title={c.name}
                  />
                ))}
              </div>

              <p className="text-xs font-bold text-vybe-muted uppercase tracking-wider mb-2">Animated Border <span className="normal-case text-yellow-300 font-semibold ml-1">400 coins</span></p>
              <button
                onClick={() => handleSaveBorder(borderColor, !animatedBorder)}
                disabled={borderSaving}
                className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all"
                style={{ background: animatedBorder ? 'rgba(124,58,237,0.15)' : 'rgba(255,255,255,0.03)', border: animatedBorder ? '1px solid rgba(124,58,237,0.4)' : '1px solid rgba(255,255,255,0.08)' }}
              >
                <div className="w-10 h-10 rounded-full flex-shrink-0" style={{ background: animatedBorder ? 'conic-gradient(#7c3aed,#1b62f5,#ec4899,#7c3aed)' : 'rgba(255,255,255,0.1)', animation: animatedBorder ? 'spin 2s linear infinite' : 'none' }} />
                <div className="text-left">
                  <p className="text-white text-sm font-bold">{animatedBorder ? 'Animated — Active' : 'Animated Border'}</p>
                  <p className="text-vybe-muted text-xs">Glowing rotating ring around your profile picture</p>
                </div>
              </button>
              <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
            </div>

            {/* Gifts */}
            <div className={cardCls} style={cardStyle}>
              <h2 className="text-white font-black text-base mb-1">Gifts During Chat</h2>
              <p className="text-vybe-muted text-xs mb-4">Send gifts to the person you're chatting with. Coins are spent when you tap Send.</p>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mb-4">
                {GIFTS_LIST.map(g => (
                  <div key={g.id} className="flex flex-col items-center text-center p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-1.5" style={{ background: `${g.color}18`, border: `1px solid ${g.color}30` }}>
                      <g.Icon size={20} style={{ color: g.color }} />
                    </div>
                    <p className="text-white text-xs font-bold mb-1">{g.name}</p>
                    <span className="flex items-center gap-0.5 text-[10px] font-semibold text-yellow-300"><CoinBadge size={9} />{g.cost}</span>
                  </div>
                ))}
              </div>
              <button onClick={() => navigate('/chat')} className="w-full py-2.5 rounded-xl text-sm font-bold text-white" style={{ background: 'linear-gradient(135deg,#7c3aed,#1b62f5)' }}>
                Start a Chat to Send Gifts
              </button>
            </div>

          </div>
        )}

        {/* ── BUY COINS ────────────────────────────────────────── */}
        {tab === 'buy' && (
          <div className={`${cardCls} space-y-4`} style={cardStyle}>
            <h2 className="text-white font-bold text-base">Choose a Package</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {PACKAGES.map((pkg) => (
                <motion.div
                  key={pkg.id}
                  whileHover={{ scale: 1.02 }}
                  className={`relative rounded-2xl p-5 border cursor-pointer transition-colors ${pkg.popular ? 'border-purple-500/50' : 'border-white/8'}`}
                  style={{ background: pkg.popular ? 'rgba(168,85,247,0.08)' : 'rgba(255,255,255,0.03)' }}
                  onClick={() => handleBuy(pkg)}
                >
                  {pkg.popular && (
                    <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[10px] font-extrabold text-white"
                      style={{ background: 'linear-gradient(135deg,#a855f7,#7c3aed)' }}>
                      BEST VALUE
                    </span>
                  )}
                  <div className="flex items-center justify-between mb-3">
                    <CoinBadge size={28} />
                    <span className="text-2xl font-extrabold text-yellow-300">{pkg.label}</span>
                  </div>
                  <div className="flex items-end justify-between">
                    <span className="text-white/40 text-xs">One-time payment</span>
                    <button
                      disabled={buyLoading === pkg.id}
                      className="px-4 py-2 rounded-xl text-sm font-extrabold text-white transition-all disabled:opacity-60"
                      style={{ background: pkg.popular ? 'linear-gradient(135deg,#a855f7,#7c3aed)' : 'linear-gradient(135deg,#1b62f5,#4b88f7)', boxShadow: pkg.popular ? '0 0 16px rgba(168,85,247,0.4)' : '0 0 16px rgba(27,98,245,0.4)' }}
                    >
                      {buyLoading === pkg.id ? '…' : `$${pkg.amountUsd.toFixed(2)}`}
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
            <p className="text-vybe-muted text-xs text-center pt-2">
              Payments processed securely via Stripe. No subscriptions — one-time purchases only.
            </p>
          </div>
        )}

        {/* ── HISTORY ──────────────────────────────────────────── */}
        {tab === 'history' && (
          <div className={cardCls} style={cardStyle}>
            <h2 className="text-white font-bold text-base mb-4">Transaction History</h2>
            {histLoading ? (
              <div className="py-12 text-center text-vybe-muted text-sm">Loading…</div>
            ) : history.length === 0 ? (
              <div className="py-12 text-center">
                <div className="flex justify-center mb-3"><CoinBadge size={36} /></div>
                <p className="text-white/50 text-sm">No transactions yet</p>
              </div>
            ) : (
              <div className="space-y-1 max-h-[520px] overflow-y-auto pr-1">
                {history.map((tx, i) => {
                  const meta = TX_TYPE_LABELS[tx.type] || { label: tx.type || '—', color: tx.amount > 0 ? 'text-green-400' : 'text-red-400' }
                  const earnable = tx.type === 'tip_received' || tx.type === 'cashout' || tx.type === 'cashout_refund'
                  return (
                    <div key={i} className="flex items-center justify-between px-4 py-3 rounded-xl hover:bg-white/3 transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="flex-shrink-0">
                          {tx.amount > 0
                            ? <TrendingUp size={14} className="text-green-400" />
                            : <TrendingDown size={14} className="text-red-400" />
                          }
                        </span>
                        <div className="min-w-0">
                          <p className="text-white text-xs font-semibold">{meta.label}</p>
                          <p className="text-white/40 text-[11px] truncate">{tx.reason}</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end ml-3 flex-shrink-0">
                        <span className={`text-sm font-extrabold ${tx.amount > 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {tx.amount > 0 ? '+' : ''}{tx.amount}
                        </span>
                        {earnable && (
                          <span className="text-[10px] text-yellow-400/70">earn bal</span>
                        )}
                        <span className="text-vybe-muted/50 text-[10px]">
                          {new Date(tx.timestamp).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ── REFERRAL ─────────────────────────────────────────── */}
        {tab === 'referral' && (
          <div className="grid gap-5">
            <div className={cardCls} style={cardStyle}>
              <h2 className="text-white font-bold text-base mb-1">Refer Friends — Earn 50 Coins Each</h2>
              <p className="text-vybe-muted text-sm mb-5">Share your link. When someone signs up with it, you both get 50 coins.</p>
              {referralInfo ? (
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <input readOnly value={referralInfo.referralLink || ''} className={`${inputCls} flex-1`} />
                    <button
                      onClick={copyReferral}
                      className="px-4 py-3 rounded-xl text-sm font-bold transition-all"
                      style={{ background: copied ? 'rgba(34,197,94,0.15)' : 'rgba(27,98,245,0.15)', border: `1px solid ${copied ? 'rgba(34,197,94,0.3)' : 'rgba(27,98,245,0.3)'}`, color: copied ? '#4ade80' : '#4b88f7' }}
                    >
                      {copied ? '✓ Copied!' : 'Copy'}
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="px-4 py-3 rounded-xl bg-white/4 border border-white/6 text-center">
                      <p className="text-2xl font-extrabold text-white">{referralInfo.referralCount || 0}</p>
                      <p className="text-vybe-muted text-xs mt-0.5">Friends referred</p>
                    </div>
                    <div className="px-4 py-3 rounded-xl bg-white/4 border border-white/6 text-center">
                      <div className="flex items-center justify-center gap-1 mb-0.5">
                        <CoinBadge size={16} />
                        <p className="text-2xl font-extrabold text-yellow-300">{(referralInfo.referralCount || 0) * 50}</p>
                      </div>
                      <p className="text-vybe-muted text-xs mt-0.5">Coins earned</p>
                    </div>
                  </div>
                  <div className="flex gap-3 pt-1">
                    <a
                      href={`https://twitter.com/intent/tweet?text=Join+me+on+Vybe+for+random+video+chats!+${encodeURIComponent(referralInfo.referralLink)}`}
                      target="_blank" rel="noreferrer"
                      className="flex-1 py-2.5 rounded-xl text-sm font-bold text-center text-white transition-all"
                      style={{ background: 'rgba(29,161,242,0.15)', border: '1px solid rgba(29,161,242,0.3)' }}
                    >
                      𝕏 Share
                    </a>
                    <a
                      href={`https://wa.me/?text=Join+me+on+Vybe!+${encodeURIComponent(referralInfo.referralLink)}`}
                      target="_blank" rel="noreferrer"
                      className="flex-1 py-2.5 rounded-xl text-sm font-bold text-center text-white transition-all"
                      style={{ background: 'rgba(37,211,102,0.15)', border: '1px solid rgba(37,211,102,0.3)' }}
                    >
                      WhatsApp
                    </a>
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center text-vybe-muted text-sm">Loading…</div>
              )}
            </div>
          </div>
        )}

        {/* ── CASH OUT ─────────────────────────────────────────── */}
        {tab === 'cashout' && (
          <div className="grid gap-5">
            {/* Balances for cashout */}
            <div className="grid grid-cols-2 gap-4">
              <div className="px-4 py-4 rounded-2xl border border-blue-500/20" style={{ background: 'rgba(27,98,245,0.06)' }}>
                <p className="text-blue-400/70 text-xs font-bold uppercase mb-1">Spend Balance</p>
                <div className="flex items-center gap-1.5">
                  <CoinBadge size={16} />
                  <p className="text-xl font-extrabold text-white">{coins.toLocaleString()}</p>
                </div>
                <p className="text-blue-400/40 text-[11px] mt-1">Cannot be cashed out</p>
              </div>
              <div className="px-4 py-4 rounded-2xl border border-yellow-500/30" style={{ background: 'rgba(234,179,8,0.07)' }}>
                <p className="text-yellow-400/70 text-xs font-bold uppercase mb-1">Earn Balance</p>
                <div className="flex items-center gap-1.5">
                  <DollarSign size={16} className="text-yellow-400" />
                  <p className="text-xl font-extrabold text-yellow-300">{cashableCoins.toLocaleString()}</p>
                </div>
                <p className="text-yellow-400/50 text-[11px] mt-1 flex items-center gap-1">
                  {canCashout ? <><Check size={11} className="text-green-400" /><span className="text-green-400">Eligible to cash out</span></> : `${Math.max(0, 1000 - cashableCoins).toLocaleString()} more needed`}
                </p>
              </div>
            </div>

            <div className={cardCls} style={cardStyle}>
              <h2 className="text-white font-bold text-base mb-1">Cash Out via PayPal</h2>
              <p className="text-vybe-muted text-sm mb-4">
                Only your <span className="text-yellow-300 font-semibold">Earn Balance</span> (tips received) can be cashed out.
                Minimum request: 1,000 coins.
              </p>

              {/* PayPal email */}
              <div className="mb-4">
                <label className="text-white/60 text-xs font-semibold block mb-2">PayPal Email</label>
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={paypalEmail}
                    onChange={(e) => setPaypalEmail(e.target.value)}
                    placeholder="your@paypal.com"
                    className={`${inputCls} flex-1`}
                  />
                  <button
                    onClick={handleSavePaypal}
                    disabled={paypalSaving || !paypalEmail}
                    className="px-4 py-3 rounded-xl text-sm font-bold text-white disabled:opacity-50 transition-all"
                    style={{ background: 'rgba(27,98,245,0.2)', border: '1px solid rgba(27,98,245,0.3)' }}
                  >
                    {paypalSaving ? '…' : 'Save'}
                  </button>
                </div>
              </div>

              {/* Cash out form */}
              {canCashout ? (
                <div className="space-y-3">
                  <div>
                    <label className="text-white/60 text-xs font-semibold block mb-2">
                      Amount (from Earn Balance — max {cashableCoins.toLocaleString()})
                    </label>
                    <input
                      type="number"
                      value={cashoutAmount}
                      onChange={(e) => setCashoutAmount(e.target.value)}
                      placeholder="1000"
                      min="1000"
                      max={cashableCoins}
                      step="100"
                      className={inputCls}
                    />
                    {cashoutAmount && parseInt(cashoutAmount) >= 1000 && parseInt(cashoutAmount) <= cashableCoins && (
                      <p className="text-green-400 text-xs mt-1">≈ ${((parseInt(cashoutAmount) / 1000) * 4.20).toFixed(2)} to your PayPal</p>
                    )}
                    {cashoutAmount && parseInt(cashoutAmount) > cashableCoins && (
                      <p className="text-red-400 text-xs mt-1">Exceeds your Earn Balance of {cashableCoins.toLocaleString()} coins</p>
                    )}
                  </div>
                  <button
                    onClick={handleCashout}
                    disabled={cashoutLoading || !cashoutAmount || parseInt(cashoutAmount) < 1000 || parseInt(cashoutAmount) > cashableCoins || !paypalEmail}
                    className="w-full py-3 rounded-xl text-sm font-extrabold text-white transition-all disabled:opacity-50"
                    style={{ background: 'linear-gradient(135deg,#22c55e,#16a34a)', boxShadow: '0 0 20px rgba(34,197,94,0.3)' }}
                  >
                    {cashoutLoading ? 'Submitting…' : 'Request Cash Out'}
                  </button>
                  <p className="text-vybe-muted text-xs text-center">Requests are reviewed and processed within 3–5 business days.</p>
                </div>
              ) : (
                <div className="px-4 py-4 rounded-xl text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <p className="text-white/50 text-sm">Earn {Math.max(0, 1000 - cashableCoins).toLocaleString()} more coins from tips to unlock cash out</p>
                  <p className="text-vybe-muted text-xs mt-1">Tip coins go directly to your Earn Balance during video chats</p>
                </div>
              )}
            </div>

            {/* Cash out history */}
            {cashouts.length > 0 && (
              <div className={cardCls} style={cardStyle}>
                <h3 className="text-white font-bold text-sm mb-3">Request History</h3>
                <div className="space-y-2">
                  {cashouts.map((r) => (
                    <div key={r._id} className="flex items-center justify-between px-4 py-3 rounded-xl bg-white/3">
                      <div>
                        <p className="text-white text-sm font-semibold">{r.coinsAmount.toLocaleString()} coins → ${r.gbpAmount.toFixed(2)}</p>
                        <p className="text-vybe-muted text-xs">{r.paypalEmail} · {new Date(r.createdAt).toLocaleDateString()}</p>
                        {r.adminNote && <p className="text-white/40 text-xs mt-0.5">{r.adminNote}</p>}
                      </div>
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border capitalize ${statusBadge(r.status)}`}>{r.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
      <Footer />
    </div>
  )
}
