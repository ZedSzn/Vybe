import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Loader2, Shield } from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { useAuth } from '../context/AuthContext'
import { VybeCoin } from '../components/VybeCoin'
import { VybeBadge } from '../components/VybeBadge'
import axios from 'axios'


const PACKAGES = [
  {
    id:      'coins_100',
    coins:   100,
    price:   '£1.49',
    label:   'Starter',
    icon:    null,
    color:   '#6b7280',
    glow:    'rgba(107,114,128,0.25)',
    popular: false,
    desc:    'Perfect for tips and badges',
  },
  {
    id:      'coins_500',
    coins:   500,
    price:   '£5.99',
    label:   'Popular',
    icon:    '⚡',
    color:   '#00D4FF',
    glow:    'rgba(0,212,255,0.3)',
    popular: false,
    desc:    'Most popular — great for tipping',
  },
  {
    id:      'coins_1200',
    coins:   1200,
    price:   '£11.99',
    label:   'Best Value',
    icon:    '⭐',
    color:   '#a855f7',
    glow:    'rgba(168,85,247,0.3)',
    popular: true,
    desc:    'Best value — more coins, more fun',
  },
  {
    id:      'coins_3000',
    coins:   3000,
    price:   '£24.99',
    label:   'Mega',
    icon:    '👑',
    color:   '#00D4FF',
    glow:    'rgba(0,212,255,0.25)',
    popular: false,
    desc:    'For power users who love tipping',
  },
  {
    id:      'coins_7000',
    coins:   7000,
    price:   '£49.99',
    label:   'Ultimate',
    icon:    '🚀',
    color:   '#00D4FF',
    glow:    'rgba(0,212,255,0.3)',
    popular: false,
    desc:    'Maximum coins — best rate available',
  },
]

const EARN_WAYS = [
  { icon: '🎁', label: 'Sign-up bonus',      amount: '+100',  note: 'One time' },
  { icon: '📅', label: 'Daily login',         amount: '+10',   note: 'Per day' },
  { icon: '🔥', label: '3-day streak',        amount: '+30',   note: 'Bonus' },
  { icon: '💪', label: '7-day streak',        amount: '+100',  note: 'Bonus' },
  { icon: '🏆', label: '30-day streak',       amount: '+500',  note: 'Bonus' },
  { icon: '💬', label: 'Every 10 chats',      amount: '+5',    note: 'Repeatable' },
  { icon: '👥', label: 'Refer a friend',      amount: '+50',   note: 'Per referral' },
  { icon: '💰', label: 'Receive a tip',       amount: 'Varies', note: '70% of tip' },
]

const SPEND_WAYS = [
  { badge: null,    icon: '🔁', label: 'Replay last match',     cost: '20',    desc: 'Reconnect with your last partner' },
  { badge: 'spark',            label: 'Badge: Spark',           cost: '75',    desc: 'Common badge — profile & status flex' },
  { badge: 'star',             label: 'Badge: Shooting Star',   cost: '120',   desc: 'Common badge — profile & status flex' },
  { badge: 'flame',            label: 'Badge: Flame',           cost: '250',   desc: 'Rare badge — profile & status flex' },
  { badge: 'orb',              label: 'Badge: Lightning Orb',   cost: '480',   desc: 'Epic badge — profile & status flex' },
  { badge: 'crown',            label: 'Badge: Cosmic Crown',    cost: '950',   desc: 'Legendary badge — profile & status flex' },
  { badge: null,    icon: '💸', label: 'Send tip',               cost: '10+',   desc: 'Tip your chat partner directly' },
]

