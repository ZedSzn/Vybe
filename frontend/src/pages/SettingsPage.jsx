import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Loader2, Trash2, UserX, Download, AlertTriangle, Check, Mail, ShieldCheck } from 'lucide-react'
import EmptyStateIllustration from '../components/EmptyStateIllustration'
import VybeCoin from '../components/VybeCoin'
import { CoinBalance, CoinReward } from '../components/VybeCoinIcons'
import { Skeleton } from '../components/Skeleton'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'

const TABS = [
  { id: 'coins',       label: 'Coins'         },
  { id: 'blocks',      label: '🚫 Blocked'    },
  { id: 'referral',    label: '🔗 Referral'   },
  { id: 'account',     label: '⚙️ Account'    },
]

export default function SettingsPage() {
  const { user, logout } = useAuth()
  const navigate         = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const [tab, setTab] = useState(searchParams.get('tab') || 'coins')

  useEffect(() => {
    setSearchParams({ tab }, { replace: true })
  }, [tab]) // eslint-disable-line

  if (!user) {
    return (
      <div className="min-h-screen animated-bg font-space flex items-center justify-center">
        <div className="text-center">
          <p className="text-vybe-muted mb-4">Sign in to access settings</p>
          <Link to="/auth" className="px-6 py-3 rounded-xl btn-purple text-white font-black text-sm">Sign In</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen animated-bg font-space">
      <Navbar />
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-vybe-purple/8 rounded-full blur-3xl" />
      </div>

      <div className="pt-24 pb-12 px-4 max-w-2xl mx-auto relative z-10">
        <motion.button
          onClick={() => navigate(-1)}
          whileHover={{ x: -3 }}
          whileTap={{ scale: 0.93 }}
          transition={{ type: 'spring', stiffness: 500, damping: 28 }}
          className="inline-flex items-center gap-2 text-vybe-muted hover:text-white transition-colors mb-6 text-sm"
        >
          <ArrowLeft size={15} /> Back
        </motion.button>

        <h1 className="text-2xl font-black text-white mb-6">Settings</h1>

        {/* Tab bar */}
        <div className="flex gap-1 flex-wrap mb-6">
          {TABS.map((t) => (
            <motion.button
              key={t.id}
              onClick={() => setTab(t.id)}
              whileHover={{ scale: tab === t.id ? 1 : 1.04 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 450, damping: 22 }}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                tab === t.id
                  ? 'bg-vybe-purple text-white'
                  : 'bg-vybe-card border border-vybe-border text-vybe-muted hover:text-white hover:border-white/20'
              }`}
            >
              {t.id === 'coins'
                ? <span className="flex items-center gap-1"><CoinBalance size={11} /> Coins</span>
                : t.label}
            </motion.button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          >
            {tab === 'coins'    && <CoinsTab />}
            {tab === 'blocks'   && <BlocksTab />}
            {tab === 'referral' && <ReferralTab />}
            {tab === 'account'  && <AccountTab logout={logout} navigate={navigate} />}
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
      <Skeleton className="h-24 w-full" rounded="rounded-2xl" />
      <Skeleton className="h-52 w-full" rounded="rounded-2xl" />
      <div className="glass-card rounded-2xl p-5 space-y-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex items-center justify-between py-2 border-b border-vybe-border/40 last:border-0">
            <div className="flex items-center gap-2.5">
              <Skeleton className="w-6 h-4" rounded="rounded" />
              <Skeleton className="h-4 w-36" rounded="rounded" />
            </div>
            <Skeleton className="h-4 w-14" rounded="rounded" />
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <div className="space-y-4">
      {/* Balance card */}
      <div className="glass-card rounded-2xl p-6">
        <p className="text-vybe-muted text-xs font-bold uppercase tracking-wider mb-2">Coin Balance</p>
        <p className="text-4xl font-black text-white flex items-center gap-2">{coins.toLocaleString()} <CoinBalance size={28}/></p>
      </div>

      {/* Earn ways */}
      <div className="glass-card rounded-2xl p-5">
        <h3 className="text-sm font-black text-white mb-4">Ways to earn coins</h3>
        <div className="space-y-2.5">
          {[
            { icon: '👥', action: 'Friend signs up via referral', coins: 50,  suffix: ' each' },
            { icon: '🎁', action: 'Receive gifts in chat',        coins: 70,  suffix: '% goes to your earnings' },
          ].map(({ icon, action, coins: c, suffix }) => (
            <div key={action} className="flex items-center justify-between py-2 border-b border-vybe-border/40 last:border-0">
              <div className="flex items-center gap-2.5">
                <span className="text-base">{icon}</span>
                <span className="text-white/80 text-sm">{action}</span>
              </div>
              <span className="text-yellow-300 text-sm font-bold flex items-center gap-1">
                {suffix.includes('%') ? suffix : <><span>+{c}</span><CoinReward size={12}/>{suffix}</>}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Transaction history */}
      <div className="glass-card rounded-2xl p-5">
        <h3 className="text-sm font-black text-white mb-4">Transaction History</h3>
        {history.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="py-6 flex flex-col items-center text-center"
          >
            <EmptyStateIllustration variant="wallet" size={72} />
            <p className="text-white/60 text-xs font-semibold mt-1">No transactions yet</p>
          </motion.div>
        ) : (
          <div className="space-y-1 max-h-72 overflow-y-auto">
            {history.map((t, i) => (
              <div key={i} className="flex items-center justify-between py-2.5 border-b border-vybe-border/30 last:border-0">
                <div>
                  <p className="text-white text-xs font-semibold">{t.reason}</p>
                  <p className="text-vybe-muted text-[10px]">{new Date(t.timestamp).toLocaleDateString()}</p>
                </div>
                <span className={`text-sm font-black flex items-center gap-1 ${t.amount > 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {t.amount > 0 ? '+' : ''}{t.amount}<VybeCoin size={12}/>
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
    <div className="glass-card rounded-2xl p-5 space-y-3">
      <Skeleton className="h-5 w-32" rounded="rounded" />
      <Skeleton className="h-3 w-48" rounded="rounded" />
      {[...Array(4)].map((_, i) => (
        <div key={i} className="flex items-center justify-between py-2.5 border-b border-vybe-border/30 last:border-0">
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
    <div className="glass-card rounded-2xl p-5">
      <h3 className="text-sm font-black text-white mb-1">Blocked Users</h3>
      <p className="text-vybe-muted text-xs mb-4">Blocked users will never be matched with you.</p>
      {blocked.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="py-8 flex flex-col items-center text-center"
        >
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3"
            style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.15)' }}>
            <UserX size={24} className="text-vybe-purple-light opacity-50" />
          </div>
          <p className="text-white/60 text-sm font-semibold mb-0.5">No blocked users</p>
          <p className="text-vybe-muted text-xs">Users you block won't be matched with you</p>
        </motion.div>
      ) : (
        <div className="space-y-2">
          {blocked.map((u) => (
            <div key={u._id} className="flex items-center justify-between py-3 border-b border-vybe-border/40 last:border-0">
              <div className="flex items-center gap-3">
                {u.avatar ? (
                  <img src={u.avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-vybe-purple to-blue-900 flex items-center justify-center text-white text-sm font-black">
                    {u.username?.[0]?.toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="text-white text-sm font-semibold">{u.username}</p>
                  {u.country && <p className="text-vybe-muted text-xs">{u.country}</p>}
                </div>
              </div>
              <button
                onClick={() => unblock(u._id)}
                className="px-3 py-1.5 rounded-lg border border-vybe-border text-vybe-muted hover:text-white hover:border-vybe-purple/40 text-xs font-semibold transition-all"
              >
                Unblock
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Referral Tab ─────────────────────────────────────────────────────────────
function ReferralTab() {
  const [info,    setInfo]    = useState(null)
  const [leaders, setLeaders] = useState([])
  const [loading, setLoading] = useState(true)
  const [copied,  setCopied]  = useState(false)

  useEffect(() => {
    Promise.all([axios.get('/api/referral/info'), axios.get('/api/referral/leaderboard')])
      .then(([i, l]) => { setInfo(i.data); setLeaders(l.data.leaders) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const copy = () => {
    navigator.clipboard?.writeText(info?.referralLink || '')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) return (
    <div className="space-y-4">
      <div className="glass-card rounded-2xl p-5 space-y-3">
        <Skeleton className="h-5 w-36" rounded="rounded" />
        <Skeleton className="h-4 w-56" rounded="rounded" />
        <div className="flex gap-2">
          <Skeleton className="h-9 flex-1" rounded="rounded-xl" />
          <Skeleton className="h-9 w-16" rounded="rounded-xl" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-9" rounded="rounded-xl" />)}
        </div>
      </div>
      <div className="glass-card rounded-2xl p-5 space-y-3">
        <Skeleton className="h-5 w-44" rounded="rounded" />
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-3 py-2 border-b border-vybe-border/30 last:border-0">
            <Skeleton className="w-5 h-4" rounded="rounded" />
            <Skeleton className="w-7 h-7 flex-shrink-0" rounded="rounded-full" />
            <Skeleton className="h-4 flex-1" rounded="rounded" />
            <Skeleton className="h-4 w-20" rounded="rounded" />
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <div className="space-y-4">
      <div className="glass-card rounded-2xl p-5">
        <h3 className="text-sm font-black text-white mb-1">Your Referral Link</h3>
        <p className="text-vybe-muted text-xs mb-4">
          You've invited <span className="text-white font-bold">{info?.referralCount || 0}</span> friends
          and earned <span className="text-yellow-300 font-bold inline-flex items-center gap-1">{(info?.coinsEarned || 0).toLocaleString()} <CoinReward size={12} /></span>.
        </p>
        <div className="flex gap-2 mb-3">
          <div className="flex-1 px-3 py-2 bg-vybe-bg border border-vybe-border rounded-xl text-vybe-muted text-xs truncate font-mono">
            {info?.referralLink}
          </div>
          <button onClick={copy} className="px-3 py-2 rounded-xl bg-vybe-purple/20 border border-vybe-purple/30 text-vybe-purple hover:bg-vybe-purple/30 transition-colors text-sm">
            {copied ? <Check size={14} className="text-green-400" /> : 'Copy'}
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: '📱 WhatsApp', url: `https://wa.me/?text=${encodeURIComponent('Join me on Vybe! ' + (info?.referralLink || ''))}` },
            { label: '🐦 Twitter',  url: `https://twitter.com/intent/tweet?text=${encodeURIComponent('Join me on Vybe! ' + (info?.referralLink || ''))}` },
            { label: '👻 Snapchat', url: `https://www.snapchat.com/scan?attachmentUrl=${encodeURIComponent(info?.referralLink || '')}` },
            { label: '📋 Copy',     onClick: copy },
          ].map(({ label, url, onClick }) => (
            url ? (
              <a key={label} href={url} target="_blank" rel="noopener noreferrer"
                className="py-2 rounded-xl border border-vybe-border text-vybe-muted hover:text-white hover:border-vybe-purple/40 text-xs text-center font-semibold transition-all">
                {label}
              </a>
            ) : (
              <button key={label} onClick={onClick}
                className="py-2 rounded-xl border border-vybe-border text-vybe-muted hover:text-white hover:border-vybe-purple/40 text-xs text-center font-semibold transition-all">
                {label}
              </button>
            )
          ))}
        </div>
      </div>

      {leaders.length > 0 && (
        <div className="glass-card rounded-2xl p-5">
          <h3 className="text-sm font-black text-white mb-4">🏆 Top Inviters This Month</h3>
          <div className="space-y-2">
            {leaders.slice(0, 10).map((l, i) => (
              <div key={l._id} className="flex items-center gap-3 py-2 border-b border-vybe-border/30 last:border-0">
                <span className={`text-sm font-black w-5 ${i === 0 ? 'text-yellow-400' : i === 1 ? 'text-gray-300' : i === 2 ? 'text-amber-600' : 'text-vybe-muted'}`}>
                  {i + 1}
                </span>
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-vybe-purple to-blue-900 flex items-center justify-center text-white text-xs font-black flex-shrink-0">
                  {l.username?.[0]?.toUpperCase()}
                </div>
                <span className="text-white text-sm font-semibold flex-1 truncate">{l.username}</span>
                <span className="text-yellow-300 text-xs font-black">{l.referralCount} invited</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Streak Tab ───────────────────────────────────────────────────────────────
// ─── Email Verification Section ───────────────────────────────────────────────
function EmailVerificationSection({ user }) {
  const { refreshUser } = useAuth()
  const [sending,  setSending]  = useState(false)
  const [sent,     setSent]     = useState(false)
  const [errMsg,   setErrMsg]   = useState('')

  useEffect(() => {
    refreshUser().catch(() => {})
  }, []) // eslint-disable-line

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
      <div className="glass-card rounded-2xl p-4 border border-green-500/25 bg-green-500/5 flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-green-500/15 flex items-center justify-center flex-shrink-0">
          <ShieldCheck size={18} className="text-green-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-bold">Email verified</p>
          <p className="text-vybe-muted text-xs truncate">{user?.email}</p>
        </div>
        <span className="text-green-400 text-xs font-bold bg-green-500/10 border border-green-500/25 px-2 py-1 rounded-lg flex-shrink-0">✓ Verified</span>
      </div>
    )
  }

  return (
    <div className="glass-card rounded-2xl p-5 border border-amber-500/25 bg-amber-500/5">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-9 h-9 rounded-full bg-amber-500/15 flex items-center justify-center flex-shrink-0 mt-0.5">
          <Mail size={18} className="text-amber-400" />
        </div>
        <div>
          <p className="text-white text-sm font-bold">Verify your email</p>
          <p className="text-vybe-muted text-xs mt-0.5 leading-relaxed">
            A verification link will be sent to <span className="text-white/70">{user?.email}</span>.
            Click it to confirm your address and unlock your verified badge.
          </p>
        </div>
      </div>

      {sent ? (
        <div className="flex items-center gap-2 text-green-400 text-sm py-1">
          <Check size={15} /> Verification email sent — check your inbox!
        </div>
      ) : (
        <>
          <button
            onClick={resend}
            disabled={sending}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 hover:bg-amber-500/20 text-sm font-bold transition-all disabled:opacity-50"
          >
            {sending ? <><Loader2 size={13} className="animate-spin" /> Sending…</> : <><Mail size={13} /> Send Verification Email</>}
          </button>
          {errMsg && <p className="text-red-400 text-xs mt-2">{errMsg}</p>}
        </>
      )}
    </div>
  )
}

// ─── Account Tab ──────────────────────────────────────────────────────────────
function AccountTab({ logout, navigate }) {
  const { user } = useAuth()
  const [downloading,  setDownloading]  = useState(false)
  const [deleteStep,   setDeleteStep]   = useState(0) // 0=idle, 1=confirm, 2=deleting
  const [deleteInput,  setDeleteInput]  = useState('')
  const [deleteError,  setDeleteError]  = useState('')
  const [dlMsg,        setDlMsg]        = useState('')

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
      <div className="glass-card rounded-2xl p-5">
        <h3 className="text-sm font-black text-white mb-1 flex items-center gap-2"><Download size={14} /> Download My Data</h3>
        <p className="text-vybe-muted text-xs mb-4">Get a copy of all your data sent to {user?.email}. This complies with GDPR Article 20.</p>
        {dlMsg ? (
          <p className="text-green-400 text-sm flex items-center gap-2"><Check size={14} /> {dlMsg}</p>
        ) : (
          <button onClick={downloadData} disabled={downloading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-vybe-border text-vybe-muted hover:text-white hover:border-vybe-purple/40 text-sm transition-all disabled:opacity-50">
            {downloading ? <><Loader2 size={13} className="animate-spin" /> Exporting…</> : <><Download size={13} /> Request Data Export</>}
          </button>
        )}
      </div>

      {/* Delete account */}
      <div className="glass-card rounded-2xl p-5 border border-red-500/20">
        <h3 className="text-sm font-black text-red-400 mb-1 flex items-center gap-2"><AlertTriangle size={14} /> Delete Account</h3>
        <p className="text-vybe-muted text-xs mb-4">
          Permanently deletes your account and all data within 30 days. This cannot be undone.
        </p>

        {deleteStep === 0 && (
          <button onClick={() => setDeleteStep(1)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 text-sm transition-all">
            <Trash2 size={13} /> Delete my account
          </button>
        )}

        {deleteStep === 1 && (
          <div className="space-y-3">
            {deleteError && <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">{deleteError}</p>}
            <p className="text-white text-sm">Type <strong className="text-red-400">DELETE</strong> to confirm:</p>
            <input
              value={deleteInput}
              onChange={(e) => setDeleteInput(e.target.value)}
              placeholder="Type DELETE"
              className="w-full px-3 py-2.5 bg-vybe-bg border border-red-500/30 rounded-xl text-white text-sm placeholder-vybe-muted focus:outline-none focus:border-red-500"
            />
            <div className="flex gap-2">
              <button
                onClick={deleteAccount}
                disabled={deleteInput !== 'DELETE'}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-sm disabled:opacity-40 transition-all"
              >
                Permanently Delete
              </button>
              <button onClick={() => { setDeleteStep(0); setDeleteInput('') }}
                className="px-4 py-2.5 rounded-xl border border-vybe-border text-vybe-muted hover:text-white text-sm transition-all">
                Cancel
              </button>
            </div>
          </div>
        )}

        {deleteStep === 2 && (
          <div className="flex items-center gap-2 text-vybe-muted text-sm">
            <Loader2 size={14} className="animate-spin" /> Deleting account…
          </div>
        )}
      </div>
    </div>
  )
}
