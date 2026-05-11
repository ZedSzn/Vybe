// Vybe collectible badge SVG system
// Common → Rare → Epic → Legendary rarity tiers

export function BadgeSpark({ size = 64 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="vs_bg" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(253,224,71,0.2)"/>
          <stop offset="100%" stopColor="rgba(253,224,71,0)"/>
        </radialGradient>
        <linearGradient id="vs_bolt" x1="36" y1="4" x2="26" y2="60" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#ffffff"/>
          <stop offset="20%"  stopColor="#fef08a"/>
          <stop offset="60%"  stopColor="#facc15"/>
          <stop offset="100%" stopColor="#b45309"/>
        </linearGradient>
        <linearGradient id="vs_bolt2" x1="32" y1="10" x2="30" y2="46" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="rgba(255,255,255,0.9)"/>
          <stop offset="100%" stopColor="rgba(254,240,138,0.2)"/>
        </linearGradient>
        <filter id="vs_glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="blur"/>
          <feColorMatrix in="blur" type="matrix"
            values="1 0.8 0 0 0  0.9 0.7 0 0 0  0 0 0 0 0  0 0 0 0.9 0" result="cb"/>
          <feMerge><feMergeNode in="cb"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="vs_soft" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="1.5" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>
      <circle cx="32" cy="32" r="30" fill="url(#vs_bg)"/>
      <circle cx="32" cy="32" r="29" stroke="rgba(250,204,21,0.25)" strokeWidth="1" fill="none"/>
      {/* Main bolt */}
      <path d="M37 5 L19 33 H31 L26 59 L45 31 H33 Z" fill="url(#vs_bolt)" filter="url(#vs_glow)"/>
      {/* Inner highlight */}
      <path d="M34 11 L22 31 H30 L28 50 L39 31 H31 Z" fill="url(#vs_bolt2)" filter="url(#vs_soft)" opacity="0.55"/>
      {/* Spark particles */}
      <circle cx="49" cy="16" r="2.2" fill="#fef08a" opacity="0.85"/>
      <circle cx="13" cy="21" r="1.6" fill="#fef9c3" opacity="0.65"/>
      <circle cx="53" cy="38" r="1.3" fill="#facc15" opacity="0.5"/>
      <circle cx="9"  cy="46" r="1.9" fill="#fde047" opacity="0.4"/>
      {/* Electric arc */}
      <path d="M47 13 L51 17 L47 21" stroke="rgba(254,240,138,0.75)" strokeWidth="1.2" strokeLinecap="round" fill="none"/>
      <path d="M10 24 L7 27 L10 30" stroke="rgba(254,240,138,0.5)" strokeWidth="1" strokeLinecap="round" fill="none"/>
    </svg>
  )
}

