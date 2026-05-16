export const BANNER_PRESETS = [
  { id: 'default',  style: 'linear-gradient(135deg, rgba(0,212,255,0.4) 0%, rgba(99,102,241,0.3) 40%, rgba(0,212,255,0.35) 100%)' },
  { id: 'sunset',   style: 'linear-gradient(135deg, rgba(234,88,12,0.5) 0%, rgba(236,72,153,0.35) 50%, rgba(0,212,255,0.3) 100%)' },
  { id: 'ocean',    style: 'linear-gradient(135deg, rgba(6,182,212,0.5) 0%, rgba(0,212,255,0.4) 50%, rgba(0,68,102,0.5) 100%)' },
  { id: 'forest',   style: 'linear-gradient(135deg, rgba(0,212,255,0.45) 0%, rgba(0,212,255,0.35) 50%, rgba(6,95,70,0.5) 100%)' },
  { id: 'ember',    style: 'linear-gradient(135deg, rgba(239,68,68,0.5) 0%, rgba(0,212,255,0.3) 50%, rgba(234,88,12,0.4) 100%)' },
  { id: 'aurora',   style: 'linear-gradient(135deg, rgba(99,102,241,0.5) 0%, rgba(0,212,255,0.3) 40%, rgba(236,72,153,0.35) 100%)' },
  { id: 'midnight', style: 'linear-gradient(135deg, rgba(15,23,42,0.9) 0%, rgba(30,27,75,0.8) 50%, rgba(17,24,39,0.9) 100%)' },
  { id: 'rose',     style: 'linear-gradient(135deg, rgba(244,63,94,0.45) 0%, rgba(251,113,133,0.3) 50%, rgba(190,18,60,0.4) 100%)' },
]

export function getBannerStyle(user) {
  if (!user) return BANNER_PRESETS[0].style
  return BANNER_PRESETS.find(b => b.id === user.bannerGradient)?.style || BANNER_PRESETS[0].style
}
