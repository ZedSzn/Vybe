/**
 * ProfilePill — compact user identity chip for the Vybe app.
 *
 * <ProfilePill
 *   username="ZZ_NZ"
 *   avatarUrl="/avatars/zz.jpg"
 *   isOnline={true}
 *   isVerified={true}
 *   pillStyle="glass"
 *   friendStatus="none"
 *   onAddFriend={() => sendFriendRequest(userId)}
 * />
 *
 * Props:
 *   username     : string
 *   avatarUrl    : string (optional — falls back to gradient initials)
 *   isOnline     : boolean
 *   isVerified   : boolean
 *   pillStyle    : 'glass' | 'minimal' | 'gradient' | 'outline' | 'compact'
 *   friendStatus : 'none' | 'pending' | 'friends' | 'self'  ('self' hides the + button)
 *   onAddFriend  : () => void   (parent owns the state)
 *   bannerStyle  : string (optional — CSS background; overrides pillStyle's background)
 *   bannerImage  : string (optional — image layered over bannerStyle)
 */

const ACCENT  = '#00D4FF'
const PURPLE  = '#7C3AED'
const PAGE_BG = '#0a0a0f'

// 12-point sunburst outline for the verified badge.
function sunburstPath(cx, cy, outer, inner, points) {
  const step = Math.PI / points
  let d = ''
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outer : inner
    const a = i * step - Math.PI / 2
    d += `${i === 0 ? 'M' : 'L'}${(cx + r * Math.cos(a)).toFixed(2)} ${(cy + r * Math.sin(a)).toFixed(2)}`
  }
  return `${d}Z`
}
const STAR_PATH = sunburstPath(8, 8, 8, 5.7, 12)

