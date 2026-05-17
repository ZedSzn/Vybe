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
const PLACE_COLOR = { 1: '#f59e0b', 2: '#cbd5e1', 3: '#d97706' }

// Overlapping pile of all 6 gift boxes with a cyan/purple glow behind it.
function GiftCluster() {
  const pile = [
    { id: 'big-vybe',       size: 46, style: { left: '2%',  bottom: '12%', transform: 'rotate(-22deg)', zIndex: 2 } },
    { id: 'vybe',           size: 44, style: { right: '2%', bottom: '14%', transform: 'rotate(20deg)',  zIndex: 2 } },
    { id: 'ultra-vybe',     size: 58, style: { left: '15%', top: '20%',    transform: 'rotate(-13deg)', zIndex: 3 } },
    { id: 'mega-vybe',      size: 56, style: { right: '13%', top: '18%',   transform: 'rotate(13deg)',  zIndex: 3 } },
    { id: 'small-vybe',     size: 40, style: { left: '50%', bottom: '-2%', transform: 'translateX(-50%) rotate(7deg)', zIndex: 4 } },
    { id: 'legendary-vybe', size: 80, style: { left: '50%', top: '46%',    transform: 'translate(-50%,-50%) rotate(-2deg)', zIndex: 5 } },
  ]
  return (
    <div style={{ position: 'relative', width: 240, height: 130, margin: '0 auto 14px' }}>
      <div style={{ position: 'absolute', left: '50%', top: '52%', width: 200, height: 110, transform: 'translate(-50%,-50%)', borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(0,212,255,0.32) 0%, rgba(124,58,237,0.22) 50%, transparent 72%)', filter: 'blur(26px)', pointerEvents: 'none' }} />
      {pile.map((g) => (
        <div key={g.id} style={{ position: 'absolute', ...g.style }}>
          <GiftIcon id={g.id} size={g.size} />
        </div>
      ))}
    </div>
  )
}

function CrownGold() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="#f59e0b" style={{ filter: 'drop-shadow(0 0 6px rgba(245,158,11,0.6))' }}>
      <path d="M2 8.5 L6.8 12 L12 4 L17.2 12 L22 8.5 L19.8 20 L4.2 20 Z" />
    </svg>
  )
}

function Avatar({ url, name, size, ring }) {
  if (url) {
    return <img src={url} alt="" style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', border: ring ? `2px solid ${ring}` : 'none' }} />
  }
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: 'linear-gradient(135deg, #7C3AED, #00D4FF)', border: ring ? `2px solid ${ring}` : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: size * 0.36 }}>
      {(name || '?').slice(0, 2).toUpperCase()}
    </div>
  )
}

function RankBadge({ rank }) {
  if (!rank || rank === 'Newcomer') return null
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 50, background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.25)', color: '#f59e0b', fontSize: 9, fontWeight: 700, whiteSpace: 'nowrap' }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#f59e0b' }} />{rank}
    </span>
  )
}

