import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import axios from 'axios'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { GiftIcon, GIFTS } from '../components/GiftIcon'

const SORA = "'Sora', system-ui, sans-serif"

// Per-place podium styling.
const PODIUM = {
  1: { minH: 200, avatar: 58, border: '#f59e0b', bg: 'linear-gradient(180deg, #1a1200 0%, #0d0d18 100%)',
       grad: 'linear-gradient(135deg, #f59e0b, #7C3AED)', coin: '#f59e0b',
       badgeBg: 'rgba(245,158,11,0.2)', badgeColor: '#f59e0b' },
  2: { minH: 170, avatar: 48, border: '#2a2a3a', bg: '#0d0d18',
       grad: 'linear-gradient(135deg, #1a1a2e, #7C3AED)', coin: '#00D4FF',
       badgeBg: 'rgba(255,255,255,0.05)', badgeColor: '#555' },
  3: { minH: 150, avatar: 44, border: '#2a2a3a', bg: '#0d0d18',
       grad: 'linear-gradient(135deg, #cd7f32, #7C3AED)', coin: '#7C3AED',
       badgeBg: 'rgba(255,255,255,0.05)', badgeColor: '#555' },
}

// Gifter-rank label → colour.
function rankColor(rank) {
  if (rank === 'Vybe Legend') return '#f59e0b'
  if (rank === 'Vybe Elite')  return '#00D4FF'
  if (rank === 'Vybe Ultra')  return '#7C3AED'
  return '#444'
}

// Avatar circle — image, or gradient-initials fallback.
function Avatar({ url, name, size, ring, grad }) {
  if (url) return <img src={url} alt="" style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', border: ring ? `2px solid ${ring}` : 'none', flexShrink: 0 }} />
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: grad || 'linear-gradient(135deg, #7C3AED, #00D4FF)',
      border: ring ? `2px solid ${ring}` : 'none',
      display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: size * 0.36 }}>
      {(name || '?').slice(0, 2).toUpperCase()}
    </div>
  )
}

// Custom SVG crown for the 1st-place card.
function Crown() {
  return (
    <svg width="32" height="28" viewBox="0 0 32 28" fill="none">
      <path d="M2 22 L7 6 L13 16 L16 2 L19 16 L25 6 L30 22 Z" fill="rgba(245,158,11,0.2)" stroke="#f59e0b" strokeWidth="1.5" strokeLinejoin="round" />
      <rect x="2" y="22" width="28" height="5" rx="2" fill="rgba(245,158,11,0.2)" stroke="#f59e0b" strokeWidth="1.5" />
      <circle cx="7" cy="6" r="2" fill="#f59e0b" />
      <circle cx="16" cy="2" r="2.5" fill="#00D4FF" />
      <circle cx="25" cy="6" r="2" fill="#7C3AED" />
    </svg>
  )
}

