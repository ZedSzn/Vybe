// Profile banner gradients — shared by the profile page and the ProfilePill
// so the pill can render whatever banner the user picked.
export const BANNER_PRESETS = [
  { id: 'default',  name: 'Vybe',     style: 'linear-gradient(135deg, rgba(0,212,255,0.4) 0%, rgba(99,102,241,0.3) 40%, rgba(0,212,255,0.35) 100%)' },
  { id: 'sunset',   name: 'Sunset',   style: 'linear-gradient(135deg, rgba(234,88,12,0.5) 0%, rgba(236,72,153,0.35) 50%, rgba(0,212,255,0.3) 100%)' },
  { id: 'ocean',    name: 'Ocean',    style: 'linear-gradient(135deg, rgba(6,182,212,0.5) 0%, rgba(0,212,255,0.4) 50%, rgba(0,68,102,0.5) 100%)' },
  { id: 'forest',   name: 'Forest',   style: 'linear-gradient(135deg, rgba(0,212,255,0.45) 0%, rgba(0,212,255,0.35) 50%, rgba(6,95,70,0.5) 100%)' },
  { id: 'ember',    name: 'Ember',    style: 'linear-gradient(135deg, rgba(239,68,68,0.5) 0%, rgba(0,212,255,0.3) 50%, rgba(234,88,12,0.4) 100%)' },
  { id: 'aurora',   name: 'Aurora',   style: 'linear-gradient(135deg, rgba(99,102,241,0.5) 0%, rgba(0,212,255,0.3) 40%, rgba(236,72,153,0.35) 100%)' },
  { id: 'midnight', name: 'Midnight', style: 'linear-gradient(135deg, rgba(15,23,42,0.9) 0%, rgba(30,27,75,0.8) 50%, rgba(17,24,39,0.9) 100%)' },
  { id: 'rose',     name: 'Rose',     style: 'linear-gradient(135deg, rgba(244,63,94,0.45) 0%, rgba(251,113,133,0.3) 50%, rgba(190,18,60,0.4) 100%)' },
]

// CSS background for a banner id — falls back to the default pill surface.
export function bannerBackground(id) {
  if (!id) return null
  return BANNER_PRESETS.find((b) => b.id === id)?.style || null
}
