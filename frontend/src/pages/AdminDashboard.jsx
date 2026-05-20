import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import {
  Shield, Users, Flag, Ban, DollarSign, Settings, Activity,
  Search, RefreshCw, X, CheckCircle, AlertTriangle, LogOut,
  UserX, TrendingUp, Eye, Trash2, MessageSquare, UserCheck,
  UserMinus, ChevronLeft, ChevronRight, ToggleLeft, ToggleRight,
  Wifi, Heart, Loader2, Send, Lock,
} from 'lucide-react'

// ─── Helpers ──────────────────────────────────────────────────────────────────
const ah = (token) => ({ headers: { 'x-admin-token': token } })

function Toast({ toast }) {
  if (!toast) return null
  const isErr = toast.type === 'error'
  return (
    <div className={`fixed top-5 right-5 z-[100] px-5 py-3 rounded-xl text-sm font-bold flex items-center gap-2.5 border backdrop-blur-xl ${
      isErr ? 'bg-red-500/15 border-red-500/40 text-red-300' : 'bg-cyan-500/15 border-cyan-400/45 text-cyan-300'
    }`}
      style={{ boxShadow: isErr ? '0 18px 50px rgba(0,0,0,0.5), 0 0 24px rgba(239,68,68,0.25)' : '0 18px 50px rgba(0,0,0,0.5), 0 0 24px rgba(0,212,255,0.3)' }}>
      {isErr ? <AlertTriangle size={14} /> : <CheckCircle size={14} />}
      {toast.msg}
    </div>
  )
}

function StatCard({ label, value, icon: Icon, color, bg, border }) {
  // Pick an ambient halo colour that matches the stat accent so the cards
  // feel like they're emitting light from their corner.
  const halo = color?.includes('emerald') ? 'rgba(52,211,153,0.35)'
    : color?.includes('red')              ? 'rgba(248,113,113,0.3)'
    : color?.includes('pink')             ? 'rgba(244,114,182,0.3)'
    : 'rgba(0,212,255,0.42)'
  return (
    <div className={`relative ${bg} border ${border} rounded-2xl px-5 py-4 overflow-hidden group transition-all duration-300 hover:border-cyan-400/45 hover:translate-y-[-1px]`}>
      <div className="pointer-events-none absolute -top-12 -right-10 w-28 h-28 rounded-full opacity-50 group-hover:opacity-75 transition-opacity"
        style={{ background: `radial-gradient(circle, ${halo}, transparent 70%)` }} />
      <div className="relative">
        <div className="flex items-center justify-between mb-3">
          <p className="text-vybe-muted text-[10px] font-black uppercase tracking-[0.16em]">{label}</p>
          {Icon && <Icon size={14} className={`${color} opacity-75`} />}
        </div>
        <p className={`text-[28px] font-black leading-none ${color}`} style={{ fontFeatureSettings: '"tnum"', letterSpacing: '-0.02em' }}>{value ?? '—'}</p>
      </div>
    </div>
  )
}

function Spinner() {
  return <div className="flex justify-center py-20"><div className="loading-dots flex"><span /><span /><span /></div></div>
}

const BAN_DURATION_OPTIONS = [
  { value: '24h', label: '24 Hours' },
  { value: '7d',  label: '7 Days' },
  { value: '14d', label: '14 Days' },
  { value: '30d', label: '30 Days' },
  { value: 'permanent', label: 'Permanent' },
]

const REASON_LABELS = {
  nudity: '🔞 Nudity', harassment: '😤 Harassment', underage: '👶 Underage', spam: '🤖 Spam', other: '📋 Other',
}

