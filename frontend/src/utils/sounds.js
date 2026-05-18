// Synthesised sound effects via Web Audio API — no audio files needed.
// All sounds are very subtle (low gain) so they don't annoy users.

let _ctx = null

function ctx() {
  if (!_ctx) {
    try {
      _ctx = new (window.AudioContext || window.webkitAudioContext)()
    } catch {
      return null
    }
  }
  if (_ctx.state === 'suspended') {
    _ctx.resume().catch(() => {})
  }
  return _ctx
}

function tone(frequency, startTime, duration, gain = 0.22, type = 'sine') {
  const c = ctx()
  if (!c) return
  try {
    const osc  = c.createOscillator()
    const env  = c.createGain()
    osc.connect(env)
    env.connect(c.destination)
    osc.type = type
    osc.frequency.setValueAtTime(frequency, startTime)
    env.gain.setValueAtTime(gain, startTime)
    env.gain.exponentialRampToValueAtTime(0.001, startTime + duration)
    osc.start(startTime)
    osc.stop(startTime + duration + 0.01)
  } catch {}
}

// Cheerful ascending C-E-G arpeggio on match found
export function playMatchFound() {
  const c = ctx()
  if (!c) return
  const t = c.currentTime
  tone(523.25, t,        0.18, 0.2)   // C5
  tone(659.25, t + 0.13, 0.18, 0.2)  // E5
  tone(783.99, t + 0.26, 0.28, 0.22) // G5
}

// Sparkle cascade + warm bell for gift received
export function playGiftReceived() {
  const c = ctx()
  if (!c) return
  const t = c.currentTime
  tone(523.25, t, 0.5, 0.11, 'sine') // warm bell body — C5
  const freqs = [1046, 1318, 1568, 2093, 1760, 2637]
  freqs.forEach((f, i) => tone(f, t + 0.02 + i * 0.06, 0.12, 0.1, 'triangle'))
}

// Bright, magical rising chime + shimmer tail for gift sent
export function playGiftSent() {
  const c = ctx()
  if (!c) return
  const t = c.currentTime
  // Rising chime — E5 → B5 → E6
  tone(659.25, t,        0.14, 0.17, 'triangle')
  tone(987.77, t + 0.08, 0.16, 0.17, 'triangle')
  tone(1318.5, t + 0.17, 0.28, 0.19, 'triangle')
  // Shimmer tail — quick high sparkles
  const sparkle = [2093, 2637, 3136, 2349]
  sparkle.forEach((f, i) => tone(f, t + 0.27 + i * 0.05, 0.09, 0.06, 'sine'))
}

// Soft coin-drop for tip sent
export function playTipSent() {
  const c = ctx()
  if (!c) return
  const t = c.currentTime
  tone(880, t,        0.07, 0.18)
  tone(440, t + 0.06, 0.12, 0.15)
}

// Very subtle tick for primary button presses
export function playClick() {
  const c = ctx()
  if (!c) return
  tone(900, c.currentTime, 0.03, 0.07, 'square')
}

// Error/fail buzzer
export function playError() {
  const c = ctx()
  if (!c) return
  tone(220, c.currentTime, 0.15, 0.1, 'sawtooth')
}

// ─── Firework sounds ──────────────────────────────────────────────────────────
let _noiseBuf = null
function noiseBuffer(c) {
  if (_noiseBuf && _noiseBuf.sampleRate === c.sampleRate) return _noiseBuf
  const buf  = c.createBuffer(1, Math.floor(c.sampleRate * 1.2), c.sampleRate)
  const data = buf.getChannelData(0)
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
  _noiseBuf = buf
  return buf
}

// Rising whistle — the shell climbing before it bursts.
function whistle(start, gain = 0.06) {
  const c = ctx()
  if (!c) return
  try {
    const osc = c.createOscillator()
    const env = c.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(480, start)
    osc.frequency.exponentialRampToValueAtTime(1650, start + 0.34)
    env.gain.setValueAtTime(0.0001, start)
    env.gain.linearRampToValueAtTime(gain, start + 0.12)
    env.gain.exponentialRampToValueAtTime(0.0001, start + 0.4)
    osc.connect(env); env.connect(c.destination)
    osc.start(start); osc.stop(start + 0.42)
  } catch {}
}

