export function VybeCoin({ size = 14 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}
    >
      {/* Outer edge — deep bronze for depth */}
      <circle cx="8" cy="8" r="7.5" fill="#92400e" />
      {/* Main body — dark amber */}
      <circle cx="8" cy="8" r="6.8" fill="#d97706" />
      {/* Face — bright amber */}
      <circle cx="8" cy="8" r="5.8" fill="#f59e0b" />
      {/* Soft inner ring */}
      <circle cx="8" cy="8" r="5" fill="#fbbf24" opacity="0.5" />
      {/* Top-left shine highlight */}
      <ellipse cx="6.4" cy="5.6" rx="1.9" ry="1.3" fill="#fef3c7" opacity="0.65" />
      {/* Engraved V */}
      <text
        x="8"
        y="11.4"
        textAnchor="middle"
        fontSize="7"
        fontWeight="900"
        fill="#78350f"
        fontFamily="Arial, Helvetica, sans-serif"
        letterSpacing="-0.5"
      >V</text>
    </svg>
  )
}

export default VybeCoin
