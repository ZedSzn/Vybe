import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Gift, DollarSign, Zap, Star, Users, TrendingUp } from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

const HOW_IT_WORKS = [
  {
    icon: <Users size={22} style={{ color: '#00D4FF' }} />,
    title: 'Start a chat session',
    desc: 'Jump into a video chat like normal. Anyone who joins your session can see you live.',
  },
  {
    icon: <Gift size={22} style={{ color: '#00D4FF' }} />,
    title: 'Viewers send you gifts',
    desc: 'Other users send you virtual gifts — roses, stars, diamonds, and more — each worth real money.',
  },
  {
    icon: <DollarSign size={22} style={{ color: '#00D4FF' }} />,
    title: 'Gifts convert to coins',
    desc: 'Every gift lands in your wallet as Vybe Coins. You can cash out once you hit the minimum threshold.',
  },
  {
    icon: <TrendingUp size={22} style={{ color: '#00D4FF' }} />,
    title: 'Grow your earnings',
    desc: 'The more engaging your sessions, the more gifts you receive. Build a following and earn more over time.',
  },
]

const COMPARE_ROWS = [
  { feature: 'Min. followers to earn',   vybe: '0',        twitch: '50',       tiktok: '1,000',    youtube: '1,000',   vybeWins: true  },
  { feature: 'Revenue share',            vybe: '70%',      twitch: '50%',      tiktok: '50%',      youtube: '55%',     vybeWins: true  },
  { feature: 'Minimum cash out',         vybe: '£5',       twitch: '$100',     tiktok: '$100',     youtube: '$100',    vybeWins: true  },
  { feature: 'Time to cash out',         vybe: '3–5 days', twitch: '45 days',  tiktok: '30 days',  youtube: 'Monthly', vybeWins: true  },
  { feature: 'No application needed',    vybe: true,       twitch: false,      tiktok: false,      youtube: false,     vybeWins: true  },
  { feature: 'Random audience matching', vybe: true,       twitch: false,      tiktok: false,      youtube: false,     vybeWins: true  },
  { feature: 'Free to join',             vybe: true,       twitch: true,       tiktok: true,       youtube: true,      vybeWins: false },
]

const FAQS = [
  {
    q: 'How much is each coin worth?',
    a: 'Every 1,000 Vybe Coins = approximately £4.20 at cashout. You keep 70% of all gift value — the remaining 30% covers platform fees.',
  },
  {
    q: 'When can I cash out?',
    a: 'You can request a payout once your Earn Balance reaches 1,000 coins (≈ £4.20). Payouts are processed within 3–5 business days via PayPal.',
  },
  {
    q: 'Do I need a subscription to earn?',
    a: 'No — earning from gifts is available to all users. Having a VIP badge does help attract more viewers and gifts though.',
  },
  {
    q: 'Are there limits on how much I can earn?',
    a: 'There are no earning caps. Top creators on Vybe earn hundreds of pounds per month from regular sessions.',
  },
]

/* ─── Platform logo SVGs ─── */
const TwitchIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="white">
    <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z"/>
  </svg>
)
const TikTokIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="white">
    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.23 8.23 0 004.83 1.56V6.81a4.85 4.85 0 01-1.06-.12z"/>
  </svg>
)
const YouTubeIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="white">
    <path d="M23.5 6.2a3 3 0 00-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 00.5 6.2 31.2 31.2 0 000 12a31.2 31.2 0 00.5 5.8 3 3 0 002.1 2.1C4.5 20.4 12 20.4 12 20.4s7.5 0 9.4-.5a3 3 0 002.1-2.1A31.2 31.2 0 0024 12a31.2 31.2 0 00-.5-5.8zM9.7 15.5V8.5l6.2 3.5-6.2 3.5z"/>
  </svg>
)