export function BadgeStar({ size = 64 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="bst_bg" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="rgba(56,189,248,0.2)"/>
          <stop offset="100%" stopColor="rgba(56,189,248,0)"/>
        </radialGradient>
        <linearGradient id="bst_main" x1="32" y1="5" x2="32" y2="59" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#ffffff"/>
          <stop offset="20%"  stopColor="#bae6fd"/>
          <stop offset="60%"  stopColor="#0ea5e9"/>
          <stop offset="100%" stopColor="#075985"/>
        </linearGradient>
        <linearGradient id="bst_tail" x1="32" y1="32" x2="8" y2="56" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="rgba(186,230,253,0.85)"/>
          <stop offset="100%" stopColor="rgba(186,230,253,0)"/>
        </linearGradient>
        <filter id="bst_glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="blur"/>
          <feColorMatrix in="blur" type="matrix"
            values="0 0.2 0 0 0  0.4 0.8 1 0 0  0.8 1 1 0 0  0 0 0 0.8 0" result="cb"/>
          <feMerge><feMergeNode in="cb"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="bst_soft" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1.2" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>
      <circle cx="32" cy="32" r="30" fill="url(#bst_bg)"/>
      <circle cx="32" cy="32" r="29" stroke="rgba(56,189,248,0.28)" strokeWidth="1" fill="none"/>
      {/* Comet tail */}
      <path d="M32 32 L8 56" stroke="url(#bst_tail)" strokeWidth="3.5" strokeLinecap="round"/>
      {/* 8-point star */}
      <path d="M32,6 L34.6,20.4 L46.6,12.4 L39.6,25.4 L54,28 L39.6,30.6 L46.6,43.6 L34.6,35.6 L32,50 L29.4,35.6 L17.4,43.6 L24.4,30.6 L10,28 L24.4,25.4 L17.4,12.4 L29.4,20.4 Z"
        fill="url(#bst_main)" filter="url(#bst_glow)"/>
      {/* Specular */}
      <ellipse cx="26.5" cy="21" rx="4.5" ry="2.8" fill="white" opacity="0.38" transform="rotate(-30 26.5 21)"/>
      <ellipse cx="25" cy="19.5" rx="2" ry="1.2" fill="white" opacity="0.6" transform="rotate(-30 25 19.5)"/>
      {/* Sparkle diamonds */}
      <path d="M53 9  L54.5 11.5 L53 14  L51.5 11.5 Z" fill="rgba(186,230,253,0.95)" filter="url(#bst_soft)"/>
      <path d="M13 13 L14.2 15  L13 17  L11.8 15  Z"   fill="rgba(186,230,253,0.75)" filter="url(#bst_soft)"/>
      <path d="M55 45 L56  46.5 L55 48  L54  46.5 Z"   fill="rgba(186,230,253,0.65)" filter="url(#bst_soft)"/>
      <path d="M8  38 L9   39.5 L8  41  L7   39.5 Z"   fill="rgba(186,230,253,0.5)"  filter="url(#bst_soft)"/>
    </svg>
  )
}

export function BadgeFlame({ size = 64 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="bfl_bg" cx="50%" cy="72%" r="55%">
          <stop offset="0%"   stopColor="rgba(249,115,22,0.25)"/>
          <stop offset="100%" stopColor="rgba(239,68,68,0)"/>
        </radialGradient>
        <linearGradient id="bfl_outer" x1="32" y1="5" x2="32" y2="57" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#fef9c3"/>
          <stop offset="18%"  stopColor="#fbbf24"/>
          <stop offset="45%"  stopColor="#f97316"/>
          <stop offset="70%"  stopColor="#dc2626"/>
          <stop offset="90%"  stopColor="#991b1b"/>
          <stop offset="100%" stopColor="#450a0a"/>
        </linearGradient>
        <linearGradient id="bfl_mid" x1="32" y1="14" x2="32" y2="55" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#fef9c3"/>
          <stop offset="35%"  stopColor="#fde047"/>
          <stop offset="75%"  stopColor="#fb923c"/>
          <stop offset="100%" stopColor="#ea580c"/>
        </linearGradient>
        <linearGradient id="bfl_core" x1="32" y1="22" x2="32" y2="52" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#ffffff"/>
          <stop offset="55%"  stopColor="#fef9c3"/>
          <stop offset="100%" stopColor="#fde047"/>
        </linearGradient>
        <filter id="bfl_glow" x="-45%" y="-45%" width="190%" height="190%">
          <feGaussianBlur stdDeviation="3.5" result="blur"/>
          <feColorMatrix in="blur" type="matrix"
            values="1 0.4 0 0 0  0.35 0.15 0 0 0  0 0 0 0 0  0 0 0 0.9 0" result="cb"/>
          <feMerge><feMergeNode in="cb"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="bfl_soft" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1.2" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>
      <circle cx="32" cy="32" r="30" fill="url(#bfl_bg)"/>
      <circle cx="32" cy="32" r="29" stroke="rgba(249,115,22,0.35)" strokeWidth="1" fill="none"/>
      {/* Outer flame */}
      <path d="M32,5 C32,5 45,17 43,28 C41,37 48,36 44,44 C41,50 38,56 32,56 C26,56 23,50 20,44 C16,36 23,37 21,28 C19,17 32,5 32,5 Z"
        fill="url(#bfl_outer)" filter="url(#bfl_glow)"/>
      {/* Mid flame */}
      <path d="M32,15 C32,15 40,23 38,31 C36,38 41,38 39,44 C38,47 36,51 32,51 C28,51 26,47 25,44 C23,38 28,38 26,31 C24,23 32,15 32,15 Z"
        fill="url(#bfl_mid)" opacity="0.92"/>
      {/* Core flame */}
      <path d="M32,25 C32,25 37,30 35,35 C34,39 37,40 35,44 C34,46 33,47.5 32,47.5 C31,47.5 30,46 29,44 C27,40 30,39 29,35 C27,30 32,25 32,25 Z"
        fill="url(#bfl_core)"/>
      {/* Ember particles */}
      <circle cx="24" cy="9"  r="2.2" fill="#fbbf24" opacity="0.75" filter="url(#bfl_soft)"/>
      <circle cx="41" cy="7"  r="1.6" fill="#fde047" opacity="0.65" filter="url(#bfl_soft)"/>
      <circle cx="19" cy="17" r="1.3" fill="#fb923c" opacity="0.55" filter="url(#bfl_soft)"/>
      <circle cx="46" cy="19" r="1.1" fill="#fbbf24" opacity="0.45" filter="url(#bfl_soft)"/>
      <circle cx="14" cy="28" r="1"   fill="#f97316" opacity="0.4"  filter="url(#bfl_soft)"/>
    </svg>
  )
}

