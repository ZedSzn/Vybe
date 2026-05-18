import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { GiftIcon, GIFTS } from './GiftIcon'
import { playGiftBlast } from '../utils/sounds'

// 0→1 magnitude across the 50→5000 coin range — drives how big the blast is.
function magOf(giftId, coins) {
  const gift  = GIFTS.find((g) => g.id === giftId)
  const value = coins || gift?.coins || 100
  return Math.max(0, Math.min(1,
    (Math.log(value) - Math.log(50)) / (Math.log(5000) - Math.log(50))))
}

function GiftBlastOne({ anim }) {
  const { giftId, coins } = anim
  const gift = GIFTS.find((g) => g.id === giftId)
  const mag  = magOf(giftId, coins)
  const W = window.innerWidth, H = window.innerHeight
  const cx = W / 2, cy = H / 2
  const D  = Math.max(W, H)
  const giftSize  = 150 + mag * 180          // 150 → 330
  const particles = 32 + Math.round(mag * 42) // 32 → 74

  useEffect(() => { playGiftBlast(Math.round(mag * 5)) }, [])

  return (
    <>
      {/* full-screen radial flash */}
      <motion.div
        style={{ position: 'fixed', inset: 0, background: 'radial-gradient(circle at 50% 50%, rgba(0,212,255,0.34) 0%, rgba(0,212,255,0.07) 42%, transparent 76%)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 0.5, 0] }}
        transition={{ duration: 2.2, times: [0, 0.12, 0.5, 1], ease: 'easeOut' }}
      />
      {/* rotating light rays */}
      <motion.div
        style={{
          position: 'fixed', left: cx, top: cy, width: D * 1.7, height: D * 1.7,
          marginLeft: -D * 0.85, marginTop: -D * 0.85,
          background: 'repeating-conic-gradient(from 0deg, rgba(0,212,255,0.16) 0deg 11deg, transparent 11deg 24deg)',
        }}
        initial={{ rotate: 0, scale: 0.2, opacity: 0 }}
        animate={{ rotate: 55, scale: 1, opacity: [0, 0.85, 0] }}
        transition={{ duration: 2.2, ease: 'easeOut' }}
      />
      {/* particle burst that fills the screen */}
      {Array.from({ length: particles }).map((_, i) => {
        const ang  = Math.random() * Math.PI * 2
        const dist = (0.32 + Math.random() * 0.68) * D * 0.62
        return (
          <motion.div
            key={i}
            style={{
              position: 'fixed', left: cx, top: cy, width: 10, height: 10,
              marginLeft: -5, marginTop: -5, borderRadius: '50%',
              background: i % 2 ? '#00D4FF' : '#FFE08A',
              boxShadow: i % 2 ? '0 0 12px #00D4FF' : '0 0 12px #FFE08A',
            }}
            initial={{ x: 0, y: 0, scale: 0, opacity: 0 }}
            animate={{
              x: Math.cos(ang) * dist,
              y: Math.sin(ang) * dist + 130,
              scale: [0, 1.4, 0.6, 0],
              opacity: [0, 1, 1, 0],
            }}
            transition={{ duration: 1.6 + Math.random() * 0.7, ease: 'easeOut' }}
          />
        )
      })}
      {/* huge gift in the centre */}
      <motion.div
        style={{
          position: 'fixed', left: cx, top: cy,
          marginLeft: -giftSize / 2, marginTop: -giftSize / 2,
          filter: 'drop-shadow(0 18px 54px rgba(0,212,255,0.72))',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14,
        }}
        initial={{ scale: 0, rotate: -22, opacity: 0 }}
        animate={{ scale: [0, 1.2, 1, 1], rotate: [-22, 7, 0, 0], opacity: [0, 1, 1, 0] }}
        transition={{ duration: 2.2, times: [0, 0.22, 0.4, 1], ease: 'easeOut' }}
      >
        <GiftIcon id={giftId} size={giftSize} />
        {gift?.name && (
          <span style={{
            fontFamily: "'Sora', system-ui, sans-serif", fontWeight: 800,
            fontSize: 20 + mag * 16, letterSpacing: '-0.02em', color: '#fff',
            textShadow: '0 2px 22px rgba(0,212,255,0.85)', whiteSpace: 'nowrap',
          }}>
            {gift.name}
          </span>
        )}
      </motion.div>
    </>
  )
}

// Full-screen gift takeover — a huge gift, rotating rays, a screen-filling
// particle burst and a flash. Everything scales with the gift's value.
export default function GiftBlast({ anims }) {
  return (
    <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 60 }}>
      {anims.map((a) => <GiftBlastOne key={a.id} anim={a} />)}
    </div>
  )
}
