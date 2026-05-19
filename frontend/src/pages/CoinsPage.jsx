import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Loader2, Shield, Gift } from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { useAuth } from '../context/AuthContext'
import { VybeCoin } from '../components/VybeCoin'
import axios from 'axios'

const PACKAGES = [
  { id: 'coins_100',  coins: 100,  price: '£1.49',  label: 'Starter',    color: '#00D4FF', glow: 'rgba(0,212,255,0.3)', popular: false, desc: 'A few gifts to get started' },
  { id: 'coins_500',  coins: 500,  price: '£5.99',  label: 'Popular',    color: '#00D4FF', glow: 'rgba(0,212,255,0.3)', popular: false, desc: 'The most popular pick' },
  { id: 'coins_1200', coins: 1200, price: '£11.99', label: 'Best Value', color: '#00D4FF', glow: 'rgba(0,212,255,0.4)', popular: true,  desc: 'More coins, better rate' },
  { id: 'coins_3000', coins: 3000, price: '£24.99', label: 'Mega',       color: '#00D4FF', glow: 'rgba(0,212,255,0.3)', popular: false, desc: 'For frequent gifters' },
  { id: 'coins_7000', coins: 7000, price: '£49.99', label: 'Ultimate',   color: '#00D4FF', glow: 'rgba(0,212,255,0.3)', popular: false, desc: 'The best rate available' },
]

export default function CoinsPage() {
  const { user, token, loading: authLoading } = useAuth()
  const navigate        = useNavigate()
  const [searchParams]  = useSearchParams()
  const fromChat        = searchParams.get('from') === 'chat'
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
        <div style={{ position: 'absolute', bottom: '10%', right: '10%', width: '400px', height: '400px', background: 'radial-gradient(ellipse at 50% 50%, rgba(124,58,237,0.05) 0%, transparent 65%)' }} />
      </div>

      <Navbar />

      <div className="relative z-10 max-w-xl mx-auto px-4 pt-28 pb-24">

        {/* Header */}
        <motion.div
          className="text-center mb-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55 }}
        >
          <button
            onClick={() => navigate(fromChat ? '/chat' : '/wallet')}
            className="inline-flex items-center gap-2 text-sm mb-6 transition-colors"
            style={{ color: '#888899' }}
          >
            <ArrowLeft size={15} />
            {fromChat ? 'Back to chat' : 'Back to Wallet'}
          </button>
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ background: 'rgba(0,212,255,0.12)', border: '1px solid rgba(0,212,255,0.25)' }}>
              <VybeCoin size={26} />
            </div>
            <h1 className="text-4xl font-black text-white tracking-tight">Buy Coins</h1>
          </div>
          <p style={{ color: '#888899' }} className="text-base max-w-sm mx-auto">
            Use coins to send gifts to the people you meet in video chat.
          </p>
          {user && (
            <div className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-full text-sm font-semibold"
              style={{ background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.2)', color: '#00B8E0' }}>
              <VybeCoin size={15} /> Your balance: <span className="text-white font-black">{(user.coins || 0).toLocaleString()} coins</span>
            </div>
          )}
        </motion.div>

        {error && (
          <div className="mb-6 p-4 rounded-xl text-sm text-center"
            style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}>
            {error}
          </div>
        )}

        {/* Coin packages — horizontal rows */}
        <div className="space-y-3 mb-8">
          {PACKAGES.map((pkg, i) => (
            <motion.div
              key={pkg.id}
              className="relative flex items-center gap-4 rounded-2xl p-4"
              style={{
                background: pkg.popular ? 'linear-gradient(135deg, rgba(0,212,255,0.14) 0%, rgba(10,15,32,0.5) 100%)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${pkg.popular ? pkg.color + '80' : 'rgba(255,255,255,0.07)'}`,
                boxShadow: pkg.popular ? `0 0 34px ${pkg.glow}` : 'none',
              }}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06, duration: 0.4 }}
            >
              {pkg.popular && (
                <div className="absolute -top-2.5 left-4 px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider text-white"
                  style={{ background: pkg.color }}>
                  BEST VALUE
                </div>
              )}

              {/* Coin icon tile */}
              <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: `${pkg.color}1e`, border: `1px solid ${pkg.color}40` }}>
                <VybeCoin size={26} />
              </div>

              {/* Coins + label */}
              <div className="flex-1 min-w-0">
                <p className="text-white font-black text-lg leading-tight">{pkg.coins.toLocaleString()} coins</p>
                <p className="text-xs truncate" style={{ color: '#888899' }}>
                  <span style={{ color: pkg.color, fontWeight: 700 }}>{pkg.label}</span> · {pkg.desc}
                </p>
              </div>

              {/* Buy button */}
              <motion.button
                onClick={() => handleBuy(pkg)}
                disabled={loading === pkg.id}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                className="flex-shrink-0 py-2.5 rounded-xl font-extrabold text-sm text-white flex items-center justify-center disabled:opacity-60"
                style={{
                  minWidth: 96,
                  background: pkg.color,
                  boxShadow: pkg.popular ? `0 0 22px ${pkg.glow}` : 'none',
                }}
              >
                {loading === pkg.id
                  ? <Loader2 size={15} className="animate-spin" />
                  : pkg.price}
              </motion.button>
            </motion.div>
          ))}
        </div>

        {/* Security note */}
        <div className="flex items-center justify-center gap-2.5 mb-8 text-xs text-center" style={{ color: '#888899' }}>
          <Shield size={14} />
          <span>Secure payment via Stripe · No card details stored · Instant delivery</span>
        </div>

        {/* What coins are for */}
        <motion.div
          className="rounded-2xl p-6 flex items-start gap-4"
          style={{ background: 'rgba(0,212,255,0.05)', border: '1px solid rgba(0,212,255,0.15)' }}
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45 }}
        >
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(0,212,255,0.12)', border: '1px solid rgba(0,212,255,0.25)' }}>
            <Gift size={18} style={{ color: '#00D4FF' }} />
          </div>
          <div>
            <h2 className="text-white font-black text-base mb-1">What are coins for?</h2>
            <p className="text-sm leading-relaxed" style={{ color: '#888899' }}>
              Send gifts to the people you vibe with in video chat — from a Small Vybe to a
              Legendary Vybe. Whoever you gift can cash their gifts out for real money.
            </p>
          </div>
        </motion.div>
      </div>

      <Footer />
    </div>
  )
}
