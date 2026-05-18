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
