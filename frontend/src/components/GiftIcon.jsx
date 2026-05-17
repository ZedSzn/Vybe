// Shared gift catalog + custom SVG gift-box icons for the Vybe gifting system.

export const GIFTS = [
  { id: 'small-vybe',     name: 'Small Vybe',     subtitle: 'Show some love',       coins: 50,   tier: 'Starter', color: '#00D4FF' },
  { id: 'vybe',           name: 'Vybe',           subtitle: 'Solid support',        coins: 100,  tier: 'Starter', color: '#7C3AED' },
  { id: 'big-vybe',       name: 'Big Vybe',       subtitle: 'Making an impression', coins: 250,  tier: 'Popular', color: '#00D4FF' },
  { id: 'mega-vybe',      name: 'Mega Vybe',      subtitle: 'Top tier energy',      coins: 500,  tier: 'Popular', color: '#7C3AED' },
  { id: 'ultra-vybe',     name: 'Ultra Vybe',     subtitle: "You're the real one",  coins: 1000, tier: 'Premium', color: '#f59e0b' },
  { id: 'legendary-vybe', name: 'Legendary Vybe', subtitle: 'Absolute legend',      coins: 5000, tier: 'Premium', color: '#f59e0b' },
]

export const GIFT_TIERS = ['Starter', 'Popular', 'Premium']

