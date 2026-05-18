import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { GiftIcon, GIFTS } from './GiftIcon'
import { playGiftThrow, playGiftImpact } from '../utils/sounds'

// 0→1 magnitude across the 50→5000 coin range — drives how big the toss lands.
function magOf(giftId, coins) {
  const gift  = GIFTS.find((g) => g.id === giftId)
  const value = coins || gift?.coins || 100
  return Math.max(0, Math.min(1,
    (Math.log(value) - Math.log(50)) / (Math.log(5000) - Math.log(50))))
}

// The burst where the gift lands: a glowing frame on the recipient's panel,
// a shockwave ring, a sparkle spray and the gift popping.
function GiftImpact({ t, giftId, mag }) {
  const ring    = 180 + mag * 150
  const impSize = 72 + mag * 34
  return (
    <>
      {/* glowing frame on the recipient's panel */}
      <motion.div
        style={{
          position: 'fixed', left: t.cx - t.w / 2, top: t.cy - t.h / 2,
          width: t.w, height: t.h, borderRadius: 20, pointerEvents: 'none',
          border: '3px solid #00D4FF',
          boxShadow: '0 0 46px rgba(0,212,255,0.7), inset 0 0 46px rgba(0,212,255,0.28)',
        }}
        initial={{ opacity: 0, scale: 1.05 }}
        animate={{ opacity: [0, 1, 1, 0], scale: [1.05, 0.99, 1, 1] }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      />
      {/* shockwave ring */}
      <motion.div
        style={{ position: 'fixed', left: t.cx, top: t.cy, borderRadius: '50%', border: '3px solid #FFE08A' }}
        initial={{ x: '-50%', y: '-50%', width: 24, height: 24, opacity: 0.9 }}
        animate={{ x: '-50%', y: '-50%', width: ring, height: ring, opacity: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      />
      {/* sparkle spray */}
      {Array.from({ length: 16 }).map((_, i) => {
        const ang = (i / 16) * Math.PI * 2
        const d   = 70 + mag * 80 + (i % 3) * 16
        return (
          <motion.div
            key={i}
            style={{
              position: 'fixed', left: t.cx, top: t.cy, width: 9, height: 9,
              marginLeft: -4.5, marginTop: -4.5, borderRadius: '50%',
              background: i % 2 ? '#00D4FF' : '#FFE08A',
              boxShadow: i % 2 ? '0 0 10px #00D4FF' : '0 0 10px #FFE08A',
            }}
            initial={{ x: 0, y: 0, scale: 0, opacity: 0 }}
            animate={{ x: Math.cos(ang) * d, y: Math.sin(ang) * d, scale: [0, 1.3, 0], opacity: [0, 1, 0] }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
          />
        )
      })}
      {/* the gift pops on impact */}
      <motion.div
        style={{
          position: 'fixed', left: t.cx, top: t.cy,
          marginLeft: -impSize / 2, marginTop: -impSize / 2,
          filter: 'drop-shadow(0 8px 22px rgba(0,212,255,0.7))',
        }}
        initial={{ scale: 0.7, opacity: 1 }}
        animate={{ scale: [0.7, 1.5, 1.3], opacity: [1, 1, 0] }}
        transition={{ duration: 1.1, ease: 'easeOut' }}
      >
        <GiftIcon id={giftId} size={impSize} />
      </motion.div>
    </>
  )
}

function GiftTossOne({ anim }) {
  const { giftId, coins, target } = anim
  const [phase, setPhase] = useState('fly')
  const mag = magOf(giftId, coins)

  // Fall back to the upper-centre of the screen if no panel rect was captured.
  const t = target || {
    cx: window.innerWidth / 2,
    cy: window.innerHeight * 0.34,
    w: Math.min(window.innerWidth - 80, 520),
    h: 300,
  }
  const startX  = window.innerWidth / 2
  const startY  = window.innerHeight - 90
  const midX    = (startX + t.cx) / 2
  const arcY    = Math.min(startY, t.cy) - 150
  const flySize = 60 + mag * 30

  useEffect(() => { playGiftThrow() }, [])

  if (phase === 'fly') {
    return (
      <motion.div
        style={{ position: 'fixed', left: 0, top: 0, willChange: 'transform' }}
        initial={{ x: startX, y: startY, scale: 0.4, rotate: -30, opacity: 0 }}
        animate={{
          x: [startX, midX, t.cx],
          y: [startY, arcY, t.cy],
          scale: [0.4, 1.05, 0.78],
          rotate: [-30, 18, 64],
          opacity: [0, 1, 1],
        }}
        transition={{ duration: 0.72, ease: 'easeOut' }}
        onAnimationComplete={() => { setPhase('impact'); playGiftImpact(Math.round(mag * 5)) }}
      >
        <div style={{ transform: 'translate(-50%,-50%)', filter: 'drop-shadow(0 6px 18px rgba(0,212,255,0.6))' }}>
          <GiftIcon id={giftId} size={flySize} />
        </div>
      </motion.div>
    )
  }
  return <GiftImpact t={t} giftId={giftId} mag={mag} />
}

// Full-screen overlay — for every gift, tosses it from the sender's side in an
// arc that slams into the recipient's video panel with an impact burst.
export default function GiftToss({ anims }) {
  return (
    <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 60 }}>
      {anims.map((a) => <GiftTossOne key={a.id} anim={a} />)}
    </div>
  )
}
