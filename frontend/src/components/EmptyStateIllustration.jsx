// Branded SVG illustrations for empty states.
// Each variant has its own subtle animation and uses Vybe's purple/blue palette.

function Ring({ r, delay = 0, opacity = 0.18 }) {
  return (
    <circle cx="60" cy="60" r={r} fill="none" stroke="rgba(139,92,246,0.45)" strokeWidth="1"
      style={{ animation: `es-ring 3s ease-in-out ${delay}s infinite`, opacity,
        transformOrigin: '60px 60px' }} />
  )
}

const shared = `
  @keyframes es-ring   { 0%,100%{ transform:scale(1); opacity:0.18 } 50%{ transform:scale(1.06); opacity:0.32 } }
  @keyframes es-float  { 0%,100%{ transform:translateY(0) } 50%{ transform:translateY(-5px) } }
  @keyframes es-pulse  { 0%,100%{ opacity:0.55 } 50%{ opacity:1 } }
  @keyframes es-spin   { to{ transform:rotate(360deg) } }
  @keyframes es-bounce { 0%,100%{ transform:translateY(0) } 40%{ transform:translateY(-8px) } 70%{ transform:translateY(-3px) } }
  @keyframes es-trail  { 0%{ stroke-dashoffset:80 } 100%{ stroke-dashoffset:0 } }
`

// ── Notifications ──────────────────────────────────────────────────────────
function NotificationsIllustration() {
  return (
    <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <style>{shared}</style>
      <Ring r={44} delay={0} />
      <Ring r={36} delay={0.5} opacity={0.1} />
      {/* Bell body */}
      <g style={{ animation: 'es-float 3.5s ease-in-out infinite', transformOrigin: '60px 60px' }}>
        <path d="M60 28 C60 28 42 38 42 58 L42 70 L38 74 L82 74 L78 70 L78 58 C78 38 60 28 60 28Z"
          fill="rgba(124,58,237,0.18)" stroke="rgba(139,92,246,0.65)" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M54 74 C54 77.3 56.7 80 60 80 C63.3 80 66 77.3 66 74"
          fill="rgba(124,58,237,0.25)" stroke="rgba(139,92,246,0.65)" strokeWidth="1.5" />
        {/* Handle */}
        <line x1="60" y1="28" x2="60" y2="22" stroke="rgba(139,92,246,0.5)" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="60" cy="20" r="3" fill="rgba(139,92,246,0.4)" />
      </g>
      {/* Sparkles */}
      <g style={{ animation: 'es-pulse 2s ease-in-out infinite' }}>
        <text x="28" y="46" fontSize="10" textAnchor="middle" fill="rgba(167,139,250,0.7)">✦</text>
        <text x="92" y="50" fontSize="8"  textAnchor="middle" fill="rgba(167,139,250,0.5)">✦</text>
        <text x="88" y="34" fontSize="6"  textAnchor="middle" fill="rgba(167,139,250,0.4)">✦</text>
      </g>
    </svg>
  )
}