// Custom SVG gift-box icon for each gift.
export function GiftIcon({ id, size = 28 }) {
  const p = { width: size, height: size, viewBox: '0 0 48 48', fill: 'none' }
  switch (id) {
    case 'small-vybe': return (
      <svg {...p}>
        <rect x="10" y="22" width="28" height="20" rx="2" fill="#001a2e" stroke="#00D4FF" strokeWidth="1.2" />
        <rect x="8" y="18" width="32" height="6" rx="1.5" fill="#001a2e" stroke="#00D4FF" strokeWidth="1.2" />
        <line x1="24" y1="18" x2="24" y2="42" stroke="#00D4FF" strokeWidth="1.2" />
        <path d="M24 18 C24 18 20 14 17 15 C14 16 15 20 18 19 C21 18 24 18 24 18Z" fill="none" stroke="#00D4FF" strokeWidth="1" strokeLinecap="round" />
        <path d="M24 18 C24 18 28 14 31 15 C34 16 33 20 30 19 C27 18 24 18 24 18Z" fill="none" stroke="#00D4FF" strokeWidth="1" strokeLinecap="round" />
      </svg>
    )
    case 'vybe': return (
      <svg {...p}>
        <rect x="9" y="22" width="30" height="21" rx="2" fill="#0d0022" stroke="#7C3AED" strokeWidth="1.2" />
        <rect x="7" y="17" width="34" height="7" rx="1.5" fill="#0d0022" stroke="#7C3AED" strokeWidth="1.2" />
        <line x1="24" y1="17" x2="24" y2="43" stroke="#7C3AED" strokeWidth="1.2" />
        <path d="M24 17 C24 17 19 12 16 13 C13 14 14 19 17 18 C20 17 24 17 24 17Z" fill="rgba(124,58,237,0.2)" stroke="#7C3AED" strokeWidth="1" strokeLinecap="round" />
        <path d="M24 17 C24 17 29 12 32 13 C35 14 34 19 31 18 C28 17 24 17 24 17Z" fill="rgba(124,58,237,0.2)" stroke="#7C3AED" strokeWidth="1" strokeLinecap="round" />
      </svg>
    )
    case 'big-vybe': return (
      <svg {...p}>
        <rect x="8" y="21" width="32" height="22" rx="2" fill="#001a2e" stroke="#00D4FF" strokeWidth="1.3" />
        <rect x="6" y="16" width="36" height="7" rx="1.5" fill="#001a2e" stroke="#00D4FF" strokeWidth="1.3" />
        <line x1="24" y1="16" x2="24" y2="43" stroke="#7C3AED" strokeWidth="1.5" />
        <path d="M24 16 C24 16 18 10 15 11 C11 12 12 18 16 17 C20 16 24 16 24 16Z" fill="rgba(0,212,255,0.15)" stroke="#00D4FF" strokeWidth="1.1" strokeLinecap="round" />
        <path d="M24 16 C24 16 30 10 33 11 C37 12 36 18 32 17 C28 16 24 16 24 16Z" fill="rgba(0,212,255,0.15)" stroke="#00D4FF" strokeWidth="1.1" strokeLinecap="round" />
      </svg>
    )
    case 'mega-vybe': return (
      <svg {...p}>
        <rect x="7" y="20" width="34" height="23" rx="2.5" fill="#0d0022" stroke="#7C3AED" strokeWidth="1.4" />
        <rect x="5" y="15" width="38" height="7" rx="2" fill="#0d0022" stroke="#7C3AED" strokeWidth="1.4" />
        <line x1="24" y1="15" x2="24" y2="43" stroke="#00D4FF" strokeWidth="1.5" />
        <path d="M24 15 C24 15 17 8 13 9 C9 10 10 17 15 16 C19 15 24 15 24 15Z" fill="rgba(124,58,237,0.25)" stroke="#7C3AED" strokeWidth="1.2" />
        <path d="M24 15 C24 15 31 8 35 9 C39 10 38 17 33 16 C29 15 24 15 24 15Z" fill="rgba(124,58,237,0.25)" stroke="#7C3AED" strokeWidth="1.2" />
        <circle cx="24" cy="31" r="3" fill="none" stroke="#00D4FF" strokeWidth="1" />
        <circle cx="24" cy="31" r="1.2" fill="#7C3AED" />
      </svg>
    )
    case 'ultra-vybe': return (
      <svg {...p}>
        <rect x="6" y="19" width="36" height="24" rx="3" fill="#1a1000" stroke="#f59e0b" strokeWidth="1.5" />
        <rect x="4" y="14" width="40" height="7" rx="2" fill="#1a1000" stroke="#f59e0b" strokeWidth="1.5" />
        <line x1="24" y1="14" x2="24" y2="43" stroke="#f59e0b" strokeWidth="1.5" />
        <path d="M24 14 C24 14 16 6 12 7 C7 8 8 16 13 15 C18 14 24 14 24 14Z" fill="rgba(245,158,11,0.2)" stroke="#f59e0b" strokeWidth="1.3" />
        <path d="M24 14 C24 14 32 6 36 7 C41 8 40 16 35 15 C30 14 24 14 24 14Z" fill="rgba(245,158,11,0.2)" stroke="#f59e0b" strokeWidth="1.3" />
        <circle cx="24" cy="30" r="3.5" fill="none" stroke="#f59e0b" strokeWidth="1.2" />
        <circle cx="24" cy="30" r="1.5" fill="#f59e0b" />
      </svg>
    )
    case 'legendary-vybe': return (
      <svg {...p}>
        <rect x="5" y="18" width="38" height="25" rx="3" fill="#1a1000" stroke="#f59e0b" strokeWidth="1.8" />
        <rect x="3" y="13" width="42" height="7" rx="2" fill="#1a1000" stroke="#f59e0b" strokeWidth="1.8" />
        <line x1="24" y1="13" x2="24" y2="43" stroke="#f59e0b" strokeWidth="2" />
        <path d="M24 13 C24 13 15 4 10 5 C5 6 6 15 12 14 C17 13 24 13 24 13Z" fill="rgba(245,158,11,0.3)" stroke="#f59e0b" strokeWidth="1.5" />
        <path d="M24 13 C24 13 33 4 38 5 C43 6 42 15 36 14 C31 13 24 13 24 13Z" fill="rgba(245,158,11,0.3)" stroke="#f59e0b" strokeWidth="1.5" />
        <circle cx="24" cy="29" r="4" fill="none" stroke="#00D4FF" strokeWidth="1.2" />
        <circle cx="24" cy="29" r="2" fill="#f59e0b" />
        <circle cx="24" cy="29" r="0.8" fill="#fff" />
        <path d="M8 3 L9.5 7 M40 3 L38.5 7 M3 9 L6 10.5 M45 9 L42 10.5" stroke="#f59e0b" strokeWidth="1" strokeLinecap="round" opacity="0.8" />
      </svg>
    )
    default: return null
  }
}
