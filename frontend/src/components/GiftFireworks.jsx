import { useRef, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { GiftIcon, GIFTS } from './GiftIcon'
import { playFireworkLaunch, playFireworkBurst } from '../utils/sounds'

// Festive multi-colour palettes — one is picked per shell so a burst reads
// like a real fireworks show rather than a single flat colour.
const PALETTES = [
  ['#00D4FF', '#7CF9FF', '#FFFFFF'],
  ['#FFE08A', '#FF9D2E', '#FFF4D6'],
  ['#FF5FA2', '#FF9DC8', '#FFFFFF'],
  ['#A78BFA', '#00D4FF', '#E9D5FF'],
  ['#4ADE80', '#A7F3D0', '#FFFFFF'],
  ['#FF4D4D', '#FFB199', '#FFFFFF'],
]

const TRAIL = 16 // how many past positions each spark keeps for its trail

// Full-screen fireworks overlay. Watches `anims` (the chat's gift queue) and,
// for every new gift, launches a burst of shells + plays the gift's sound.
// Bigger gifts → more shells, denser/faster explosions, a louder/longer sound.
export default function GiftFireworks({ anims }) {
  const canvasRef  = useRef(null)
  const sparksRef  = useRef([])
  const shellsRef  = useRef([])
  const flashesRef = useRef([])
  const dirtyRef   = useRef(false)
  const seenRef    = useRef(new Set())
  const [centerGift, setCenterGift] = useState(null)

  // Detonate a shell: a bright flash + a spark burst in one of three shapes.
  const spawnExplosion = (x, y, palette, power) => {
    playFireworkBurst(power)
    flashesRef.current.push({ x, y, r: 8, maxR: 64 + power * 96, life: 1 })
    const shape = Math.random() // 0-.34 sphere · .34-.67 ring · .67-1 willow
    const count = 32 + Math.round(power * 36)
    const base  = 3.4 + power * 5.2
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + Math.random() * 0.22
      let speed, decay, grav
      if (shape < 0.34) {            // sphere — varied speeds, full volume
        speed = base * (0.35 + Math.random() * 0.85)
        decay = 0.013 + Math.random() * 0.013
        grav  = 0.05
      } else if (shape < 0.67) {     // ring — near-uniform speed, clean shell
        speed = base * (0.92 + Math.random() * 0.12)
        decay = 0.014 + Math.random() * 0.012
        grav  = 0.042
      } else {                       // willow — slow, long-lived, drooping
        speed = base * (0.3 + Math.random() * 0.5)
        decay = 0.0085 + Math.random() * 0.008
        grav  = 0.085
      }
      sparksRef.current.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: palette[Math.floor(Math.random() * palette.length)],
        size: 1.6 + Math.random() * 2.2,
        life: 1, decay, grav,
        glow: true,
        twinkle: Math.random() < 0.55,
        hist: [],
      })
    }
  }

  // Draw a particle's trail in just two strokes — a long faint tail plus a
  // brighter recent segment for a tail-to-head taper. Cheap enough to stay
  // at 60fps even with hundreds of sparks on screen.
  const drawTrail = (ctx, hist, x, y, color, width, alpha) => {
    if (hist.length < 2) return
    ctx.strokeStyle = color
    // full faint tail
    ctx.globalAlpha = alpha * 0.4
    ctx.lineWidth = width * 0.7
    ctx.beginPath()
    ctx.moveTo(hist[0][0], hist[0][1])
    for (let k = 1; k < hist.length; k++) ctx.lineTo(hist[k][0], hist[k][1])
    ctx.lineTo(x, y)
    ctx.stroke()
    // brighter recent segment
    const start = Math.max(0, hist.length - 6)
    ctx.globalAlpha = alpha
    ctx.lineWidth = width
    ctx.beginPath()
    ctx.moveTo(hist[start][0], hist[start][1])
    for (let k = start + 1; k < hist.length; k++) ctx.lineTo(hist[k][0], hist[k][1])
    ctx.lineTo(x, y)
    ctx.stroke()
  }

  // One animation frame. Wrapped by the loop in try/catch so a single bad
  // frame can never permanently kill the fireworks.
  const draw = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const w = canvas.width, h = canvas.height

    const active = shellsRef.current.length || sparksRef.current.length || flashesRef.current.length
    if (!active) {
      // Clear once after the last particle dies, then idle cheaply.
      if (dirtyRef.current) { ctx.clearRect(0, 0, w, h); dirtyRef.current = false }
      return
    }
    dirtyRef.current = true

    // Full clear every frame — particles carry their own trails, so a trail
    // fades out completely with the spark's life and leaves no stuck residue.
    ctx.clearRect(0, 0, w, h)
    ctx.globalCompositeOperation = 'lighter'
    ctx.lineCap = 'round'

    // Detonation flashes
    const flashes = flashesRef.current
    for (let i = flashes.length - 1; i >= 0; i--) {
      const f = flashes[i]
      f.r += (f.maxR - f.r) * 0.4
      f.life -= 0.17
      if (f.life <= 0) { flashes.splice(i, 1); continue }
      ctx.globalAlpha = Math.max(0, f.life) * 0.5
      ctx.fillStyle = '#FFFFFF'
      ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2); ctx.fill()
    }

    // Rising shells — a bright climbing streak
    const shells = shellsRef.current
    for (let i = shells.length - 1; i >= 0; i--) {
      const s = shells[i]
      s.x += s.vx; s.y += s.vy; s.vy += 0.03
      s.hist.push([s.x, s.y])
      if (s.hist.length > TRAIL) s.hist.shift()
      drawTrail(ctx, s.hist, s.x, s.y, '#FFF7E0', 3, 1)
      if (s.y <= s.targetY || s.vy >= 0) {
        spawnExplosion(s.x, s.y, s.palette, s.power)
        shells.splice(i, 1)
      }
    }

    // Drifting sparks — a fading trail, a glow halo, twinkle as they die
    const sparks = sparksRef.current
    for (let i = sparks.length - 1; i >= 0; i--) {
      const p = sparks[i]
      p.vx *= 0.982; p.vy *= 0.982; p.vy += p.grav
      p.x += p.vx; p.y += p.vy
      p.life -= p.decay
      if (p.life <= 0) { sparks.splice(i, 1); continue }
      p.hist.push([p.x, p.y])
      if (p.hist.length > TRAIL) p.hist.shift()
      let a = Math.max(0, p.life)
      if (p.twinkle && p.life < 0.55) a *= 0.35 + Math.random() * 0.65
      drawTrail(ctx, p.hist, p.x, p.y, p.color, p.size * 1.3, a * 0.85)
      ctx.fillStyle = p.color
      if (p.glow && p.life > 0.3) {
        ctx.globalAlpha = a * 0.22
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size * 2.6, 0, Math.PI * 2); ctx.fill()
      }
      ctx.globalAlpha = a
      ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill()
    }
    ctx.globalAlpha = 1
  }

  // ── Continuous loop — always running while mounted, so it can never get
  //    stuck. try/catch keeps one bad frame from breaking every future gift.
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const resize = () => {
      canvas.width  = window.innerWidth
      canvas.height = window.innerHeight
      dirtyRef.current = true
    }
    resize()
    window.addEventListener('resize', resize)
    let raf = 0
    const loop = () => {
      try { draw() } catch (e) { /* swallow — never kill the loop */ }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => {
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(raf)
    }
  }, []) // eslint-disable-line

  const launch = (giftId, coins) => {
    const W = window.innerWidth, H = window.innerHeight
    const gift  = GIFTS.find((g) => g.id === giftId)
    const value = coins || gift?.coins || 100
    const mag   = Math.max(0, Math.min(1,
      (Math.log(value) - Math.log(50)) / (Math.log(5000) - Math.log(50))))
    const shellCount = 5 + Math.round(mag * 45) // 5 → 50

    for (let i = 0; i < shellCount; i++) {
      setTimeout(() => {
        shellsRef.current.push({
          x: W * (0.1 + Math.random() * 0.8),
          y: H + 8,
          vx: (Math.random() - 0.5) * 0.8,
          vy: -(11 + Math.random() * 4),
          targetY: H * (0.14 + Math.random() * 0.44),
          palette: PALETTES[Math.floor(Math.random() * PALETTES.length)],
          power: 0.5 + mag * 0.95,
          hist: [],
        })
        playFireworkLaunch()
      }, i * (48 + Math.random() * 92))
    }
  }

  // ── Trigger a burst for every gift not seen yet ──
  useEffect(() => {
    for (const a of anims) {
      if (seenRef.current.has(a.id)) continue
      seenRef.current.add(a.id)
      launch(a.giftId, a.coins)
      setCenterGift({ key: a.id, giftId: a.giftId })
      setTimeout(() => setCenterGift((c) => (c && c.key === a.id ? null : c)), 3000)
    }
    // Keep the seen-set bounded to the gifts still in the queue.
    seenRef.current = new Set(
      [...seenRef.current].filter((id) => anims.some((a) => a.id === id)),
    )
  }, [anims]) // eslint-disable-line

  return (
    <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 60 }}>
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
      <AnimatePresence>
        {centerGift && (() => {
          const gc = GIFTS.find((g) => g.id === centerGift.giftId)?.color || '#00D4FF'
          return (
          <div key={centerGift.key} className="absolute left-1/2 top-1/2">
            {/* entrance flash */}
            <motion.div
              className="absolute rounded-full"
              style={{
                width: 440, height: 440, left: '50%', top: '50%',
                background: 'radial-gradient(circle, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0) 60%)',
              }}
              initial={{ x: '-50%', y: '-50%', scale: 0.2, opacity: 0 }}
              animate={{ x: '-50%', y: '-50%', scale: [0.2, 1.3], opacity: [0, 0.95, 0] }}
              transition={{ duration: 0.55, ease: 'easeOut' }}
            />
            {/* rotating light rays */}
            <motion.div
              className="absolute rounded-full"
              style={{
                width: 700, height: 700, left: '50%', top: '50%',
                background: `repeating-conic-gradient(from 0deg, ${gc}2b 0deg 8deg, transparent 8deg 21deg)`,
              }}
              initial={{ x: '-50%', y: '-50%', scale: 0.3, rotate: 0, opacity: 0 }}
              animate={{ x: '-50%', y: '-50%', scale: 1, rotate: 50, opacity: [0, 0.9, 0.9, 0] }}
              transition={{ duration: 3, times: [0, 0.16, 0.72, 1], ease: 'easeOut' }}
            />
            {/* pulsing glow halo */}
            <motion.div
              className="absolute rounded-full"
              style={{
                width: 400, height: 400, left: '50%', top: '50%',
                background: `radial-gradient(circle, ${gc}73 0%, ${gc}00 70%)`,
              }}
              initial={{ x: '-50%', y: '-50%', scale: 0.3, opacity: 0 }}
              animate={{ x: '-50%', y: '-50%', scale: [0.3, 1.15, 0.95, 1.12, 0.97, 1], opacity: [0, 1, 0.7, 0.95, 0.6, 0] }}
              transition={{ duration: 3, ease: 'easeInOut' }}
            />
            {/* expanding shockwave rings */}
            {[0, 1].map((r) => (
              <motion.div
                key={'rg' + r}
                className="absolute rounded-full"
                style={{ left: '50%', top: '50%', border: `2px solid ${gc}` }}
                initial={{ x: '-50%', y: '-50%', width: 60, height: 60, opacity: 0.8 }}
                animate={{ x: '-50%', y: '-50%', width: 340 + r * 130, height: 340 + r * 130, opacity: 0 }}
                transition={{ duration: 1 + r * 0.3, ease: 'easeOut', delay: r * 0.18 }}
              />
            ))}
            {/* one-shot sparkle burst */}
            {Array.from({ length: 18 }).map((_, i) => {
              const ang = (i / 18) * Math.PI * 2
              const d   = 130 + (i % 3) * 30
              return (
                <motion.div
                  key={'sp' + i}
                  className="absolute rounded-full"
                  style={{
                    width: 9, height: 9, left: '50%', top: '50%', marginLeft: -4.5, marginTop: -4.5,
                    background: i % 2 ? gc : '#FFE08A',
                    boxShadow: i % 2 ? `0 0 10px ${gc}` : '0 0 10px #FFE08A',
                  }}
                  initial={{ x: 0, y: 0, scale: 0, opacity: 0 }}
                  animate={{ x: Math.cos(ang) * d, y: Math.sin(ang) * d, scale: [0, 1.4, 0], opacity: [0, 1, 0] }}
                  transition={{ duration: 1, ease: 'easeOut', delay: 0.12 }}
                />
              )
            })}
            {/* sparkles orbiting the gift while it holds */}
            {Array.from({ length: 5 }).map((_, i) => {
              const radius = 108 + i * 15
              return (
                <motion.div
                  key={'orb' + i}
                  className="absolute"
                  style={{ left: '50%', top: '50%' }}
                  initial={{ x: '-50%', y: '-50%', rotate: i * 72, opacity: 0 }}
                  animate={{ x: '-50%', y: '-50%', rotate: i * 72 + 320, opacity: [0, 0, 1, 1, 0] }}
                  transition={{ duration: 3, times: [0, 0.22, 0.34, 0.8, 1], ease: 'linear' }}
                >
                  <div style={{
                    position: 'absolute', left: radius, top: 0, width: 8, height: 8,
                    marginLeft: -4, marginTop: -4, borderRadius: '50%',
                    background: i % 2 ? gc : '#FFE08A',
                    boxShadow: `0 0 12px ${i % 2 ? gc : '#FFE08A'}`,
                  }} />
                </motion.div>
              )
            })}
            {/* the gift — a punchy pop, then a gentle breathing hold */}
            <motion.div
              className="absolute left-1/2 top-1/2"
              style={{ filter: `drop-shadow(0 14px 44px ${gc}dd)` }}
              initial={{ x: '-50%', y: '-50%', scale: 0, opacity: 0 }}
              animate={{
                x: '-50%', y: '-50%',
                scale: [0, 1.4, 1, 1.07, 1, 1.05, 1],
                opacity: [0, 1, 1, 1, 1, 1, 0],
              }}
              exit={{ opacity: 0, scale: 0.85 }}
              transition={{
                duration: 3,
                scale:   { duration: 3, times: [0, 0.14, 0.27, 0.45, 0.62, 0.8, 1], ease: 'easeInOut' },
                opacity: { duration: 3, times: [0, 0.1, 0.3, 0.5, 0.7, 0.86, 1] },
              }}
            >
              <GiftIcon id={centerGift.giftId} size={158} />
            </motion.div>
          </div>
          )
        })()}
      </AnimatePresence>
    </div>
  )
}
