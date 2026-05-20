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
    desc: 'Other users send you Vybe Coins during your chat. Every coin you receive converts directly into real money you can withdraw.',
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
  { feature: 'Min. followers to earn',   vybe: '0',        twitch: '25',       tiktok: '10,000',   youtube: '1,000',   vybeWins: true  },
  { feature: 'Revenue share',            vybe: '70%',      twitch: '50%',      tiktok: '50%',      youtube: '55%',     vybeWins: true  },
  { feature: 'Minimum cash out',         vybe: '£4.20',    twitch: '$100',     tiktok: '$100',     youtube: '$100',    vybeWins: true  },
  { feature: 'Time to cash out',         vybe: '3–5 days', twitch: '45 days',  tiktok: '30 days',  youtube: 'Monthly', vybeWins: true  },
  { feature: 'No application needed',    vybe: true,       twitch: false,      tiktok: false,      youtube: false,     vybeWins: true  },
  { feature: 'Random audience matching', vybe: true,       twitch: false,      tiktok: false,      youtube: false,     vybeWins: true  },
  { feature: 'Free to join',             vybe: true,       twitch: true,       tiktok: true,       youtube: true,      vybeWins: false },
]

const FAQS = [
  {
    q: 'How much is each coin worth?',
    a: 'Every 1,000 Vybe Coins = £4.20 when you cash out. That is your rate after a 30% platform fee — no caps and no other deductions.',
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

function CompareTable({ onStartEarning }) {
  const [hoveredRow, setHoveredRow] = useState(null)

  const renderVal = (val, isVybe) => {
    if (typeof val === 'boolean') {
      return val
        ? <span style={{ color: isVybe ? '#00D4FF' : '#444455', fontSize: 16 }}>✓</span>
        : <span style={{ color: '#444455', fontSize: 16 }}>✗</span>
    }
    return val
  }

  const headerCell = { padding: '20px 16px', height: 80, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 7 }

  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 20, overflow: 'hidden',
    }}>
      <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <div style={{ minWidth: 560 }}>

          {/* Header row */}
          <div style={{
            display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr',
            background: 'rgba(255,255,255,0.05)',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
          }}>
            {/* Feature label column — empty */}
            <div style={{ padding: '20px 16px', height: 80 }} />

            {/* Vybe */}
            <div style={{ ...headerCell, background: '#00D4FF' }}>
              <img src="/favicon.svg" alt="Vybe" style={{ width: 32, height: 32, borderRadius: 8 }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: 'white', letterSpacing: '0.06em' }}>Best</span>
            </div>

            {/* Twitch */}
            <div style={{ ...headerCell, background: 'rgba(255,255,255,0.02)' }}>
              <svg viewBox="0 0 24 24" fill="#9146FF" width="32" height="32">
                <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z"/>
              </svg>
              <span style={{ fontSize: 11, fontWeight: 600, color: '#666677' }}>Twitch</span>
            </div>

            {/* TikTok */}
            <div style={{ ...headerCell, background: 'rgba(255,255,255,0.02)' }}>
              <svg viewBox="0 0 24 24" width="32" height="32">
                <path fill="white" d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.19 8.19 0 004.79 1.52V6.75a4.85 4.85 0 01-1.02-.06z"/>
              </svg>
              <span style={{ fontSize: 11, fontWeight: 600, color: '#666677' }}>TikTok</span>
            </div>

            {/* YouTube */}
            <div style={{ ...headerCell, background: 'rgba(255,255,255,0.02)' }}>
              <svg viewBox="0 0 24 24" width="32" height="32">
                <path fill="#FF0000" d="M23.495 6.205a3.007 3.007 0 00-2.088-2.088c-1.87-.501-9.396-.501-9.396-.501s-7.507-.01-9.396.501A3.007 3.007 0 00.527 6.205a31.247 31.247 0 00-.522 5.805 31.247 31.247 0 00.522 5.783 3.007 3.007 0 002.088 2.088c1.868.502 9.396.502 9.396.502s7.506 0 9.396-.502a3.007 3.007 0 002.088-2.088 31.247 31.247 0 00.5-5.783 31.247 31.247 0 00-.5-5.805zM9.609 15.601V8.408l6.264 3.602z"/>
              </svg>
              <span style={{ fontSize: 11, fontWeight: 600, color: '#666677' }}>YouTube</span>
            </div>
          </div>

          {/* Feature rows */}
          {COMPARE_ROWS.map((row, ri) => (
            <div
              key={ri}
              onMouseEnter={() => setHoveredRow(ri)}
              onMouseLeave={() => setHoveredRow(null)}
              style={{
                display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr',
                borderBottom: ri < COMPARE_ROWS.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                background: hoveredRow === ri ? 'rgba(255,255,255,0.02)' : 'transparent',
                transition: 'background 0.15s',
                minHeight: 56,
              }}
            >
              {/* Feature name */}
              <div style={{
                padding: '0 16px', display: 'flex', alignItems: 'center',
                position: 'sticky', left: 0, background: hoveredRow === ri ? 'rgba(18,18,28,1)' : 'rgba(13,13,24,1)',
                transition: 'background 0.15s', zIndex: 1,
              }}>
                <span style={{ color: '#ffffff', fontSize: 14, fontWeight: 500 }}>{row.feature}</span>
              </div>

              {/* Vybe value */}
              <div style={{
                padding: '0 16px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'rgba(0,212,255,0.04)',
                color: '#00D4FF', fontWeight: 700, fontSize: 14,
              }}>
                {renderVal(row.vybe, true)}
              </div>

              {/* Twitch, TikTok, YouTube */}
              {['twitch', 'tiktok', 'youtube'].map(key => (
                <div key={key} style={{
                  padding: '0 16px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#555566', fontSize: 14,
                }}>
                  {renderVal(row[key], false)}
                </div>
              ))}
            </div>
          ))}

        </div>
      </div>

      {/* Bottom banner — kept outside the horizontal-scroll container so it
          spans the viewport width and never clips on mobile */}
      <div style={{
        background: 'rgba(0,212,255,0.06)',
        borderTop: '1px solid rgba(0,212,255,0.15)',
        padding: '24px', textAlign: 'center',
      }}>
        <p style={{ fontWeight: 700, fontSize: 17, color: 'white', marginBottom: 6 }}>
          Vybe wins on 6 out of 7 features
        </p>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 18 }}>
          Join thousands already earning on Vybe
        </p>
        <motion.button
          onClick={onStartEarning}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          style={{
            padding: '12px 28px', borderRadius: 10, border: 'none',
            background: 'linear-gradient(135deg, #00B8E0 0%, #00D4FF 50%, #00B8E0 100%)',
            color: '#0a0a0f', fontWeight: 800, fontSize: 14, cursor: 'pointer',
          }}
        >
          Start Earning Free
        </motion.button>
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
          <h2 style={{ color: 'white', fontWeight: 900, fontSize: 20, marginBottom: 20, textAlign: 'center' }}>How it works</h2>
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
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>You keep <span style={{ color: 'white', fontWeight: 700 }}>70%</span> of every gift after a flat <span style={{ color: 'white', fontWeight: 700 }}>30% platform fee</span>. No caps. Cash out any time you hit 1,000 coins (≈ £4.20).</p>
        </motion.div>

        {/* Comparison table */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.24 }} style={{ marginBottom: 48 }}>
          <h2 style={{ color: 'white', fontWeight: 900, fontSize: 20, marginBottom: 6, textAlign: 'center' }}>Why creators choose Vybe</h2>
          <p style={{ color: 'rgba(255,255,255,0.38)', fontSize: 14, marginBottom: 20, textAlign: 'center' }}>Compare us to the big platforms</p>
          <CompareTable onStartEarning={() => navigate('/chat')} />
        </motion.div>

        {/* Earnings calculator */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.3 }} style={{ marginBottom: 48 }}>
          <h2 style={{ color: 'white', fontWeight: 900, fontSize: 20, marginBottom: 6, textAlign: 'center' }}>Estimate your earnings</h2>
          <p style={{ color: 'rgba(255,255,255,0.38)', fontSize: 14, marginBottom: 20, textAlign: 'center' }}>See how much you could make on Vybe</p>
          <EarningsCalculator onStartEarning={() => navigate('/chat')} />
        </motion.div>

        {/* FAQ */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.36 }} style={{ marginBottom: 48 }}>
          <h2 style={{ color: 'white', fontWeight: 900, fontSize: 20, marginBottom: 20, textAlign: 'center' }}>Common questions</h2>
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