// ── Friends ────────────────────────────────────────────────────────────────
function FriendsIllustration() {
  return (
    <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <style>{shared}</style>
      <Ring r={44} delay={0} />
      {/* Person 1 (left) */}
      <g style={{ animation: 'es-float 3.2s ease-in-out 0s infinite', transformOrigin: '42px 60px' }}>
        <circle cx="42" cy="46" r="9" fill="rgba(124,58,237,0.25)" stroke="rgba(139,92,246,0.7)" strokeWidth="1.5" />
        <path d="M26 74 C26 64 34 60 42 60 C50 60 58 64 58 74"
          fill="rgba(124,58,237,0.18)" stroke="rgba(139,92,246,0.65)" strokeWidth="1.5" strokeLinecap="round" />
      </g>
      {/* Person 2 (right) */}
      <g style={{ animation: 'es-float 3.2s ease-in-out 0.8s infinite', transformOrigin: '78px 60px' }}>
        <circle cx="78" cy="46" r="9" fill="rgba(0,212,255,0.25)" stroke="rgba(0,184,224,0.7)" strokeWidth="1.5" />
        <path d="M62 74 C62 64 70 60 78 60 C86 60 94 64 94 74"
          fill="rgba(0,212,255,0.18)" stroke="rgba(0,184,224,0.65)" strokeWidth="1.5" strokeLinecap="round" />
      </g>
      {/* + in the middle */}
      <g style={{ animation: 'es-pulse 2s ease-in-out infinite' }}>
        <circle cx="60" cy="60" r="9" fill="rgba(124,58,237,0.3)" stroke="rgba(139,92,246,0.6)" strokeWidth="1.5" />
        <line x1="60" y1="55" x2="60" y2="65" stroke="rgba(167,139,250,0.9)" strokeWidth="1.8" strokeLinecap="round" />
        <line x1="55" y1="60" x2="65" y2="60" stroke="rgba(167,139,250,0.9)" strokeWidth="1.8" strokeLinecap="round" />
      </g>
    </svg>
  )
}

// ── Wallet / Transactions ──────────────────────────────────────────────────
function WalletIllustration() {
  return (
    <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <style>{shared}</style>
      <Ring r={44} delay={0} />
      <Ring r={32} delay={1} opacity={0.1} />
      {/* Coin */}
      <g style={{ animation: 'es-bounce 2.8s ease-in-out infinite', transformOrigin: '60px 60px' }}>
        <circle cx="60" cy="60" r="22" fill="rgba(251,191,36,0.12)" stroke="rgba(251,191,36,0.5)" strokeWidth="1.5" />
        <circle cx="60" cy="60" r="17" fill="rgba(251,191,36,0.08)" stroke="rgba(251,191,36,0.25)" strokeWidth="1" />
        <text x="60" y="65" fontSize="16" fontWeight="bold" textAnchor="middle" fill="rgba(251,191,36,0.8)">V</text>
      </g>
      {/* Upward arrow trail */}
      <g style={{ animation: 'es-pulse 2s ease-in-out 0.5s infinite' }}>
        <path d="M60 32 L60 20 M60 20 L54 26 M60 20 L66 26"
          stroke="rgba(167,139,250,0.7)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </g>
      {/* Stars */}
      <text x="30" y="44" fontSize="9" fill="rgba(251,191,36,0.4)" style={{ animation: 'es-pulse 2.5s ease-in-out 0.3s infinite' }}>✦</text>
      <text x="86" y="50" fontSize="7" fill="rgba(251,191,36,0.35)" style={{ animation: 'es-pulse 2.5s ease-in-out 0.9s infinite' }}>✦</text>
    </svg>
  )
}

// ── Messages ───────────────────────────────────────────────────────────────
function MessagesIllustration() {
  return (
    <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <style>{shared}</style>
      <Ring r={44} delay={0} />
      {/* Main bubble */}
      <g style={{ animation: 'es-float 3s ease-in-out infinite', transformOrigin: '60px 58px' }}>
        <rect x="30" y="36" width="52" height="36" rx="10"
          fill="rgba(0,212,255,0.18)" stroke="rgba(0,184,224,0.65)" strokeWidth="1.5" />
        <path d="M44 72 L38 82 L52 72" fill="rgba(0,212,255,0.18)" stroke="rgba(0,184,224,0.65)" strokeWidth="1.5" strokeLinejoin="round" />
        {/* Dots inside bubble */}
        <circle cx="48" cy="54" r="3" fill="rgba(0,184,224,0.6)" />
        <circle cx="60" cy="54" r="3" fill="rgba(0,184,224,0.6)" style={{ animation: 'es-pulse 1.2s ease-in-out 0.2s infinite' }} />
        <circle cx="72" cy="54" r="3" fill="rgba(0,184,224,0.6)" style={{ animation: 'es-pulse 1.2s ease-in-out 0.4s infinite' }} />
      </g>
    </svg>
  )
}