function CompareTable({ onStartEarning }) {
  const [hoveredRow, setHoveredRow] = useState(null)

  const compCell = (val) => {
    if (typeof val === 'boolean') {
      return val
        ? <span style={{ color: 'rgba(255,255,255,0.28)', fontSize: 18, lineHeight: 1 }}>✓</span>
        : (
          <span style={{
            width: 26, height: 26, borderRadius: '50%',
            background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            color: '#f87171', fontSize: 13, fontWeight: 700,
          }}>✗</span>
        )
    }
    return <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>{val}</span>
  }

  return (
    <div style={{
      background: 'rgba(255,255,255,0.02)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
      border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, overflow: 'hidden',
    }}>
      <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <div style={{ minWidth: 620 }}>

          {/* ── Platform header cards ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '195px 1fr 1fr 1fr 1fr', alignItems: 'flex-end', padding: '0 12px' }}>

            {/* empty corner */}
            <div style={{ padding: '24px 0 0' }} />

            {/* Vybe — taller, glowing */}
            <div style={{
              background: 'linear-gradient(160deg, #00C8EE 0%, #00D4FF 60%, #00BCE0 100%)',
              borderRadius: '14px 14px 0 0',
              padding: '18px 10px 16px',
              textAlign: 'center',
              marginTop: -16,
              boxShadow: '0 0 30px rgba(0,212,255,0.45), 0 -6px 20px rgba(0,212,255,0.2)',
              position: 'relative', zIndex: 2,
            }}>
              <span style={{
                display: 'inline-block', fontSize: 9, fontWeight: 900, letterSpacing: '0.12em',
                background: '#0a0a0f', color: '#00D4FF', padding: '3px 8px', borderRadius: 6, marginBottom: 10,
              }}>⭐ BEST CHOICE</span>
              <div style={{ fontWeight: 900, fontSize: 20, color: '#0a0a0f', letterSpacing: '0.12em' }}>VYBE</div>
            </div>

            {/* Twitch */}
            <div style={{ padding: '16px 10px 14px', textAlign: 'center', background: 'rgba(145,70,255,0.07)', borderRadius: '12px 12px 0 0', marginLeft: 4, marginRight: 4 }}>
              <div style={{ width: 30, height: 30, borderRadius: 9, background: '#9146FF', margin: '0 auto 8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <TwitchIcon />
              </div>
              <div style={{ fontWeight: 700, fontSize: 11, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.04em' }}>Twitch</div>
            </div>

            {/* TikTok */}
            <div style={{ padding: '16px 10px 14px', textAlign: 'center', background: 'rgba(255,0,80,0.05)', borderRadius: '12px 12px 0 0', marginLeft: 4, marginRight: 4 }}>
              <div style={{ width: 30, height: 30, borderRadius: 9, background: '#111', border: '1px solid rgba(255,255,255,0.1)', margin: '0 auto 8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <TikTokIcon />
              </div>
              <div style={{ fontWeight: 700, fontSize: 11, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.04em' }}>TikTok Live</div>
            </div>

            {/* YouTube */}
            <div style={{ padding: '16px 10px 14px', textAlign: 'center', background: 'rgba(255,0,0,0.05)', borderRadius: '12px 12px 0 0', marginLeft: 4, marginRight: 4 }}>
              <div style={{ width: 30, height: 30, borderRadius: 9, background: '#FF0000', margin: '0 auto 8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <YouTubeIcon />
              </div>
              <div style={{ fontWeight: 700, fontSize: 11, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.04em' }}>YouTube Live</div>
            </div>
          </div>

          {/* ── Divider ── */}
          <div style={{ height: 1, background: 'rgba(255,255,255,0.07)', margin: '0 12px' }} />

          {/* ── Feature rows ── */}
          {COMPARE_ROWS.map((row, ri) => (
            <div
              key={ri}
              onMouseEnter={() => setHoveredRow(ri)}
              onMouseLeave={() => setHoveredRow(null)}
              style={{
                display: 'grid',
                gridTemplateColumns: '195px 1fr 1fr 1fr 1fr',
                borderBottom: ri < COMPARE_ROWS.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                background: hoveredRow === ri
                  ? 'rgba(0,212,255,0.04)'
                  : ri % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent',
                transition: 'background 0.15s',
                margin: '0 12px',
              }}
            >
              {/* Feature name — sticky on mobile */}
              <div style={{
                padding: '15px 0 15px 4px',
                display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
                position: 'sticky', left: 0, zIndex: 1,
                background: 'inherit',
              }}>
                <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: 600 }}>{row.feature}</span>
                {row.vybeWins && (
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 3,
                    fontSize: 9, fontWeight: 800, letterSpacing: '0.06em',
                    color: '#00D4FF', background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.2)',
                    padding: '2px 7px', borderRadius: 99, flexShrink: 0, whiteSpace: 'nowrap',
                  }}>🏆 Vybe Wins</span>
                )}
              </div>

              {/* Vybe value */}
              <div style={{
                padding: '15px 8px', textAlign: 'center',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderLeft: '2px solid rgba(0,212,255,0.25)',
                background: 'rgba(0,212,255,0.05)',
              }}>
                {typeof row.vybe === 'boolean' && row.vybe ? (
                  <span style={{
                    width: 28, height: 28, borderRadius: '50%',
                    background: 'rgba(74,222,128,0.15)', border: '1px solid rgba(74,222,128,0.3)',
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    color: '#4ade80', fontSize: 14, fontWeight: 800,
                  }}>✓</span>
                ) : (
                  <span style={{ color: '#00D4FF', fontWeight: 900, fontSize: 15 }}>{row.vybe}</span>
                )}
              </div>

              {/* Twitch value */}
              <div style={{ padding: '15px 8px', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {compCell(row.twitch)}
              </div>

              {/* TikTok value */}
              <div style={{ padding: '15px 8px', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {compCell(row.tiktok)}
              </div>

              {/* YouTube value */}
              <div style={{ padding: '15px 8px', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {compCell(row.youtube)}
              </div>
            </div>
          ))}

          {/* ── Bottom banner ── */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(0,212,255,0.13) 0%, rgba(0,184,224,0.1) 100%)',
            borderTop: '1px solid rgba(0,212,255,0.18)',
            padding: '28px 24px', textAlign: 'center',
          }}>
            <p style={{ fontWeight: 900, fontSize: 18, color: 'white', marginBottom: 6, letterSpacing: '-0.02em' }}>
              Vybe wins on 6 out of 7 features
            </p>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 20 }}>
              Join thousands already earning on Vybe
            </p>
            <motion.button
              onClick={onStartEarning}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              style={{
                padding: '13px 32px', borderRadius: 12, border: 'none',
                background: 'linear-gradient(135deg, #00B8E0 0%, #00D4FF 50%, #00B8E0 100%)',
                boxShadow: '0 4px 20px rgba(0,212,255,0.4)',
                color: '#0a0a0f', fontWeight: 900, fontSize: 14, cursor: 'pointer',
              }}
            >
              Start Earning Free
            </motion.button>
          </div>

        </div>
      </div>
    </div>
  )
}

function EarningsCalculator({ onStartEarning }) {
  const [hours, setHours] = useState(2)
  const [gifts, setGifts] = useState(5)

  const monthly = hours * gifts * 15 * 0.7 * (4.20 / 1000) * 30
  const daily = monthly / 30

  const sliderTrack = (val, min, max) => {
    const pct = ((val - min) / (max - min)) * 100
    return {
      appearance: 'none', WebkitAppearance: 'none',
      width: '100%', height: 6, borderRadius: 99, outline: 'none', cursor: 'pointer',
      background: `linear-gradient(to right, #00D4FF 0%, #00D4FF ${pct}%, rgba(255,255,255,0.1) ${pct}%, rgba(255,255,255,0.1) 100%)`,
    }
  }

  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
      border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 28,
      boxShadow: '0 0 40px rgba(0,212,255,0.04)',
    }}>
      <style>{`
        input[type=range].calc-slider::-webkit-slider-thumb {
          -webkit-appearance: none; appearance: none;
          width: 20px; height: 20px; border-radius: 50%;
          background: #00D4FF; cursor: pointer;
          box-shadow: 0 0 0 3px rgba(0,212,255,0.25);
        }
        input[type=range].calc-slider::-moz-range-thumb {
          width: 20px; height: 20px; border-radius: 50%; border: none;
          background: #00D4FF; cursor: pointer;
        }
      `}</style>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* Slider 1 */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
            <label style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.6)' }}>Hours chatting per day</label>
            <span style={{ fontSize: 14, fontWeight: 900, color: '#00D4FF', background: 'rgba(0,212,255,0.12)', padding: '2px 10px', borderRadius: 8 }}>{hours}h</span>
          </div>
          <input
            type="range" min={1} max={8} value={hours} onChange={e => setHours(Number(e.target.value))}
            className="calc-slider" style={sliderTrack(hours, 1, 8)}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 10, color: 'rgba(255,255,255,0.2)' }}>
            <span>1h</span><span>8h</span>
          </div>
        </div>

        {/* Slider 2 */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
            <label style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.6)' }}>Gifts received per hour</label>
            <span style={{ fontSize: 14, fontWeight: 900, color: '#00D4FF', background: 'rgba(0,212,255,0.12)', padding: '2px 10px', borderRadius: 8 }}>{gifts}</span>
          </div>
          <input
            type="range" min={1} max={20} value={gifts} onChange={e => setGifts(Number(e.target.value))}
            className="calc-slider" style={sliderTrack(gifts, 1, 20)}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 10, color: 'rgba(255,255,255,0.2)' }}>
            <span>1</span><span>20</span>
          </div>
        </div>

        {/* Result */}
        <div style={{
          background: 'rgba(0,212,255,0.06)', border: '1px solid rgba(0,212,255,0.15)',
          borderRadius: 14, padding: '20px 24px', textAlign: 'center',
        }}>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>
            Daily: <span style={{ color: 'rgba(255,255,255,0.7)', fontWeight: 700 }}>£{daily.toFixed(2)}</span>
          </p>
          <motion.p
            key={monthly.toFixed(2)}
            initial={{ scale: 0.95, opacity: 0.6 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.15 }}
            style={{
              fontSize: 38, fontWeight: 900, letterSpacing: '-0.03em',
              background: 'linear-gradient(120deg, #00D4FF, #00B8E0)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              filter: 'drop-shadow(0 0 16px rgba(0,212,255,0.4))',
              margin: '4px 0 2px',
            }}
          >
            £{monthly.toFixed(2)}
          </motion.p>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 0 }}>per month</p>
          <p style={{ fontSize: 12, color: 'rgba(0,212,255,0.55)', fontWeight: 600, marginTop: 8 }}>
            Top Vybers earn £200+ per month
          </p>
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', marginTop: 6 }}>
            Based on average gift values. Results may vary.
          </p>
        </div>

        <motion.button
          onClick={onStartEarning}
          whileHover={{ scale: 1.012 }}
          whileTap={{ scale: 0.985 }}
          style={{
            width: '100%', padding: '14px 0', borderRadius: 14, border: 'none',
            background: 'linear-gradient(135deg, #00B8E0 0%, #00D4FF 50%, #00B8E0 100%)',
            boxShadow: '0 4px 24px rgba(0,212,255,0.35)',
            color: '#0a0a0f', fontWeight: 900, fontSize: 14, cursor: 'pointer',
          }}
        >
          Start Earning This Much
        </motion.button>
      </div>
    </div>
  )
}