export function BadgeOrb({ size = 64 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="bor_bg" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="rgba(139,92,246,0.38)"/>
          <stop offset="60%"  stopColor="rgba(139,92,246,0.12)"/>
          <stop offset="100%" stopColor="rgba(139,92,246,0)"/>
        </radialGradient>
        <radialGradient id="bor_sphere" cx="33%" cy="28%" r="72%">
          <stop offset="0%"   stopColor="#ede9fe"/>
          <stop offset="25%"  stopColor="#c4b5fd"/>
          <stop offset="55%"  stopColor="#7c3aed"/>
          <stop offset="85%"  stopColor="#3b0764"/>
          <stop offset="100%" stopColor="#1e0038"/>
        </radialGradient>
        <radialGradient id="bor_inner" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="rgba(167,139,250,0.6)"/>
          <stop offset="100%" stopColor="rgba(109,40,217,0)"/>
        </radialGradient>
        <filter id="bor_glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4.5" result="blur"/>
          <feColorMatrix in="blur" type="matrix"
            values="0.4 0 0.6 0 0  0 0 0.9 0 0  0.9 0 1 0 0  0 0 0 0.85 0" result="cb"/>
          <feMerge><feMergeNode in="cb"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <clipPath id="bor_clip"><circle cx="32" cy="32" r="20"/></clipPath>
      </defs>
      {/* Ambient glow */}
      <circle cx="32" cy="32" r="30" fill="url(#bor_bg)"/>
      {/* Outer orbital rings */}
      <ellipse cx="32" cy="32" rx="28" ry="10" stroke="rgba(167,139,250,0.38)" strokeWidth="1.5" fill="none" transform="rotate(-22 32 32)"/>
      <ellipse cx="32" cy="32" rx="28" ry="10" stroke="rgba(167,139,250,0.22)" strokeWidth="1"   fill="none" transform="rotate(58 32 32)"/>
      {/* Outer ring border */}
      <circle cx="32" cy="32" r="29" stroke="rgba(167,139,250,0.3)" strokeWidth="1" fill="none"/>
      {/* Inner pre-glow */}
      <circle cx="32" cy="32" r="22" fill="url(#bor_inner)" filter="url(#bor_glow)"/>
      {/* Main sphere */}
      <circle cx="32" cy="32" r="20" fill="url(#bor_sphere)" filter="url(#bor_glow)"/>
      <circle cx="32" cy="32" r="20" stroke="rgba(196,181,253,0.65)" strokeWidth="1.5" fill="none"/>
      {/* Energy swirls inside sphere */}
      <g clipPath="url(#bor_clip)">
        <path d="M17,25 Q27,20 38,29 Q49,38 44,47" stroke="rgba(237,233,254,0.42)" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
        <path d="M20,40 Q32,33 44,38" stroke="rgba(237,233,254,0.26)" strokeWidth="1.2" strokeLinecap="round" fill="none"/>
        <path d="M24,18 Q30,28 22,36" stroke="rgba(237,233,254,0.2)" strokeWidth="1" strokeLinecap="round" fill="none"/>
      </g>
      {/* Specular highlight */}
      <ellipse cx="25.5" cy="23.5" rx="6.5" ry="4" fill="white" opacity="0.32" transform="rotate(-22 25.5 23.5)"/>
      <ellipse cx="23.5" cy="22"   rx="2.5" ry="1.5" fill="white" opacity="0.55" transform="rotate(-22 23.5 22)"/>
      {/* Electric arcs */}
      <path d="M7  19 L9.5 21.5 L7  24" stroke="rgba(167,139,250,0.75)" strokeWidth="1.2" strokeLinecap="round" fill="none"/>
      <path d="M57 40 L54.5 42.5 L57 45" stroke="rgba(167,139,250,0.6)"  strokeWidth="1.2" strokeLinecap="round" fill="none"/>
      <path d="M14 52 L16.5 54 L14 56" stroke="rgba(167,139,250,0.5)"  strokeWidth="1"   strokeLinecap="round" fill="none"/>
      <path d="M52 8  L54 10 L52 12"  stroke="rgba(167,139,250,0.45)" strokeWidth="1"   strokeLinecap="round" fill="none"/>
    </svg>
  )
}