// One podium card. `entry` may be null → renders an empty placeholder slot.
function PodiumCard({ entry, place, coinsOf }) {
  const p = PODIUM[place]
  const unlocked = entry ? GIFTS.filter((g) => (entry.giftCollection || []).includes(g.id)) : []
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ height: 30, marginBottom: 4, display: 'flex', alignItems: 'flex-end' }}>
        {place === 1 && <Crown />}
      </div>
      <div style={{ position: 'relative', width: '100%', minHeight: p.minH, background: p.bg, borderRadius: 16,
        border: `1.5px solid ${entry ? p.border : '#2a2a3a'}`, padding: '30px 8px 14px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        {/* Rank number badge */}
        <div style={{ position: 'absolute', top: 8, left: 8, width: 22, height: 22, borderRadius: 6,
          background: p.badgeBg, color: p.badgeColor, fontWeight: 800, fontSize: 11,
          display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {place}
        </div>
        {entry ? (
          <>
            <Avatar url={entry.avatarUrl} name={entry.username} size={p.avatar} ring={place === 1 ? '#f59e0b' : undefined} grad={p.grad} />
            <p style={{ color: '#fff', fontWeight: 700, fontSize: 12, marginTop: 8, maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {entry.username}
            </p>
            {place === 1 && entry.gifterRank && entry.gifterRank !== 'Newcomer' && (
              <p style={{ color: '#f59e0b', fontWeight: 700, fontSize: 10, marginTop: 2 }}>{entry.gifterRank}</p>
            )}
            <p style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: p.coin, fontWeight: 800, fontSize: 13, marginTop: 6 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: p.coin }} />
              {coinsOf(entry).toLocaleString()}
            </p>
            {place === 1 && unlocked.length > 0 && (
              <div style={{ display: 'flex', gap: 1, marginTop: 'auto', paddingTop: 10 }}>
                {unlocked.map((g) => <GiftIcon key={g.id} id={g.id} size={14} />)}
              </div>
            )}
          </>
        ) : (
          <span style={{ color: '#333', fontWeight: 800, fontSize: 26 }}>—</span>
        )}
      </div>
    </div>
  )
}

export default function LeaderboardPage() {
  const navigate = useNavigate()
  const [leaders, setLeaders] = useState([])
  const [loading, setLoading] = useState(true)
  const [period,  setPeriod]  = useState('weekly')

  useEffect(() => {
    axios.get(`/api/leaderboard/gifters?period=${period}`)
      .then(({ data }) => setLeaders(data.leaders || []))
      .catch(() => setLeaders([]))
      .finally(() => setLoading(false))
  }, [period])

  const coinsOf = (u) => (period === 'alltime' ? u.totalCoinsGifted : u.weeklyCoinsGifted) || 0
  const top3 = leaders.slice(0, 3)
  const countLabel = `${leaders.length} ${leaders.length === 1 ? 'gifter' : 'gifters'} ${period === 'alltime' ? 'all time' : 'this week'}`

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', fontFamily: SORA, display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <div className="relative z-10 max-w-2xl mx-auto px-4 pt-28 pb-24" style={{ flex: 1, width: '100%' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 22 }}>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: '#fff', letterSpacing: '-1px', lineHeight: 1.1 }}>
            Top <span style={{ color: '#00D4FF' }}>Gifters</span>
          </h1>
          <p style={{ color: '#2a2a3a', fontSize: 11, fontWeight: 600, marginTop: 6 }}>Resets every Monday at midnight</p>
        </div>

        {/* Week toggle */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 26 }}>
          <div style={{ display: 'inline-flex', gap: 4, padding: 4, borderRadius: 50, background: '#0d0d18', border: '1px solid #1a1a2e' }}>
            {[['weekly', 'This Week'], ['alltime', 'All Time']].map(([val, label]) => {
              const active = period === val
              return (
                <button key={val} type="button" onClick={() => setPeriod(val)}
                  style={{ padding: '7px 20px', borderRadius: 50, fontSize: 12, fontFamily: SORA, cursor: 'pointer',
                    fontWeight: active ? 700 : 600, border: 'none',
                    background: active ? '#00D4FF' : 'transparent',
                    color: active ? '#0a0a0f' : '#333' }}>
                  {label}
                </button>
              )
            })}
          </div>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '70px 0' }}>
            <Loader2 size={28} className="animate-spin" style={{ color: '#00D4FF' }} />
          </div>
        ) : leaders.length === 0 ? (
          /* Empty state */
          <div style={{ textAlign: 'center', padding: '28px 0 56px' }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#fff' }}>
              {period === 'alltime' ? 'No gifts sent yet' : 'No gifts sent yet this week'}
            </h2>
            <p style={{ color: '#333', fontSize: 12, fontWeight: 600, marginTop: 7, marginBottom: 22 }}>
              Be the first — start a video chat and send a gift
            </p>
            <button type="button" onClick={() => navigate('/')}
              style={{ padding: '12px 28px', borderRadius: 50, background: '#00D4FF', color: '#0a0a0f', fontWeight: 700, fontSize: 14, fontFamily: SORA, border: 'none', cursor: 'pointer' }}>
              Start Chatting
            </button>
          </div>
        ) : (
          <>
            {/* Top 3 podium — 2nd, 1st, 3rd */}
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 10, marginBottom: 28 }}>
              <PodiumCard entry={top3[1] || null} place={2} coinsOf={coinsOf} />
              <PodiumCard entry={top3[0] || null} place={1} coinsOf={coinsOf} />
              <PodiumCard entry={top3[2] || null} place={3} coinsOf={coinsOf} />
            </div>

            {/* Rankings */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
              <span style={{ color: '#1e1e2e', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Rankings</span>
              <span style={{ color: '#1e1e2e', fontSize: 11, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{countLabel}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {leaders.map((u, i) => {
                const rank = i + 1
                const isMe = !!u.isMe
                const unlocked = GIFTS.filter((g) => (u.giftCollection || []).includes(g.id))
                return (
                  <motion.div
                    key={`${u.username}-${rank}`}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i * 0.025, 0.4), duration: 0.3 }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 14,
                      background: isMe ? 'rgba(0,212,255,0.03)' : '#0d0d18',
                      border: `${isMe ? '1.5px' : '1px'} solid ${isMe ? '#00D4FF' : '#111122'}`,
                    }}
                  >
                    <span style={{ width: 20, textAlign: 'center', fontWeight: 800, fontSize: 14, color: rank === 1 ? '#f59e0b' : '#555', flexShrink: 0 }}>{rank}</span>
                    <Avatar url={u.avatarUrl} name={u.username} size={40} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ color: '#fff', fontWeight: 700, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.username}</span>
                        {isMe && (
                          <span style={{ background: 'rgba(0,212,255,0.1)', color: '#00D4FF', fontSize: 10, fontWeight: 700, borderRadius: 10, padding: '1px 7px', flexShrink: 0 }}>you</span>
                        )}
                      </div>
                      {u.gifterRank && u.gifterRank !== 'Newcomer' && (
                        <p style={{ color: rankColor(u.gifterRank), fontSize: 10, fontWeight: 700, lineHeight: 1.3 }}>{u.gifterRank}</p>
                      )}
                      {unlocked.length > 0 && (
                        <div style={{ display: 'flex', gap: 1, marginTop: 2 }}>
                          {unlocked.map((g) => <GiftIcon key={g.id} id={g.id} size={14} />)}
                        </div>
                      )}
                    </div>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#f59e0b', fontWeight: 800, fontSize: 13, flexShrink: 0 }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#f59e0b' }} />
                      {coinsOf(u).toLocaleString()}
                    </span>
                  </motion.div>
                )
              })}
            </div>
          </>
        )}
      </div>
      <Footer />
    </div>
  )
}