export default function EarnPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen" style={{ background: '#0a0a0f', fontFamily: 'inherit' }}>
      {/* Ambient */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>
        <div className="absolute" style={{ top: '-5%', left: '15%', width: '600px', height: '600px', background: 'radial-gradient(ellipse at 50% 50%, rgba(0,212,255,0.07) 0%, transparent 65%)' }} />
        <div className="absolute" style={{ bottom: '10%', right: '-5%', width: '500px', height: '500px', background: 'radial-gradient(ellipse at 50% 50%, rgba(0,212,255,0.06) 0%, transparent 65%)' }} />
      </div>

      <Navbar />

      <div className="relative z-10 max-w-3xl mx-auto px-4 pt-28 pb-24">

        {/* Back */}
        <button
          onClick={() => navigate('/')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: 'rgba(255,255,255,0.35)', fontSize: 13, fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', marginBottom: 40, transition: 'color 0.2s' }}
          onMouseEnter={e => e.currentTarget.style.color = 'white'}
          onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.35)'}
        >
          <ArrowLeft size={15} />
          Back to Vybe
        </button>

        {/* Hero */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }} style={{ textAlign: 'center', marginBottom: 56 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '4px 14px', borderRadius: 999, fontSize: 11, fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 24, background: 'rgba(0,212,255,0.12)', color: 'rgba(0,212,255,0.9)', border: '1px solid rgba(0,212,255,0.2)' }}>
            <Zap size={11} /> Earn on Vybe
          </div>
          <h1 style={{ fontSize: 'clamp(32px,5vw,46px)', fontWeight: 900, color: 'white', lineHeight: 1.1, marginBottom: 16, letterSpacing: '-0.03em' }}>
            Get paid to<br />
            <span style={{ background: 'linear-gradient(90deg,#00D4FF,#00B8E0)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>live chat</span>
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 15, lineHeight: 1.7, maxWidth: 440, margin: '0 auto' }}>
            When you chat on Vybe, viewers can send you gifts — each one converts into real money in your wallet.
          </p>
        </motion.div>

        {/* How it works */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.1 }} style={{ marginBottom: 48 }}>
          <h2 style={{ color: 'white', fontWeight: 900, fontSize: 20, marginBottom: 20 }}>How it works</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }}>
            {HOW_IT_WORKS.map((step, i) => (
              <div key={i} style={{ padding: 20, borderRadius: 16, display: 'flex', gap: 16, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.18)' }}>
                  {step.icon}
                </div>
                <div>
                  <p style={{ color: 'white', fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{step.title}</p>
                  <p style={{ color: 'rgba(255,255,255,0.38)', fontSize: 13, lineHeight: 1.6 }}>{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Coins callout */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.18 }}
          style={{ borderRadius: 16, padding: 24, marginBottom: 48, textAlign: 'center', background: 'linear-gradient(135deg, rgba(0,212,255,0.12) 0%, rgba(0,184,224,0.1) 100%)', border: '1px solid rgba(0,212,255,0.18)' }}
        >
          <Star size={24} style={{ color: '#00D4FF', margin: '0 auto 10px' }} />
          <p style={{ color: 'white', fontWeight: 900, fontSize: 18, marginBottom: 6 }}>1,000 coins ≈ £4.20</p>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>You keep <span style={{ color: 'white', fontWeight: 700 }}>70%</span> of every gift. No caps. Cash out any time you hit 1,000 coins (≈ £4.20).</p>
        </motion.div>

        {/* Comparison table */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.24 }} style={{ marginBottom: 48 }}>
          <h2 style={{ color: 'white', fontWeight: 900, fontSize: 20, marginBottom: 6 }}>Why creators choose Vybe</h2>
          <p style={{ color: 'rgba(255,255,255,0.38)', fontSize: 14, marginBottom: 20 }}>Compare us to the big platforms</p>
          <CompareTable onStartEarning={() => navigate('/chat')} />
        </motion.div>

        {/* Earnings calculator */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.3 }} style={{ marginBottom: 48 }}>
          <h2 style={{ color: 'white', fontWeight: 900, fontSize: 20, marginBottom: 6 }}>Estimate your earnings</h2>
          <p style={{ color: 'rgba(255,255,255,0.38)', fontSize: 14, marginBottom: 20 }}>See how much you could make on Vybe</p>
          <EarningsCalculator onStartEarning={() => navigate('/chat')} />
        </motion.div>

        {/* FAQ */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.36 }} style={{ marginBottom: 48 }}>
          <h2 style={{ color: 'white', fontWeight: 900, fontSize: 20, marginBottom: 20 }}>Common questions</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {FAQS.map((item, i) => (
              <div key={i} style={{ padding: 20, borderRadius: 14, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <p style={{ color: 'white', fontWeight: 700, fontSize: 14, marginBottom: 6 }}>{item.q}</p>
                <p style={{ color: 'rgba(255,255,255,0.38)', fontSize: 13, lineHeight: 1.65 }}>{item.a}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.42 }} style={{ textAlign: 'center' }}>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 14, marginBottom: 16 }}>Ready to start earning?</p>
          <motion.button
            onClick={() => navigate('/chat')}
            whileHover={{ scale: 1.012 }}
            whileTap={{ scale: 0.985 }}
            style={{
              padding: '14px 36px', borderRadius: 14, border: 'none',
              background: 'linear-gradient(135deg, #00B8E0 0%, #00D4FF 50%, #00B8E0 100%)',
              boxShadow: '0 4px 24px rgba(0,212,255,0.35)',
              color: '#0a0a0f', fontWeight: 900, fontSize: 14, cursor: 'pointer',
            }}
          >
            Start Chatting &amp; Earning
          </motion.button>
        </motion.div>

      </div>

      <Footer />
    </div>
  )
}
