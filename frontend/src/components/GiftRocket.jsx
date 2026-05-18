import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Rocket } from 'lucide-react'
import { GiftIcon, GIFTS } from './GiftIcon'
import { playGiftRocket } from '../utils/sounds'

function hexA(hex, a) {
  const h = (hex || '#00D4FF').replace('#', '')
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  return `rgba(${r},${g},${b},${a})`
}

// Festive multi-colour confetti — the celebration.
const CONFETTI = ['#00D4FF', '#FF5FA2', '#FFE08A', '#7C3AED', '#4ADE80', '#FF9D2E', '#FFFFFF']

// Per-gift traits: tier index (0-5), magnitude, accent colour.
function traitsOf(giftId, coins) {
  const idx  = GIFTS.findIndex((g) => g.id === giftId)
  const gift = GIFTS.find((g) => g.id === giftId)
  const value = coins || gift?.coins || 100
  const mag = Math.max(0, Math.min(1,
    (Math.log(value) - Math.log(50)) / (Math.log(5000) - Math.log(50))))
  return { idx: idx < 0 ? 0 : idx, mag, color: gift?.color || '#00D4FF' }
}

// The celebration when the rocket detonates: a flash, shockwave rings, a
// confetti shower down the whole screen, and the gift presented in the centre.
function Explosion({ x, y, color, mag, idx, giftId }) {
  const D = Math.max(window.innerWidth, window.innerHeight)
  const H = window.innerHeight
  const confettiN = 34 + Math.round(mag * 82)   // 34 → 116
  const rings     = idx >= 4 ? 3 : idx >= 2 ? 2 : 1
  const flash     = 240 + mag * 440
  const giftPop   = 112 + mag * 96

  return (
    <>
      {/* detonation flash */}
      <motion.div
        style={{
          position: 'fixed', left: x, top: y, width: flash, height: flash,
          marginLeft: -flash / 2, marginTop: -flash / 2, borderRadius: '50%',
          background: `radial-gradient(circle, ${hexA(color, 0.5)} 0%, ${hexA(color, 0.12)} 45%, transparent 75%)`,
        }}
        initial={{ scale: 0.2, opacity: 0 }}
        animate={{ scale: [0.2, 1.2, 1], opacity: [0, 1, 0] }}
        transition={{ duration: 1, ease: 'easeOut' }}
      />
      {/* shockwave rings */}
      {Array.from({ length: rings }).map((_, r) => {
        const size = 160 + mag * 230 + r * 80
        return (
          <motion.div
            key={'r' + r}
            style={{ position: 'fixed', left: x, top: y, borderRadius: '50%', border: `3px solid ${color}` }}
            initial={{ x: '-50%', y: '-50%', width: 22, height: 22, opacity: 0.85 }}
            animate={{ x: '-50%', y: '-50%', width: size, height: size, opacity: 0 }}
            transition={{ duration: 0.7 + r * 0.15, ease: 'easeOut', delay: r * 0.1 }}
          />
        )
      })}
      {/* confetti shower — bursts out then rains down the whole screen */}
      {Array.from({ length: confettiN }).map((_, i) => {
        const ang    = Math.random() * Math.PI * 2
        const spread = (0.25 + Math.random() * 0.75) * (160 + mag * D * 0.4)
        const w      = 7 + Math.random() * 8
        const h      = 4 + Math.random() * 6
        const spin   = (Math.random() < 0.5 ? -1 : 1) * (360 + Math.random() * 760)
        const fall   = H * (0.55 + Math.random() * 0.6)
        const dur    = 2 + Math.random() * 1.1
        return (
          <motion.div
            key={'c' + i}
            style={{
              position: 'fixed', left: x, top: y, width: w, height: h,
              marginLeft: -w / 2, marginTop: -h / 2, borderRadius: 1.5,
              background: CONFETTI[i % CONFETTI.length],
            }}
            initial={{ x: 0, y: 0, rotate: 0, opacity: 0 }}
            animate={{
              x: Math.cos(ang) * spread + (Math.random() - 0.5) * 70,
              y: [0, Math.sin(ang) * spread - 30, fall],
              rotate: spin,
              opacity: [0, 1, 1, 0],
            }}
            transition={{
              duration: dur, ease: 'easeOut',
              opacity: { duration: dur, times: [0, 0.08, 0.72, 1] },
            }}
          />
        )
      })}
      {/* soft glow behind the gift */}
      <motion.div
        style={{
          position: 'fixed', left: x, top: y, width: giftPop * 2.6, height: giftPop * 2.6,
          marginLeft: -giftPop * 1.3, marginTop: -giftPop * 1.3, borderRadius: '50%',
          background: `radial-gradient(circle, ${hexA(color, 0.42)} 0%, transparent 68%)`,
        }}
        initial={{ scale: 0.3, opacity: 0 }}
        animate={{ scale: [0.3, 1.1, 1, 1], opacity: [0, 0.9, 0.65, 0] }}
        transition={{ duration: 2.3, ease: 'easeOut' }}
      />
      {/* the gift — pops in clean, holds in the centre, then drifts up & fades */}
      <motion.div
        style={{
          position: 'fixed', left: x, top: y,
          marginLeft: -giftPop / 2, marginTop: -giftPop / 2,
          filter: `drop-shadow(0 14px 38px ${hexA(color, 0.85)})`,
        }}
        initial={{ scale: 0, y: 0, opacity: 0 }}
        animate={{ scale: [0, 1.2, 1, 1, 1], y: [0, 0, 0, -12, -12], opacity: [0, 1, 1, 1, 0] }}
        transition={{ duration: 2.3, times: [0, 0.16, 0.3, 0.82, 1], ease: 'easeOut' }}
      >
        <GiftIcon id={giftId} size={giftPop} />
      </motion.div>
    </>
  )
}