// Low thump + filtered noise punch — the burst.
function boom(start, gain = 0.28) {
  const c = ctx()
  if (!c) return
  try {
    const osc = c.createOscillator()
    const env = c.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(130, start)
    osc.frequency.exponentialRampToValueAtTime(42, start + 0.26)
    env.gain.setValueAtTime(gain, start)
    env.gain.exponentialRampToValueAtTime(0.001, start + 0.32)
    osc.connect(env); env.connect(c.destination)
    osc.start(start); osc.stop(start + 0.34)

    const src = c.createBufferSource()
    src.buffer = noiseBuffer(c)
    const lp = c.createBiquadFilter()
    lp.type = 'lowpass'; lp.frequency.value = 850
    const nenv = c.createGain()
    nenv.gain.setValueAtTime(gain * 0.8, start)
    nenv.gain.exponentialRampToValueAtTime(0.001, start + 0.2)
    src.connect(lp); lp.connect(nenv); nenv.connect(c.destination)
    src.start(start); src.stop(start + 0.22)
  } catch {}
}

// Sparkly high-passed noise tail — the crackle after the burst.
function crackle(start, duration, gain = 0.06) {
  const c = ctx()
  if (!c) return
  try {
    const src = c.createBufferSource()
    src.buffer = noiseBuffer(c)
    src.loop = true
    const hp = c.createBiquadFilter()
    hp.type = 'highpass'; hp.frequency.value = 2200
    const env = c.createGain()
    env.gain.setValueAtTime(0.0001, start)
    env.gain.linearRampToValueAtTime(gain, start + 0.03)
    env.gain.exponentialRampToValueAtTime(0.0001, start + duration)
    src.connect(hp); hp.connect(env); env.connect(c.destination)
    src.start(start); src.stop(start + duration + 0.05)
  } catch {}
}

// Firework sound for a gift — `level` 0-5 (Small Vybe → Legendary Vybe).
// Each level is audibly distinct: more booms, longer crackle, and from the
// mid tiers up a celebratory chord, with a grand finale for the Legendary.
export function playGiftFireworks(level = 0) {
  const c = ctx()
  if (!c) return
  const t   = c.currentTime
  const lvl = Math.max(0, Math.min(5, Math.round(level)))
  const booms = 1 + lvl // 1 → 6
  whistle(t, 0.05 + lvl * 0.008)
  for (let i = 0; i < booms; i++) {
    const bt = t + 0.34 + i * (0.15 + Math.random() * 0.13)
    boom(bt, (0.2 + lvl * 0.03) * (0.82 + Math.random() * 0.36))
    crackle(bt + 0.05, 0.45 + lvl * 0.13, 0.045 + lvl * 0.012)
  }
  // Celebratory C-major chord from the mid tiers up
  if (lvl >= 2) {
    const chord = [523.25, 659.25, 783.99, 1046.5]
    chord.forEach((f, i) => tone(f, t + 0.34 + i * 0.05, 0.55, 0.05 + lvl * 0.008, 'triangle'))
  }
  // Grand finale — an extra volley for the Legendary
  if (lvl >= 5) {
    for (let i = 0; i < 3; i++) boom(t + 1.5 + i * 0.17, 0.3)
    crackle(t + 1.5, 1.1, 0.09)
  }
}

// Whoosh — the gift being thrown across the screen toward the partner.
export function playGiftThrow() {
  const c = ctx()
  if (!c) return
  try {
    const t = c.currentTime
    const src = c.createBufferSource()
    src.buffer = noiseBuffer(c)
    const bp = c.createBiquadFilter()
    bp.type = 'bandpass'; bp.Q.value = 1.3
    bp.frequency.setValueAtTime(380, t)
    bp.frequency.exponentialRampToValueAtTime(2600, t + 0.5)
    const env = c.createGain()
    env.gain.setValueAtTime(0.0001, t)
    env.gain.linearRampToValueAtTime(0.1, t + 0.14)
    env.gain.exponentialRampToValueAtTime(0.0001, t + 0.56)
    src.connect(bp); bp.connect(env); env.connect(c.destination)
    src.start(t); src.stop(t + 0.6)
  } catch {}
}

// Impact — the gift landing on the partner: a thud + a sparkle, scaled by tier.
export function playGiftImpact(level = 0) {
  const c = ctx()
  if (!c) return
  const t   = c.currentTime
  const lvl = Math.max(0, Math.min(5, Math.round(level)))
  boom(t, 0.22 + lvl * 0.025)
  const sparkle = [1568, 2093, 2637, 3136, 2349]
  sparkle.forEach((f, i) => tone(f, t + 0.05 + i * 0.045, 0.11, 0.05 + lvl * 0.008, 'triangle'))
}

