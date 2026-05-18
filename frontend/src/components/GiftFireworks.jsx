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
  ['#FF4D4D', '#FFB199', '#FFFFFF'],
]

const TRAIL = 9 // how many past positions each spark keeps for its trail

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
    flashesRef.current.push({ x, y, r: 8, maxR: 64 + power * 96, life: 1 })
    const shape = Math.random() // 0-.34 sphere · .34-.67 ring · .67-1 willow
    const count = 40 + Math.round(power * 40)
    const base  = 2 + power * 3.6
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + Math.random() * 0.22
      let speed, decay, grav
      if (shape < 0.34) {            // sphere — varied speeds, full volume
        speed = base * (0.35 + Math.random() * 0.85)
        decay = 0.0065 + Math.random() * 0.010
        grav  = 0.035
      } else if (shape < 0.67) {     // ring — near-uniform speed, clean shell
        speed = base * (0.92 + Math.random() * 0.12)
        decay = 0.0075 + Math.random() * 0.009
        grav  = 0.028
      } else {                       // willow — slow, long-lived, drooping
        speed = base * (0.3 + Math.random() * 0.5)
        decay = 0.0035 + Math.random() * 0.005
        grav  = 0.062
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

  // Stroke a fading trail through a particle's position history.
  const drawTrail = (ctx, hist, x, y, color, width, alpha) => {
    if (hist.length < 2) return
    for (let k = 1; k < hist.length; k++) {
      ctx.globalAlpha = alpha * (k / hist.length) // tail dim → head bright
      ctx.strokeStyle = color
      ctx.lineWidth = width * (0.4 + 0.6 * (k / hist.length))
      ctx.beginPath()
      ctx.moveTo(hist[k - 1][0], hist[k - 1][1])
      ctx.lineTo(hist[k][0], hist[k][1])
      ctx.stroke()
    }
    ctx.globalAlpha = alpha
    ctx.beginPath()
    ctx.moveTo(hist[hist.length - 1][0], hist[hist.length - 1][1])
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
      f.r += (f.maxR - f.r) * 0.34
      f.life -= 0.12
      if (f.life <= 0) { flashes.splice(i, 1); continue }
      ctx.globalAlpha = Math.max(0, f.life) * 0.5
      ctx.fillStyle = '#FFFFFF'
      ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2); ctx.fill()
    }

    // Rising shells — a bright climbing streak
    const shells = shellsRef.current
    for (let i = shells.length - 1; i >= 0; i--) {
      const s = shells[i]
      s.x += s.vx; s.y += s.vy; s.vy += 0.022
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
      p.vx *= 0.985; p.vy *= 0.985; p.vy += p.grav
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
    const level = Math.max(0, GIFTS.findIndex((g) => g.id === giftId))
    const shellCount = 3 + Math.round(mag * 14) // 3 → 17

    for (let i = 0; i < shellCount; i++) {
      setTimeout(() => {
        shellsRef.current.push({
          x: W * (0.1 + Math.random() * 0.8),
          y: H + 8,
          vx: (Math.random() - 0.5) * 0.8,
          vy: -(7 + Math.random() * 3.4),
          targetY: H * (0.14 + Math.random() * 0.44),
          palette: PALETTES[Math.floor(Math.random() * PALETTES.length)],
          power: 0.5 + mag * 0.95,
          hist: [],
        })
      }, i * (80 + Math.random() * 150))
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
  }, [anims]) // eslint-disable-line

  return (
    <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 60 }}>
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
      <AnimatePresence>
        {centerGift && (
          <div key={centerGift.key} className="absolute left-1/2 top-1/2">
            {/* soft glow halo behind the gift */}
            <motion.div
              className="absolute rounded-full"
              style={{
                width: 320, height: 320, left: '50%', top: '50%',
                background: 'radial-gradient(circle, rgba(0,212,255,0.4) 0%, rgba(0,212,255,0) 70%)',
              }}
              initial={{ x: '-50%', y: '-50%', scale: 0.3, opacity: 0 }}
              animate={{ x: '-50%', y: '-50%', scale: [0.3, 1.2, 1], opacity: [0, 0.85, 0] }}
              transition={{ duration: 2.5, ease: 'easeOut' }}
            />
            <motion.div
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
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
