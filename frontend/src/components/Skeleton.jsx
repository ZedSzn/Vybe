const shimmerStyle = {
  background: 'linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.09) 50%, rgba(255,255,255,0.04) 75%)',
  backgroundSize: '200% 100%',
  animation: 'vybe-shimmer 1.6s ease-in-out infinite',
}

export function Skeleton({ className = '', style = {}, rounded = 'rounded-xl' }) {
  return (
    <div className={`${rounded} ${className}`} style={{ ...shimmerStyle, ...style }} />
  )
}

// Preset skeletons for common patterns
export function SkeletonText({ lines = 2, className = '' }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className="h-3"
          style={{ width: i === lines - 1 ? '60%' : '100%', ...shimmerStyle }}
        />
      ))}
    </div>
  )
}

export function SkeletonCard({ className = '', children }) {
  return (
    <div
      className={`rounded-2xl p-5 border border-white/5 ${className}`}
      style={{ background: 'linear-gradient(160deg, #0d0d1c 0%, #09091a 100%)' }}
    >
      {children}
    </div>
  )
}

export function SkeletonAvatar({ size = 10 }) {
  return (
    <div
      className={`w-${size} h-${size} rounded-full flex-shrink-0`}
      style={shimmerStyle}
    />
  )
}

// Global shimmer keyframe injected once
if (typeof document !== 'undefined' && !document.getElementById('vybe-shimmer-style')) {
  const el = document.createElement('style')
  el.id = 'vybe-shimmer-style'
  el.textContent = `
    @keyframes vybe-shimmer {
      0%   { background-position: 200% center }
      100% { background-position: -200% center }
    }
  `
  document.head.appendChild(el)
}
