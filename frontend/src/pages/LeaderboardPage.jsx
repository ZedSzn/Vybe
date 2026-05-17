import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import axios from 'axios'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { GiftIcon, GIFTS } from '../components/GiftIcon'
import { useAuth } from '../context/AuthContext'

const SORA = "'Sora', system-ui, sans-serif"
const PLACE_COLOR = { 1: '#f59e0b', 2: '#aaa', 3: '#cd7f32' }

// Floating sparkle particles scattered around the hero.
const SPARKLES = [
  { left: '8%',  top: '12%', size: 4, color: '#00D4FF', opacity: 0.7 },
  { left: '18%', top: '38%', size: 3, color: '#7C3AED', opacity: 0.5 },
  { left: '12%', top: '64%', size: 5, color: '#f59e0b', opacity: 0.6 },
  { left: '30%', top: '8%',  size: 3, color: '#f59e0b', opacity: 0.45 },
  { left: '42%', top: '30%', size: 4, color: '#00D4FF', opacity: 0.55 },
  { left: '50%', top: '6%',  size: 3, color: '#7C3AED', opacity: 0.6 },
  { left: '62%', top: '26%', size: 4, color: '#f59e0b', opacity: 0.5 },
  { left: '72%', top: '10%', size: 3, color: '#00D4FF', opacity: 0.65 },
  { left: '84%', top: '34%', size: 5, color: '#7C3AED', opacity: 0.5 },
  { left: '90%', top: '60%', size: 4, color: '#00D4FF', opacity: 0.6 },
  { left: '80%', top: '70%', size: 3, color: '#f59e0b', opacity: 0.55 },
  { left: '6%',  top: '88%', size: 3, color: '#7C3AED', opacity: 0.45 },
]

