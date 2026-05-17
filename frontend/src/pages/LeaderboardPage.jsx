import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import axios from 'axios'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import VybeCoin from '../components/VybeCoin'
import { GiftIcon, GIFTS } from '../components/GiftIcon'
import { useAuth } from '../context/AuthContext'

const SORA = "'Sora', system-ui, sans-serif"
const PLACE_COLOR = { 1: '#f59e0b', 2: '#aaa', 3: '#cd7f32' }

// A pile of the 6 gift boxes (Small Vybe twice) with a cyan/purple glow.
function GiftCluster() {
  const items = [
    { id: 'small-vybe',     size: 36, left: '5%',  top: '42%', rot: -30, z: 2 },
    { id: 'small-vybe',     size: 36, left: '95%', top: '42%', rot: 30,  z: 2 },
    { id: 'big-vybe',       size: 38, left: '18%', top: '57%', rot: -22, z: 3 },
    { id: 'vybe',           size: 38, left: '82%', top: '57%', rot: 22,  z: 3 },
    { id: 'ultra-vybe',     size: 50, left: '33%', top: '55%', rot: -11, z: 4 },
    { id: 'mega-vybe',      size: 50, left: '67%', top: '55%', rot: 11,  z: 4 },
    { id: 'legendary-vybe', size: 70, left: '50%', top: '50%', rot: -3,  z: 5 },
  ]
  return (
    <div style={{ position: 'relative', width: 300, height: 124, margin: '0 auto 14px', maxWidth: '92%' }}>
      <div style={{ position: 'absolute', left: '50%', top: '52%', width: 230, height: 100, transform: 'translate(-50%,-50%)', borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(0,212,255,0.3) 0%, rgba(124,58,237,0.2) 50%, transparent 73%)', filter: 'blur(28px)', pointerEvents: 'none' }} />
      {items.map((g, i) => (
        <div key={i} style={{ position: 'absolute', left: g.left, top: g.top, transform: `translate(-50%,-50%) rotate(${g.rot}deg)`, zIndex: g.z }}>
          <GiftIcon id={g.id} size={g.size} />
        </div>
      ))}
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

export default function LeaderboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [leaders, setLeaders] = useState([])
  const [loading, setLoading] = useState(true)
  const [period,  setPeriod]  = useState('weekly')
  const meName = user?.username

  useEffect(() => {
    axios.get(`/api/leaderboard/gifters?period=${period}`)
      .then(({ data }) => setLeaders(data.leaders || []))
      .catch(() => setLeaders([]))
      .finally(() => setLoading(false))
  }, [period])

  const coinsOf = (u) => (period === 'alltime' ? u.totalCoinsGifted : u.weeklyCoinsGifted) || 0
  const top3 = leaders.slice(0, 3)

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', fontFamily: SORA, display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <div className="relative z-10 max-w-2xl mx-auto px-4 pt-28 pb-24" style={{ flex: 1, width: '100%' }}>

        {/* Hero */}
        <div style={{ textAlign: 'center', marginBottom: 22 }}>
          <GiftCluster />
          <h1 style={{ fontSize: 28, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', lineHeight: 1.1 }}>Top Gifters</h1>
          <p style={{ color: '#444', fontSize: 12, fontWeight: 600, marginTop: 5 }}>Resets every Monday at midnight</p>
        </div>

        {/* Week toggle */}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 26 }}>
          {[['weekly', 'This Week'], ['alltime', 'All Time']].map(([val, label]) => {
            const active = period === val
            return (
              <button key={val} type="button" onClick={() => setPeriod(val)}
                style={{ padding: '7px 20px', borderRadius: 50, fontSize: 12, fontWeight: 700, fontFamily: SORA, cursor: 'pointer',
                  background: active ? 'rgba(0,212,255,0.1)' : '#0d0d18',
                  border: `1px solid ${active ? '#00D4FF' : '#1a1a2e'}`,
                  color: active ? '#00D4FF' : '#555' }}>
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
          <div style={{ textAlign: 'center', padding: '24px 0 48px' }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>
              {period === 'alltime' ? 'No gifts sent yet' : 'No gifts sent yet this week'}
            </h2>
            <p style={{ color: '#888899', fontSize: 12, fontWeight: 600, marginTop: 6, marginBottom: 20 }}>
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
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 8, marginBottom: 24 }}>
              {[[top3[1], 2], [top3[0], 1], [top3[2], 3]].map(([e, place]) => {
                if (!e) return <div key={place} style={{ flex: 1, maxWidth: 130 }} />
                const c = PLACE_COLOR[place]
                const first = place === 1
                const blockH = place === 1 ? 70 : place === 2 ? 50 : 36
                return (
                  <div key={place} style={{ flex: 1, maxWidth: 130, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    {first && <div style={{ fontSize: 22, lineHeight: 1, marginBottom: 2 }}>👑</div>}
                    <Avatar url={e.avatarUrl} name={e.username} size={first ? 56 : 46} ring={c} />
                    <p style={{ color: '#fff', fontWeight: 800, fontSize: 12, marginTop: 6, maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {e.username}{e.username === meName ? ' (you)' : ''}
                    </p>
                    <p style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#f59e0b', fontWeight: 800, fontSize: 13, margin: '3px 0 7px' }}>
                      <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#f59e0b' }} />
                      {coinsOf(e).toLocaleString()}
                    </p>
                    <div style={{ width: '100%', height: blockH, background: '#0d0d18', borderRadius: '12px 12px 0 0', borderTop: `2px solid ${c}`, borderLeft: `1px solid ${c}55`, borderRight: `1px solid ${c}55`, display: 'flex', justifyContent: 'center', paddingTop: 6, color: c, fontWeight: 800, fontSize: 18 }}>
                      {place}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Full rankings list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {leaders.map((u, i) => {
                const rank = i + 1
                const isMe = u.username === meName
                const rankColor = PLACE_COLOR[rank] || '#444'
                const unlocked = GIFTS.filter((g) => (u.giftCollection || []).includes(g.id))
                return (
                  <motion.div
                    key={`${u.username}-${rank}`}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i * 0.025, 0.4), duration: 0.3 }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 12,
                      background: isMe ? 'rgba(0,212,255,0.04)' : '#0d0d18',
                      border: `1px solid ${isMe ? 'rgba(0,212,255,0.3)' : '#1a1a2e'}`,
                    }}
                  >
                    <span style={{ width: 22, textAlign: 'center', fontWeight: 800, fontSize: 14, color: rankColor, flexShrink: 0 }}>{rank}</span>
                    <Avatar url={u.avatarUrl} name={u.username} size={36} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <span style={{ color: '#fff', fontWeight: 700, fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.username}</span>
                        {isMe && <span style={{ color: '#00D4FF', fontSize: 10, fontWeight: 700, flexShrink: 0 }}>(you)</span>}
                      </div>
                      {u.gifterRank && u.gifterRank !== 'Newcomer' && (
                        <p style={{ color: '#f59e0b', fontSize: 10, fontWeight: 700, lineHeight: 1.3 }}>{u.gifterRank}</p>
                      )}
                      {unlocked.length > 0 && (
                        <div style={{ display: 'flex', gap: 1, marginTop: 2 }}>
                          {unlocked.map((g) => <GiftIcon key={g.id} id={g.id} size={14} />)}
                        </div>
                      )}
                    </div>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#f59e0b', fontWeight: 800, fontSize: 14, flexShrink: 0 }}>
                      <VybeCoin size={12} />{coinsOf(u).toLocaleString()}
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
