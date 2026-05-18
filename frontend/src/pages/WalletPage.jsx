import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { VybeCoin } from '../components/VybeCoin'
import { Skeleton } from '../components/Skeleton'
import EmptyStateIllustration from '../components/EmptyStateIllustration'
import {
  TrendingUp, TrendingDown,
  Check, Loader2, DollarSign, ShoppingCart, Gift,
} from 'lucide-react'

const PACKAGES = [
  { id: 'coins_100',  coins: 100,  price: '£1.49',  label: 'Starter',    color: '#10b981', glow: 'rgba(16,185,129,0.3)',  popular: false, desc: 'A few gifts to get started' },
  { id: 'coins_500',  coins: 500,  price: '£5.99',  label: 'Popular',    color: '#00D4FF', glow: 'rgba(0,212,255,0.3)',   popular: false, desc: 'The most popular pick' },
  { id: 'coins_1200', coins: 1200, price: '£11.99', label: 'Best Value', color: '#7C3AED', glow: 'rgba(124,58,237,0.35)', popular: true,  desc: 'More coins, better rate' },
  { id: 'coins_3000', coins: 3000, price: '£24.99', label: 'Mega',       color: '#ec4899', glow: 'rgba(236,72,153,0.3)',  popular: false, desc: 'For frequent gifters' },
  { id: 'coins_7000', coins: 7000, price: '£49.99', label: 'Ultimate',   color: '#f59e0b', glow: 'rgba(245,158,11,0.3)',  popular: false, desc: 'The best rate available' },
]

const TX_TYPE_LABELS = {
  signup:        { label: 'Sign-up bonus',  color: 'text-cyan-400'  },
  bonus:         { label: 'Login bonus',    color: 'text-cyan-400'  },
  streak:        { label: 'Streak bonus',   color: 'text-orange-400' },
  referral:      { label: 'Referral',       color: 'text-cyan-400'   },
  purchase:      { label: 'Coin purchase',  color: 'text-cyan-400'   },
  tip_received:  { label: 'Tip received',   color: 'text-cyan-400' },
  tip_sent:      { label: 'Tip sent',       color: 'text-red-400'    },
  gift:          { label: 'Gift sent',      color: 'text-red-400'    },
  cashout:       { label: 'Cash out',       color: 'text-cyan-400' },
  cashout_refund:{ label: 'Cashout refund', color: 'text-cyan-400'  },
}