// ── Badges ────────────────────────────────────────────────────────────────
function BadgesIllustration() {
  return (
    <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <style>{shared}</style>
      <Ring r={44} delay={0} />
      <Ring r={34} delay={1.2} opacity={0.1} />
      {/* Trophy */}
      <g style={{ animation: 'es-float 3.5s ease-in-out infinite', transformOrigin: '60px 55px' }}>
        <path d="M42 32 L78 32 L74 58 C74 66 67 72 60 72 C53 72 46 66 46 58 Z"
          fill="rgba(251,191,36,0.12)" stroke="rgba(251,191,36,0.5)" strokeWidth="1.5" strokeLinejoin="round" />
        {/* Handles */}
        <path d="M42 32 C36 32 32 38 32 44 C32 50 36 54 42 54"
          fill="none" stroke="rgba(251,191,36,0.4)" strokeWidth="1.5" />
        <path d="M78 32 C84 32 88 38 88 44 C88 50 84 54 78 54"
          fill="none" stroke="rgba(251,191,36,0.4)" strokeWidth="1.5" />
        {/* Base */}
        <path d="M52 72 L52 80 L68 80 L68 72" fill="rgba(251,191,36,0.12)" stroke="rgba(251,191,36,0.4)" strokeWidth="1.5" />
        <line x1="46" y1="80" x2="74" y2="80" stroke="rgba(251,191,36,0.5)" strokeWidth="2" strokeLinecap="round" />
        {/* Star in trophy */}
        <text x="60" y="56" fontSize="16" textAnchor="middle" fill="rgba(251,191,36,0.7)" style={{ animation: 'es-pulse 2s ease-in-out infinite' }}>★</text>
      </g>
    </svg>
  )
}

// ── Requests ──────────────────────────────────────────────────────────────
function RequestsIllustration() {
  return (
    <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <style>{shared}</style>
      <Ring r={44} delay={0} />
      <g style={{ animation: 'es-float 3s ease-in-out infinite', transformOrigin: '60px 55px' }}>
        {/* Clock face */}
        <circle cx="60" cy="55" r="24" fill="rgba(124,58,237,0.1)" stroke="rgba(139,92,246,0.5)" strokeWidth="1.5" />
        <circle cx="60" cy="55" r="2" fill="rgba(139,92,246,0.8)" />
        {/* Clock hands */}
        <line x1="60" y1="55" x2="60" y2="40" stroke="rgba(139,92,246,0.9)" strokeWidth="1.8" strokeLinecap="round" />
        <line x1="60" y1="55" x2="70" y2="62" stroke="rgba(139,92,246,0.7)" strokeWidth="1.5" strokeLinecap="round" />
        {/* Tick marks */}
        {[0,30,60,90,120,150,180,210,240,270,300,330].map((deg, i) => {
          const r = deg * Math.PI / 180
          const x1 = 60 + 21 * Math.sin(r)
          const y1 = 55 - 21 * Math.cos(r)
          const x2 = 60 + 23 * Math.sin(r)
          const y2 = 55 - 23 * Math.cos(r)
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(139,92,246,0.35)" strokeWidth="1" />
        })}
      </g>
    </svg>
  )
}

// ── Main export ────────────────────────────────────────────────────────────
const VARIANTS = {
  notifications: NotificationsIllustration,
  friends:       FriendsIllustration,
  wallet:        WalletIllustration,
  messages:      MessagesIllustration,
  badges:        BadgesIllustration,
  requests:      RequestsIllustration,
}

export default function EmptyStateIllustration({ variant = 'notifications', size = 120 }) {
  const Component = VARIANTS[variant] || NotificationsIllustration
  const scale = size / 120
  return (
    <div style={{ width: size, height: size, transform: `scale(${scale})`, transformOrigin: 'top left', flexShrink: 0 }}>
      <Component />
    </div>
  )
}
