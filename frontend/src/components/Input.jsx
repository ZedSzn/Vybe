// Unified input components — consistent focus ring, sizing, error states.
// All inputs follow the same visual language: dark fill, purple focus glow.

const BASE_INPUT = `
  w-full bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.09)]
  rounded-[12px] px-4 py-2.5 text-sm text-white placeholder-[#55606e]
  outline-none transition-[border-color,box-shadow] duration-[180ms]
  focus:border-[rgba(124,58,237,0.55)] focus:shadow-[0_0_0_3px_rgba(124,58,237,0.12),0_0_12px_rgba(124,58,237,0.08)]
`.replace(/\s+/g, ' ').trim()

const ERROR_INPUT = `
  border-[rgba(239,68,68,0.5)] focus:border-[rgba(239,68,68,0.7)]
  focus:shadow-[0_0_0_3px_rgba(239,68,68,0.12)]
`.replace(/\s+/g, ' ').trim()

function Label({ children, required }) {
  return (
    <label className="block text-[10px] font-bold text-[#55606e] uppercase tracking-[0.06em] mb-1.5">
      {children}
      {required && <span className="text-red-400 ml-0.5">*</span>}
    </label>
  )
}

function ErrorMsg({ message }) {
  if (!message) return null
  return <p className="mt-1.5 text-[11px] text-red-400 font-medium">{message}</p>
}

export function TextInput({
  label,
  error,
  required,
  className = '',
  containerClassName = '',
  ...props
}) {
  return (
    <div className={containerClassName}>
      {label && <Label required={required}>{label}</Label>}
      <input
        className={`${BASE_INPUT} ${error ? ERROR_INPUT : ''} ${className}`}
        {...props}
      />
      <ErrorMsg message={error} />
    </div>
  )
}

export function PasswordInput({ label, error, required, className = '', containerClassName = '', ...props }) {
  return (
    <div className={containerClassName}>
      {label && <Label required={required}>{label}</Label>}
      <input
        type="password"
        className={`${BASE_INPUT} ${error ? ERROR_INPUT : ''} ${className}`}
        {...props}
      />
      <ErrorMsg message={error} />
    </div>
  )
}

export function TextareaInput({ label, error, required, rows = 3, className = '', containerClassName = '', ...props }) {
  return (
    <div className={containerClassName}>
      {label && <Label required={required}>{label}</Label>}
      <textarea
        rows={rows}
        className={`${BASE_INPUT} resize-none ${error ? ERROR_INPUT : ''} ${className}`}
        {...props}
      />
      <ErrorMsg message={error} />
    </div>
  )
}

export function SelectInput({ label, error, required, children, className = '', containerClassName = '', ...props }) {
  return (
    <div className={containerClassName}>
      {label && <Label required={required}>{label}</Label>}
      <select
        className={`${BASE_INPUT} ${error ? ERROR_INPUT : ''} ${className}`}
        style={{ background: 'rgba(255,255,255,0.05)' }}
        {...props}
      >
        {children}
      </select>
      <ErrorMsg message={error} />
    </div>
  )
}

// Chat-style message input (no label, rounder, slightly larger)
export function ChatInput({ className = '', ...props }) {
  return (
    <input
      className={`
        w-full bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)]
        rounded-[14px] px-4 py-3 text-sm text-white placeholder-[#55606e]
        outline-none transition-[border-color,box-shadow] duration-[180ms]
        focus:border-[rgba(124,58,237,0.45)] focus:shadow-[0_0_0_3px_rgba(124,58,237,0.10)]
        ${className}
      `}
      {...props}
    />
  )
}

// Search input with icon slot
export function SearchInput({ icon, className = '', containerClassName = '', ...props }) {
  return (
    <div className={`relative ${containerClassName}`}>
      {icon && (
        <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#55606e]">
          {icon}
        </span>
      )}
      <input
        className={`${BASE_INPUT} ${icon ? 'pl-9' : ''} ${className}`}
        {...props}
      />
    </div>
  )
}
