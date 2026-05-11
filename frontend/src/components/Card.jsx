// Unified card surface component.
// Three elevation levels matching the layering system in tailwind.config.js

const VARIANTS = {
  glass: {
    background: 'rgba(8, 8, 18, 0.94)',
    backdropFilter: 'blur(32px) saturate(1.6)',
    WebkitBackdropFilter: 'blur(32px) saturate(1.6)',
    border: '1px solid rgba(255, 255, 255, 0.07)',
    boxShadow: '0 4px 32px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.05)',
  },
  solid: {
    background: '#0d0d1b',
    border: '1px solid #181828',
    boxShadow: '0 4px 24px rgba(0,0,0,0.45)',
  },
  elevated: {
    background: '#101020',
    border: '1px solid rgba(255,255,255,0.08)',
    boxShadow: '0 8px 48px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06)',
  },
  flat: {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.06)',
  },
  glow: {
    background: '#0d0d1b',
    border: '1px solid rgba(124,58,237,0.25)',
    boxShadow: '0 4px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(124,58,237,0.12)',
  },
}

const RADII = {
  sm:   '12px',
  md:   '16px',
  lg:   '20px',
  xl:   '24px',
  '2xl':'28px',
  '3xl':'32px',
}

export default function Card({
  variant  = 'glass',
  radius   = 'lg',
  padding  = true,
  children,
  className = '',
  style: extraStyle = {},
  onClick,
  ...rest
}) {
  const v = VARIANTS[variant] || VARIANTS.glass
  const r = RADII[radius]    || RADII.lg

  return (
    <div
      onClick={onClick}
      className={`${padding ? 'p-5' : ''} ${onClick ? 'cursor-pointer' : ''} ${className}`}
      style={{ ...v, borderRadius: r, ...extraStyle }}
      {...rest}
    >
      {children}
    </div>
  )
}

// Convenience labeled section inside a card
export function CardSection({ title, action, children, className = '' }) {
  return (
    <div className={`space-y-3 ${className}`}>
      {(title || action) && (
        <div className="flex items-center justify-between">
          {title && <h3 className="text-sm font-black text-white">{title}</h3>}
          {action}
        </div>
      )}
      {children}
    </div>
  )
}
