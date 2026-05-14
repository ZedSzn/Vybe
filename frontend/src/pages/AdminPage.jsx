import { useState, useEffect, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import axios from 'axios'
import {
  Shield, Users, Flag, Search, RefreshCw, X, CheckCircle,
  AlertTriangle, TrendingUp, Wifi, UserX, ChevronDown, DollarSign,
} from 'lucide-react'

const REASON_MAP = {
  nudity:      { label: '🔞 Nudity',      color: 'text-red-400',    bg: 'bg-red-500/15',    border: 'border-red-500/25' },
  harassment:  { label: '😤 Harassment',  color: 'text-orange-400', bg: 'bg-orange-500/15', border: 'border-orange-500/25' },
  underage:    { label: '👶 Underage',    color: 'text-yellow-400', bg: 'bg-yellow-500/15', border: 'border-yellow-500/25' },
  spam:        { label: '🤖 Spam',        color: 'text-cyan-400',   bg: 'bg-cyan-400/15',   border: 'border-cyan-400/25' },
  other:       { label: '📋 Other',       color: 'text-gray-400',   bg: 'bg-gray-500/15',   border: 'border-gray-500/25' },
}

function Toast({ toast }) {
  if (!toast) return null
  return (
    <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl text-sm font-semibold shadow-card animate-fade-in flex items-center gap-2 ${
      toast.type === 'error'
        ? 'bg-red-500/20 border border-red-500/40 text-red-300'
        : 'bg-green-500/20 border border-green-500/40 text-green-300'
    }`}>
      {toast.type === 'error' ? <AlertTriangle size={14} /> : <CheckCircle size={14} />}
      {toast.msg}
    </div>
  )
}

function StatCard({ label, value, color, bg, border, icon: Icon }) {
  return (
    <div className={`${bg} border ${border} rounded-xl p-4`}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-vybe-muted text-[11px] font-bold uppercase tracking-wider">{label}</p>
        {Icon && <Icon size={14} className={`${color} opacity-60`} />}
      </div>
      <p className={`text-3xl font-black ${color}`}>{value ?? '—'}</p>
    </div>
  )
}

export default function AdminPage() {
  const { user, isAuthenticated } = useAuth()
  const navigate = useNavigate()

  const [tab,          setTab]          = useState('reports')
  const [stats,        setStats]        = useState(null)
  const [reports,      setReports]      = useState([])
  const [users,        setUsers]        = useState([])
  const [unbanPurchases, setUnbanPurchases] = useState([])
  const [search,       setSearch]       = useState('')
  const [reportFilter, setReportFilter] = useState('all')
  const [loading,      setLoading]      = useState(true)
  const [toast,        setToast]        = useState(null)
  const [banModal,     setBanModal]     = useState(null)
  const [banReason,    setBanReason]    = useState('')

  useEffect(() => {
    if (!isAuthenticated || !user?.isAdmin) { navigate('/'); return }
    fetchStats()
    fetchReports()
  }, [isAuthenticated, user]) // eslint-disable-line

  useEffect(() => {
    if (tab === 'reports') fetchReports()
    if (tab === 'users')   fetchUsers()
    if (tab === 'unbans')  fetchUnbanPurchases()
  }, [tab, reportFilter]) // eslint-disable-line

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const fetchStats = async () => {
    try { const { data } = await axios.get('/api/admin/stats'); setStats(data) } catch {}
  }

  const fetchUnbanPurchases = async () => {
    setLoading(true)
    try {
      const { data } = await axios.get('/api/admin/unban-purchases')
      setUnbanPurchases(data.purchases || [])
    } catch { showToast('Failed to load unban purchases', 'error') }
    finally { setLoading(false) }
  }

  const fetchReports = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await axios.get(`/api/admin/reports?status=${reportFilter}`)
      setReports(data.reports || [])
    } catch { showToast('Failed to load reports', 'error') }
    finally { setLoading(false) }
  }, [reportFilter])

  const fetchUsers = async (q = search) => {
    setLoading(true)
    try {
      const { data } = await axios.get(`/api/admin/users?search=${encodeURIComponent(q)}`)
      setUsers(data.users || [])
    } catch { showToast('Failed to load users', 'error') }
    finally { setLoading(false) }
  }

  const banUser = async (userId, reason) => {
    try {
      await axios.post(`/api/admin/ban/${userId}`, { reason })
      showToast('User banned')
      setBanModal(null); setBanReason('')
      fetchUsers(); fetchStats()
    } catch { showToast('Failed to ban user', 'error') }
  }

  const unbanUser = async (userId) => {
    try {
      await axios.post(`/api/admin/unban/${userId}`)
      showToast('User unbanned')
      fetchUsers(); fetchStats()
    } catch { showToast('Failed to unban user', 'error') }
  }

  const resolveReport = async (id) => {
    try {
      await axios.post(`/api/admin/resolve-report/${id}`)
      showToast('Report resolved')
      fetchReports(); fetchStats()
    } catch { showToast('Failed to resolve', 'error') }
  }

  return (
    <div className="min-h-screen bg-vybe-bg font-space">
      <Toast toast={toast} />

      {/* Ban reason modal */}
      {banModal && (
        <>
          <div className="fixed inset-0 bg-black/60 z-40" onClick={() => setBanModal(null)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[340px] bg-vybe-bg2 border border-vybe-border rounded-2xl p-5 shadow-purple">
            <h3 className="font-black text-white mb-1">Ban {banModal.username}?</h3>
            <p className="text-vybe-muted text-xs mb-4">Provide a reason (shown to the user).</p>
            <textarea
              value={banReason}
              onChange={(e) => setBanReason(e.target.value)}
              placeholder="e.g. Violation of community guidelines — nudity on camera"
              rows={3}
              className="w-full px-3 py-2.5 bg-vybe-card border border-vybe-border rounded-xl text-white text-sm placeholder-vybe-muted focus:border-vybe-purple transition-all resize-none mb-4"
            />
            <div className="flex gap-2">
              <button onClick={() => { setBanModal(null); setBanReason('') }} className="flex-1 py-2.5 rounded-xl border border-vybe-border text-vybe-muted hover:text-white text-sm transition-colors">Cancel</button>
              <button onClick={() => banUser(banModal.userId, banReason || 'Banned by admin')} className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-bold transition-all">Confirm Ban</button>
            </div>
          </div>
        </>
      )}

      {/* Top nav */}
      <div className="border-b border-vybe-border bg-vybe-bg2 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-vybe-purple/15 border border-vybe-purple/30 flex items-center justify-center">
              <Shield size={18} className="text-vybe-purple" />
            </div>
            <div>
              <h1 className="text-base font-black text-white leading-none">Vybe Admin</h1>
              <p className="text-[11px] text-vybe-muted mt-0.5">Moderation Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden sm:flex items-center gap-1.5 text-xs text-green-400">
              <Wifi size={12} />
              {stats?.online ?? 0} online
            </span>
            <Link to="/" className="flex items-center gap-1.5 text-vybe-muted hover:text-white text-sm transition-colors">
              <X size={14} />
              <span className="hidden sm:inline">Exit</span>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">

        {/* Stats row */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3 mb-6">
            <StatCard label="Total Reports"   value={stats.totalReports}   color="text-vybe-purple"  bg="bg-vybe-purple/10"   border="border-vybe-purple/20"  icon={Flag} />
            <StatCard label="Pending"          value={stats.pendingReports} color="text-yellow-400"   bg="bg-yellow-500/10"   border="border-yellow-500/20"  icon={AlertTriangle} />
            <StatCard label="Total Users"      value={stats.totalUsers}     color="text-green-400"    bg="bg-green-500/10"    border="border-green-500/20"   icon={Users} />
            <StatCard label="Banned"           value={stats.bannedUsers}    color="text-red-400"      bg="bg-red-500/10"      border="border-red-500/20"     icon={UserX} />
            <StatCard label="Online Now"       value={stats.online}         color="text-cyan-400"     bg="bg-cyan-400/10"     border="border-cyan-400/20"    icon={TrendingUp} />
            <StatCard label="Unban Sales"      value={stats.unbanCount}     color="text-emerald-400"  bg="bg-emerald-500/10"  border="border-emerald-500/20" icon={DollarSign} />
            <StatCard label="Unban Revenue"    value={`$${(stats.unbanRevenue || 0).toFixed(2)}`} color="text-emerald-300" bg="bg-emerald-500/10" border="border-emerald-500/20" icon={DollarSign} />
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 bg-vybe-card2 p-1 rounded-xl w-fit mb-5">
          {[
            { id: 'reports', label: '🚨 Reports' },
            { id: 'users',   label: '👥 Users' },
            { id: 'unbans',  label: '💳 Unban Sales' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${
                tab === t.id ? 'bg-vybe-purple text-white shadow-purple-sm' : 'text-vybe-muted hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Reports tab ─────────────────────────────────────────── */}
        {tab === 'reports' && (
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-4">
              {['all', 'pending', 'resolved'].map((f) => (
                <button
                  key={f}
                  onClick={() => setReportFilter(f)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition-all border ${
                    reportFilter === f
                      ? 'bg-vybe-purple/20 text-vybe-purple border-vybe-purple/40'
                      : 'text-vybe-muted border-vybe-border hover:text-white hover:border-vybe-border/80'
                  }`}
                >
                  {f}
                </button>
              ))}
              <button onClick={fetchReports} className="ml-auto flex items-center gap-1.5 text-vybe-muted hover:text-white text-xs transition-colors p-2 rounded-lg hover:bg-vybe-card">
                <RefreshCw size={13} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
            </div>

            {loading ? (
              <div className="flex justify-center py-20"><div className="loading-dots flex"><span /><span /><span /></div></div>
            ) : reports.length === 0 ? (
              <div className="text-center py-20 text-vybe-muted">
                <Flag size={36} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm font-medium">No reports found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {reports.map((r) => {
                  const reason = REASON_MAP[r.reason] || REASON_MAP.other
                  return (
                    <div key={r._id} className={`bg-vybe-card border rounded-2xl p-4 sm:p-5 transition-opacity ${r.resolved ? 'border-vybe-border opacity-50' : 'border-red-500/15'}`}>
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-3">
                            <span className={`text-[11px] font-black px-2.5 py-1 rounded-full ${reason.bg} ${reason.color} border ${reason.border}`}>
                              {reason.label}
                            </span>
                            {r.resolved && (
                              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-green-500/15 text-green-400 border border-green-500/25 flex items-center gap-1">
                                <CheckCircle size={10} /> Resolved
                              </span>
                            )}
                          </div>
                          <div className="space-y-1 text-[13px]">
                            <p className="text-vybe-muted">
                              Reported user:{' '}
                              <span className="text-white font-semibold">{r.reportedUserId?.username || 'Guest'}</span>
                              {r.reportedUserId?.email && <span className="text-vybe-muted ml-1">({r.reportedUserId.email})</span>}
                              {r.reportedUserId?.isBanned && <span className="ml-2 text-[10px] px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/20 font-bold">BANNED</span>}
                            </p>
                            <p className="text-vybe-muted">
                              Reported by:{' '}
                              <span className="text-gray-400">{r.reporterUserId?.username || `Guest (${r.reporterSocketId?.slice(0,8)}…)`}</span>
                            </p>
                            <p className="text-vybe-muted text-[12px]">{new Date(r.createdAt).toLocaleString()}</p>
                          </div>
                        </div>

                        {!r.resolved && (
                          <div className="flex flex-wrap gap-2 flex-shrink-0">
                            {r.reportedUserId && !r.reportedUserId.isBanned && (
                              <button
                                onClick={() => setBanModal({ userId: r.reportedUserId._id, username: r.reportedUserId.username })}
                                className="px-3 py-1.5 rounded-lg bg-red-500/15 border border-red-500/30 text-red-400 hover:bg-red-500/25 text-xs font-bold transition-all"
                              >
                                Ban User
                              </button>
                            )}
                            <button
                              onClick={() => resolveReport(r._id)}
                              className="px-3 py-1.5 rounded-lg bg-green-500/15 border border-green-500/30 text-green-400 hover:bg-green-500/25 text-xs font-bold transition-all"
                            >
                              Resolve
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Users tab ───────────────────────────────────────────── */}
        {tab === 'users' && (
          <div>
            <div className="flex gap-2 mb-4">
              <div className="relative flex-1 max-w-sm">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-vybe-muted" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchUsers()}
                  placeholder="Search username or email…"
                  className="w-full pl-9 pr-4 py-2.5 bg-vybe-card border border-vybe-border rounded-xl text-sm text-white placeholder-vybe-muted focus:border-vybe-purple transition-all"
                />
              </div>
              <button
                onClick={() => fetchUsers()}
                className="px-4 py-2.5 rounded-xl bg-vybe-purple text-white text-sm font-bold hover:bg-vybe-purple-light transition-all"
              >
                Search
              </button>
              <button onClick={() => { setSearch(''); fetchUsers('') }} className="p-2.5 rounded-xl border border-vybe-border text-vybe-muted hover:text-white transition-colors">
                <RefreshCw size={14} />
              </button>
            </div>

            {loading ? (
              <div className="flex justify-center py-20"><div className="loading-dots flex"><span /><span /><span /></div></div>
            ) : users.length === 0 ? (
              <div className="text-center py-20 text-vybe-muted">
                <Users size={36} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm font-medium">No users found</p>
              </div>
            ) : (
              <div className="bg-vybe-card border border-vybe-border rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-vybe-border bg-vybe-card2">
                        <th className="text-left px-4 py-3 text-[11px] font-black text-vybe-muted uppercase tracking-wider">User</th>
                        <th className="text-left px-4 py-3 text-[11px] font-black text-vybe-muted uppercase tracking-wider hidden md:table-cell">Joined</th>
                        <th className="text-left px-4 py-3 text-[11px] font-black text-vybe-muted uppercase tracking-wider">Status</th>
                        <th className="text-right px-4 py-3 text-[11px] font-black text-vybe-muted uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-vybe-border">
                      {users.map((u) => (
                        <tr key={u._id} className="hover:bg-vybe-card2/50 transition-colors">
                          <td className="px-4 py-3.5">
                            <p className="font-semibold text-white">{u.username}</p>
                            <p className="text-vybe-muted text-[11px]">{u.email}</p>
                          </td>
                          <td className="px-4 py-3.5 text-vybe-muted text-[12px] hidden md:table-cell">
                            {new Date(u.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="flex flex-wrap gap-1">
                              {u.isAdmin   && <span className="text-[10px] px-2 py-0.5 rounded-full bg-vybe-purple/20 text-vybe-purple border border-vybe-purple/30 font-black">ADMIN</span>}
                              {u.isVip     && <span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-500/15 text-yellow-400 font-bold">VIP</span>}
                              {u.isPremium && <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-400/15 text-cyan-400 font-bold">MEMBER</span>}
                              {u.isBanned  ? (
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/20 font-bold">BANNED</span>
                              ) : (
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/15 text-green-400 font-bold">ACTIVE</span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3.5 text-right">
                            {!u.isAdmin && (
                              u.isBanned ? (
                                <button onClick={() => unbanUser(u._id)} className="px-3 py-1.5 rounded-lg bg-green-500/15 border border-green-500/30 text-green-400 hover:bg-green-500/25 text-xs font-bold transition-all">
                                  Unban
                                </button>
                              ) : (
                                <button onClick={() => setBanModal({ userId: u._id, username: u.username })} className="px-3 py-1.5 rounded-lg bg-red-500/15 border border-red-500/30 text-red-400 hover:bg-red-500/25 text-xs font-bold transition-all">
                                  Ban
                                </button>
                              )
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Unban Purchases tab ────────────────────────────────── */}
        {tab === 'unbans' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <p className="text-vybe-muted text-sm">{unbanPurchases.length} completed unban purchases</p>
              <button onClick={fetchUnbanPurchases} className="flex items-center gap-1.5 text-vybe-muted hover:text-white text-xs transition-colors p-2 rounded-lg hover:bg-vybe-card">
                <RefreshCw size={13} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
            </div>

            {loading ? (
              <div className="flex justify-center py-20"><div className="loading-dots flex"><span /><span /><span /></div></div>
            ) : unbanPurchases.length === 0 ? (
              <div className="text-center py-20 text-vybe-muted">
                <DollarSign size={36} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm font-medium">No unban purchases yet</p>
              </div>
            ) : (
              <div className="bg-vybe-card border border-vybe-border rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-vybe-border bg-vybe-card2">
                        <th className="text-left px-4 py-3 text-[11px] font-black text-vybe-muted uppercase tracking-wider">User</th>
                        <th className="text-left px-4 py-3 text-[11px] font-black text-vybe-muted uppercase tracking-wider hidden sm:table-cell">Ban Type</th>
                        <th className="text-left px-4 py-3 text-[11px] font-black text-vybe-muted uppercase tracking-wider">Amount</th>
                        <th className="text-left px-4 py-3 text-[11px] font-black text-vybe-muted uppercase tracking-wider hidden md:table-cell">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-vybe-border">
                      {unbanPurchases.map((p) => (
                        <tr key={p._id} className="hover:bg-vybe-card2/50 transition-colors">
                          <td className="px-4 py-3.5">
                            <p className="font-semibold text-white">{p.userId?.username || 'Unknown'}</p>
                            <p className="text-vybe-muted text-[11px]">{p.userId?.email || '—'}</p>
                          </td>
                          <td className="px-4 py-3.5 hidden sm:table-cell">
                            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-orange-500/15 text-orange-400 border border-orange-500/20">
                              {p.banType || '—'}
                            </span>
                          </td>
                          <td className="px-4 py-3.5">
                            <span className="text-emerald-400 font-bold">${(p.amount || 4.99).toFixed(2)}</span>
                          </td>
                          <td className="px-4 py-3.5 text-vybe-muted text-[12px] hidden md:table-cell">
                            {p.completedAt ? new Date(p.completedAt).toLocaleString() : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