export function BadgeCrown({ size = 64 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="bcr_bg" cx="50%" cy="48%" r="52%">
          <stop offset="0%"   stopColor="rgba(251,191,36,0.42)"/>
          <stop offset="55%"  stopColor="rgba(251,191,36,0.15)"/>
          <stop offset="100%" stopColor="rgba(251,191,36,0)"/>
        </radialGradient>
        <linearGradient id="bcr_body" x1="32" y1="14" x2="32" y2="50" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#fef9c3"/>
          <stop offset="20%"  stopColor="#fde68a"/>
          <stop offset="50%"  stopColor="#f59e0b"/>
          <stop offset="78%"  stopColor="#b45309"/>
          <stop offset="100%" stopColor="#78350f"/>
        </linearGradient>
        <linearGradient id="bcr_base" x1="12" y1="47" x2="52" y2="53" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#92400e"/>
          <stop offset="30%"  stopColor="#fde68a"/>
          <stop offset="50%"  stopColor="#fef9c3"/>
          <stop offset="70%"  stopColor="#fde68a"/>
          <stop offset="100%" stopColor="#92400e"/>
        </linearGradient>
        <filter id="bcr_glow" x="-55%" y="-55%" width="210%" height="210%">
          <feGaussianBlur stdDeviation="5.5" result="blur"/>
          <feColorMatrix in="blur" type="matrix"
            values="1 0.7 0 0 0  0.8 0.5 0 0 0  0 0 0 0 0  0 0 0 0.8 0" result="cb"/>
          <feMerge><feMergeNode in="cb"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="bcr_soft" x="-25%" y="-25%" width="150%" height="150%">
          <feGaussianBlur stdDeviation="1.8" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>
      {/* Strong golden ambient glow */}
      <circle cx="32" cy="32" r="30" fill="url(#bcr_bg)"/>
      {/* Pre-glow for the crown */}
      <circle cx="32" cy="31" r="22" fill="rgba(251,191,36,0.1)" filter="url(#bcr_glow)"/>
      {/* Outer ring */}
      <circle cx="32" cy="32" r="29" stroke="rgba(251,191,36,0.38)" strokeWidth="1.5" fill="none"/>
      {/* Crown body */}
      <path d="M11 49 L15 25 L24 39 L32 15 L40 39 L49 25 L53 49 Z"
        fill="url(#bcr_body)" filter="url(#bcr_glow)"/>
      {/* Crown inner highlight */}
      <path d="M20 45 L23 30 L28 39 L32 22 L36 39 L41 30 L44 45 Z"
        fill="rgba(254,249,195,0.18)"/>
      {/* Base band */}
      <rect x="11" y="46" width="42" height="9" rx="3" fill="url(#bcr_base)"/>
      {/* Base band top highlight */}
      <rect x="11" y="46" width="42" height="3.5" rx="2" fill="rgba(254,243,199,0.45)"/>
      {/* Base band gems (diamonds) */}
      <circle cx="21" cy="51" r="1.8" fill="#e0f2fe" opacity="0.9"/>
      <circle cx="32" cy="51" r="1.8" fill="#e0f2fe" opacity="0.9"/>
      <circle cx="43" cy="51" r="1.8" fill="#e0f2fe" opacity="0.9"/>
      {/* GEM — Top center: ruby */}
      <circle cx="32" cy="14" r="5" fill="#ef4444"/>
      <circle cx="32" cy="14" r="5" stroke="rgba(254,202,202,0.85)" strokeWidth="1.2"/>
      <ellipse cx="30" cy="12.2" rx="1.8" ry="1.1" fill="rgba(255,255,255,0.65)"/>
      {/* GEM — Left: sapphire */}
      <circle cx="15" cy="24" r="4" fill="#3b82f6"/>
      <circle cx="15" cy="24" r="4" stroke="rgba(191,219,254,0.85)" strokeWidth="1"/>
      <ellipse cx="13.5" cy="22.5" rx="1.4" ry="0.9" fill="rgba(255,255,255,0.55)"/>
      {/* GEM — Right: emerald */}
      <circle cx="49" cy="24" r="4" fill="#10b981"/>
      <circle cx="49" cy="24" r="4" stroke="rgba(167,243,208,0.85)" strokeWidth="1"/>
      <ellipse cx="47.5" cy="22.5" rx="1.4" ry="0.9" fill="rgba(255,255,255,0.55)"/>
      {/* GEM — Left inner: amethyst */}
      <circle cx="24" cy="38" r="3" fill="#a855f7"/>
      <circle cx="24" cy="38" r="3" stroke="rgba(233,213,255,0.75)" strokeWidth="0.8"/>
      <ellipse cx="23" cy="36.8" rx="1.1" ry="0.7" fill="rgba(255,255,255,0.5)"/>
      {/* GEM — Right inner: aquamarine */}
      <circle cx="40" cy="38" r="3" fill="#06b6d4"/>
      <circle cx="40" cy="38" r="3" stroke="rgba(165,243,252,0.75)" strokeWidth="0.8"/>
      <ellipse cx="39" cy="36.8" rx="1.1" ry="0.7" fill="rgba(255,255,255,0.5)"/>
      {/* 4-point sparkle stars at corners */}
      <path d="M6 10 L7 13 L10 14 L7 15 L6 18 L5 15 L2 14 L5 13 Z" fill="rgba(253,224,71,0.9)" filter="url(#bcr_soft)"/>
      <path d="M58 7  L58.8 9.5 L61.3 10.3 L58.8 11.1 L58 13.6 L57.2 11.1 L54.7 10.3 L57.2 9.5 Z" fill="rgba(253,224,71,0.8)" filter="url(#bcr_soft)"/>
      <path d="M5 53  L5.8 55.5 L8.3 56.3 L5.8 57.1 L5 59.6 L4.2 57.1 L1.7 56.3 L4.2 55.5 Z" fill="rgba(253,224,71,0.65)" filter="url(#bcr_soft)"/>
      <path d="M59 50 L59.7 52 L61.7 52.7 L59.7 53.4 L59 55.4 L58.3 53.4 L56.3 52.7 L58.3 52 Z" fill="rgba(253,224,71,0.6)" filter="url(#bcr_soft)"/>
    </svg>
  )
}

export function VybeBadge({ id, size = 64 }) {
  if (id === 'spark') return <BadgeSpark size={size} />
  if (id === 'star')  return <BadgeStar  size={size} />
  if (id === 'flame') return <BadgeFlame size={size} />
  if (id === 'orb')   return <BadgeOrb   size={size} />
  if (id === 'crown') return <BadgeCrown size={size} />
  return <BadgeSpark size={size} />
}

export default VybeBadge