function GiftRocketOne({ anim }) {
  const { giftId, coins } = anim
  const { idx, mag, color } = traitsOf(giftId, coins)
  const [phase, setPhase] = useState('launch')

  const W = window.innerWidth, H = window.innerHeight
  const cx = W / 2
  const apexY = H * 0.34
  const giftSize   = 40 + mag * 28
  const rocketSize = 44 + mag * 42

  useEffect(() => { playGiftRocket(idx) }, []) // eslint-disable-line

  if (phase === 'explode') {
    return <Explosion x={cx} y={apexY} color={color} mag={mag} idx={idx} giftId={giftId} />
  }

  return (
    <motion.div
      style={{ position: 'fixed', left: 0, top: 0, willChange: 'transform' }}
      initial={{ x: cx, y: H + 100, opacity: 0 }}
      animate={{ x: [cx, cx - 12, cx + 9, cx], y: [H + 100, apexY], opacity: [0, 1, 1, 1] }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
      onAnimationComplete={() => setPhase('explode')}
    >
      <div style={{ transform: 'translate(-50%,-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {/* gift riding on top */}
        <div style={{ filter: `drop-shadow(0 4px 14px ${hexA(color, 0.7)})` }}>
          <GiftIcon id={giftId} size={giftSize} />
        </div>
        {/* the rocket */}
        <Rocket
          size={rocketSize}
          style={{ color, transform: 'rotate(-45deg)', marginTop: -4, filter: `drop-shadow(0 0 10px ${color})` }}
        />
        {/* exhaust flame */}
        <motion.div
          style={{
            width: rocketSize * 0.5, height: rocketSize * 0.95,
            marginTop: -rocketSize * 0.34, borderRadius: '50% 50% 50% 50% / 30% 30% 70% 70%',
            background: `radial-gradient(circle at 50% 25%, #FFF4D6 0%, #FFE08A 35%, ${color} 65%, transparent 82%)`,
          }}
          animate={{ scaleY: [1, 1.55, 0.85, 1.4], scaleX: [1, 0.85, 1.1, 0.9], opacity: [0.95, 1, 0.8, 1] }}
          transition={{ duration: 0.16, repeat: Infinity }}
        />
      </div>
    </motion.div>
  )
}

// For every gift: a rocket launches with the gift on top, then detonates into
// a confetti celebration. Themed by the gift's colour, scaled by its tier.
export default function GiftRocket({ anims }) {
  return (
    <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 60 }}>
      {anims.map((a) => <GiftRocketOne key={a.id} anim={a} />)}
    </div>
  )
}
