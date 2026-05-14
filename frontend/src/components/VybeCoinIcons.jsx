/**
 * VybeCoinIcons — 5 distinct coin icons for different financial contexts.
 * Each shares the layered coin structure of VybeCoin but has a unique
 * color palette and symbol so users can tell them apart at a glance.
 *
 * CoinBalance  — gold/amber  "V"   — overall coin balance display
 * CoinSpend    — blue        "⚡"  — spending / using coins
 * CoinReward   — purple      "★"   — rewards: login, streaks, referrals
 * CoinEarn     — green       "↑"   — earnings: tips received, cashable coins
 * CoinCashout  — teal        "£"   — withdrawals / cash out
 */

const coinStyle = { display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }

// ── Gold — coin balance ────────────────────────────────────────────────────────
export function CoinBalance({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" style={coinStyle}>
      <circle cx="8" cy="8" r="7.5" fill="#92400e" />
      <circle cx="8" cy="8" r="6.8" fill="#d97706" />
      <circle cx="8" cy="8" r="5.8" fill="#f59e0b" />
      <circle cx="8" cy="8" r="5"   fill="#fbbf24" opacity="0.45" />
      <ellipse cx="6.4" cy="5.6" rx="1.9" ry="1.3" fill="#fef3c7" opacity="0.65" />
      <text x="8" y="11.4" textAnchor="middle" fontSize="7" fontWeight="900"
        fill="#78350f" fontFamily="Arial, Helvetica, sans-serif" letterSpacing="-0.5">V</text>
    </svg>
  )
}

// ── Blue — spending ────────────────────────────────────────────────────────────
export function CoinSpend({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" style={coinStyle}>
      <circle cx="8" cy="8" r="7.5" fill="#004466" />
      <circle cx="8" cy="8" r="6.8" fill="#00D4FF" />
      <circle cx="8" cy="8" r="5.8" fill="#00D4FF" />
      <circle cx="8" cy="8" r="5"   fill="#00B8E0" opacity="0.4" />
      <ellipse cx="6.4" cy="5.6" rx="1.9" ry="1.3" fill="#dbeafe" opacity="0.55" />
      {/* Lightning bolt — spend/action */}
      <path
        d="M9.1 3.8 L6.2 8.6 H8.4 L6.9 12.2 L10.6 7.0 H8.3 L9.5 3.8 Z"
        fill="#004466"
      />
    </svg>
  )
}

// ── Purple — rewards ───────────────────────────────────────────────────────────
export function CoinReward({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" style={coinStyle}>
      <circle cx="8" cy="8" r="7.5" fill="#4c1d95" />
      <circle cx="8" cy="8" r="6.8" fill="#7c3aed" />
      <circle cx="8" cy="8" r="5.8" fill="#8b5cf6" />
      <circle cx="8" cy="8" r="5"   fill="#a78bfa" opacity="0.4" />
      <ellipse cx="6.4" cy="5.6" rx="1.9" ry="1.3" fill="#ede9fe" opacity="0.55" />
      {/* 5-point star */}
      <polygon
        points="8,4.6 8.85,7.1 11.5,7.1 9.35,8.65 10.15,11.1 8,9.55 5.85,11.1 6.65,8.65 4.5,7.1 7.15,7.1"
        fill="#4c1d95"
      />
    </svg>
  )
}

// ── Green — earnings / cashable coins ─────────────────────────────────────────
export function CoinEarn({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" style={coinStyle}>
      <circle cx="8" cy="8" r="7.5" fill="#14532d" />
      <circle cx="8" cy="8" r="6.8" fill="#16a34a" />
      <circle cx="8" cy="8" r="5.8" fill="#00D4FF" />
      <circle cx="8" cy="8" r="5"   fill="#4ade80" opacity="0.4" />
      <ellipse cx="6.4" cy="5.6" rx="1.9" ry="1.3" fill="#dcfce7" opacity="0.55" />
      {/* Upward arrow — incoming/earning */}
      <path
        d="M8 4.2 L5.4 7.2 H7.2 V11.8 H8.8 V7.2 H10.6 Z"
        fill="#14532d"
      />
    </svg>
  )
}

// ── Teal — cash out / withdrawal ──────────────────────────────────────────────
export function CoinCashout({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" style={coinStyle}>
      <circle cx="8" cy="8" r="7.5" fill="#134e4a" />
      <circle cx="8" cy="8" r="6.8" fill="#0d9488" />
      <circle cx="8" cy="8" r="5.8" fill="#14b8a6" />
      <circle cx="8" cy="8" r="5"   fill="#2dd4bf" opacity="0.4" />
      <ellipse cx="6.4" cy="5.6" rx="1.9" ry="1.3" fill="#ccfbf1" opacity="0.55" />
      {/* £ pound sign — cash/withdrawal */}
      <text x="8" y="11.3" textAnchor="middle" fontSize="7.5" fontWeight="900"
        fill="#134e4a" fontFamily="Arial, Helvetica, sans-serif">£</text>
    </svg>
  )
}