function TabBtn({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 sm:px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
        active ? 'bg-[#00D4FF] text-[#0a0a0f]' : 'text-vybe-muted hover:text-white'
      }`}
    >
      {children}
    </button>
  )
}

export default function WalletPage() {
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const [tab, setTab] = useState(() => searchParams.get('tab') || 'overview')

  const switchTab = (t) => {
    setTab(t)
    // Show the skeleton from the first frame — otherwise History briefly
    // flashes the previous visit's stale list before loadHistory runs.
    if (t === 'history') setHistLoading(true)
    setSearchParams(t === 'overview' ? {} : { tab: t }, { replace: true })
    // Jump instantly — the global `scroll-behavior: smooth` would otherwise
    // animate the scroll and flash the footer through view as the shorter
    // tab swaps in.
    window.scrollTo({ top: 0, behavior: 'instant' })
  }
  const [coins, setCoins]                 = useState(user?.coins ?? 0)
  const [earnings, setEarnings]           = useState(user?.cashableCoins ?? 0)
  const [balanceLoading, setBalanceLoading] = useState(user?.coins == null)
  const [history, setHistory]             = useState([])
  const [histLoading, setHistLoading]     = useState(true)
  const [referralInfo, setReferralInfo]   = useState(null)
  const [cashouts, setCashouts]           = useState([])
  const [paypalEmail, setPaypalEmail]     = useState('')
  const [cashoutAmount, setCashoutAmount] = useState('')
  const [cashoutLoading, setCashoutLoading] = useState(false)
  const [buyLoading, setBuyLoading]       = useState(null)
  const [successMsg, setSuccessMsg]       = useState('')
  const [errorMsg, setErrorMsg]           = useState('')
  const [copied, setCopied]               = useState(false)

  useEffect(() => {
    if (authLoading) return
    if (!user) { navigate('/auth'); return }
    const success = searchParams.get('success')
    const purchasedCoins = searchParams.get('coins')
    if (success && purchasedCoins) setSuccessMsg(`${Number(purchasedCoins).toLocaleString()} coins added to your wallet!`)
  }, [user, authLoading, navigate, searchParams])

  const refreshCoins = useCallback(async () => {
    try {
      const { data } = await axios.get('/api/user/me')
      setCoins(data.user.coins ?? 0)
      setEarnings(data.user.cashableCoins ?? 0)
      setPaypalEmail(data.user.paypalEmail ?? '')
    } catch {} finally {
      setBalanceLoading(false)
    }
  }, [])

  useEffect(() => { refreshCoins() }, [refreshCoins])

  const loadHistory = useCallback(async () => {
    setHistLoading(true)
    try {
      const { data } = await axios.get('/api/user/coins/history')
      setHistory(data.history || [])
      setCoins(data.coins ?? 0)
      setEarnings(data.cashableCoins ?? 0)
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
  }, [tab])

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

  const handleCashout = async () => {
    const amount = parseInt(cashoutAmount, 10)
    if (!amount || amount < 1000) { setErrorMsg('Minimum cash out is 1,000 earnings coins'); return }
    if (amount > earnings) { setErrorMsg(`You only have ${earnings.toLocaleString()} earnings coins`); return }
    if (!paypalEmail) { setErrorMsg('Enter your PayPal email above'); return }
    setCashoutLoading(true)
    setErrorMsg('')
    try {
      // Save the PayPal email first so the user never has to click Save separately.
      await axios.put('/api/user/paypal-email', { paypalEmail })
      await axios.post('/api/cashout/request', { coinsAmount: amount })
      setSuccessMsg(`Cash out request submitted for ${amount.toLocaleString()} coins (£${((amount / 1000) * 4.20).toFixed(2)})`)
      setCashoutAmount('')
      loadCashouts()
      refreshCoins()
    } catch (e) { setErrorMsg(e.response?.data?.error || 'Failed to submit request') }
    setCashoutLoading(false)
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
    pending:  'bg-cyan-500/15 text-cyan-400 border-yellow-500/25',
    approved: 'bg-cyan-500/15 text-cyan-400 border-cyan-400/25',
    rejected: 'bg-red-500/15 text-red-400 border-red-500/25',
  }[s] || '')

  const cardCls   = 'rounded-2xl p-5 border border-vybe-border'
  const cardStyle = { background: 'linear-gradient(160deg, #0d0d1c 0%, #09091a 100%)' }
  const inputCls  = 'w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-white/30 outline-none focus:border-cyan-400/60 focus:ring-1 focus:ring-cyan-400/30 transition-colors'

  const canCashout = earnings >= 1000

  return (
    <div className="min-h-screen bg-vybe-bg flex flex-col font-space">
      <AnimatePresence>
        {buyLoading && (
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

      <Navbar />
      <main className="flex-1 pt-20 pb-16 px-4 max-w-4xl mx-auto w-full">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-white tracking-tight mb-1">Wallet</h1>
          <p className="text-vybe-muted text-sm mb-5">Buy coins, send gifts, and cash out your earnings</p>

          {balanceLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Skeleton className="h-[88px]" rounded="rounded-2xl" />
              <Skeleton className="h-[88px]" rounded="rounded-2xl" />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Coins */}
              <div className="flex items-center gap-4 px-5 py-4 rounded-2xl border border-cyan-400/25" style={{ background: 'rgba(0,212,255,0.07)' }}>
                <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(0,212,255,0.15)' }}>
                  <VybeCoin size={22} />
                </div>
                <div>
                  <p className="text-xs font-bold text-cyan-400/80 uppercase tracking-wider mb-0.5">Coins</p>
                  <p className="text-2xl font-extrabold text-white">{coins.toLocaleString()}</p>
                  <p className="text-cyan-400/50 text-[11px]">use to send gifts in chat</p>
                </div>
              </div>

              {/* Earnings */}
              <div className="flex items-center gap-4 px-5 py-4 rounded-2xl border border-cyan-400/25" style={{ background: 'rgba(0,212,255,0.06)' }}>
                <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(0,212,255,0.12)' }}>
                  <DollarSign size={20} className="text-cyan-400" />
                </div>
                <div>
                  <p className="text-xs font-bold text-cyan-400/80 uppercase tracking-wider mb-0.5">Earnings</p>
                  <p className="text-2xl font-extrabold text-cyan-400">{earnings.toLocaleString()}</p>
                  <p className="text-cyan-400/50 text-[11px]">≈ £{((earnings / 1000) * 4.20).toFixed(2)} cashable from tips</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Banners */}
        <AnimatePresence>
          {successMsg && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="mb-4 px-5 py-3 rounded-xl text-sm text-cyan-400 border border-cyan-400/25 flex items-center justify-between"
              style={{ background: 'rgba(0,212,255,0.08)' }}>
              {successMsg}
              <button onClick={() => setSuccessMsg('')} className="text-cyan-400/50 hover:text-cyan-400 ml-4">✕</button>
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
            ['buy',      'Buy Coins'],
            ['history',  'History'],
            ['cashout',  'Cash Out'],
          ].map(([t, label]) => (
            <TabBtn key={t} active={tab === t} onClick={() => switchTab(t)}>{label}</TabBtn>
          ))}
        </div>

        {/* ── OVERVIEW ── */}
        {tab === 'overview' && (
          <div className="grid gap-5">
            {/* How it works */}
            <div className={cardCls} style={cardStyle}>
              <h2 className="text-white font-bold text-base mb-5">How Gifting Works</h2>
              <div className="grid sm:grid-cols-3 gap-4">
                {[
                  { Icon: ShoppingCart, color: '#00B8E0', step: '1', title: 'Buy Coins', desc: 'Purchase coins with a simple one-time payment via Stripe.' },
                  { Icon: Gift,         color: '#00D4FF', step: '2', title: 'Send Gifts', desc: 'Send gifts to people you meet in video chat — instantly.' },
                  { Icon: DollarSign,   color: '#00D4FF', step: '3', title: 'Cash Out',   desc: 'Recipients earn 70% of every gift and can cash out to PayPal.' },
                ].map(({ Icon, color, step, title, desc }) => (
                  <div key={step} className="flex flex-col items-center text-center p-5 rounded-2xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3 relative" style={{ background: `${color}18`, border: `1px solid ${color}30` }}>
                      <Icon size={22} style={{ color }} />
                      <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black text-white" style={{ background: color }}>
                        {step}
                      </span>
                    </div>
                    <p className="text-white font-bold text-sm mb-1">{title}</p>
                    <p className="text-vybe-muted text-xs leading-relaxed">{desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Earnings info */}
            <div className="rounded-2xl p-5 border border-cyan-400/20" style={{ background: 'rgba(0,212,255,0.04)' }}>
              <div className="flex items-center gap-2 mb-1">
                <DollarSign size={15} className="text-cyan-400" />
                <p className="text-cyan-400 font-bold text-sm">How Earnings Work</p>
              </div>
              <p className="text-vybe-muted text-xs leading-relaxed">
                When someone sends you a gift in chat, 70% goes straight to your Earnings balance. Once you reach 1,000 earnings coins (≈ £4.20), you can request a PayPal payout in the <button className="text-white font-semibold underline" onClick={() => switchTab('cashout')}>Cash Out</button> tab.
              </p>
            </div>
          </div>
        )}

        {/* ── BUY COINS ── */}
        {tab === 'buy' && (
          <div className={cardCls} style={cardStyle}>
            <h2 className="text-white font-bold text-base mb-4">Choose a Package</h2>
            <div className="space-y-3">
              {PACKAGES.map((pkg, i) => (
                <motion.div
                  key={pkg.id}
                  className="relative flex items-center gap-4 rounded-2xl p-4"
                  style={{
                    background: pkg.popular ? 'linear-gradient(135deg, rgba(124,58,237,0.14) 0%, rgba(10,15,32,0.5) 100%)' : 'rgba(255,255,255,0.03)',
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
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: `${pkg.color}1e`, border: `1px solid ${pkg.color}40` }}>
                    <VybeCoin size={26} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-black text-lg leading-tight">{pkg.coins.toLocaleString()} coins</p>
                    <p className="text-xs truncate" style={{ color: '#888899' }}>
                      <span style={{ color: pkg.color, fontWeight: 700 }}>{pkg.label}</span> · {pkg.desc}
                    </p>
                  </div>
                  <motion.button
                    onClick={() => handleBuy(pkg)}
                    disabled={buyLoading === pkg.id}
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                    className="flex-shrink-0 py-2.5 rounded-xl font-extrabold text-sm text-white flex items-center justify-center disabled:opacity-60"
                    style={{
                      minWidth: 96,
                      background: pkg.color,
                      boxShadow: pkg.popular ? `0 0 22px ${pkg.glow}` : 'none',
                    }}
                  >
                    {buyLoading === pkg.id ? <Loader2 size={15} className="animate-spin" /> : pkg.price}
                  </motion.button>
                </motion.div>
              ))}
            </div>
            <p className="text-vybe-muted text-xs text-center pt-4">
              Payments processed securely via Stripe. No subscriptions — one-time purchases only.
            </p>
          </div>
        )}

        {/* ── HISTORY ── */}
        {tab === 'history' && (
          <div className={cardCls} style={{ ...cardStyle, minHeight: 540 }}>
            <h2 className="text-white font-bold text-base mb-4">Transaction History</h2>
            {histLoading ? (
              <div className="space-y-2">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="flex items-center justify-between px-4 py-3 rounded-xl">
                    <div className="flex items-center gap-3 flex-1">
                      <Skeleton className="w-5 h-5 flex-shrink-0" rounded="rounded-full" />
                      <div className="flex-1 space-y-1.5">
                        <Skeleton className="h-3 w-32" />
                        <Skeleton className="h-2 w-20" />
                      </div>
                    </div>
                    <Skeleton className="h-4 w-10" />
                  </div>
                ))}
              </div>
            ) : history.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="py-8 flex flex-col items-center text-center"
              >
                <EmptyStateIllustration variant="wallet" size={96} />
                <p className="text-white/70 text-sm font-bold mt-2 mb-1">No transactions yet</p>
                <p className="text-white/30 text-xs">Buy coins or receive gifts to see your history here</p>
              </motion.div>
            ) : (
              <div className="space-y-1 max-h-[460px] overflow-y-auto pr-1">
                {history.map((tx, i) => {
                  const meta = TX_TYPE_LABELS[tx.type] || { label: tx.type || '—', color: tx.amount > 0 ? 'text-cyan-400' : 'text-red-400' }
                  const isEarning = tx.type === 'tip_received' || tx.type === 'cashout' || tx.type === 'cashout_refund'
                  return (
                    <div key={i} className="flex items-center justify-between px-4 py-3 rounded-xl hover:bg-white/3 transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="flex-shrink-0">
                          {tx.amount > 0
                            ? <TrendingUp size={14} className="text-cyan-400" />
                            : <TrendingDown size={14} className="text-red-400" />
                          }
                        </span>
                        <div className="min-w-0">
                          <p className="text-white text-xs font-semibold">{meta.label}</p>
                          <p className="text-white/40 text-[11px] truncate">{tx.reason}</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end ml-3 flex-shrink-0">
                        <span className={`text-sm font-extrabold ${tx.amount > 0 ? 'text-cyan-400' : 'text-red-400'}`}>
                          {tx.amount > 0 ? '+' : ''}{tx.amount}
                        </span>
                        {isEarning && <span className="text-[10px] text-cyan-400/60">earnings</span>}
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

        {/* ── CASH OUT ── */}
        {tab === 'cashout' && (
          <div className="grid gap-5 content-start" style={{ minHeight: 540 }}>
            {/* Earnings summary */}
            <div className="px-5 py-4 rounded-2xl border border-cyan-400/25 flex items-center gap-4" style={{ background: 'rgba(0,212,255,0.06)' }}>
              <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(0,212,255,0.15)' }}>
                <DollarSign size={20} className="text-cyan-400" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold text-cyan-400/80 uppercase tracking-wider mb-0.5">Your Earnings</p>
                <p className="text-2xl font-extrabold text-cyan-400">{earnings.toLocaleString()} coins</p>
                <p className="text-cyan-400/50 text-[11px]">≈ £{((earnings / 1000) * 4.20).toFixed(2)} · from tips received in chat</p>
              </div>
              {canCashout && (
                <div className="flex items-center gap-1 text-cyan-400 text-xs font-bold">
                  <Check size={13} /> Eligible
                </div>
              )}
            </div>

            <div className={cardCls} style={cardStyle}>
              <h2 className="text-white font-bold text-base mb-1">Cash Out via PayPal</h2>
              <p className="text-vybe-muted text-sm mb-4">
                Minimum 1,000 earnings coins to request a payout. Rate: 1,000 coins = £4.20.
              </p>

              <div className="mb-4">
                <label className="text-white/60 text-xs font-semibold block mb-2">Your PayPal Email</label>
                <input
                  type="email"
                  value={paypalEmail}
                  onChange={(e) => setPaypalEmail(e.target.value)}
                  placeholder="your@paypal.com"
                  className={`${inputCls} w-full`}
                />
              </div>

              {canCashout ? (
                <div className="space-y-3">
                  <div>
                    <label className="text-white/60 text-xs font-semibold block mb-2">
                      Amount to cash out (max {earnings.toLocaleString()})
                    </label>
                    <input
                      type="number"
                      value={cashoutAmount}
                      onChange={(e) => setCashoutAmount(e.target.value)}
                      placeholder="1000"
                      min="1000"
                      max={earnings}
                      step="100"
                      className={inputCls}
                    />
                    {cashoutAmount && parseInt(cashoutAmount) >= 1000 && parseInt(cashoutAmount) <= earnings && (
                      <p className="text-cyan-400 text-xs mt-1">≈ £{((parseInt(cashoutAmount) / 1000) * 4.20).toFixed(2)} to your PayPal</p>
                    )}
                    {cashoutAmount && parseInt(cashoutAmount) > earnings && (
                      <p className="text-red-400 text-xs mt-1">Exceeds your earnings of {earnings.toLocaleString()} coins</p>
                    )}
                  </div>
                  <button
                    onClick={handleCashout}
                    disabled={cashoutLoading || !cashoutAmount || parseInt(cashoutAmount) < 1000 || parseInt(cashoutAmount) > earnings || !paypalEmail}
                    className="w-full py-3 rounded-xl text-sm font-extrabold text-white transition-all disabled:opacity-50"
                    style={{ background: 'linear-gradient(135deg,#00D4FF,#00B8E0)', boxShadow: '0 0 20px rgba(0,212,255,0.3)' }}
                  >
                    {cashoutLoading ? 'Submitting…' : 'Save & Request Cash Out'}
                  </button>
                  <p className="text-vybe-muted text-xs text-center">Reviewed and processed within 3–5 business days.</p>
                </div>
              ) : (
                <div className="px-4 py-5 rounded-xl text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <p className="text-white/50 text-sm mb-1">Earn {Math.max(0, 1000 - earnings).toLocaleString()} more coins from tips to unlock cash out</p>
                  <p className="text-vybe-muted text-xs">When someone sends you a gift in chat, it goes to your earnings balance</p>
                </div>
              )}
            </div>

            {cashouts.length > 0 && (
              <div className={cardCls} style={cardStyle}>
                <h3 className="text-white font-bold text-sm mb-3">Request History</h3>
                <div className="space-y-2">
                  {cashouts.map((r) => (
                    <div key={r._id} className="flex items-center justify-between px-4 py-3 rounded-xl bg-white/3">
                      <div>
                        <p className="text-white text-sm font-semibold">{r.coinsAmount.toLocaleString()} coins → £{r.gbpAmount.toFixed(2)}</p>
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