function PodiumBlock({ entry, place, isMe }) {
  const c = PLACE_COLOR[place]
  const first = place === 1
  return (
    <div style={{ flex: 1, maxWidth: 132, display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: first ? 2 : 1 }}>
      <div style={{ height: 24, display: 'flex', alignItems: 'flex-end' }}>{first && <CrownGold />}</div>
      <div style={{ position: 'relative', zIndex: 2, marginBottom: -16 }}>
        <Avatar url={entry.avatarUrl} name={entry.username} size={first ? 60 : 50} ring={c} />
        <span style={{ position: 'absolute', bottom: -2, right: -2, width: 20, height: 20, borderRadius: '50%', background: c, color: '#0a0a0f', fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #0a0a0f' }}>{place}</span>
      </div>
      <div style={{ width: '100%', background: '#0d0d18', border: `1px solid ${isMe ? '#00D4FF' : c + '66'}`, borderRadius: 14, padding: `${first ? 30 : 26}px 8px 14px`, textAlign: 'center' }}>
        <p style={{ color: '#fff', fontWeight: 800, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{entry.username}</p>
        <div style={{ display: 'flex', justifyContent: 'center', margin: '4px 0 8px' }}><RankBadge rank={entry.gifterRank} /></div>
        <p style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: c, fontWeight: 800, fontSize: first ? 16 : 14 }}>
          <VybeCoin size={first ? 14 : 12} />{(entry.weeklyCoinsGifted || 0).toLocaleString()}
        </p>
      </div>
    </div>
  )
}

export default function LeaderboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [leaders, setLeaders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    axios.get('/api/leaderboard/gifters')
      .then(({ data }) => setLeaders(data.leaders || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const top3 = leaders.slice(0, 3)
  const rest = leaders.slice(3)
  const meName = user?.username

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', fontFamily: SORA }}>
      <Navbar />
      <div className="relative z-10 max-w-2xl mx-auto px-4 pt-28 pb-24">

        {/* Hero */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <GiftCluster />
          <h1 style={{ fontSize: 32, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', lineHeight: 1.1 }}>Top Gifters</h1>
          <p style={{ color: '#444', fontSize: 13, fontWeight: 600, marginTop: 6 }}>Resets every Monday at midnight</p>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
            <Loader2 size={28} className="animate-spin" style={{ color: '#00D4FF' }} />
          </div>
        ) : leaders.length === 0 ? (
          /* Empty state */
          <div style={{ textAlign: 'center', padding: '20px 0 40px' }}>
            <GiftCluster />
            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#fff', marginTop: 8 }}>No gifts sent yet this week</h2>
            <p style={{ color: '#888899', fontSize: 13, fontWeight: 600, marginTop: 6, marginBottom: 22 }}>Be the first — send a gift in a video chat</p>
            <button onClick={() => navigate('/')}
              style={{ padding: '12px 28px', borderRadius: 50, background: '#00D4FF', color: '#0a0a0f', fontWeight: 800, fontSize: 14, fontFamily: SORA, border: 'none', cursor: 'pointer', boxShadow: '0 0 28px rgba(0,212,255,0.35)' }}>
              Start Chatting
            </button>
          </div>
        ) : (
          <>
            {/* Top 3 podium */}
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 8, marginBottom: 28 }}>
              {top3[1] && <PodiumBlock entry={top3[1]} place={2} isMe={top3[1].username === meName} />}
              {top3[0] && <PodiumBlock entry={top3[0]} place={1} isMe={top3[0].username === meName} />}
              {top3[2] && <PodiumBlock entry={top3[2]} place={3} isMe={top3[2].username === meName} />}
            </div>

            {/* 4th — 50th */}
            {rest.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {rest.map((u, idx) => {
                  const rank = idx + 4
                  const isMe = u.username === meName
                  return (
                    <motion.div
                      key={`${u.username}-${rank}`}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(idx * 0.025, 0.4), duration: 0.3 }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 12,
                        background: isMe ? 'rgba(0,212,255,0.08)' : (idx % 2 === 0 ? '#0d0d18' : '#0b0b14'),
                        border: `1px solid ${isMe ? 'rgba(0,212,255,0.4)' : '#1a1a2e'}`,
                      }}
                    >
                      <span style={{ width: 24, textAlign: 'center', fontWeight: 800, fontSize: 14, color: 'rgba(255,255,255,0.5)', flexShrink: 0 }}>{rank}</span>
                      <Avatar url={u.avatarUrl} name={u.username} size={38} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ color: '#fff', fontWeight: 800, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.username}</span>
                          {isMe && <span style={{ color: '#00D4FF', fontSize: 9, fontWeight: 800 }}>YOU</span>}
                        </div>
                        <div style={{ display: 'flex', gap: 1, marginTop: 3, alignItems: 'center' }}>
                          {GIFTS.filter((g) => (u.giftCollection || []).includes(g.id)).map((g) => (
                            <GiftIcon key={g.id} id={g.id} size={14} />
                          ))}
                          {(u.giftCollection || []).length === 0 && <RankBadge rank={u.gifterRank} />}
                        </div>
                      </div>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#f59e0b', fontWeight: 800, fontSize: 14, flexShrink: 0 }}>
                        <VybeCoin size={12} />{(u.weeklyCoinsGifted || 0).toLocaleString()}
                      </span>
                    </motion.div>
                  )
                })}
              </div>
            )}
          </>
        )}
      </div>
      <Footer />
    </div>
  )
}
