import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Loader2, Trophy } from 'lucide-react'
import axios from 'axios'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import VybeCoin from '../components/VybeCoin'
import { GiftIcon, GIFTS } from '../components/GiftIcon'

const SORA = "'Sora', system-ui, sans-serif"
const rankColor = (i) => (i === 0 ? '#f59e0b' : i === 1 ? '#cbd5e1' : i === 2 ? '#d97706' : 'rgba(255,255,255,0.55)')

export default function LeaderboardPage() {
  const navigate = useNavigate()
  const [leaders, setLeaders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    axios.get('/api/leaderboard/gifters')
      .then(({ data }) => setLeaders(data.leaders || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen" style={{ background: '#0a0a0f', fontFamily: SORA }}>
      <Navbar />
      <div className="relative z-10 max-w-2xl mx-auto px-4 pt-28 pb-24">
        <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-sm mb-6" style={{ color: '#888899' }}>
          <ArrowLeft size={15} /> Back
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.25)' }}>
            <Trophy size={22} style={{ color: '#f59e0b' }} />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">Top Gifters This Week</h1>
            <p className="text-sm" style={{ color: '#888899' }}>Resets every Monday</p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-24">
            <Loader2 size={28} className="animate-spin" style={{ color: '#00D4FF' }} />
          </div>
        ) : leaders.length === 0 ? (
          <div className="text-center py-20">
            <p style={{ fontSize: 48, marginBottom: 14 }}>🎁</p>
            <p className="text-white font-extrabold text-lg mb-1">No gifts sent yet this week</p>
            <p className="text-sm" style={{ color: '#888899' }}>Be the first — send a gift in a video chat.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {leaders.map((u, i) => {
              const top3 = i < 3
              return (
                <motion.div
                  key={`${u.username}-${i}`}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.03, 0.4), duration: 0.35 }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 12,
                    background: top3 ? 'rgba(245,158,11,0.06)' : '#0d0d18',
                    border: `1px solid ${top3 ? 'rgba(245,158,11,0.2)' : '#1a1a2e'}`,
                  }}
                >
                  {/* Rank */}
                  <span style={{ width: 26, textAlign: 'center', fontWeight: 800, fontSize: 16, color: rankColor(i), flexShrink: 0 }}>
                    {i + 1}
                  </span>

                  {/* Avatar */}
                  {u.avatarUrl ? (
                    <img src={u.avatarUrl} alt="" style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                  ) : (
                    <div style={{ width: 40, height: 40, borderRadius: '50%', flexShrink: 0, background: 'linear-gradient(135deg, #7C3AED, #00D4FF)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 14 }}>
                      {(u.username || '?').slice(0, 2).toUpperCase()}
                    </div>
                  )}

                  {/* Name + rank badge + unlocked gifts */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="flex items-center gap-2">
                      <span className="text-white font-extrabold text-sm truncate">{u.username}</span>
                      {u.gifterRank && u.gifterRank !== 'Newcomer' && (
                        <span style={{ padding: '1px 7px', borderRadius: 50, background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.25)', color: '#f59e0b', fontSize: 9, fontWeight: 700, flexShrink: 0, whiteSpace: 'nowrap' }}>
                          {u.gifterRank}
                        </span>
                      )}
                    </div>
                    <div className="flex gap-1 mt-1">
                      {GIFTS.filter((g) => (u.giftCollection || []).includes(g.id)).map((g) => (
                        <GiftIcon key={g.id} id={g.id} size={14} />
                      ))}
                    </div>
                  </div>

                  {/* Weekly coins gifted */}
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#f59e0b', fontWeight: 800, fontSize: 14, flexShrink: 0 }}>
                    <VybeCoin size={13} />{(u.weeklyCoinsGifted || 0).toLocaleString()}
                  </span>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
      <Footer />
    </div>
  )
}