function VerifiedBadge({ size }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" role="img" aria-label="Verified" style={{ flexShrink: 0 }}>
      <path d={STAR_PATH} fill={ACCENT} />
      <path d="M5.05 8.15 L6.95 10 L11 5.6" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

const PlusGlyph = () => (
  <svg width="100%" height="100%" viewBox="0 0 14 14" fill="none">
    <path d="M7 2.6 V11.4 M2.6 7 H11.4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
)

const CheckGlyph = () => (
  <svg width="100%" height="100%" viewBox="0 0 14 14" fill="none">
    <path d="M3 7.4 L5.9 10.3 L11 4.2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

// pillStyle → container treatment
const PILL_STYLES = {
  glass:    { background: 'rgba(255,255,255,0.05)',                       border: '1px solid rgba(0,212,255,0.25)',   backdropFilter: 'blur(12px)' },
  minimal:  { background: '#0d0d18',                                      border: '1px solid #1e1e2e' },
  gradient: { background: `linear-gradient(135deg, ${PURPLE}, ${ACCENT})`, border: '1px solid rgba(124,58,237,0.4)' },
  outline:  { background: 'transparent',                                  border: `1.5px solid ${ACCENT}` },
  compact:  { background: 'rgba(255,255,255,0.05)',                       border: '1px solid rgba(0,212,255,0.25)',   backdropFilter: 'blur(12px)' },
}

// "+" button look per style, used only when a request can be sent (friendStatus === 'none').
const ADD_BTN_STYLES = {
  glass:    { background: ACCENT,                                          color: PAGE_BG, border: 'none' },
  minimal:  { background: 'transparent',                                   color: ACCENT,  border: `1.5px solid ${ACCENT}` },
  gradient: { background: `linear-gradient(135deg, ${PURPLE}, ${ACCENT})`,  color: '#fff',  border: 'none' },
  outline:  { background: ACCENT,                                          color: PAGE_BG, border: 'none' },
  compact:  { background: ACCENT,                                          color: PAGE_BG, border: 'none' },
}

export default function ProfilePill({
  username = '',
  avatarUrl,
  isOnline = false,
  isVerified = false,
  pillStyle = 'glass',
  friendStatus = 'none',
  onAddFriend,
  bannerStyle,
  bannerImage,
}) {
  const compact = pillStyle === 'compact'
  const AVATAR  = compact ? 26 : 32
  const TEXT    = compact ? 12 : 14
  const BTN     = compact ? 22 : 28
  const DOT     = compact ? 7  : 9
  const GAP     = compact ? 7  : 9

  const initials   = (username.trim() || '?').slice(0, 2).toUpperCase()
  const locked     = friendStatus === 'pending' || friendStatus === 'friends'
  const showButton = friendStatus !== 'self'
  const useBanner  = !!bannerStyle

  // Friend-request button visual state
  let btnVisual
  if (friendStatus === 'friends') {
    btnVisual = { background: 'rgba(34,197,94,0.18)', border: '1px solid rgba(34,197,94,0.45)', color: '#4ade80' }
  } else if (friendStatus === 'pending') {
    btnVisual = { background: '#1e1e2e', border: '1px solid #2a2a3a', color: '#7a7a8c' }
  } else {
    btnVisual = ADD_BTN_STYLES[pillStyle] || ADD_BTN_STYLES.glass
  }

  const container = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: GAP,
    padding: compact ? '4px 10px 4px 4px' : '6px 14px 6px 6px',
    borderRadius: 999,
    fontFamily: "'Sora', system-ui, sans-serif",
    ...(useBanner
      ? { position: 'relative', overflow: 'hidden', background: bannerStyle, border: '1px solid rgba(255,255,255,0.18)' }
      : (PILL_STYLES[pillStyle] || PILL_STYLES.glass)),
  }

  const content = (
    <>
      {/* Avatar + online dot */}
      <div style={{ position: 'relative', flexShrink: 0, width: AVATAR, height: AVATAR }}>
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={username}
            style={{ width: AVATAR, height: AVATAR, borderRadius: '50%', objectFit: 'cover', display: 'block', border: '2px solid rgba(255,255,255,0.1)' }}
          />
        ) : (
          <div
            style={{
              width: AVATAR, height: AVATAR, borderRadius: '50%',
              background: `linear-gradient(135deg, ${PURPLE}, ${ACCENT})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontWeight: 700, fontSize: compact ? 10 : 12, letterSpacing: '-0.02em',
            }}
          >
            {initials}
          </div>
        )}
        {isOnline && (
          <span
            role="img"
            aria-label="Online"
            style={{
              position: 'absolute', right: -1, bottom: -1,
              width: DOT, height: DOT, borderRadius: '50%',
              background: '#22c55e', border: `2px solid ${PAGE_BG}`,
              boxShadow: '0 0 6px rgba(34,197,94,0.8)',
            }}
          />
        )}
      </div>

      {/* Username */}
      <span style={{ color: '#fff', fontWeight: 700, fontSize: TEXT, lineHeight: 1, whiteSpace: 'nowrap', letterSpacing: '-0.01em' }}>
        {username || 'User'}
      </span>

      {/* Verified badge */}
      {isVerified && <VerifiedBadge size={compact ? 13 : 16} />}

      {/* Friend-request button */}
      {showButton && (
        <button
          type="button"
          onClick={locked ? undefined : onAddFriend}
          disabled={locked}
          aria-label={friendStatus === 'friends' ? 'Friends' : friendStatus === 'pending' ? 'Friend request pending' : 'Add friend'}
          className={`transition-transform duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/50 ${
            locked ? 'cursor-default' : 'cursor-pointer hover:scale-110 active:scale-90'
          }`}
          style={{
            width: BTN, height: BTN, borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: compact ? 5 : 7,
            flexShrink: 0,
            ...btnVisual,
          }}
        >
          {friendStatus === 'none' ? <PlusGlyph /> : <CheckGlyph />}
        </button>
      )}
    </>
  )

  return (
    <div style={container}>
      {useBanner && bannerImage && (
        <img src={bannerImage} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' }} />
      )}
      {useBanner
        ? <div style={{ position: 'relative', zIndex: 1, display: 'inline-flex', alignItems: 'center', gap: GAP }}>{content}</div>
        : content}
    </div>
  )
}
