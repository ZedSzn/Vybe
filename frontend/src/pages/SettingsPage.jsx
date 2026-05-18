import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, Loader2, Trash2, UserX, Download, AlertTriangle, Check, Mail,
  ShieldCheck, Ban, UserCog, Gift, ArrowDownToLine,
} from 'lucide-react'
import EmptyStateIllustration from '../components/EmptyStateIllustration'
import VybeCoin from '../components/VybeCoin'
import { CoinBalance } from '../components/VybeCoinIcons'
import { Skeleton } from '../components/Skeleton'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'

// Shared surface — matches the glass panels used across the rest of the site.
const PANEL = { background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }
const MUTED = '#888899'

const TABS = [
  { id: 'coins',   label: 'Coins',   icon: CoinBalance },
  { id: 'blocks',  label: 'Blocked', icon: Ban },
  { id: 'account', label: 'Account', icon: UserCog },
]

export default function SettingsPage() {
  const { user, logout } = useAuth()
  const navigate         = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const initial = searchParams.get('tab')
  const [tab, setTab] = useState(TABS.some((t) => t.id === initial) ? initial : 'coins')

  useEffect(() => {
    setSearchParams({ tab }, { replace: true })
  }, [tab]) // eslint-disable-line

  if (!user) {
    return (
      <div className="min-h-screen font-space flex items-center justify-center" style={{ background: '#07090f' }}>
        <div className="text-center">
          <p className="mb-4" style={{ color: MUTED }}>Sign in to access settings</p>
          <Link to="/auth" className="px-6 py-3 rounded-xl text-white font-black text-sm"
            style={{ background: 'linear-gradient(135deg,#00D4FF,#00B8E0)' }}>
            Sign In
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen font-space" style={{ background: '#07090f' }}>
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }}>
        <div style={{ position: 'absolute', top: '-5%', left: '20%', width: '500px', height: '500px', background: 'radial-gradient(ellipse at 50% 50%, rgba(0,212,255,0.06) 0%, transparent 65%)' }} />
        <div style={{ position: 'absolute', bottom: '8%', right: '12%', width: '420px', height: '420px', background: 'radial-gradient(ellipse at 50% 50%, rgba(0,212,255,0.035) 0%, transparent 65%)' }} />
      </div>

      <Navbar />

      <div className="relative z-10 pt-24 pb-16 px-4 max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center gap-4">
          <motion.button
            onClick={() => navigate(-1)}
            whileHover={{ x: -3, color: '#ffffff' }}
            whileTap={{ scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 500, damping: 28 }}
            className="inline-flex items-center transition-colors"
            style={{ color: MUTED }}
          >
            <ArrowLeft size={16} />
          </motion.button>
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight">Settings</h1>
            <p className="text-sm mt-0.5" style={{ color: MUTED }}>Manage your coins, blocks and account</p>
          </div>
        </div>

        {/* Tab bar */}
        <div className="flex gap-2 flex-wrap mb-6">
          {TABS.map((t) => {
            const active = tab === t.id
            const Icon = t.icon
            return (
              <motion.button
                key={t.id}
                onClick={() => setTab(t.id)}
                whileHover={{ scale: active ? 1 : 1.04 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 450, damping: 22 }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-colors"
                style={active
                  ? { background: 'rgba(0,212,255,0.15)', border: '1px solid rgba(0,212,255,0.4)', color: '#00D4FF' }
                  : { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', color: MUTED }}
              >
                <Icon size={13} />
                {t.label}
              </motion.button>
            )
          })}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          >
            {tab === 'coins'   && <CoinsTab />}
            {tab === 'blocks'  && <BlocksTab />}
            {tab === 'account' && <AccountTab logout={logout} navigate={navigate} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

// ─── Coins Tab ────────────────────────────────────────────────────────────────
function CoinsTab() {
  const [coins,   setCoins]   = useState(0)
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    axios.get('/api/user/coins/history')
      .then(({ data }) => { setCoins(data.coins); setHistory(data.history) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="space-y-4">
      <Skeleton className="h-28 w-full" rounded="rounded-2xl" />
      <Skeleton className="h-40 w-full" rounded="rounded-2xl" />
      <div className="rounded-2xl p-5 space-y-3" style={PANEL}>
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex items-center justify-between py-2">
            <Skeleton className="h-4 w-36" rounded="rounded" />
            <Skeleton className="h-4 w-14" rounded="rounded" />
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <div className="space-y-4">
      {/* Balance */}
      <div className="rounded-2xl p-6" style={PANEL}>
        <p className="text-[11px] font-bold uppercase tracking-[0.15em] mb-2" style={{ color: MUTED }}>Coin Balance</p>
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <p className="text-4xl font-black text-white flex items-center gap-2">
            {coins.toLocaleString()} <CoinBalance size={26} />
          </p>
          <div className="flex gap-2">
            <Link to="/wallet?tab=buy"
              className="px-3.5 py-2 rounded-xl text-xs font-extrabold text-white transition-opacity hover:opacity-90"
              style={{ background: 'linear-gradient(135deg,#00D4FF,#00B8E0)', boxShadow: '0 0 14px rgba(0,212,255,0.3)' }}>
              Buy coins
            </Link>
            <Link to="/wallet?tab=cashout"
              className="px-3.5 py-2 rounded-xl text-xs font-extrabold transition-colors"
              style={{ background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.28)', color: '#00D4FF' }}>
              Cash out
            </Link>
          </div>
        </div>
      </div>

      {/* How coins work */}
      <div className="rounded-2xl p-5" style={PANEL}>
        <h3 className="text-sm font-black text-white mb-4">How coins work</h3>
        <div className="space-y-4">
          {[
            { Icon: Gift, title: 'Spend', desc: 'Send gifts to people you meet in video chat.' },
            { Icon: ArrowDownToLine, title: 'Earn', desc: 'When someone gifts you, the coins land in your cashable balance — withdraw real money any time from your Wallet.' },
          ].map(({ Icon, title, desc }) => (
            <div key={title} className="flex gap-3 items-start">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.22)' }}>
                <Icon size={16} style={{ color: '#00D4FF' }} />
              </div>
              <div className="min-w-0">
                <p className="text-white text-sm font-bold">{title}</p>
                <p className="text-xs leading-relaxed mt-0.5" style={{ color: MUTED }}>{desc}</p>
              </div>
            </div>
          ))}
        </div>
        <Link to="/wallet"
          className="mt-4 inline-flex items-center gap-1 text-xs font-bold transition-colors"
          style={{ color: '#00D4FF' }}>
          Open Wallet →
        </Link>
      </div>

      {/* Transaction history */}
      <div className="rounded-2xl p-5" style={PANEL}>
        <h3 className="text-sm font-black text-white mb-4">Transaction History</h3>
        {history.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-6 flex flex-col items-center text-center">
            <EmptyStateIllustration variant="wallet" size={72} />
            <p className="text-xs font-semibold mt-1" style={{ color: MUTED }}>No transactions yet</p>
          </motion.div>
        ) : (
          <div className="max-h-72 overflow-y-auto">
            {history.map((t, i) => (
              <div key={i} className="flex items-center justify-between py-2.5 border-b last:border-0"
                style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                <div>
                  <p className="text-white text-xs font-semibold">{t.reason}</p>
                  <p className="text-[10px] mt-0.5" style={{ color: MUTED }}>{new Date(t.timestamp).toLocaleDateString()}</p>
                </div>
                <span className={`text-sm font-black flex items-center gap-1 ${t.amount > 0 ? 'text-cyan-400' : 'text-red-400'}`}>
                  {t.amount > 0 ? '+' : ''}{t.amount}<VybeCoin size={12} />
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Blocks Tab ───────────────────────────────────────────────────────────────
function BlocksTab() {
  const [blocked, setBlocked] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    axios.get('/api/user/blocks')
      .then(({ data }) => setBlocked(data.blocked))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const unblock = async (id) => {
    try {
      await axios.delete(`/api/user/block/${id}`)
      setBlocked((b) => b.filter((u) => String(u._id) !== String(id)))
    } catch {}
  }

  if (loading) return (
    <div className="rounded-2xl p-5 space-y-3" style={PANEL}>
      <Skeleton className="h-5 w-32" rounded="rounded" />
      <Skeleton className="h-3 w-48" rounded="rounded" />
      {[...Array(4)].map((_, i) => (
        <div key={i} className="flex items-center justify-between py-2.5">
          <div className="flex items-center gap-3">
            <Skeleton className="w-8 h-8 flex-shrink-0" rounded="rounded-full" />
            <div className="space-y-1.5">
              <Skeleton className="h-3.5 w-24" rounded="rounded" />
              <Skeleton className="h-3 w-16" rounded="rounded" />
            </div>
          </div>
          <Skeleton className="h-7 w-16" rounded="rounded-lg" />
        </div>
      ))}
    </div>
  )

  return (
    <div className="rounded-2xl p-5" style={PANEL}>
      <h3 className="text-sm font-black text-white mb-1">Blocked Users</h3>
      <p className="text-xs mb-4" style={{ color: MUTED }}>Blocked users will never be matched with you.</p>
      {blocked.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-8 flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3"
            style={{ background: 'rgba(0,212,255,0.07)', border: '1px solid rgba(0,212,255,0.14)' }}>
            <UserX size={24} style={{ color: '#00D4FF', opacity: 0.55 }} />
          </div>
          <p className="text-sm font-semibold mb-0.5" style={{ color: 'rgba(255,255,255,0.65)' }}>No blocked users</p>
          <p className="text-xs" style={{ color: MUTED }}>Users you block won't be matched with you</p>
        </motion.div>
      ) : (
        <div>
          {blocked.map((u) => (
            <div key={u._id} className="flex items-center justify-between py-3 border-b last:border-0"
              style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
              <div className="flex items-center gap-3">
                {u.avatar ? (
                  <img src={u.avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
                ) : (
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-black"
                    style={{ background: 'linear-gradient(135deg,#00D4FF,#00B8E0)' }}>
                    {u.username?.[0]?.toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="text-white text-sm font-semibold">{u.username}</p>
                  {u.country && <p className="text-xs" style={{ color: MUTED }}>{u.country}</p>}
                </div>
              </div>
              <motion.button
                onClick={() => unblock(u._id)}
                whileTap={{ scale: 0.94 }}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: MUTED }}
              >
                Unblock
              </motion.button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Email Verification Section ───────────────────────────────────────────────
function EmailVerificationSection({ user }) {
  const { refreshUser } = useAuth()
  const [sending, setSending] = useState(false)
  const [sent,    setSent]    = useState(false)
  const [errMsg,  setErrMsg]  = useState('')

  useEffect(() => { refreshUser().catch(() => {}) }, []) // eslint-disable-line

  const resend = async () => {
    setSending(true)
    setErrMsg('')
    try {
      await axios.post('/api/auth/resend-verification', { email: user?.email })
      setSent(true)
    } catch (err) {
      setErrMsg(err.response?.data?.error || 'Failed to send. Try again.')
    }
    setSending(false)
  }

  if (user?.emailVerified) {
    return (
      <div className="rounded-2xl p-4 flex items-center gap-3"
        style={{ background: 'rgba(0,212,255,0.05)', border: '1px solid rgba(0,212,255,0.22)' }}>
        <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(0,212,255,0.14)' }}>
          <ShieldCheck size={18} style={{ color: '#00D4FF' }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-bold">Email verified</p>
          <p className="text-xs truncate" style={{ color: MUTED }}>{user?.email}</p>
        </div>
        <span className="text-xs font-bold px-2 py-1 rounded-lg flex-shrink-0"
          style={{ color: '#00D4FF', background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.25)' }}>
          ✓ Verified
        </span>
      </div>
    )
  }

  return (
    <div className="rounded-2xl p-5" style={{ background: 'rgba(0,212,255,0.05)', border: '1px solid rgba(0,212,255,0.22)' }}>
      <div className="flex items-start gap-3 mb-4">
        <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
          style={{ background: 'rgba(0,212,255,0.14)' }}>
          <Mail size={18} style={{ color: '#00D4FF' }} />
        </div>
        <div>
          <p className="text-white text-sm font-bold">Verify your email</p>
          <p className="text-xs mt-0.5 leading-relaxed" style={{ color: MUTED }}>
            A verification link will be sent to <span className="text-white/70">{user?.email}</span>.
            Click it to confirm your address and unlock your verified badge.
          </p>
        </div>
      </div>

      {sent ? (
        <div className="flex items-center gap-2 text-sm py-1" style={{ color: '#00D4FF' }}>
          <Check size={15} /> Verification email sent — check your inbox!
        </div>
      ) : (
        <>
          <motion.button
            onClick={resend}
            disabled={sending}
            whileTap={{ scale: 0.97 }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-colors disabled:opacity-50"
            style={{ background: 'rgba(0,212,255,0.12)', border: '1px solid rgba(0,212,255,0.3)', color: '#00D4FF' }}
          >
            {sending ? <><Loader2 size={13} className="animate-spin" /> Sending…</> : <><Mail size={13} /> Send Verification Email</>}
          </motion.button>
          {errMsg && <p className="text-red-400 text-xs mt-2">{errMsg}</p>}
        </>
      )}
    </div>
  )
}

// ─── Account Tab ──────────────────────────────────────────────────────────────
function AccountTab({ logout, navigate }) {
  const { user } = useAuth()
  const [downloading, setDownloading] = useState(false)
  const [deleteStep,  setDeleteStep]  = useState(0) // 0=idle, 1=confirm, 2=deleting
  const [deleteInput, setDeleteInput] = useState('')
  const [deleteError, setDeleteError] = useState('')
  const [dlMsg,       setDlMsg]       = useState('')

  const downloadData = async () => {
    setDownloading(true)
    try {
      const { data } = await axios.post('/api/gdpr/download')
      setDlMsg(data.message || 'Export sent to your email.')
    } catch (err) {
      setDlMsg(err.response?.data?.error || 'Failed to send export.')
    }
    setDownloading(false)
  }

  const deleteAccount = async () => {
    if (deleteInput !== 'DELETE') return
    setDeleteStep(2)
    try {
      await axios.post('/api/gdpr/delete-account', { confirm: 'DELETE' })
      logout()
      navigate('/')
    } catch (err) {
      setDeleteError(err.response?.data?.error || 'Failed to delete account.')
      setDeleteStep(1)
    }
  }

  return (
    <div className="space-y-4">
      {/* Email verification */}
      <EmailVerificationSection user={user} />

      {/* Data export */}
      <div className="rounded-2xl p-5" style={PANEL}>
        <h3 className="text-sm font-black text-white mb-1 flex items-center gap-2"><Download size={14} /> Download My Data</h3>
        <p className="text-xs mb-4" style={{ color: MUTED }}>Get a copy of all your data sent to {user?.email}. This complies with GDPR Article 20.</p>
        {dlMsg ? (
          <p className="text-sm flex items-center gap-2" style={{ color: '#00D4FF' }}><Check size={14} /> {dlMsg}</p>
        ) : (
          <motion.button onClick={downloadData} disabled={downloading} whileTap={{ scale: 0.97 }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-colors disabled:opacity-50"
            style={{ background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.28)', color: '#00D4FF' }}>
            {downloading ? <><Loader2 size={13} className="animate-spin" /> Exporting…</> : <><Download size={13} /> Request Data Export</>}
          </motion.button>
        )}
      </div>

      {/* Delete account */}
      <div className="rounded-2xl p-5" style={{ background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.2)' }}>
        <h3 className="text-sm font-black text-red-400 mb-1 flex items-center gap-2"><AlertTriangle size={14} /> Delete Account</h3>
        <p className="text-xs mb-4" style={{ color: MUTED }}>
          Permanently deletes your account and all data within 30 days. This cannot be undone.
        </p>

        {deleteStep === 0 && (
          <motion.button onClick={() => setDeleteStep(1)} whileTap={{ scale: 0.97 }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-colors"
            style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171' }}>
            <Trash2 size={13} /> Delete my account
          </motion.button>
        )}

        {deleteStep === 1 && (
          <div className="space-y-3">
            {deleteError && (
              <p className="text-red-400 text-xs rounded-xl px-3 py-2"
                style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
                {deleteError}
              </p>
            )}
            <p className="text-white text-sm">Type <strong className="text-red-400">DELETE</strong> to confirm:</p>
            <input
              value={deleteInput}
              onChange={(e) => setDeleteInput(e.target.value)}
              placeholder="Type DELETE"
              className="w-full px-3 py-2.5 rounded-xl text-white text-sm focus:outline-none"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(239,68,68,0.3)' }}
            />
            <div className="flex gap-2">
              <button
                onClick={deleteAccount}
                disabled={deleteInput !== 'DELETE'}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-sm disabled:opacity-40 transition-colors"
              >
                Permanently Delete
              </button>
              <button onClick={() => { setDeleteStep(0); setDeleteInput('') }}
                className="px-4 py-2.5 rounded-xl text-sm transition-colors"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: MUTED }}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {deleteStep === 2 && (
          <div className="flex items-center gap-2 text-sm" style={{ color: MUTED }}>
            <Loader2 size={14} className="animate-spin" /> Deleting account…
          </div>
        )}
      </div>
    </div>
  )
}