// Gift rocket — a rising launch whistle + low thrust rumble, then a detonation
// at the apex (~0.78s in). `level` 0-5 makes every gift sound distinct: more
// booms, longer crackle, a chord on the mid tiers and a finale on the top one.
export function playGiftRocket(level = 0) {
  const c = ctx()
  if (!c) return
  const t   = c.currentTime
  const lvl = Math.max(0, Math.min(5, Math.round(level)))
  // Launch whistle — rising over the ~0.8s ascent
  try {
    const osc = c.createOscillator(), env = c.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(280, t)
    osc.frequency.exponentialRampToValueAtTime(1300 + lvl * 120, t + 0.76)
    env.gain.setValueAtTime(0.0001, t)
    env.gain.linearRampToValueAtTime(0.055 + lvl * 0.006, t + 0.16)
    env.gain.exponentialRampToValueAtTime(0.0001, t + 0.8)
    osc.connect(env); env.connect(c.destination)
    osc.start(t); osc.stop(t + 0.82)
  } catch {}
  // Low thrust rumble under the launch
  try {
    const src = c.createBufferSource(); src.buffer = noiseBuffer(c)
    const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 600
    const env = c.createGain()
    env.gain.setValueAtTime(0.04 + lvl * 0.005, t)
    env.gain.exponentialRampToValueAtTime(0.0001, t + 0.78)
    src.connect(lp); lp.connect(env); env.connect(c.destination)
    src.start(t); src.stop(t + 0.8)
  } catch {}
  // Detonation at the apex
  const et = t + 0.78
  const booms = 1 + Math.ceil(lvl * 0.8) // 1 → 5
  for (let i = 0; i < booms; i++) {
    boom(et + i * 0.13, (0.24 + lvl * 0.03) * (0.85 + Math.random() * 0.3))
    crackle(et + 0.05 + i * 0.13, 0.4 + lvl * 0.13, 0.04 + lvl * 0.012)
  }
  // Cheerful celebration arpeggio at the reveal
  const arp = [659.25, 880, 1174.66, 1567.98]
  arp.forEach((f, i) => tone(f, et + 0.14 + i * 0.07, 0.16, 0.05 + lvl * 0.005, 'triangle'))
  if (lvl >= 3) {
    const chord = [523.25, 659.25, 783.99, 1046.5]
    chord.forEach((f, i) => tone(f, et + 0.05 + i * 0.05, 0.6, 0.045 + lvl * 0.006, 'triangle'))
  }
  if (lvl >= 5) { boom(et + 0.9, 0.3); crackle(et + 0.9, 1.0, 0.09) }
}

// Big full-screen gift blast — a deep impact, a rising power sweep, a sparkle
// cascade and (from the mid tiers) a triumphant chord.
export function playGiftBlast(level = 0) {
  const c = ctx()
  if (!c) return
  const t   = c.currentTime
  const lvl = Math.max(0, Math.min(5, Math.round(level)))
  boom(t, 0.3 + lvl * 0.03)
  // Rising power sweep
  try {
    const osc = c.createOscillator()
    const env = c.createGain()
    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(120, t)
    osc.frequency.exponentialRampToValueAtTime(900 + lvl * 130, t + 0.45)
    env.gain.setValueAtTime(0.0001, t)
    env.gain.linearRampToValueAtTime(0.055 + lvl * 0.006, t + 0.18)
    env.gain.exponentialRampToValueAtTime(0.0001, t + 0.5)
    osc.connect(env); env.connect(c.destination)
    osc.start(t); osc.stop(t + 0.52)
  } catch {}
  // Sparkle cascade
  const sparkle = [1318, 1760, 2093, 2637, 3136, 2349, 1760]
  sparkle.forEach((f, i) => tone(f, t + 0.22 + i * 0.05, 0.12, 0.05 + lvl * 0.007, 'triangle'))
  // Triumphant chord from the mid tiers up
  if (lvl >= 3) {
    const chord = [392, 523.25, 659.25, 783.99]
    chord.forEach((f, i) => tone(f, t + 0.1 + i * 0.04, 0.7, 0.05 + lvl * 0.006, 'triangle'))
  }
  if (lvl >= 5) boom(t + 0.5, 0.28)
}
