// Shared camera (virtual) background presets — used by ProfilePage and ChatPage.
// `type` drives how ChatPage composites the background onto the segmented canvas.
export const CAMERA_BG_PRESETS = [
  { id: 'none',   label: 'None',   icon: '🚫', type: 'none',   preview: 'rgba(255,255,255,0.04)' },
  { id: 'blur',   label: 'Blur',   icon: '💭', type: 'blur',   preview: 'linear-gradient(135deg, #2a2a3e 0%, #14141f 100%)' },
  { id: 'space',  label: 'Space',  icon: '🌌', type: 'colors', colors: ['#0a0014', '#1a0030', '#000814'], preview: 'linear-gradient(135deg, #0a0014 0%, #1a0030 50%, #000814 100%)' },
  { id: 'sunset', label: 'Sunset', icon: '🌅', type: 'colors', colors: ['#ff6b35', '#f7c59f', '#ff6b9d'], preview: 'linear-gradient(135deg, #ff6b35 0%, #f7c59f 50%, #ff6b9d 100%)' },
  { id: 'ocean',  label: 'Ocean',  icon: '🌊', type: 'colors', colors: ['#0077b6', '#00b4d8', '#90e0ef'], preview: 'linear-gradient(135deg, #0077b6 0%, #00b4d8 50%, #90e0ef 100%)' },
  { id: 'forest', label: 'Forest', icon: '🌲', type: 'colors', colors: ['#1b4332', '#2d6a4f', '#74c69d'], preview: 'linear-gradient(135deg, #1b4332 0%, #2d6a4f 50%, #74c69d 100%)' },
  { id: 'neon',   label: 'Neon',   icon: '⚡', type: 'colors', colors: ['#0d001a', '#7c3aed', '#00ffcc'], preview: 'linear-gradient(135deg, #0d001a 0%, #7c3aed 50%, #00ffcc 100%)' },
  { id: 'custom', label: 'Custom', icon: '🖼', type: 'custom', preview: 'rgba(0,212,255,0.12)' },
]

export function getCameraBgPreset(id) {
  return CAMERA_BG_PRESETS.find(p => p.id === id) || CAMERA_BG_PRESETS[0]
}