// ─── User Profile Modal ───────────────────────────────────────────────────────
function UserProfileModal({ userId, token, onClose, onBan, onUnban, onWarn, onDelete, onGrantMembership }) {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [banModal, setBanModal]   = useState(false)
  const [warnModal, setWarnModal] = useState(false)
  const [banType,   setBanType]   = useState('permanent')
  const [banReason, setBanReason] = useState('')
  const [warnMsg,   setWarnMsg]   = useState('')
  const [unbanNote, setUnbanNote] = useState('')
  const [unbanModal, setUnbanModal] = useState(false)
  const [membershipLoad, setMembershipLoad] = useState(false)

  const handleMembership = async (plan) => {
    setMembershipLoad(true)
    try {
      const { data } = await axios.post(`/api/admin-secure/users/${userId}/grant-membership`, { plan }, ah(token))
      setProfile(p => ({ ...p, user: { ...p.user, isPremium: data.isPremium, isVip: data.isVip } }))
      if (onGrantMembership) onGrantMembership(plan)
    } catch (e) { /* showToast handled by parent */ }
    finally { setMembershipLoad(false) }
  }

  useEffect(() => {
    axios.get(`/api/admin-secure/users/${userId}/profile`, ah(token))
      .then(({ data }) => setProfile(data))
      .catch(() => setProfile(null))
      .finally(() => setLoading(false))
  }, [userId]) // eslint-disable-line

  if (loading) return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <Loader2 size={36} className="text-cyan-400 animate-spin" />
    </div>
  )
  if (!profile) return null
  const { user } = profile

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative ml-auto w-full max-w-lg bg-vybe-bg border-l border-vybe-border flex flex-col h-full overflow-y-auto">
        <div className="sticky top-0 bg-vybe-bg border-b border-vybe-border px-5 py-4 flex items-center justify-between z-10">
          <h2 className="font-black text-white text-base">User Profile</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg text-vybe-muted hover:text-white hover:bg-vybe-card flex items-center justify-center transition-colors"><X size={16} /></button>
        </div>

        <div className="p-5 space-y-5">
          {/* Basic info */}
          <div className="bg-vybe-card border border-vybe-border rounded-xl p-4">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-cyan-400/20 border border-cyan-400/30 flex items-center justify-center text-cyan-300 font-black text-xl flex-shrink-0">
                {user.username?.[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-black text-white">{user.username}</h3>
                  {profile.isOnline && <span className="w-2 h-2 rounded-full bg-cyan-500 flex-shrink-0" />}
                  {user.isBanned && <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/20 font-bold">BANNED</span>}
                  {user.isPremium && <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-400/15 text-cyan-400 font-bold">MEMBER</span>}
                  {user.isVip && <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-400 font-bold">VIP</span>}
                </div>
                <p className="text-vybe-muted text-xs mt-0.5">{user.email}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[12px]">
              {[
                ['Spend Coins',  `${(user.coins || 0).toLocaleString()} (spendable)`],
                ['Earn Coins',   `${(user.cashableCoins || 0).toLocaleString()} (cashable)`],
                ['Gender',      user.gender || '—'],
                ['Country',     user.country || '—'],
                ['Joined',      new Date(user.createdAt).toLocaleDateString()],
                ['Violations',  user.violationCount || 0],
                ['Reports recv', profile.reportsReceived],
                ['Reports made', profile.reportsMade],
                ['Unban buys',  profile.unbanPurchases?.length || 0],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between bg-vybe-bg rounded-lg px-3 py-2">
                  <span className="text-vybe-muted">{k}</span>
                  <span className="text-white font-semibold">{String(v)}</span>
                </div>
              ))}
            </div>
            {user.isBanned && (
              <div className="mt-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                <p className="text-red-400 text-xs font-bold mb-1">Ban reason:</p>
                <p className="text-red-300 text-xs">{user.banReason}</p>
                {user.banType !== 'permanent' && user.banExpiresAt && (
                  <p className="text-red-400/70 text-xs mt-1">Expires: {new Date(user.banExpiresAt).toLocaleString()}</p>
                )}
              </div>
            )}
          </div>

          {/* Ban history */}
          {user.banHistory?.length > 0 && (
            <div className="bg-vybe-card border border-vybe-border rounded-xl p-4">
              <h4 className="text-sm font-black text-white mb-3">Ban History</h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {[...user.banHistory].reverse().map((h, i) => (
                  <div key={i} className={`text-xs flex items-start gap-2 px-3 py-2 rounded-lg ${h.action === 'ban' ? 'bg-red-500/10 text-red-300' : 'bg-cyan-500/10 text-cyan-400'}`}>
                    <span className="font-bold uppercase flex-shrink-0">{h.action}</span>
                    <span className="text-white/60 flex-1 truncate">{h.reason || h.note || (h.unbannedBy ? `by ${h.unbannedBy}` : '')}</span>
                    <span className="text-white/40 flex-shrink-0">{new Date(h.timestamp).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Free Membership */}
          <div className="bg-vybe-card border border-vybe-border rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-black text-white">Free Membership</h4>
              <div className="flex items-center gap-1.5">
                {user.isVip     && <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-400 border border-yellow-500/25 font-bold">VIP Active</span>}
                {user.isPremium && !user.isVip && <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-400/15 text-cyan-400 border border-cyan-400/25 font-bold">Basic Active</span>}
                {!user.isPremium && <span className="text-[10px] px-2 py-0.5 rounded-full bg-vybe-card2 text-vybe-muted font-bold">None</span>}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => handleMembership('basic')}
                disabled={membershipLoad || (user.isPremium && !user.isVip)}
                className="py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-40"
                style={{ background: 'rgba(0,212,255,0.15)', border: '1px solid rgba(0,212,255,0.3)', color: '#00B8E0' }}
              >
                {membershipLoad ? '…' : 'Basic'}
              </button>
              <button
                onClick={() => handleMembership('vip')}
                disabled={membershipLoad || user.isVip}
                className="py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-40"
                style={{ background: 'rgba(0,212,255,0.12)', border: '1px solid rgba(0,212,255,0.25)', color: '#00B8E0' }}
              >
                {membershipLoad ? '…' : 'VIP'}
              </button>
              <button
                onClick={() => handleMembership(null)}
                disabled={membershipLoad || !user.isPremium}
                className="py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-40"
                style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#f87171' }}
              >
                {membershipLoad ? '…' : 'Revoke'}
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-2">
            {user.isBanned ? (
              <button onClick={() => setUnbanModal(true)} className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-cyan-500/15 border border-cyan-400/30 text-cyan-400 hover:bg-cyan-500/25 text-sm font-bold transition-all">
                <UserCheck size={14} /> Unban
              </button>
            ) : (
              <button onClick={() => setBanModal(true)} className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 hover:bg-red-500/25 text-sm font-bold transition-all">
                <Ban size={14} /> Ban
              </button>
            )}
            <button onClick={() => setWarnModal(true)} className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-cyan-500/15 border border-yellow-500/30 text-cyan-400 hover:bg-cyan-500/25 text-sm font-bold transition-all">
              <MessageSquare size={14} /> Warn
            </button>
            <button onClick={() => { if (confirm(`Delete ${user.username}? This cannot be undone.`)) onDelete(user._id) }} className="col-span-2 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-red-900/20 border border-red-800/30 text-red-500 hover:bg-red-900/40 text-sm font-bold transition-all">
              <Trash2 size={14} /> Delete Account Permanently
            </button>
          </div>
        </div>

        {/* Ban modal */}
        {banModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50" onClick={() => setBanModal(false)} />
            <div className="relative w-[340px] bg-vybe-bg2 border border-vybe-border rounded-2xl p-5 shadow-2xl">
              <h3 className="font-black text-white mb-4">Ban {user.username}</h3>
              <select value={banType} onChange={(e) => setBanType(e.target.value)} className="w-full px-3 py-2.5 bg-vybe-card border border-vybe-border rounded-xl text-white text-sm mb-3 focus:border-cyan-400 focus:outline-none">
                {BAN_DURATION_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <textarea value={banReason} onChange={(e) => setBanReason(e.target.value)} placeholder="Ban reason (shown to user)…" rows={3} className="w-full px-3 py-2.5 bg-vybe-card border border-vybe-border rounded-xl text-white text-sm placeholder-vybe-muted focus:border-cyan-400 focus:outline-none resize-none mb-4" />
              <div className="flex gap-2">
                <button onClick={() => setBanModal(false)} className="flex-1 py-2.5 rounded-xl border border-vybe-border text-vybe-muted text-sm">Cancel</button>
                <button onClick={() => { onBan(user._id, banReason || 'Banned by admin', banType); setBanModal(false) }} className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-bold">Confirm Ban</button>
              </div>
            </div>
          </div>
        )}

        {/* Unban modal */}
        {unbanModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50" onClick={() => setUnbanModal(false)} />
            <div className="relative w-[340px] bg-vybe-bg2 border border-vybe-border rounded-2xl p-5 shadow-2xl">
              <h3 className="font-black text-white mb-4">Unban {user.username}</h3>
              <input value={unbanNote} onChange={(e) => setUnbanNote(e.target.value)} placeholder="Unban note, e.g. false ban…" className="w-full px-3 py-2.5 bg-vybe-card border border-vybe-border rounded-xl text-white text-sm placeholder-vybe-muted focus:border-cyan-400 focus:outline-none mb-4" />
              <div className="flex gap-2">
                <button onClick={() => setUnbanModal(false)} className="flex-1 py-2.5 rounded-xl border border-vybe-border text-vybe-muted text-sm">Cancel</button>
                <button onClick={() => { onUnban(user._id, unbanNote); setUnbanModal(false) }} className="flex-1 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-500 text-white text-sm font-bold">Unban</button>
              </div>
            </div>
          </div>
        )}

        {/* Warn modal */}
        {warnModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50" onClick={() => setWarnModal(false)} />
            <div className="relative w-[340px] bg-vybe-bg2 border border-vybe-border rounded-2xl p-5 shadow-2xl">
              <h3 className="font-black text-white mb-4">Send Warning to {user.username}</h3>
              <textarea value={warnMsg} onChange={(e) => setWarnMsg(e.target.value)} placeholder="Warning message…" rows={3} className="w-full px-3 py-2.5 bg-vybe-card border border-vybe-border rounded-xl text-white text-sm placeholder-vybe-muted focus:border-cyan-400 focus:outline-none resize-none mb-4" />
              <div className="flex gap-2">
                <button onClick={() => setWarnModal(false)} className="flex-1 py-2.5 rounded-xl border border-vybe-border text-vybe-muted text-sm">Cancel</button>
                <button onClick={() => { if (warnMsg) { onWarn(user._id, warnMsg); setWarnModal(false) } }} className="flex-1 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-bold">Send Warning</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main Dashboard ────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const navigate                         = useNavigate()
  const token                            = localStorage.getItem('vybe_admin_token') || ''
  const [section,     setSection]        = useState('overview')
  const [toast,       setToast]          = useState(null)
  const [stats,       setStats]          = useState(null)
  const [profileId,   setProfileId]      = useState(null)
  const toastTimer                       = useRef(null)

  // Admin JWT expires after 2h — a present-but-expired token must be treated
  // as logged out, otherwise every request silently fails to load.
  const isTokenExpired = (t) => {
    try {
      const { exp } = JSON.parse(atob(t.split('.')[1]))
      return !exp || exp * 1000 <= Date.now()
    } catch { return true }
  }

  // ── Auth check + inactivity timer ────────────────────────────────────────
  useEffect(() => {
    if (!token || isTokenExpired(token)) {
      localStorage.removeItem('vybe_admin_token')
      localStorage.removeItem('vybe_admin_activity')
      navigate('/admin-vybe-2024', { replace: true })
      return
    }

    const updateActivity = () => localStorage.setItem('vybe_admin_activity', Date.now().toString())
    const checkActivity  = setInterval(() => {
      const last = parseInt(localStorage.getItem('vybe_admin_activity') || '0', 10)
      if ((last && Date.now() - last > 2 * 60 * 60 * 1000) || isTokenExpired(token)) handleLogout()
    }, 60000)

    window.addEventListener('click',   updateActivity)
    window.addEventListener('keydown', updateActivity)
    updateActivity()
    fetchStats()

    return () => {
      clearInterval(checkActivity)
      window.removeEventListener('click',   updateActivity)
      window.removeEventListener('keydown', updateActivity)
    }
  }, []) // eslint-disable-line

  const showToast = (msg, type = 'success') => {
    clearTimeout(toastTimer.current)
    setToast({ msg, type })
    toastTimer.current = setTimeout(() => setToast(null), 3200)
  }

  const handleLogout = () => {
    localStorage.removeItem('vybe_admin_token')
    localStorage.removeItem('vybe_admin_activity')
    navigate('/admin-vybe-2024', { replace: true })
  }

  const fetchStats = async () => {
    try {
      const { data } = await axios.get('/api/admin-secure/stats', ah(token))
      setStats(data)
    } catch {}
  }

  // ── Section: Users ────────────────────────────────────────────────────────
  const UsersSection = () => {
    const [users,  setUsers]  = useState([])
    const [search, setSearch] = useState('')
    const [loading, setLoading] = useState(false)
    const [page,   setPage]   = useState(1)
    const [total,  setTotal]  = useState(0)

    const fetchUsers = useCallback(async (q = search, p = page) => {
      setLoading(true)
      try {
        const { data } = await axios.get(`/api/admin-secure/users?search=${encodeURIComponent(q)}&page=${p}&limit=30`, ah(token))
        setUsers(data.users || []); setTotal(data.total || 0)
      } catch { showToast('Failed to load users', 'error') }
      finally { setLoading(false) }
    }, [search, page]) // eslint-disable-line

    useEffect(() => { fetchUsers() }, []) // eslint-disable-line

    const banUser = async (id, reason, banType) => {
      try { await axios.post(`/api/admin-secure/users/${id}/ban`, { reason, banType }, ah(token)); showToast('User banned'); fetchUsers(); setProfileId(null) }
      catch (e) { showToast(e.response?.data?.error || 'Failed', 'error') }
    }
    const unbanUser = async (id, note) => {
      try { await axios.post(`/api/admin-secure/users/${id}/unban`, { note }, ah(token)); showToast('User unbanned'); fetchUsers(); setProfileId(null) }
      catch (e) { showToast(e.response?.data?.error || 'Failed', 'error') }
    }
    const warnUser = async (id, message) => {
      try { await axios.post(`/api/admin-secure/users/${id}/warn`, { message }, ah(token)); showToast('Warning sent') }
      catch (e) { showToast(e.response?.data?.error || 'Failed', 'error') }
    }
    const deleteUser = async (id) => {
      try { await axios.delete(`/api/admin-secure/users/${id}`, ah(token)); showToast('Account deleted'); fetchUsers(); setProfileId(null) }
      catch (e) { showToast(e.response?.data?.error || 'Failed', 'error') }
    }

    return (
      <div>
        {profileId && (
          <UserProfileModal userId={profileId} token={token}
            onClose={() => setProfileId(null)}
            onBan={banUser} onUnban={unbanUser} onWarn={warnUser} onDelete={deleteUser}
            onGrantMembership={(plan) => showToast(plan ? `Free ${plan.toUpperCase()} membership granted` : 'Membership revoked')}
          />
        )}
        <div className="flex gap-2 mb-5">
          <div className="relative flex-1">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-vybe-muted" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { setPage(1); fetchUsers(search, 1) } }} placeholder="Search username or email…" className="w-full pl-9 pr-4 py-2.5 bg-vybe-card border border-vybe-border rounded-xl text-sm text-white placeholder-vybe-muted focus:border-cyan-400 focus:outline-none transition-all" />
          </div>
          <button onClick={() => { setPage(1); fetchUsers(search, 1) }} className="px-4 py-2.5 rounded-xl bg-cyan-400 text-[#06121b] text-sm font-bold hover:bg-cyan-300 transition-all">Search</button>
          <button onClick={() => { setSearch(''); setPage(1); fetchUsers('', 1) }} className="p-2.5 rounded-xl border border-vybe-border text-vybe-muted hover:text-white transition-colors"><RefreshCw size={14} /></button>
        </div>

        {loading ? <Spinner /> : users.length === 0 ? (
          <div className="text-center py-20 text-vybe-muted"><Users size={36} className="mx-auto mb-3 opacity-30" /><p className="text-sm">No users found</p></div>
        ) : (
          <>
            <div className="bg-vybe-card border border-vybe-border rounded-2xl overflow-hidden mb-4">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-vybe-border bg-vybe-card2">
                    {['User', 'Status', 'Violations', 'Joined', 'Actions'].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-[11px] font-black text-vybe-muted uppercase tracking-wider">{h}</th>
                    ))}
                  </tr></thead>
                  <tbody className="divide-y divide-vybe-border">
                    {users.map((u) => (
                      <tr key={u._id} className="hover:bg-vybe-card2/50 transition-colors">
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2">
                            {u.isOnline && <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 flex-shrink-0" />}
                            <div>
                              <p className="font-semibold text-white">{u.username}</p>
                              <p className="text-vybe-muted text-[11px]">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex flex-wrap gap-1">
                            {u.isBanned && <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/20 font-bold">BANNED</span>}
                            {!u.isBanned && <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-400 font-bold">ACTIVE</span>}
                            {u.isPremium && <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-400/15 text-cyan-400 font-bold">MEMBER</span>}
                            {u.isVip && <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-400 font-bold">VIP</span>}
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-vybe-muted text-sm">{u.violationCount || 0}</td>
                        <td className="px-4 py-3.5 text-vybe-muted text-[12px]">{new Date(u.createdAt).toLocaleDateString()}</td>
                        <td className="px-4 py-3.5">
                          <button onClick={() => setProfileId(u._id)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-cyan-400/15 border border-cyan-400/30 text-cyan-400 text-xs font-bold hover:bg-cyan-400/25 transition-all">
                            <Eye size={11} /> View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm text-vybe-muted">
              <span>{total} total users</span>
              <div className="flex gap-2">
                <button disabled={page <= 1} onClick={() => { setPage(page - 1); fetchUsers(search, page - 1) }} className="p-2 rounded-lg border border-vybe-border disabled:opacity-40 hover:text-white transition-colors"><ChevronLeft size={14} /></button>
                <span className="px-3 py-2">Page {page}</span>
                <button disabled={users.length < 30} onClick={() => { setPage(page + 1); fetchUsers(search, page + 1) }} className="p-2 rounded-lg border border-vybe-border disabled:opacity-40 hover:text-white transition-colors"><ChevronRight size={14} /></button>
              </div>
            </div>
          </>
        )}
      </div>
    )
  }

  // ── Section: Bans ─────────────────────────────────────────────────────────
  const BansSection = () => {
    const [filter,  setFilter]  = useState('active')
    const [users,   setUsers]   = useState([])
    const [loading, setLoading] = useState(false)
    const [page,    setPage]    = useState(1)
    const [total,   setTotal]   = useState(0)

    const fetchBans = useCallback(async (f = filter, p = page) => {
      setLoading(true)
      try {
        const { data } = await axios.get(`/api/admin-secure/bans?filter=${f}&page=${p}`, ah(token))
        setUsers(data.users || []); setTotal(data.total || 0)
      } catch { showToast('Failed to load bans', 'error') }
      finally { setLoading(false) }
    }, [filter, page]) // eslint-disable-line

    useEffect(() => { fetchBans() }, []) // eslint-disable-line

    const doUnban = async (id, note = 'False ban — unbanned by admin') => {
      try { await axios.post(`/api/admin-secure/users/${id}/unban`, { note }, ah(token)); showToast('Unbanned'); fetchBans() }
      catch (e) { showToast(e.response?.data?.error || 'Failed', 'error') }
    }

    return (
      <div>
        <div className="flex gap-1 bg-vybe-card2 p-1 rounded-xl w-fit mb-5 flex-wrap">
          {[['active', 'Active Bans'], ['permanent', 'Permanent'], ['temporary', 'Temporary'], ['paid-unban', 'Paid Unbans']].map(([f, label]) => (
            <button key={f} onClick={() => { setFilter(f); setPage(1); fetchBans(f, 1) }} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${filter === f ? 'bg-cyan-400 text-[#06121b]' : 'text-vybe-muted hover:text-white'}`}>{label}</button>
          ))}
        </div>

        {loading ? <Spinner /> : users.length === 0 ? (
          <div className="text-center py-20 text-vybe-muted"><Ban size={36} className="mx-auto mb-3 opacity-30" /><p className="text-sm">No results</p></div>
        ) : (
          <div className="space-y-3">
            {users.filter(Boolean).map((u) => (
              <div key={u._id} className="bg-vybe-card border border-vybe-border rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-white text-sm">{u.username}</p>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ${u.banType === 'permanent' ? 'bg-red-500/20 text-red-400 border border-red-500/25' : 'bg-orange-500/20 text-orange-400 border border-orange-500/25'}`}>{u.banType || '?'}</span>
                  </div>
                  <p className="text-vybe-muted text-xs mt-0.5 truncate">{u.banReason}</p>
                  {u.banExpiresAt && <p className="text-vybe-muted/60 text-[11px] mt-0.5">Expires: {new Date(u.banExpiresAt).toLocaleString()}</p>}
                </div>
                {u.isBanned && u.banType !== 'permanent' ? (
                  <button onClick={() => doUnban(u._id)} className="px-3 py-1.5 rounded-lg bg-cyan-500/15 border border-cyan-400/30 text-cyan-400 hover:bg-cyan-500/25 text-xs font-bold transition-all flex items-center gap-1">
                    <UserCheck size={12} /> Unban
                  </button>
                ) : !u.isBanned && (
                  <span className="px-3 py-1.5 rounded-lg bg-green-500/12 border border-green-500/25 text-green-400 text-xs font-bold flex items-center gap-1">
                    <UserCheck size={12} /> Unbanned
                  </span>
                )}
              </div>
            ))}
            <div className="flex items-center justify-between text-sm text-vybe-muted pt-2">
              <span>{total} total</span>
              <div className="flex gap-2">
                <button disabled={page <= 1} onClick={() => { setPage(page - 1); fetchBans(filter, page - 1) }} className="p-2 rounded-lg border border-vybe-border disabled:opacity-40"><ChevronLeft size={14} /></button>
                <span className="px-3 py-2">Page {page}</span>
                <button disabled={users.length < 50} onClick={() => { setPage(page + 1); fetchBans(filter, page + 1) }} className="p-2 rounded-lg border border-vybe-border disabled:opacity-40"><ChevronRight size={14} /></button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // ── Section: Reports ──────────────────────────────────────────────────────
  const ReportsSection = () => {
    const [filter,  setFilter]  = useState('pending')
    const [reports, setReports] = useState([])
    const [loading, setLoading] = useState(false)
    const [page,    setPage]    = useState(1)
    const [total,   setTotal]   = useState(0)

    const fetchReports = useCallback(async (f = filter, p = page) => {
      setLoading(true)
      try {
        const { data } = await axios.get(`/api/admin-secure/reports?status=${f}&page=${p}`, ah(token))
        setReports(data.reports || []); setTotal(data.total || 0)
      } catch { showToast('Failed', 'error') }
      finally { setLoading(false) }
    }, [filter, page]) // eslint-disable-line

    useEffect(() => { fetchReports() }, []) // eslint-disable-line

    const resolve  = async (id) => { try { await axios.post(`/api/admin-secure/reports/${id}/resolve`,  {}, ah(token)); showToast('Resolved');  fetchReports() } catch { showToast('Failed', 'error') } }
    const dismiss  = async (id) => { try { await axios.post(`/api/admin-secure/reports/${id}/dismiss`,  {}, ah(token)); showToast('Dismissed'); fetchReports() } catch { showToast('Failed', 'error') } }
    const banFromReport = async (userId, reason) => {
      if (!userId) return
      try { await axios.post(`/api/admin-secure/users/${userId}/ban`, { reason, banType: 'permanent' }, ah(token)); showToast('User banned') }
      catch (e) { showToast(e.response?.data?.error || 'Failed', 'error') }
    }

    return (
      <div>
        <div className="flex gap-1 bg-vybe-card2 p-1 rounded-xl w-fit mb-5">
          {[['pending', 'Pending'], ['resolved', 'Resolved'], ['dismissed', 'Dismissed'], ['all', 'All']].map(([f, label]) => (
            <button key={f} onClick={() => { setFilter(f); setPage(1); fetchReports(f, 1) }} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${filter === f ? 'bg-cyan-400 text-[#06121b]' : 'text-vybe-muted hover:text-white'}`}>{label}</button>
          ))}
        </div>

        {loading ? <Spinner /> : reports.length === 0 ? (
          <div className="text-center py-20 text-vybe-muted"><Flag size={36} className="mx-auto mb-3 opacity-30" /><p className="text-sm">No reports</p></div>
        ) : (
          <div className="space-y-3">
            {reports.map((r) => (
              <div key={r._id} className={`bg-vybe-card border rounded-xl p-4 ${r.dismissed ? 'border-vybe-border opacity-50' : r.resolved ? 'border-cyan-400/15' : 'border-red-500/15'}`}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="text-[11px] font-black px-2.5 py-1 rounded-full bg-red-500/15 text-red-400 border border-red-500/20">
                        {REASON_LABELS[r.reason] || r.reason}
                      </span>
                      {r.resolved && !r.dismissed && <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-cyan-500/15 text-cyan-400 border border-cyan-400/25">✓ Resolved</span>}
                      {r.dismissed && <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-gray-500/15 text-gray-400 border border-gray-500/25">Dismissed</span>}
                    </div>
                    <p className="text-[13px] text-vybe-muted">
                      Reported: <span className="text-white font-semibold">{r.reportedUserId?.username || 'Guest'}</span>
                      {r.reportedUserId?.email && <span className="text-vybe-muted ml-1 text-[11px]">({r.reportedUserId.email})</span>}
                    </p>
                    <p className="text-[13px] text-vybe-muted">
                      Reporter: <span className="text-gray-400">{r.reporterUserId?.username || 'Guest'}</span>
                    </p>
                    <p className="text-vybe-muted text-[12px] mt-1">{new Date(r.createdAt).toLocaleString()}</p>
                  </div>
                  {!r.resolved && !r.dismissed && (
                    <div className="flex flex-wrap gap-2">
                      {r.reportedUserId && !r.reportedUserId.isBanned && (
                        <button onClick={() => banFromReport(r.reportedUserId._id, `Banned after report: ${r.reason}`)} className="px-3 py-1.5 rounded-lg bg-red-500/15 border border-red-500/30 text-red-400 hover:bg-red-500/25 text-xs font-bold transition-all">Ban</button>
                      )}
                      <button onClick={() => resolve(r._id)} className="px-3 py-1.5 rounded-lg bg-cyan-500/15 border border-cyan-400/30 text-cyan-400 hover:bg-cyan-500/25 text-xs font-bold transition-all">Resolve</button>
                      <button onClick={() => dismiss(r._id)} className="px-3 py-1.5 rounded-lg bg-gray-500/15 border border-gray-500/30 text-gray-400 hover:bg-gray-500/25 text-xs font-bold transition-all">Dismiss</button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div className="flex items-center justify-between text-sm text-vybe-muted pt-2">
              <span>{total} total</span>
              <div className="flex gap-2">
                <button disabled={page <= 1} onClick={() => { setPage(page - 1); fetchReports(filter, page - 1) }} className="p-2 rounded-lg border border-vybe-border disabled:opacity-40"><ChevronLeft size={14} /></button>
                <span className="px-3 py-2">Page {page}</span>
                <button disabled={reports.length < 50} onClick={() => { setPage(page + 1); fetchReports(filter, page + 1) }} className="p-2 rounded-lg border border-vybe-border disabled:opacity-40"><ChevronRight size={14} /></button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // ── Section: Friends ──────────────────────────────────────────────────────
  const FriendsSection = () => {
    const [search,   setSearch]   = useState('')
    const [userId,   setUserId]   = useState('')
    const [friends,  setFriends]  = useState([])
    const [loading,  setLoading]  = useState(false)
    const [searched, setSearched] = useState(false)

    const findUser = async () => {
      if (!search) return
      setLoading(true)
      try {
        const { data } = await axios.get(`/api/admin-secure/users?search=${encodeURIComponent(search)}&limit=5`, ah(token))
        if (data.users?.[0]) {
          setUserId(data.users[0]._id)
          const { data: fd } = await axios.get(`/api/admin-secure/users/${data.users[0]._id}/friends`, ah(token))
          setFriends(fd.friendships || [])
          setSearched(true)
        } else { showToast('User not found', 'error') }
      } catch { showToast('Failed', 'error') }
      finally { setLoading(false) }
    }

    const removeFriendship = async (id) => {
      try { await axios.delete(`/api/admin-secure/friendships/${id}`, ah(token)); setFriends((prev) => prev.filter((f) => f._id !== id)); showToast('Friendship removed') }
      catch { showToast('Failed', 'error') }
    }

    return (
      <div>
        <div className="flex gap-2 mb-6">
          <div className="relative flex-1">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-vybe-muted" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && findUser()} placeholder="Search user by username or email…" className="w-full pl-9 pr-4 py-2.5 bg-vybe-card border border-vybe-border rounded-xl text-sm text-white placeholder-vybe-muted focus:border-cyan-400 focus:outline-none" />
          </div>
          <button onClick={findUser} className="px-4 py-2.5 rounded-xl bg-cyan-400 text-[#06121b] text-sm font-bold hover:bg-cyan-300">View Friends</button>
        </div>

        {loading ? <Spinner /> : !searched ? (
          <div className="text-center py-20 text-vybe-muted"><Heart size={36} className="mx-auto mb-3 opacity-30" /><p className="text-sm">Search a user to view their friends list</p></div>
        ) : friends.length === 0 ? (
          <div className="text-center py-16 text-vybe-muted"><Heart size={32} className="mx-auto mb-3 opacity-30" /><p className="text-sm">No friends found for this user</p></div>
        ) : (
          <div className="space-y-3">
            {friends.map((f) => (
              <div key={f._id} className="bg-vybe-card border border-vybe-border rounded-xl p-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-cyan-400/20 flex items-center justify-center text-cyan-300 font-bold text-sm flex-shrink-0">
                    {f.requester.username?.[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold text-sm truncate">{f.requester.username} ↔ {f.recipient.username}</p>
                    <p className="text-vybe-muted text-[11px]">Since {new Date(f.updatedAt || f.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <button onClick={() => removeFriendship(f._id)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-500/15 border border-red-500/30 text-red-400 hover:bg-red-500/25 text-xs font-bold transition-all flex-shrink-0">
                  <UserMinus size={12} /> Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  // ── Section: Revenue ──────────────────────────────────────────────────────
  const RevenueSection = () => {
    const [data,    setData]    = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
      axios.get('/api/admin-secure/revenue', ah(token))
        .then(({ data }) => setData(data))
        .catch(() => showToast('Failed to load revenue', 'error'))
        .finally(() => setLoading(false))
    }, []) // eslint-disable-line

    if (loading) return <Spinner />
    if (!data) return null

    const total = (data.unbanRevenue || 0) + (data.coinRevenue || 0) + (data.subscriptionRevenue || 0)
    const months = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

    const MonthlyChart = ({ title, rows, accent = 'emerald' }) => {
      if (!rows?.length) return null
      const max = Math.max(...rows.map((x) => x.total))
      return (
        <div className="bg-vybe-card border border-vybe-border rounded-2xl p-5">
          <h3 className="font-black text-white mb-4 text-sm">{title}</h3>
          <div className="space-y-2">
            {rows.map((m) => {
              const pct = max ? (m.total / max) * 100 : 0
              return (
                <div key={`${m._id.year}-${m._id.month}`} className="flex items-center gap-3">
                  <span className="text-vybe-muted text-xs w-16 flex-shrink-0">{months[m._id.month]} {m._id.year}</span>
                  <div className="flex-1 bg-vybe-bg rounded-full h-2 overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${accent === 'emerald' ? 'bg-emerald-400' : 'bg-cyan-400'}`}
                      style={{ width: `${pct}%`, boxShadow: accent === 'emerald' ? '0 0 8px rgba(52,211,153,0.5)' : '0 0 8px rgba(0,212,255,0.5)' }} />
                  </div>
                  <span className={`text-xs font-bold w-20 text-right ${accent === 'emerald' ? 'text-emerald-400' : 'text-cyan-300'}`} style={{ fontFeatureSettings: '"tnum"' }}>£{m.total.toFixed(2)}</span>
                  <span className="text-vybe-muted text-[11px] w-10">{m.count}x</span>
                </div>
              )
            })}
          </div>
        </div>
      )
    }

    return (
      <div className="space-y-6">
        {/* Top: headline revenue */}
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-400/55 mb-3">Revenue (all-time)</p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard label="Total Revenue"     value={`£${total.toFixed(2)}`}                          color="text-emerald-400" bg="bg-emerald-500/8" border="border-emerald-500/25" icon={TrendingUp} />
            <StatCard label="Coin Sales"        value={`£${(data.coinRevenue || 0).toFixed(2)}`}        color="text-emerald-400" bg="bg-emerald-500/8" border="border-emerald-500/20" icon={DollarSign} />
            <StatCard label="Unban Sales"       value={`£${(data.unbanRevenue || 0).toFixed(2)}`}       color="text-emerald-400" bg="bg-emerald-500/8" border="border-emerald-500/20" icon={DollarSign} />
            <StatCard label="Membership MRR"    value={`£${(data.subscriptionRevenue || 0).toFixed(2)}`} color="text-emerald-400" bg="bg-emerald-500/8" border="border-emerald-500/20" icon={DollarSign} />
          </div>
        </div>

        {/* Coin sales detail */}
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-400/55 mb-3">Coin sales</p>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            <StatCard label="Revenue"      value={`£${(data.coinRevenue || 0).toFixed(2)}`}    color="text-emerald-400" bg="bg-emerald-500/8" border="border-emerald-500/20" icon={DollarSign} />
            <StatCard label="Orders"       value={data.coinCount || 0}                          color="text-cyan-300"    bg="bg-cyan-500/8"    border="border-cyan-400/20"   icon={TrendingUp} />
            <StatCard label="Coins Sold"   value={(data.coinsSold || 0).toLocaleString()}       color="text-cyan-300"    bg="bg-cyan-500/8"    border="border-cyan-400/20"   icon={TrendingUp} />
          </div>
        </div>

        {/* Memberships detail */}
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-400/55 mb-3">Memberships (active subscriptions)</p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard label="MRR"             value={`£${(data.subscriptionRevenue || 0).toFixed(2)}`} color="text-emerald-400" bg="bg-emerald-500/8" border="border-emerald-500/20" icon={DollarSign} />
            <StatCard label="Active Total"    value={data.subscriptionCount || 0}                       color="text-cyan-300"    bg="bg-cyan-500/8"    border="border-cyan-400/20"  icon={Users} />
            <StatCard label="Basic Active"    value={data.subscriptionBasic || 0}                       color="text-cyan-300"    bg="bg-cyan-500/8"    border="border-cyan-400/20"  icon={Users} />
            <StatCard label="VIP Active"      value={data.subscriptionVip || 0}                         color="text-amber-300"   bg="bg-amber-500/8"   border="border-amber-500/25" icon={Users} />
          </div>
        </div>

        {/* Unban detail */}
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-400/55 mb-3">Unban purchases</p>
          <div className="grid grid-cols-2 gap-3">
            <StatCard label="Revenue" value={`£${(data.unbanRevenue || 0).toFixed(2)}`} color="text-emerald-400" bg="bg-emerald-500/8" border="border-emerald-500/20" icon={DollarSign} />
            <StatCard label="Sales"   value={data.unbanCount || 0}                       color="text-cyan-300"    bg="bg-cyan-500/8"    border="border-cyan-400/20"   icon={TrendingUp} />
          </div>
        </div>

        {/* Monthly breakdowns side-by-side */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
          <MonthlyChart title="Unban — monthly"     rows={data.monthlyBreakdown} accent="emerald" />
          <MonthlyChart title="Coin sales — monthly" rows={data.coinMonthly}      accent="cyan" />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
          {data.recentCoinTransactions?.length > 0 && (
            <div className="bg-vybe-card border border-vybe-border rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-vybe-border flex items-center justify-between">
                <h3 className="font-black text-white text-sm">Recent coin purchases</h3>
                <span className="text-vybe-muted text-[11px]">{data.recentCoinTransactions.length}</span>
              </div>
              <div className="divide-y divide-vybe-border max-h-[420px] overflow-y-auto">
                {data.recentCoinTransactions.map((t) => (
                  <div key={t._id} className="px-5 py-3.5 flex items-center justify-between">
                    <div className="min-w-0">
                      <p className="text-white text-sm font-semibold truncate">{t.userId?.username || '—'}</p>
                      <p className="text-vybe-muted text-[11px]">Coins · {(t.coinsAmount || 0).toLocaleString()}</p>
                      <p className="text-vybe-muted text-[11px]">{t.completedAt ? new Date(t.completedAt).toLocaleString() : '—'}</p>
                    </div>
                    <span className="text-emerald-400 font-black text-base flex-shrink-0 ml-3" style={{ fontFeatureSettings: '"tnum"' }}>£{(t.gbpAmount || 0).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {data.recentTransactions?.length > 0 && (
            <div className="bg-vybe-card border border-vybe-border rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-vybe-border flex items-center justify-between">
                <h3 className="font-black text-white text-sm">Recent unban purchases</h3>
                <span className="text-vybe-muted text-[11px]">{data.recentTransactions.length}</span>
              </div>
              <div className="divide-y divide-vybe-border max-h-[420px] overflow-y-auto">
                {data.recentTransactions.map((t) => (
                  <div key={t._id} className="px-5 py-3.5 flex items-center justify-between">
                    <div className="min-w-0">
                      <p className="text-white text-sm font-semibold truncate">{t.userId?.username || '—'}</p>
                      <p className="text-vybe-muted text-[11px]">Unban · {t.banType || '—'}</p>
                      <p className="text-vybe-muted text-[11px]">{t.completedAt ? new Date(t.completedAt).toLocaleString() : '—'}</p>
                    </div>
                    <span className="text-emerald-400 font-black text-base flex-shrink-0 ml-3" style={{ fontFeatureSettings: '"tnum"' }}>£{(t.amount || 4.99).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  // ── Section: Settings ─────────────────────────────────────────────────────
  const SettingsSection = () => {
    const [settings, setSettings] = useState(null)
    const [loading,  setLoading]  = useState(true)
    const [saving,   setSaving]   = useState(false)
    const [pwForm,   setPwForm]   = useState({ current: '', new: '', confirm: '' })
    const [pwLoading, setPwLoading] = useState(false)
    const [broadcast, setBroadcast] = useState('')
    const [bcLoading, setBcLoading] = useState(false)

    useEffect(() => {
      axios.get('/api/admin-secure/settings', ah(token))
        .then(({ data }) => setSettings(data))
        .finally(() => setLoading(false))
    }, []) // eslint-disable-line

    const save = async () => {
      setSaving(true)
      try {
        await axios.post('/api/admin-secure/settings', settings, ah(token))
        showToast('Settings saved')
      } catch (e) { showToast(e.response?.data?.error || 'Failed', 'error') }
      finally { setSaving(false) }
    }

    // Immediate-persist for toggles — saves the moment you flip the switch
    // so users don't have to remember to hit the global Save button.
    const persistImmediate = async (patch, successMsg) => {
      const next = { ...settings, ...patch }
      setSettings(next)
      try {
        await axios.post('/api/admin-secure/settings', next, ah(token))
        if (successMsg) showToast(successMsg)
      } catch (e) {
        showToast(e.response?.data?.error || 'Failed to save', 'error')
        // Roll back on failure so the UI matches the server.
        setSettings(settings)
      }
    }

    const changePassword = async () => {
      if (pwForm.new !== pwForm.confirm) { showToast('Passwords do not match', 'error'); return }
      if (pwForm.new.length < 8) { showToast('Min 8 characters', 'error'); return }
      setPwLoading(true)
      try {
        await axios.post('/api/admin-secure/settings/change-password', { currentPassword: pwForm.current, newPassword: pwForm.new }, ah(token))
        showToast('Password changed'); setPwForm({ current: '', new: '', confirm: '' })
      } catch (e) { showToast(e.response?.data?.error || 'Failed', 'error') }
      finally { setPwLoading(false) }
    }

    const sendBroadcast = async () => {
      if (!broadcast) return
      setBcLoading(true)
      try {
        const { data } = await axios.post('/api/admin-secure/broadcast', { message: broadcast }, ah(token))
        showToast(`Delivered to ${data.delivered} online users`); setBroadcast('')
      } catch (e) { showToast(e.response?.data?.error || 'Failed', 'error') }
      finally { setBcLoading(false) }
    }

    if (loading) return <Spinner />
    if (!settings) return null

    return (
      <div className="space-y-6 max-w-2xl">
        {/* Maintenance */}
        <div className="bg-vybe-card border border-vybe-border rounded-2xl p-5">
          <h3 className="font-black text-white mb-4">Maintenance Mode</h3>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-white text-sm font-semibold">Enable Maintenance</p>
              <p className="text-vybe-muted text-xs">Shows a maintenance page to all users</p>
            </div>
            <button onClick={() => persistImmediate({ maintenanceMode: !settings.maintenanceMode }, !settings.maintenanceMode ? 'Maintenance enabled — users see the maintenance page' : 'Maintenance disabled')} className="text-cyan-300 hover:opacity-80 transition-opacity">
              {settings.maintenanceMode ? <ToggleRight size={32} /> : <ToggleLeft size={32} className="opacity-40" />}
            </button>
          </div>
          {settings.maintenanceMode && (
            <div className="px-3 py-2.5 rounded-lg mb-3 space-y-1" style={{ background: 'rgba(234,179,8,0.1)', border: '1px solid rgba(234,179,8,0.2)' }}>
              <p className="text-xs font-black" style={{ color: '#00B8E0' }}>⚠ Maintenance is LIVE</p>
              <p className="text-xs" style={{ color: 'rgba(234,179,8,0.7)' }}>Regular users see the maintenance page right now. You bypass it because you're logged into the admin panel — test in an incognito window to verify.</p>
            </div>
          )}
          <label className="block text-xs font-bold text-vybe-muted uppercase tracking-wider mb-1.5">Maintenance Message</label>
          <input value={settings.maintenanceMessage} onChange={(e) => setSettings({ ...settings, maintenanceMessage: e.target.value })} className="w-full px-3 py-2.5 bg-vybe-bg border border-vybe-border rounded-xl text-white text-sm placeholder-vybe-muted focus:border-cyan-400 focus:outline-none" />
        </div>

        {/* Moderation thresholds */}
        <div className="bg-vybe-card border border-vybe-border rounded-2xl p-5">
          <h3 className="font-black text-white mb-2">Moderation Thresholds</h3>
          <p className="text-vybe-muted text-xs mb-4">
            Counted as <span className="text-cyan-300 font-bold">unique reporters</span> within 24 hours — duplicate reports from the same person don&apos;t stack.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { key: 'warnThreshold',         label: 'Auto-warn',                 hint: 'Send a warning notification',                    default: 3 },
              { key: 'reportThreshold',       label: 'Auto-ban (general)',        hint: 'Temp ban for normal reports',                    default: 5 },
              { key: 'severeReportThreshold', label: 'Auto-ban (severe override)', hint: 'Nudity / underage — faster trigger',             default: 2 },
            ].map(({ key, label, hint, default: dflt }) => (
              <div key={key} className="bg-vybe-bg border border-vybe-border rounded-xl p-3.5">
                <label className="block text-[10px] font-black text-cyan-400/70 uppercase tracking-[0.14em] mb-1">{label}</label>
                <input
                  type="number" min={1} max={20}
                  value={settings[key] ?? dflt}
                  onChange={(e) => setSettings({ ...settings, [key]: parseInt(e.target.value) || dflt })}
                  className="w-full px-3 py-2 bg-vybe-card border border-vybe-border rounded-lg text-white text-lg font-black focus:border-cyan-400 focus:outline-none"
                  style={{ fontFeatureSettings: '"tnum"' }}
                />
                <p className="text-vybe-muted text-[11px] mt-1.5 leading-snug">{hint}</p>
              </div>
            ))}
          </div>
          <div className="mt-3 px-3 py-2.5 rounded-lg" style={{ background: 'rgba(0,212,255,0.06)', border: '1px solid rgba(0,212,255,0.18)' }}>
            <p className="text-[11px] text-cyan-300/85 leading-relaxed">
              <span className="font-bold">Recommended:</span> 3 / 5 / 2 — warn at 3 to give users a chance to course-correct, ban at 5 for normal reports, ban faster (2) for nudity or underage reports.
            </p>
          </div>
        </div>

        {/* Announcement */}
        <div className="bg-vybe-card border border-vybe-border rounded-2xl p-5">
          <h3 className="font-black text-white mb-4">Site Announcement</h3>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-white text-sm font-semibold">Show Announcement</p>
              <p className="text-vybe-muted text-xs">Displays banner to all users on home page</p>
            </div>
            <button onClick={() => persistImmediate({ announcementActive: !settings.announcementActive }, !settings.announcementActive ? 'Announcement live' : 'Announcement hidden')} className="text-cyan-300 hover:opacity-80 transition-opacity">
              {settings.announcementActive ? <ToggleRight size={32} /> : <ToggleLeft size={32} className="opacity-40" />}
            </button>
          </div>
          <label className="block text-xs font-bold text-vybe-muted uppercase tracking-wider mb-1.5">Announcement Text</label>
          <textarea value={settings.announcement} onChange={(e) => setSettings({ ...settings, announcement: e.target.value })} rows={2} className="w-full px-3 py-2.5 bg-vybe-bg border border-vybe-border rounded-xl text-white text-sm placeholder-vybe-muted focus:border-cyan-400 focus:outline-none resize-none mb-4" placeholder="e.g. New features dropping this weekend! 🎉" />
        </div>

        <button onClick={save} disabled={saving} className="px-6 py-3 rounded-xl btn-purple text-white font-black text-sm disabled:opacity-60">
          {saving ? 'Saving…' : 'Save Settings'}
        </button>

        {/* Live broadcast */}
        <div className="bg-vybe-card border border-vybe-border rounded-2xl p-5">
          <h3 className="font-black text-white mb-1">Live Broadcast</h3>
          <p className="text-vybe-muted text-xs mb-4">Sends a one-time notification to all currently online users</p>
          <div className="flex gap-2">
            <input value={broadcast} onChange={(e) => setBroadcast(e.target.value)} placeholder="Message to broadcast…" className="flex-1 px-3 py-2.5 bg-vybe-bg border border-vybe-border rounded-xl text-white text-sm placeholder-vybe-muted focus:border-cyan-400 focus:outline-none" />
            <button onClick={sendBroadcast} disabled={bcLoading || !broadcast} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-cyan-400 text-[#06121b] text-sm font-bold hover:bg-cyan-300 disabled:opacity-50 transition-all">
              {bcLoading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />} Send
            </button>
          </div>
        </div>

        {/* Change password */}
        <div className="bg-vybe-card border border-vybe-border rounded-2xl p-5">
          <h3 className="font-black text-white mb-4">Change Admin Password</h3>
          <div className="space-y-3">
            {[['current', 'Current Password', pwForm.current], ['new', 'New Password', pwForm.new], ['confirm', 'Confirm New Password', pwForm.confirm]].map(([field, label, value]) => (
              <div key={field}>
                <label className="block text-xs font-bold text-vybe-muted uppercase tracking-wider mb-1.5">{label}</label>
                <input type="password" value={value} onChange={(e) => setPwForm({ ...pwForm, [field]: e.target.value })} className="w-full px-3 py-2.5 bg-vybe-bg border border-vybe-border rounded-xl text-white text-sm focus:border-cyan-400 focus:outline-none" />
              </div>
            ))}
            <button onClick={changePassword} disabled={pwLoading} className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-cyan-400/20 border border-cyan-400/30 text-cyan-400 text-sm font-bold hover:bg-cyan-400/30 transition-all disabled:opacity-50">
              <Lock size={14} /> {pwLoading ? 'Updating…' : 'Update Password'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Section: Logs ─────────────────────────────────────────────────────────
  const LogsSection = () => {
    const [logs,    setLogs]    = useState([])
    const [loading, setLoading] = useState(false)
    const [page,    setPage]    = useState(1)
    const [total,   setTotal]   = useState(0)

    const fetchLogs = async (p = page) => {
      setLoading(true)
      try {
        const { data } = await axios.get(`/api/admin-secure/logs?page=${p}`, ah(token))
        setLogs(data.logs || []); setTotal(data.total || 0)
      } catch { showToast('Failed', 'error') }
      finally { setLoading(false) }
    }

    useEffect(() => { fetchLogs() }, []) // eslint-disable-line

    const ACTION_COLORS = {
      ban: 'text-red-400', unban: 'text-cyan-400', warn: 'text-cyan-400',
      delete: 'text-red-500', broadcast: 'text-cyan-400', 'change-admin-password': 'text-cyan-400',
      'update-settings': 'text-gray-400', 'remove-friendship': 'text-orange-400',
    }

    return (
      <div>
        <div className="flex items-center justify-between mb-5">
          <p className="text-vybe-muted text-sm">{total} total log entries</p>
          <button onClick={() => fetchLogs(page)} className="flex items-center gap-1.5 text-vybe-muted hover:text-white text-xs transition-colors p-2 rounded-lg hover:bg-vybe-card"><RefreshCw size={13} /></button>
        </div>

        {loading ? <Spinner /> : logs.length === 0 ? (
          <div className="text-center py-20 text-vybe-muted"><Activity size={36} className="mx-auto mb-3 opacity-30" /><p className="text-sm">No log entries yet</p></div>
        ) : (
          <>
            <div className="bg-vybe-card border border-vybe-border rounded-2xl overflow-hidden mb-4">
              <div className="divide-y divide-vybe-border">
                {logs.map((log) => (
                  <div key={log._id} className="px-4 py-3 flex items-start gap-4">
                    <span className={`text-[11px] font-black uppercase tracking-wide flex-shrink-0 mt-0.5 w-24 ${ACTION_COLORS[log.action] || 'text-vybe-muted'}`}>{log.action}</span>
                    <div className="flex-1 min-w-0">
                      {log.targetUsername && <span className="text-white text-xs font-semibold">{log.targetUsername} </span>}
                      <span className="text-vybe-muted text-xs truncate">{log.details}</span>
                    </div>
                    <span className="text-vybe-muted text-[11px] flex-shrink-0">{new Date(log.timestamp).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between text-sm text-vybe-muted">
              <span>Page {page}</span>
              <div className="flex gap-2">
                <button disabled={page <= 1} onClick={() => { setPage(page - 1); fetchLogs(page - 1) }} className="p-2 rounded-lg border border-vybe-border disabled:opacity-40"><ChevronLeft size={14} /></button>
                <button disabled={logs.length < 100} onClick={() => { setPage(page + 1); fetchLogs(page + 1) }} className="p-2 rounded-lg border border-vybe-border disabled:opacity-40"><ChevronRight size={14} /></button>
              </div>
            </div>
          </>
        )}
      </div>
    )
  }

  // ── Section: Cash Outs ────────────────────────────────────────────────────
  const CashOutSection = () => {
    const [filter,   setFilter]   = useState('pending')
    const [requests, setRequests] = useState([])
    const [loading,  setLoading]  = useState(false)
    const [noteMap,  setNoteMap]  = useState({})
    const [reviewId, setReviewId] = useState(null)
    const [reviewData, setReviewData] = useState(null)
    const [reviewLoading, setReviewLoading] = useState(false)

    const fetchRequests = useCallback(async (f = filter) => {
      setLoading(true)
      try {
        const { data } = await axios.get(`/api/admin-secure/cashout-requests?status=${f}`, ah(token))
        setRequests(data.requests || [])
      } catch { showToast('Failed to load cashout requests', 'error') }
      finally { setLoading(false) }
    }, [filter]) // eslint-disable-line

    useEffect(() => { fetchRequests() }, []) // eslint-disable-line

    const approve = async (id) => {
      try {
        await axios.post(`/api/admin-secure/cashout/${id}/approve`, { note: noteMap[id] || '' }, ah(token))
        showToast('Cash out approved')
        fetchRequests(filter)
        setReviewId(null)
      } catch (e) { showToast(e.response?.data?.error || 'Failed', 'error') }
    }

    const reject = async (id) => {
      try {
        await axios.post(`/api/admin-secure/cashout/${id}/reject`, { note: noteMap[id] || '' }, ah(token))
        showToast('Cash out rejected — coins refunded')
        fetchRequests(filter)
        setReviewId(null)
      } catch (e) { showToast(e.response?.data?.error || 'Failed', 'error') }
    }

    const openReview = async (req) => {
      setReviewId(req._id)
      setReviewData(null)
      setReviewLoading(true)
      try {
        const { data } = await axios.get(`/api/admin-secure/users/${req.userId?._id}/coin-history?type=tip_received`, ah(token))
        setReviewData(data)
      } catch { setReviewData(null) }
      finally { setReviewLoading(false) }
    }

    const selectedReq = requests.find(r => r._id === reviewId)

    return (
      <div>
        <div className="flex gap-1 bg-vybe-card2 p-1 rounded-xl w-fit mb-5">
          {[['pending','Pending'],['approved','Approved'],['rejected','Rejected'],['all','All']].map(([f, label]) => (
            <button key={f} onClick={() => { setFilter(f); fetchRequests(f) }}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${filter === f ? 'bg-cyan-400 text-[#06121b]' : 'text-vybe-muted hover:text-white'}`}>
              {label}
            </button>
          ))}
        </div>

        {loading ? <Spinner /> : requests.length === 0 ? (
          <div className="text-center py-20 text-vybe-muted"><DollarSign size={36} className="mx-auto mb-3 opacity-30" /><p className="text-sm">No requests</p></div>
        ) : (
          <div className="space-y-3">
            {requests.map((r) => (
              <div key={r._id} className={`bg-vybe-card border rounded-xl p-4 ${r.suspicious ? 'border-red-500/40' : 'border-vybe-border'}`}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="text-white font-bold text-sm">{r.userId?.username || '—'}</p>
                      <span className="text-vybe-muted text-xs">{r.userId?.email}</span>
                      {r.suspicious && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 font-black flex items-center gap-1">
                          <AlertTriangle size={9} /> SUSPICIOUS
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] mb-2">
                      <span className="text-vybe-muted">Request: <span className="text-white font-semibold">{r.coinsAmount?.toLocaleString()} coins</span></span>
                      <span className="text-vybe-muted">Value: <span className="text-emerald-400 font-semibold">£{r.gbpAmount?.toFixed(2)}</span></span>
                      <span className="text-vybe-muted">PayPal: <span className="text-white">{r.paypalEmail}</span></span>
                      <span className="text-vybe-muted">Cashable bal: <span className="text-cyan-400 font-semibold">{(r.userId?.cashableCoins ?? '?').toLocaleString()}</span></span>
                      <span className="text-vybe-muted">Spend bal: <span className="text-cyan-400 font-semibold">{(r.userId?.coins ?? '?').toLocaleString()}</span></span>
                      <span className="text-vybe-muted">Tips total: <span className="text-white">{(r.userId?.tipsEarned ?? '?').toLocaleString()}</span></span>
                    </div>
                    <p className="text-vybe-muted text-[11px]">{new Date(r.createdAt).toLocaleString()}</p>
                    {r.adminNote && <p className="text-white/40 text-xs mt-1">Note: {r.adminNote}</p>}
                  </div>
                  <div className="flex flex-col gap-2 flex-shrink-0">
                    <span className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border capitalize text-center ${
                      r.status === 'pending' ? 'bg-cyan-500/15 text-cyan-400 border-yellow-500/25' :
                      r.status === 'approved' ? 'bg-cyan-500/15 text-cyan-400 border-cyan-400/25' :
                      'bg-red-500/15 text-red-400 border-red-500/25'
                    }`}>{r.status}</span>
                    {r.status === 'pending' && (
                      <button onClick={() => openReview(r)}
                        className="px-3 py-1.5 rounded-lg bg-cyan-400/15 border border-cyan-400/30 text-cyan-400 text-xs font-bold hover:bg-cyan-400/25 transition-all flex items-center gap-1">
                        <Eye size={11} /> Review
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Review modal */}
        {reviewId && selectedReq && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
            <div className="absolute inset-0 bg-black/60" onClick={() => setReviewId(null)} />
            <div className="relative w-full max-w-lg bg-vybe-bg border border-vybe-border rounded-2xl shadow-2xl mx-4 p-5 max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-black text-white text-base">Review: {selectedReq.userId?.username}</h3>
                <button onClick={() => setReviewId(null)} className="w-7 h-7 rounded-lg text-vybe-muted hover:text-white hover:bg-vybe-card flex items-center justify-center"><X size={14} /></button>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                <div className="bg-vybe-card rounded-xl px-3 py-2">
                  <p className="text-vybe-muted text-[11px]">Request amount</p>
                  <p className="text-white font-black">{selectedReq.coinsAmount?.toLocaleString()} coins</p>
                </div>
                <div className="bg-vybe-card rounded-xl px-3 py-2">
                  <p className="text-vybe-muted text-[11px]">GBP value</p>
                  <p className="text-emerald-400 font-black">£{selectedReq.gbpAmount?.toFixed(2)}</p>
                </div>
                <div className="bg-cyan-500/10 border border-yellow-500/20 rounded-xl px-3 py-2">
                  <p className="text-cyan-400/70 text-[11px]">Earn balance now</p>
                  <p className="text-cyan-300 font-black">{(reviewData?.cashableCoins ?? selectedReq.userId?.cashableCoins ?? '…').toLocaleString()}</p>
                </div>
                <div className="bg-vybe-card rounded-xl px-3 py-2">
                  <p className="text-vybe-muted text-[11px]">Total tips (history)</p>
                  <p className="text-white font-black">{reviewData ? reviewData.tipHistoryTotal?.toLocaleString() : '…'}</p>
                </div>
              </div>

              <div className="mb-4">
                <p className="text-white text-xs font-bold mb-2">Tip history (earn balance source)</p>
                {reviewLoading ? (
                  <div className="py-6 text-center text-vybe-muted text-xs">Loading tip history…</div>
                ) : reviewData?.history?.length ? (
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {reviewData.history.map((h, i) => (
                      <div key={i} className="flex items-center justify-between px-3 py-2 rounded-lg bg-vybe-card text-xs">
                        <span className="text-white/70 truncate">{h.reason}</span>
                        <span className="text-cyan-400 font-bold ml-2 flex-shrink-0">+{h.amount}</span>
                        <span className="text-vybe-muted ml-2 flex-shrink-0">{new Date(h.timestamp).toLocaleDateString()}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-vybe-muted text-xs py-4 text-center">No tip history found</p>
                )}
              </div>

              <div className="mb-4">
                <label className="text-vybe-muted text-xs font-bold block mb-1.5">Admin note (shown to user)</label>
                <input value={noteMap[reviewId] || ''} onChange={(e) => setNoteMap(m => ({ ...m, [reviewId]: e.target.value }))}
                  placeholder="Reason for decision…" className="w-full px-3 py-2.5 bg-vybe-card border border-vybe-border rounded-xl text-white text-sm placeholder-vybe-muted focus:border-cyan-400 focus:outline-none" />
              </div>

              <div className="flex gap-2">
                <button onClick={() => reject(reviewId)} className="flex-1 py-2.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 hover:bg-red-500/25 text-sm font-bold transition-all">
                  Reject & Refund
                </button>
                <button onClick={() => approve(reviewId)} className="flex-1 py-2.5 rounded-xl bg-cyan-500/15 border border-cyan-400/30 text-cyan-400 hover:bg-cyan-500/25 text-sm font-bold transition-all">
                  Approve Payout
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // ── Section: Ban Appeals ──────────────────────────────────────────────────
  const AppealsSection = () => {
    const [filter,  setFilter]  = useState('pending')
    const [appeals, setAppeals] = useState([])
    const [loading, setLoading] = useState(false)
    const [noteMap, setNoteMap] = useState({})

    const fetchAppeals = useCallback(async (f = filter) => {
      setLoading(true)
      try {
        const { data } = await axios.get(`/api/admin-secure/appeals?status=${f}`, ah(token))
        setAppeals(data.appeals || [])
      } catch { showToast('Failed to load appeals', 'error') }
      finally { setLoading(false) }
    }, [filter]) // eslint-disable-line

    useEffect(() => { fetchAppeals() }, []) // eslint-disable-line

    const resolve = async (id) => {
      try {
        await axios.post(`/api/admin-secure/appeals/${id}/resolve`, { note: noteMap[id] || '' }, ah(token))
        showToast('Appeal marked resolved')
        fetchAppeals(filter)
      } catch (e) { showToast(e.response?.data?.error || 'Failed', 'error') }
    }

    const unbanUser = async (appeal) => {
      const uid = appeal.userId?._id
      if (!uid) { showToast('User account not found', 'error'); return }
      try {
        const note = noteMap[appeal._id] || ''
        // Send the reply (if any) so the user hears the outcome, then unban.
        if (note.trim()) {
          await axios.post(`/api/admin-secure/appeals/${appeal._id}/resolve`, { note }, ah(token))
        }
        await axios.post(`/api/admin-secure/users/${uid}/unban`, { note }, ah(token))
        showToast('User unbanned')
        fetchAppeals(filter)
      } catch (e) { showToast(e.response?.data?.error || 'Failed', 'error') }
    }

    return (
      <div>
        <div className="flex gap-1 bg-vybe-card2 p-1 rounded-xl w-fit mb-5">
          {[['pending','Pending'],['resolved','Resolved'],['all','All']].map(([f, label]) => (
            <button key={f} onClick={() => { setFilter(f); fetchAppeals(f) }}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${filter === f ? 'bg-cyan-400 text-[#06121b]' : 'text-vybe-muted hover:text-white'}`}>
              {label}
            </button>
          ))}
        </div>

        {loading ? <Spinner /> : appeals.length === 0 ? (
          <div className="text-center py-20 text-vybe-muted"><MessageSquare size={36} className="mx-auto mb-3 opacity-30" /><p className="text-sm">No appeals</p></div>
        ) : (
          <div className="space-y-3">
            {appeals.map((a) => (
              <div key={a._id} className="bg-vybe-card border border-vybe-border rounded-xl p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="text-white font-bold text-sm">{a.username || a.userId?.username || '—'}</p>
                      <span className="text-vybe-muted text-xs">{a.email || a.userId?.email}</span>
                      {a.userId && !a.userId.isBanned && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-400 border border-cyan-400/25 font-bold">UNBANNED</span>
                      )}
                    </div>
                    <p className="text-vybe-muted text-[11px] mb-2">
                      Ban: <span className="text-white">{a.banType || '—'}</span> · {a.banReason || '—'}
                    </p>
                    <p className="text-white/80 text-xs bg-vybe-card2 rounded-lg px-3 py-2 whitespace-pre-wrap">{a.message}</p>
                    <p className="text-vybe-muted text-[11px] mt-2">{new Date(a.createdAt).toLocaleString()}</p>
                    {a.adminNote && <p className="text-white/40 text-xs mt-1">Note: {a.adminNote}</p>}
                  </div>
                  <div className="flex flex-col gap-2 flex-shrink-0 w-full sm:w-52">
                    <span className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border capitalize text-center ${
                      a.status === 'pending' ? 'bg-cyan-500/15 text-cyan-400 border-yellow-500/25'
                      : 'bg-vybe-card2 text-vybe-muted border-vybe-border'
                    }`}>{a.status}</span>
                    {a.status === 'pending' && (
                      <>
                        <textarea value={noteMap[a._id] || ''} onChange={(e) => setNoteMap(m => ({ ...m, [a._id]: e.target.value }))}
                          placeholder="Reply to the user (optional) — they'll get it as a notification"
                          rows={2}
                          className="w-full px-3 py-2 bg-vybe-card2 border border-vybe-border rounded-lg text-white text-xs placeholder-vybe-muted focus:border-cyan-400 focus:outline-none resize-none" />
                        {a.userId?.isBanned && (
                          <button onClick={() => unbanUser(a)}
                            className="px-3 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold hover:bg-emerald-500/25 transition-all">
                            Unban user
                          </button>
                        )}
                        <button onClick={() => resolve(a._id)}
                          className="px-3 py-1.5 rounded-lg bg-cyan-500/15 border border-cyan-400/30 text-cyan-400 text-xs font-bold hover:bg-cyan-500/25 transition-all">
                          {(noteMap[a._id] || '').trim() ? 'Send reply & resolve' : 'Mark resolved'}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  // ─── Nav items ─────────────────────────────────────────────────────────────
  const NAV = [
    { id: 'overview', label: 'Overview',  icon: TrendingUp },
    { id: 'users',    label: 'Users',     icon: Users },
    { id: 'bans',     label: 'Bans',      icon: Ban },
    { id: 'reports',  label: 'Reports',   icon: Flag },
    { id: 'friends',  label: 'Friends',   icon: Heart },
    { id: 'cashouts', label: 'Cash Outs', icon: DollarSign },
    { id: 'appeals',  label: 'Appeals',   icon: MessageSquare },
    { id: 'revenue',  label: 'Revenue',   icon: TrendingUp },
    { id: 'settings', label: 'Settings',  icon: Settings },
    { id: 'logs',     label: 'Logs',      icon: Activity },
  ]

  // ─── Render ────────────────────────────────────────────────────────────────
  const sectionLabel = NAV.find((n) => n.id === section)?.label || section

  return (
    <div className="min-h-screen bg-vybe-bg font-space flex relative">
      {/* Ambient cyan gradient haze — never moves, sets the mood. */}
      <div className="fixed inset-0 pointer-events-none" style={{ background: 'radial-gradient(circle at 12% 10%, rgba(0,212,255,0.07), transparent 45%), radial-gradient(circle at 88% 90%, rgba(0,184,224,0.05), transparent 50%)', zIndex: 0 }} />
      <Toast toast={toast} />

      {/* Sidebar */}
      <div className="w-56 flex-shrink-0 bg-vybe-bg2/85 backdrop-blur-xl border-r border-cyan-400/10 flex flex-col sticky top-0 h-screen relative z-10">
        <div className="px-5 py-5 border-b border-cyan-400/10">
          <div className="flex items-center gap-2.5">
            <div className="relative w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, rgba(0,212,255,0.25), rgba(0,184,224,0.12))', border: '1px solid rgba(0,212,255,0.45)', boxShadow: '0 0 0 1px rgba(0,212,255,0.08) inset, 0 0 20px rgba(0,212,255,0.18)' }}>
              <Shield size={16} className="text-cyan-300" style={{ filter: 'drop-shadow(0 0 6px rgba(0,212,255,0.6))' }} />
            </div>
            <div>
              <p className="text-white font-black text-sm leading-none" style={{ letterSpacing: '-0.01em' }}>Vybe Admin</p>
              <p className="text-cyan-400/55 text-[10px] mt-1 font-bold uppercase tracking-[0.18em]">Secure</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 py-3 overflow-y-auto px-2">
          {NAV.map(({ id, label, icon: Icon }) => {
            const active = section === id
            return (
              <button
                key={id}
                onClick={() => setSection(id)}
                className={`w-full relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all mb-0.5 ${
                  active
                    ? 'text-white'
                    : 'text-vybe-muted hover:text-white hover:bg-white/[0.03]'
                }`}
                style={active ? { background: 'linear-gradient(90deg, rgba(0,212,255,0.18), rgba(0,212,255,0.04))', boxShadow: 'inset 0 0 0 1px rgba(0,212,255,0.25)' } : {}}
              >
                {active && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r"
                    style={{ background: '#00D4FF', boxShadow: '0 0 8px rgba(0,212,255,0.7)' }} />
                )}
                <Icon size={15} className={active ? 'text-cyan-300' : ''} />
                {label}
              </button>
            )
          })}
        </nav>

        <div className="px-4 py-4 border-t border-cyan-400/10">
          <div className="flex items-center gap-2 text-[11px] text-cyan-300 mb-3">
            <span className="relative flex items-center justify-center w-2 h-2">
              <span className="absolute inset-0 rounded-full bg-cyan-400 animate-ping opacity-60" />
              <span className="relative w-2 h-2 rounded-full bg-cyan-400" />
            </span>
            <span className="font-bold">{stats?.online ?? 0}</span>
            <span className="text-vybe-muted">online</span>
          </div>
          <button onClick={handleLogout} className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-vybe-muted hover:text-red-400 hover:bg-red-500/10 text-sm transition-all">
            <LogOut size={14} /> Logout
          </button>
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-10">
        {/* Top bar */}
        <div className="border-b border-cyan-400/10 bg-vybe-bg/70 backdrop-blur-xl px-6 py-4 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <span className="w-1 h-6 rounded-full" style={{ background: 'linear-gradient(180deg, #00D4FF, #00B8E0)', boxShadow: '0 0 10px rgba(0,212,255,0.55)' }} />
            <h1 className="text-base font-black text-white" style={{ letterSpacing: '-0.01em' }}>{sectionLabel}</h1>
          </div>
          <button onClick={fetchStats} className="p-2 rounded-lg text-vybe-muted hover:text-cyan-300 hover:bg-cyan-400/10 transition-all">
            <RefreshCw size={14} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">

          {section === 'overview' && stats && (() => {
            const totalRev = (stats.unbanRevenue || 0) + (stats.coinRevenue || 0)
            return (
            <div className="space-y-7">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-400/55 mb-3">Community</p>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <StatCard label="Total Users"     value={stats.totalUsers}       color="text-cyan-300"    bg="bg-cyan-500/8"    border="border-cyan-400/20"  icon={Users} />
                  <StatCard label="Online Now"      value={stats.online}           color="text-cyan-300"    bg="bg-cyan-500/8"    border="border-cyan-400/20"  icon={Wifi} />
                  <StatCard label="Banned"          value={stats.bannedUsers}      color="text-red-400"     bg="bg-red-500/8"     border="border-red-500/20"   icon={UserX} />
                  <StatCard label="Friendships"     value={stats.totalFriendships} color="text-cyan-300"    bg="bg-cyan-500/8"    border="border-cyan-400/20"  icon={Heart} />
                  <StatCard label="Total Reports"   value={stats.totalReports}     color="text-cyan-300"    bg="bg-cyan-500/8"    border="border-cyan-400/20"  icon={Flag} />
                  <StatCard label="Pending Reports" value={stats.pendingReports}   color="text-amber-300"   bg="bg-amber-500/8"   border="border-amber-500/25" icon={AlertTriangle} />
                  <StatCard label="Pending Cashouts" value={stats.pendingCashouts || 0} color="text-amber-300" bg="bg-amber-500/8" border="border-amber-500/25" icon={DollarSign} />
                  <StatCard label="Tips Earned"     value={(stats.totalTipsEarned || 0).toLocaleString()} color="text-cyan-300" bg="bg-cyan-500/8" border="border-cyan-400/20" icon={TrendingUp} />
                </div>
              </div>

              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-400/55 mb-3">Sales &amp; Revenue</p>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <StatCard label="Total Revenue"   value={`£${totalRev.toFixed(2)}`}                       color="text-emerald-400" bg="bg-emerald-500/8" border="border-emerald-500/25" icon={TrendingUp} />
                  <StatCard label="Coin Sales"      value={`£${(stats.coinRevenue || 0).toFixed(2)}`}      color="text-emerald-400" bg="bg-emerald-500/8" border="border-emerald-500/20" icon={DollarSign} />
                  <StatCard label="Coins Sold"      value={(stats.coinsPurchased || 0).toLocaleString()}    color="text-cyan-300"    bg="bg-cyan-500/8"    border="border-cyan-400/20"  icon={TrendingUp} />
                  <StatCard label="Coin Orders"     value={stats.coinPurchaseCount || 0}                    color="text-cyan-300"    bg="bg-cyan-500/8"    border="border-cyan-400/20"  icon={DollarSign} />
                  <StatCard label="Unban Revenue"   value={`£${(stats.unbanRevenue || 0).toFixed(2)}`}     color="text-emerald-400" bg="bg-emerald-500/8" border="border-emerald-500/20" icon={DollarSign} />
                  <StatCard label="Unban Sales"     value={stats.unbanCount || 0}                           color="text-emerald-300" bg="bg-emerald-500/8" border="border-emerald-500/20" icon={TrendingUp} />
                  <StatCard label="Approved Payouts" value={`£${(stats.approvedCashoutGbp || 0).toFixed(2)}`} color="text-emerald-300" bg="bg-emerald-500/8" border="border-emerald-500/20" icon={DollarSign} />
                  <StatCard label="Pending Payouts" value={`£${(stats.pendingCashoutGbp || 0).toFixed(2)}`}  color="text-amber-300"   bg="bg-amber-500/8"   border="border-amber-500/25" icon={DollarSign} />
                </div>
              </div>

              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-400/55 mb-3">Jump to</p>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {[
                    ['Users',    'users',    Users],
                    ['Revenue',  'revenue',  TrendingUp],
                    ['Reports',  'reports',  Flag],
                    ['Cash Outs', 'cashouts', DollarSign],
                  ].map(([label, id, Icon]) => (
                    <button key={id} onClick={() => setSection(id)} className="group relative overflow-hidden bg-vybe-card border border-vybe-border rounded-2xl px-4 py-3.5 text-left hover:border-cyan-400/40 hover:bg-vybe-card2 transition-all">
                      <div className="pointer-events-none absolute -bottom-12 -right-10 w-24 h-24 rounded-full opacity-0 group-hover:opacity-70 transition-opacity" style={{ background: 'radial-gradient(circle, rgba(0,212,255,0.35), transparent 70%)' }} />
                      <div className="relative flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <Icon size={14} className="text-cyan-300/80" />
                          <p className="text-white font-bold text-sm">{label}</p>
                        </div>
                        <ChevronRight size={14} className="text-vybe-muted group-hover:text-cyan-300 group-hover:translate-x-0.5 transition-all" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
            )
          })()}

          {section === 'users'    && <UsersSection />}
          {section === 'bans'     && <BansSection />}
          {section === 'reports'  && <ReportsSection />}
          {section === 'friends'  && <FriendsSection />}
          {section === 'cashouts' && <CashOutSection />}
          {section === 'appeals'  && <AppealsSection />}
          {section === 'revenue'  && <RevenueSection />}
          {section === 'settings' && <SettingsSection />}
          {section === 'logs'     && <LogsSection />}
        </div>
      </div>
    </div>
  )
}
