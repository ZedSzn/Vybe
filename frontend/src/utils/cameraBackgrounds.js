// Camera (virtual) background options — used by ProfilePage and ChatPage.
// Only a user-uploaded custom image is supported; 'none' disables the effect.
export const CAMERA_BG_PRESETS = [
  { id: 'none',   label: 'None',   icon: '🚫', type: 'none',   preview: 'rgba(255,255,255,0.04)' },
  { id: 'custom', label: 'Custom', icon: '🖼', type: 'custom', preview: 'rgba(0,212,255,0.12)' },
]
