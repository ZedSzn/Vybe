import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'

const VARIANTS = {
  primary: {
    base: 'text-white font-extrabold',
    style: {
      background: 'linear-gradient(140deg, #2065f5 0%, #1454e0 55%, #0f44cc 100%)',
      boxShadow: '0 0 0 1px rgba(0,184,224,0.2), 0 0 24px rgba(0,212,255,0.35)',
    },
    hover: { boxShadow: '0 0 0 1px rgba(0,184,224,0.55), 0 0 36px rgba(0,212,255,0.6), 0 8px 28px rgba(14,68,204,0.4)' },
  },
  purple: {
    base: 'text-white font-extrabold',
    style: {
      background: 'linear-gradient(140deg, #7c3aed 0%, #6d28d9 55%, #5b21b6 100%)',
      boxShadow: '0 0 0 1px rgba(167,139,250,0.2), 0 0 24px rgba(124,58,237,0.35)',
    },
    hover: { boxShadow: '0 0 0 1px rgba(167,139,250,0.45), 0 0 36px rgba(124,58,237,0.55)' },
  },
  secondary: {
    base: 'text-white/80 font-semibold hover:text-white',
    style: { background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)' },
    hover: { background: 'rgba(255,255,255,0.11)' },
  },
  ghost: {
    base: 'text-vybe-muted font-semibold hover:text-white',
    style: { background: 'transparent', border: '1px solid rgba(255,255,255,0.10)' },
    hover: { borderColor: 'rgba(255,255,255,0.22)', background: 'rgba(255,255,255,0.04)' },
  },
  danger: {
    base: 'text-white font-extrabold',
    style: { background: '#dc2626', boxShadow: '0 0 20px rgba(220,38,38,0.28)' },
    hover: { boxShadow: '0 0 32px rgba(220,38,38,0.45)' },
  },
  success: {
    base: 'text-white font-extrabold',
    style: { background: '#059669', boxShadow: '0 0 20px rgba(5,150,105,0.28)' },
    hover: { boxShadow: '0 0 32px rgba(5,150,105,0.45)' },
  },
  glass: {
    base: 'text-white/70 font-semibold hover:text-white',
    style: { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)' },
    hover: { background: 'rgba(255,255,255,0.09)' },
  },
}

const SIZES = {
  xs: 'px-3 py-1.5 text-[11px] rounded-[10px] gap-1.5',
  sm: 'px-4 py-2 text-xs rounded-[10px] gap-2',
  md: 'px-5 py-2.5 text-sm rounded-[12px] gap-2',
  lg: 'px-7 py-3.5 text-base rounded-[14px] gap-2.5',
}

export default function Button({
  variant  = 'primary',
  size     = 'md',
  loading  = false,
  disabled = false,
  icon,
  iconRight,
  children,
  className = '',
  style: extraStyle = {},
  onClick,
  type     = 'button',
  ...rest
}) {
  const v = VARIANTS[variant] || VARIANTS.primary
  const s = SIZES[size] || SIZES.md
  const isDisabled = disabled || loading

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      whileHover={isDisabled ? {} : { scale: 1.03, ...v.hover }}
      whileTap={isDisabled ? {} : { scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 450, damping: 22 }}
      className={`inline-flex items-center justify-center ${s} ${v.base} transition-opacity select-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      style={{ ...v.style, ...extraStyle }}
      {...rest}
    >
      {loading ? (
        <Loader2 size={14} className="animate-spin flex-shrink-0" />
      ) : icon ? (
        <span className="flex-shrink-0">{icon}</span>
      ) : null}
      {children && <span>{children}</span>}
      {!loading && iconRight && <span className="flex-shrink-0">{iconRight}</span>}
    </motion.button>
  )
}

// Icon-only square variant
export function IconButton({ variant = 'glass', size = 9, children, className = '', ...rest }) {
  const v = VARIANTS[variant] || VARIANTS.glass
  return (
    <motion.button
      whileHover={{ scale: 1.08, ...v.hover }}
      whileTap={{ scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 500, damping: 25 }}
      className={`w-${size} h-${size} rounded-icon flex items-center justify-center flex-shrink-0 transition-colors ${v.base} ${className}`}
      style={v.style}
      {...rest}
    >
      {children}
    </motion.button>
  )
}