export default function CoinsPage() {
  const { user, token, loading: authLoading } = useAuth()
  const navigate        = useNavigate()
  const [loading, setLoading] = useState(null)
  const [error,   setError]   = useState('')

  const handleBuy = async (pkg) => {
    if (authLoading) return
    if (!user) { navigate('/auth'); return }
    setLoading(pkg.id); setError('')
    try {
      const res = await axios.post(
        `/api/coins/buy`,
        { packageId: pkg.id },
        { headers: { Authorization: `Bearer ${token}` } },
      )
      if (res.data.url) window.location.href = res.data.url
    } catch (err) {
      setError(err.response?.data?.error || 'Payment failed. Please try again.')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="min-h-screen font-space" style={{ background: '#07090f' }}>
      {/* Stripe redirect overlay */}
      <AnimatePresence>
        {loading && (
          <motion.div
            className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4"
            style={{ background: 'rgba(7,9,15,0.92)', backdropFilter: 'blur(16px)' }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          >
            <Loader2 size={40} className="animate-spin" style={{ color: '#00B8E0' }} />
            <p className="text-white font-bold text-base">Opening secure checkout…</p>
            <p className="text-white/40 text-sm">You'll be redirected to Stripe</p>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }}>
        <div style={{ position: 'absolute', top: '-5%', left: '20%', width: '600px', height: '600px', background: 'radial-gradient(ellipse at 50% 50%, rgba(0,212,255,0.07) 0%, transparent 65%)' }} />
        <div style={{ position: 'absolute', bottom: '10%', right: '10%', width: '400px', height: '400px', background: 'radial-gradient(ellipse at 50% 50%, rgba(168,85,247,0.05) 0%, transparent 65%)' }} />
      </div>

      <Navbar />

      <div className="relative z-10 max-w-5xl mx-auto px-4 pt-28 pb-24">

        {/* Header */}
        <motion.div
          className="text-center mb-14"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55 }}
        >
          <button
            onClick={() => navigate('/wallet')}
            className="inline-flex items-center gap-2 text-sm mb-6 transition-colors"
            style={{ color: '#888899' }}
          >
            <ArrowLeft size={15} />
            Back to Wallet
          </button>
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
              style={{ background: 'rgba(0,212,255,0.12)', border: '1px solid rgba(0,212,255,0.25)' }}>
              ⚡
            </div>
            <h1 className="text-4xl font-black text-white tracking-tight">Buy Coins</h1>
          </div>
          <p style={{ color: '#888899' }} className="text-base max-w-md mx-auto">
            Use coins to tip great chatters, collect badges, replay matches, and more.
          </p>
          {user && (
            <div className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-full text-sm font-semibold"
              style={{ background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.2)', color: '#00B8E0' }}>
              ⚡ Your balance: <span className="text-white font-black">{(user.coins || 0).toLocaleString()} coins</span>
            </div>
          )}
        </motion.div>

        {error && (
          <div className="mb-8 p-4 rounded-xl text-sm text-center"
            style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}>
            {error}
          </div>
        )}

        {/* Coin packages */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-16">
          {PACKAGES.map((pkg, i) => (
            <motion.div
              key={pkg.id}
              className="relative flex flex-col rounded-2xl p-5"
              style={{
                background: pkg.popular ? 'linear-gradient(160deg, #0e1428 0%, #0a0f20 100%)' : 'rgba(255,255,255,0.03)',
                border: pkg.popular ? `1px solid ${pkg.color}70` : '1px solid rgba(255,255,255,0.07)',
                boxShadow: pkg.popular ? `0 0 40px ${pkg.glow}` : 'none',
              }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08, duration: 0.45 }}
            >
              {pkg.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-black text-white"
                  style={{ background: `linear-gradient(135deg, ${pkg.color}, ${pkg.color}cc)` }}>
                  BEST VALUE
                </div>
              )}

              {/* Icon */}
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 text-3xl"
                style={{ background: `${pkg.color}18`, border: `1px solid ${pkg.color}30` }}>
                {pkg.icon ?? <VybeCoin size={32} />}
              </div>

              <p className="text-xs font-extrabold uppercase tracking-widest mb-1" style={{ color: pkg.color }}>{pkg.label}</p>
              <p className="text-3xl font-black text-white mb-1">{pkg.coins.toLocaleString()} coins</p>
              <p className="text-xs mb-5 flex-1" style={{ color: '#888899' }}>{pkg.desc}</p>

              <div className="flex items-center justify-between mb-4">
                <span className="text-2xl font-black text-white">{pkg.price}</span>
                <span className="text-xs" style={{ color: '#888899' }}>one-time</span>
              </div>

              <motion.button
                onClick={() => handleBuy(pkg)}
                disabled={loading === pkg.id}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="w-full py-3 rounded-xl font-extrabold text-sm text-white flex items-center justify-center gap-2 disabled:opacity-60"
                style={{
                  background: pkg.popular ? pkg.color : `${pkg.color}22`,
                  border: `1px solid ${pkg.color}40`,
                  color: 'white',
                  boxShadow: pkg.popular ? `0 0 24px ${pkg.glow}` : 'none',
                }}
              >
                {loading === pkg.id
                  ? <><Loader2 size={15} className="animate-spin" /> Processing…</>
                  : `Buy for ${pkg.price}`}
              </motion.button>
            </motion.div>
          ))}
        </div>

        {/* Security note */}
        <div className="flex items-center justify-center gap-3 mb-16 text-sm" style={{ color: '#888899' }}>
          <Shield size={15} />
          <span>Secure payment via Stripe · No card details stored · Instant delivery</span>
        </div>

        {/* Earn & Spend guide */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Earn */}
          <motion.div
            className="rounded-2xl p-6"
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
            initial={{ opacity: 0, x: -16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45 }}
          >
            <h2 className="text-lg font-black text-white mb-4">🎁 Ways to Earn Free Coins</h2>
            <div className="space-y-2.5">
              {EARN_WAYS.map(({ icon, label, amount, note }) => (
                <div key={label} className="flex items-center justify-between py-2 border-b" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                  <div className="flex items-center gap-2.5">
                    <span className="text-lg">{icon}</span>
                    <div>
                      <p className="text-sm font-semibold text-white">{label}</p>
                      <p className="text-xs" style={{ color: '#888899' }}>{note}</p>
                    </div>
                  </div>
                  <span className="text-sm font-black" style={{ color: '#4ade80' }}>{amount}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Spend */}
          <motion.div
            className="rounded-2xl p-6"
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
            initial={{ opacity: 0, x: 16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45 }}
          >
            <h2 className="text-lg font-black text-white mb-4">✨ Ways to Spend Coins</h2>
            <div className="space-y-2.5">
              {SPEND_WAYS.map(({ badge, icon, label, cost, desc }) => (
                <div key={label} className="flex items-center justify-between py-2 border-b" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                  <div className="flex items-center gap-2.5">
                    {badge
                      ? <div className="flex-shrink-0 w-8 h-8"><VybeBadge id={badge} size={32} /></div>
                      : <span className="text-lg w-8 text-center">{icon}</span>
                    }
                    <div>
                      <p className="text-sm font-semibold text-white">{label}</p>
                      <p className="text-xs" style={{ color: '#888899' }}>{desc}</p>
                    </div>
                  </div>
                  <span className="text-sm font-black flex items-center gap-1" style={{ color: '#00D4FF' }}><VybeCoin size={14} /> {cost}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