// 5 gift boxes packed tightly into a bundle, biggest one centred at the front.
function GiftBundle() {
  const items = [
    { id: 'small-vybe',     size: 48, rot: -28, z: 1, left: '-14px', bottom: '16px' },
    { id: 'vybe',           size: 48, rot: 28,  z: 1, right: '-14px', bottom: '16px' },
    { id: 'big-vybe',       size: 40, rot: 0,   z: 2, center: true,   bottom: '65px' },
    { id: 'mega-vybe',      size: 66, rot: -10, z: 3, left: '-4px',   bottom: '0' },
    { id: 'ultra-vybe',     size: 66, rot: 10,  z: 3, right: '-4px',  bottom: '0' },
    { id: 'legendary-vybe', size: 86, rot: 0,   z: 5, center: true,   bottom: '0' },
  ]
  return (
    <div style={{ position: 'relative', width: 260, height: 130, margin: '0 auto 16px', maxWidth: '92%' }}>
      <div style={{ position: 'absolute', left: '50%', bottom: 6, width: 200, height: 90, transform: 'translateX(-50%)', borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(0,212,255,0.28) 0%, rgba(124,58,237,0.18) 50%, transparent 72%)', filter: 'blur(26px)', pointerEvents: 'none' }} />
      {items.map((g, i) => {
        const pos = g.center
          ? { left: '50%', bottom: g.bottom, transform: `translateX(-50%) rotate(${g.rot}deg)` }
          : { left: g.left, right: g.right, bottom: g.bottom, transform: `rotate(${g.rot}deg)` }
        return (
          <div key={i} style={{ position: 'absolute', zIndex: g.z, ...pos }}>
            <GiftIcon id={g.id} size={g.size} />
          </div>
        )
      })}
    </div>
  )
}

function Avatar({ url, name, size, ring }) {
  if (url) return <img src={url} alt="" style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', border: ring ? `2px solid ${ring}` : 'none', flexShrink: 0 }} />
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', flexShrink: 0, background: 'linear-gradient(135deg, #7C3AED, #00D4FF)', border: ring ? `2px solid ${ring}` : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: size * 0.36 }}>
      {(name || '?').slice(0, 2).toUpperCase()}
    </div>
  )
}

// Gifter rank → accent colour.
function rankColorFor(rank) {
  if (!rank) return '#444'
  if (rank.includes('Legend')) return '#f59e0b'
  if (rank.includes('Elite'))  return '#00D4FF'
  if (rank.includes('Ultra'))  return '#7C3AED'
  return '#444'
}

export default function LeaderboardPage() {
  const { user } = useAuth()
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
  const isMine  = (u) => u.isMe || (user?.username && u.username === user.username)
  const ranked  = [...leaders].sort((a, b) => coinsOf(b) - coinsOf(a))
  const top3    = ranked.slice(0, 3)

  return (
    <div style={{ minHeight: '100vh', background: '#070712', fontFamily: SORA, display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <div className="relative z-10 max-w-2xl mx-auto px-4 pt-28 pb-24" style={{ flex: 1, width: '100%' }}>

        {/* Hero */}
        <div style={{ position: 'relative', textAlign: 'center', marginBottom: 24 }}>
          <div style={{ position: 'absolute', inset: '-40px -20px 0', background: 'radial-gradient(ellipse at 50% 60%, rgba(124,58,237,0.18) 0%, rgba(0,212,255,0.08) 40%, transparent 70%)', pointerEvents: 'none' }} />
          {SPARKLES.map((s, i) => (
            <div key={i} style={{ position: 'absolute', left: s.left, top: s.top, width: s.size, height: s.size, borderRadius: '50%', background: s.color, opacity: s.opacity, boxShadow: `0 0 ${s.size * 2}px ${s.color}`, pointerEvents: 'none' }} />
          ))}
          <div style={{ position: 'relative' }}>
            <GiftBundle />
            <h1 style={{ fontSize: 30, fontWeight: 800, color: '#fff', letterSpacing: '-0.5px', lineHeight: 1.1 }}>Top Gifters</h1>
            <p style={{ color: '#444', fontSize: 12, fontWeight: 600, marginTop: 5 }}>Resets every Monday at midnight</p>
          </div>
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
        ) : ranked.length === 0 ? (
          /* Empty state */
          <div style={{ textAlign: 'center', padding: '8px 0 48px' }}>
            <GiftBundle />
            <h2 style={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>
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
            {/* Top 3 podium */}
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 8, marginBottom: 28 }}>
              {[[top3[1], 2], [top3[0], 1], [top3[2], 3]].map(([e, place]) => {
                if (!e) return <div key={place} style={{ flex: place === 1 ? 1.2 : 1, maxWidth: 140 }} />
                const c = PLACE_COLOR[place]
                const first = place === 1
                const avatarSize = place === 1 ? 62 : place === 2 ? 52 : 46
                const padTop = place === 1 ? 22 : place === 2 ? 14 : 8
                const badgeBg = place === 1 ? 'rgba(245,158,11,0.2)' : place === 2 ? 'rgba(170,170,170,0.15)' : 'rgba(205,127,50,0.15)'
                return (
                  <div key={place} style={{ flex: first ? 1.2 : 1, maxWidth: 140, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    {first && <div style={{ fontSize: 24, lineHeight: 1, marginBottom: 4 }}>👑</div>}
                    <div style={{ position: 'relative', width: '100%', background: '#0d0d1a', borderRadius: 16, border: `1.5px solid ${c}`, padding: `${padTop}px 10px 14px`, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div style={{ position: 'absolute', top: 8, left: 8, width: 20, height: 20, borderRadius: 7, background: badgeBg, color: c, fontWeight: 800, fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {place}
                      </div>
                      <Avatar url={e.avatarUrl} name={e.username} size={avatarSize} ring={c} />
                      <p style={{ color: '#fff', fontWeight: 800, fontSize: 12, marginTop: 8, maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {e.username}{isMine(e) ? ' (you)' : ''}
                      </p>
                      <p style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#f59e0b', fontWeight: 800, fontSize: 13, marginTop: 4 }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: c }} />
                        {coinsOf(e).toLocaleString()}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Full rankings list */}
            <p style={{ color: '#2a2a3e', fontSize: 10, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>All Rankings</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {ranked.map((u, i) => {
                const rank = i + 1
                const me = isMine(u)
                const numColor = PLACE_COLOR[rank] || '#333'
                const gRankColor = rankColorFor(u.gifterRank)
                const unlocked = GIFTS.filter((g) => (u.giftCollection || []).includes(g.id))
                return (
                  <motion.div
                    key={`${u.username}-${rank}`}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i * 0.025, 0.4), duration: 0.3 }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 14,
                      background: me ? 'rgba(0,212,255,0.04)' : '#0d0d1a',
                      border: `1px solid ${me ? 'rgba(0,212,255,0.35)' : '#1a1a2e'}`,
                    }}
                  >
                    <span style={{ width: 22, textAlign: 'center', fontWeight: 800, fontSize: 14, color: numColor, flexShrink: 0 }}>{rank}</span>
                    <Avatar url={u.avatarUrl} name={u.username} size={38} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <span style={{ color: '#fff', fontWeight: 700, fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.username}</span>
                        {me && <span style={{ color: '#00D4FF', fontSize: 9, fontWeight: 700, flexShrink: 0 }}>(you)</span>}
                      </div>
                      {u.gifterRank && u.gifterRank !== 'Newcomer' && (
                        <p style={{ color: gRankColor, fontSize: 10, fontWeight: 700, lineHeight: 1.3 }}>{u.gifterRank}</p>
                      )}
                      {unlocked.length > 0 && (
                        <div style={{ display: 'flex', gap: 1, marginTop: 2 }}>
                          {unlocked.map((g) => <GiftIcon key={g.id} id={g.id} size={13} />)}
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
          </>
        )}
      </div>
      <Footer />
    </div>
  )
}
