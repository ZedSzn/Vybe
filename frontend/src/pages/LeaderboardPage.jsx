import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import axios from 'axios'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { GiftIcon, GIFTS } from '../components/GiftIcon'

const SORA = "'Sora', system-ui, sans-serif"

// Podium border colours by place.
const PLACE_COLOR = { 1: '#f59e0b', 2: '#aaa', 3: '#cd7f32' }
// Coloured coin dot per podium place.
const DOT_COLOR   = { 1: '#f59e0b', 2: '#00D4FF', 3: '#7C3AED' }
// Rank-number badge background per podium place.
const BADGE_BG    = { 1: 'rgba(245,158,11,0.2)', 2: 'rgba(170,170,170,0.15)', 3: 'rgba(205,127,50,0.15)' }
// Podium avatar sizes.
const AVATAR_SIZE = { 1: 62, 2: 52, 3: 46 }
// Podium card heights — steps up toward 1st place.
const CARD_MINH   = { 1: 180, 2: 150, 3: 130 }

// Gifter-rank label → colour.
function rankColor(rank) {
  if (rank === 'Vybe Legend') return '#f59e0b'
  if (rank === 'Vybe Elite')  return '#00D4FF'
  if (rank === 'Vybe Ultra')  return '#7C3AED'
  return '#444'
}

function Avatar({ url, name, size, ring }) {
  if (url) return <img src={url} alt="" style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', border: ring ? `2px solid ${ring}` : 'none', flexShrink: 0 }} />
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', flexShrink: 0, background: 'linear-gradient(135deg, #7C3AED, #00D4FF)', border: ring ? `2px solid ${ring}` : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: size * 0.36 }}>
      {(name || '?').slice(0, 2).toUpperCase()}
    </div>
  )
}

// Gold "Weekly Rankings" pill.
function GoldBadge() {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '6px 16px', borderRadius: 50,
      background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)',
      color: '#f59e0b', fontSize: 12, fontWeight: 700, letterSpacing: '0.09em', textTransform: 'uppercase' }}>
      <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#f59e0b' }} />
      Weekly Rankings
    </div>
  )
}

