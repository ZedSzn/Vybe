/**
 * ProfilePill — compact glass identity chip for the Vybe app (overlay size).
 *
 * <ProfilePill
 *   username="ZZ_NZ"
 *   avatarUrl="/avatars/zz.jpg"
 *   isOnline={true}
 *   isVerified={true}
 *   friendStatus="none"
 *   onAddFriend={() => sendFriendRequest(userId)}
 * />
 *
 * Props:
 *   username     : string
 *   avatarUrl    : string (optional — falls back to gradient initials)
 *   isOnline     : boolean
 *   isVerified   : boolean
 *   friendStatus : 'none' | 'pending' | 'friends' | 'self'
 *                  ('self' = the current user's own pill — hides the + button)
 *   onAddFriend  : () => void   (parent owns the friendStatus state)
 *
 * On the chat page, place inside the camera-panel wrapper:
 *   <div style={{ position: 'absolute', top: 10, left: 10 }}><ProfilePill .../></div>
 */

const ACCENT  = '#00D4FF'
const PURPLE  = '#7C3AED'
const PAGE_BG = '#0a0a0f'

function VerifiedBadge() {
  return (
    <svg width="12" height="12" viewBox="0 0 40 40" fill="none" role="img" aria-label="Verified" style={{ flexShrink: 0 }}>
      <path d="M20 2L24.1 7.2L30.6 5.4L31.4 12.1L37.6 14.9L34.8 21L37.6 27.1L31.4 29.9L30.6 36.6L24.1 34.8L20 40L15.9 34.8L9.4 36.6L8.6 29.9L2.4 27.1L5.2 21L2.4 14.9L8.6 12.1L9.4 5.4L15.9 7.2Z" fill={ACCENT} />
      <path d="M13 21l5 5 10-10" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// friendStatus → friend-request button look
const FRIEND_BTN = {
  none:    { background: ACCENT,                color: PAGE_BG,   glyph: '+' },
  pending: { background: '#1e1e2e',             color: '#555',    glyph: '✓' },
  friends: { background: 'rgba(34,197,94,0.2)', color: '#22c55e', glyph: '✓' },
}

export default function ProfilePill({
  username = '',
  avatarUrl,
  isOnline = false,
  isVerified = false,
  friendStatus = 'none',
  onAddFriend,
}) {
  const initials   = (username.trim() || '?').slice(0, 2).toUpperCase()
  const showButton = friendStatus !== 'self'
  const locked     = friendStatus === 'pending' || friendStatus === 'friends'
  const btn        = FRIEND_BTN[friendStatus] || FRIEND_BTN.none

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '4px 8px 4px 4px',
        borderRadius: 50,
        background: 'rgba(255,255,255,0.07)',
        border: '1px solid rgba(0,212,255,0.3)',
        fontFamily: "'Sora', system-ui, sans-serif",
      }}
    >
      {/* Avatar + online dot */}
      <div style={{ position: 'relative', width: 24, height: 24, flexShrink: 0 }}>
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={username}
            style={{ width: 24, height: 24, borderRadius: '50%', objectFit: 'cover', display: 'block' }}
          />
        ) : (
          <div
            style={{
              width: 24, height: 24, borderRadius: '50%',
              background: `linear-gradient(135deg, ${PURPLE}, ${ACCENT})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontWeight: 700, fontSize: 9, letterSpacing: '-0.02em',
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
              width: 7, height: 7, borderRadius: '50%',
              background: '#22c55e', border: `1.5px solid ${PAGE_BG}`,
            }}
          />
        )}
      </div>

      {/* Username */}
      <span style={{ color: '#fff', fontWeight: 700, fontSize: 11, lineHeight: 1, whiteSpace: 'nowrap' }}>
        {username || 'User'}
      </span>

      {/* Verified badge */}
      {isVerified && <VerifiedBadge />}

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
            width: 20, height: 20, borderRadius: '50%', border: 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16, fontWeight: 700, lineHeight: 1, flexShrink: 0,
            background: btn.background, color: btn.color,
            pointerEvents: locked ? 'none' : 'auto',
          }}
        >
          {btn.glyph}
        </button>
      )}
    </div>
  )
}
