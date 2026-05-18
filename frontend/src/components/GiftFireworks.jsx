import { useRef, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { GiftIcon, GIFTS } from './GiftIcon'
import { playGiftFireworks } from '../utils/sounds'

// Festive multi-colour palettes — one is picked per shell so a burst reads
// like a real fireworks show rather than a single flat colour.
const PALETTES = [
  ['#00D4FF', '#7CF9FF', '#FFFFFF'],
  ['#FFE08A', '#FF9D2E', '#FFF4D6'],
  ['#FF5FA2', '#FF9DC8', '#FFFFFF'],
  ['#A78BFA', '#00D4FF', '#E9D5FF'],
  ['#4ADE80', '#A7F3D0', '#FFFFFF'],
]

// Full-screen fireworks overlay. Watches `anims` (the chat's gift queue) and,
// for every new gift, launches a burst of shells + plays the gift's sound.
// Bigger gifts → more shells, denser explosions, a louder/longer sound.
export default function GiftFireworks({ anims }) {
  const canvasRef  = useRef(null)
  const sparksRef  = useRef([])
  const shellsRef  = useRef([])
  const rafRef     = useRef(0)
  const runningRef = useRef(false)
  const seenRef    = useRef(new Set())
  const [centerGift, setCenterGift] = useState(null)

  // ── Canvas sizing ──
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const resize = () => {
      canvas.width  = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)
    return () => {
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(rafRef.current)
    }
  }, [])

  const explode = (x, y, palette, power) => {
    const count = 38 + Math.round(power * 34)
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + Math.random() * 0.25
      const speed = (1.4 + Math.random() * 4.6) * (0.7 + power * 0.55)
      sparksRef.current.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: palette[Math.floor(Math.random() * palette.length)],
        size: 1.5 + Math.random() * 2,
        life: 1,
        decay: 0.007 + Math.random() * 0.012,
      })
    }
  }

  const tick = () => {
    const canvas = canvasRef.current
    if (!canvas) { runningRef.current = false; return }
    const ctx = canvas.getContext('2d')
    const w = canvas.width, h = canvas.height

    // Fade existing trails by lowering alpha — does NOT darken the video below.
    ctx.globalCompositeOperation = 'destination-out'
    ctx.fillStyle = 'rgba(0,0,0,0.16)'
    ctx.fillRect(0, 0, w, h)
    ctx.globalCompositeOperation = 'lighter'

    // Rising shells
    const shells = shellsRef.current
    for (let i = shells.length - 1; i >= 0; i--) {
      const s = shells[i]
      s.x += s.vx; s.y += s.vy; s.vy += 0.022
      ctx.globalAlpha = 1
      ctx.beginPath()
      ctx.fillStyle = '#FFFFFF'
      ctx.arc(s.x, s.y, 2.6, 0, Math.PI * 2)
      ctx.fill()
      if (s.y <= s.targetY || s.vy >= 0) {
        explode(s.x, s.y, s.palette, s.power)
        shells.splice(i, 1)
      }
    }

    // Drifting sparks
    const sparks = sparksRef.current
    for (let i = sparks.length - 1; i >= 0; i--) {
      const p = sparks[i]
      p.vx *= 0.984; p.vy *= 0.984; p.vy += 0.034
      p.x += p.vx; p.y += p.vy
      p.life -= p.decay
      if (p.life <= 0) { sparks.splice(i, 1); continue }
      ctx.globalAlpha = Math.max(0, p.life)
      ctx.beginPath()
      ctx.fillStyle = p.color
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.globalAlpha = 1

    if (shells.length || sparks.length) {
      rafRef.current = requestAnimationFrame(tick)
    } else {
      ctx.clearRect(0, 0, w, h)
      runningRef.current = false
    }
  }

  const ensureRunning = () => {
    if (!runningRef.current) {
      runningRef.current = true
      rafRef.current = requestAnimationFrame(tick)
    }
  }

  const launch = (giftId, coins) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const w = canvas.width, h = canvas.height
    const gift  = GIFTS.find((g) => g.id === giftId)
    const value = coins || gift?.coins || 100
    const mag   = Math.max(0, Math.min(1,
      (Math.log(value) - Math.log(50)) / (Math.log(5000) - Math.log(50))))
    const level = Math.max(0, GIFTS.findIndex((g) => g.id === giftId))
    const shellCount = 3 + Math.round(mag * 14) // 3 → 17

    for (let i = 0; i < shellCount; i++) {
      const delay = i * (80 + Math.random() * 150)
      setTimeout(() => {
        const cv = canvasRef.current
        if (!cv) return
        shellsRef.current.push({
          x: cv.width * (0.1 + Math.random() * 0.8),
          y: cv.height + 8,
          vx: (Math.random() - 0.5) * 0.8,
          vy: -(7 + Math.random() * 3.4),
          targetY: cv.height * (0.14 + Math.random() * 0.44),
          palette: PALETTES[Math.floor(Math.random() * PALETTES.length)],
          power: 0.5 + mag * 0.95,
        })
        ensureRunning()
      }, delay)
    }
    playGiftFireworks(level)
  }

  // ── Trigger a burst for every gift not seen yet ──
  useEffect(() => {
    for (const a of anims) {
      if (seenRef.current.has(a.id)) continue
      seenRef.current.add(a.id)
      launch(a.giftId, a.coins)
      setCenterGift({ key: a.id, giftId: a.giftId })
      setTimeout(() => setCenterGift((c) => (c && c.key === a.id ? null : c)), 2600)
    }
    // Keep the seen-set bounded to the gifts still in the queue.
    seenRef.current = new Set(
      [...seenRef.current].filter((id) => anims.some((a) => a.id === id)),
    )
  }, [anims])

  return (
    <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 60 }}>
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
      <AnimatePresence>
        {centerGift && (
          <motion.div
            key={centerGift.key}
            className="absolute left-1/2 top-1/2"
            initial={{ x: '-50%', y: '-50%', scale: 0.2, rotate: -22, opacity: 0 }}
            animate={{
              x: '-50%', y: '-50%',
              scale: [0.2, 1.4, 1.18, 1.18],
              rotate: [-22, 10, -4, 0],
              opacity: [0, 1, 1, 0],
            }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{
              duration: 2.5, ease: 'easeOut',
              opacity: { duration: 2.5, times: [0, 0.1, 0.74, 1] },
              scale:   { duration: 2.5, times: [0, 0.28, 0.42, 1] },
              rotate:  { duration: 1.4, times: [0, 0.3, 0.62, 1] },
            }}
            style={{ filter: 'drop-shadow(0 12px 34px rgba(0,212,255,0.7))' }}
          >
            <GiftIcon id={centerGift.giftId} size={148} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