// One podium card. `entry` may be null → renders an empty placeholder slot.
function PodiumCard({ entry, place, coinsOf }) {
  const c = PLACE_COLOR[place]
  const first = place === 1
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ height: 26, marginBottom: 4, fontSize: 22, lineHeight: 1 }}>{first ? '👑' : ''}</div>
      <div style={{ position: 'relative', width: '100%', minHeight: CARD_MINH[place], background: '#0d0d1a', borderRadius: 16,
        border: `1.5px solid ${entry ? c : '#1a1a2e'}`, padding: '28px 8px 16px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        boxShadow: first && entry ? '0 0 26px rgba(245,158,11,0.14)' : 'none' }}>
        {/* Rank number badge */}
        <div style={{ position: 'absolute', top: 8, left: 8, width: 20, height: 20, borderRadius: 7,
          background: BADGE_BG[place], color: c, fontWeight: 800, fontSize: 11,
          display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {place}
        </div>
        {entry ? (
          <>
            <Avatar url={entry.avatarUrl} name={entry.username} size={AVATAR_SIZE[place]} ring={c} />
            <p style={{ color: '#fff', fontWeight: 800, fontSize: 12, marginTop: 8, maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {entry.username}
            </p>
            <p style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: DOT_COLOR[place], fontWeight: 800, fontSize: 13, marginTop: 5 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: DOT_COLOR[place] }} />
              {coinsOf(entry).toLocaleString()}
            </p>
          </>
        ) : (
          <span style={{ color: '#333', fontWeight: 800, fontSize: 26 }}>—</span>
        )}
      </div>
    </div>
  )
}

// "How it works" explainer card.
function HowItWorks() {
  const steps = [
    { icon: '💬', title: 'Start a video chat', sub: 'Match with someone new' },
    { icon: '🎁', title: 'Send coins as gifts', sub: 'Pick from six gift tiers' },
    { icon: '🏆', title: 'Climb the rankings',  sub: 'More coins, higher rank' },
  ]
  return (
    <div style={{ marginTop: 20, background: '#0d0d18', border: '1px solid #1a1a2e', borderRadius: 16, padding: 20 }}>
      <h3 style={{ color: '#fff', fontWeight: 700, fontSize: 13, marginBottom: 14 }}>How to climb the leaderboard</h3>
      <div style={{ display: 'flex', gap: 10 }}>
        {steps.map((s) => (
          <div key={s.title} style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: 22, lineHeight: 1, marginBottom: 7 }}>{s.icon}</div>
            <p style={{ color: '#fff', fontWeight: 700, fontSize: 12 }}>{s.title}</p>
            <p style={{ color: '#444', fontWeight: 600, fontSize: 11, marginTop: 2, lineHeight: 1.35 }}>{s.sub}</p>
          </div>
        ))}
      </div>
      <p style={{ color: '#333', fontSize: 10, fontWeight: 600, textAlign: 'center', marginTop: 16 }}>
        Rankings reset every Monday at midnight
      </p>
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

  return (
    <div style={{ minHeight: '100vh', background: '#070712', fontFamily: SORA, display: 'flex', flexDirection: 'column', position: 'relative' }}>
      {/* Hero radial glow */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 440, pointerEvents: 'none',
        background: 'radial-gradient(ellipse at 50% 30%, rgba(124,58,237,0.18) 0%, rgba(0,212,255,0.08) 40%, transparent 70%)' }} />

      <Navbar />
      <div className="relative z-10 max-w-2xl mx-auto px-4 pt-28 pb-24" style={{ flex: 1, width: '100%' }}>

        {/* Hero — badge + title + subtitle */}
        <div style={{ textAlign: 'center', marginBottom: 22 }}>
          <GoldBadge />
          <h1 style={{ fontSize: 30, fontWeight: 800, color: '#fff', letterSpacing: '-0.5px', lineHeight: 1.1, marginTop: 14 }}>Top Gifters</h1>
          <p style={{ color: '#444', fontSize: 12, fontWeight: 600, marginTop: 6 }}>Resets every Monday at midnight</p>
        </div>

        {/* Week toggle */}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 26 }}>
          {[['weekly', 'This Week'], ['alltime', 'All Time']].map(([val, label]) => {
            const active = period === val
            return (
              <button key={val} type="button" onClick={() => setPeriod(val)}
                style={{ padding: '7px 20px', borderRadius: 50, fontSize: 12, fontWeight: 700, fontFamily: SORA, cursor: 'pointer',
                  background: active ? '#00D4FF' : '#0d0d1a',
                  border: `1px solid ${active ? '#00D4FF' : '#1a1a2e'}`,
                  color: active ? '#0a0a0f' : '#555' }}>
                {label}
              </button>
            )
          })}
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '70px 0' }}>
            <Loader2 size={28} className="animate-spin" style={{ color: '#00D4FF' }} />
          </div>
        ) : leaders.length === 0 ? (
          /* Empty state */
          <div style={{ textAlign: 'center', padding: '20px 0 48px' }}>
            <GoldBadge />
            <h2 style={{ fontSize: 18, fontWeight: 800, color: '#fff', marginTop: 14 }}>
              {period === 'alltime' ? 'No gifts sent yet' : 'No gifts sent yet this week'}
            </h2>
            <p style={{ color: '#444', fontSize: 12, fontWeight: 600, marginTop: 6, marginBottom: 20 }}>
              Be the first — send a gift in a video chat
            </p>
            <button type="button" onClick={() => navigate('/')}
              style={{ padding: '12px 28px', borderRadius: 50, background: '#00D4FF', color: '#0a0a0f', fontWeight: 700, fontSize: 14, fontFamily: SORA, border: 'none', cursor: 'pointer', boxShadow: '0 0 28px rgba(0,212,255,0.32)' }}>
              Start Chatting
            </button>
          </div>
        ) : (
          <>
            {/* Top 3 podium — 2nd, 1st, 3rd; all slots always render */}
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 10 }}>
              <PodiumCard entry={top3[1] || null} place={2} coinsOf={coinsOf} />
              <PodiumCard entry={top3[0] || null} place={1} coinsOf={coinsOf} />
              <PodiumCard entry={top3[2] || null} place={3} coinsOf={coinsOf} />
            </div>

            {/* Divider */}
            <div style={{ borderTop: '1px solid #111122', margin: '1.5rem 0' }} />

            {/* All rankings */}
            <p style={{ color: '#2a2a3e', fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>
              All Rankings
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {leaders.map((u, i) => {
                const rank = i + 1
                const isMe = !!u.isMe
                const numColor = PLACE_COLOR[rank] || '#333'
                const unlocked = GIFTS.filter((g) => (u.giftCollection || []).includes(g.id))
                return (
                  <motion.div
                    key={`${u.username}-${rank}`}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i * 0.025, 0.4), duration: 0.3 }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 14,
                      background: isMe ? 'rgba(0,212,255,0.07)' : '#0d0d1a',
                      border: `${isMe ? '2px' : '1px'} solid ${isMe ? '#00D4FF' : '#1a1a2e'}`,
                      borderBottom: '1px solid #1a1a2e',
                    }}
                  >
                    <span style={{ width: 22, textAlign: 'center', fontWeight: 800, fontSize: 14, color: numColor, flexShrink: 0 }}>{rank}</span>
                    <Avatar url={u.avatarUrl} name={u.username} size={38} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <span style={{ color: '#fff', fontWeight: 700, fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.username}</span>
                        {isMe && <span style={{ color: '#00D4FF', fontSize: 10, fontWeight: 700, flexShrink: 0 }}>(you)</span>}
                      </div>
                      {u.gifterRank && u.gifterRank !== 'Newcomer' && (
                        <p style={{ color: rankColor(u.gifterRank), fontSize: 11, fontWeight: 700, lineHeight: 1.3 }}>{u.gifterRank}</p>
                      )}
                      {unlocked.length > 0 && (
                        <div style={{ display: 'flex', gap: 1, marginTop: 2 }}>
                          {unlocked.map((g) => <GiftIcon key={g.id} id={g.id} size={16} />)}
                        </div>
                      )}
                    </div>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#f59e0b', fontWeight: 800, fontSize: 14, flexShrink: 0 }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#f59e0b' }} />
                      {coinsOf(u).toLocaleString()}
                    </span>
                  </motion.div>
                )
              })}
            </div>

            <HowItWorks />
          </>
        )}
      </div>
      <Footer />
    </div>
  )
}
