/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      // ── Color Palette ─────────────────────────────────────────────────────
      colors: {
        // Backgrounds — layered surface system
        'vybe-bg':    '#0a0a0f',
        'vybe-bg2':   '#0d0d18',
        'vybe-card':  '#111120',
        'vybe-card2': '#131328',
        'vybe-card3': '#16162e',

        // Borders
        'vybe-border':    '#1e1e2e',
        'vybe-border2':   '#252538',
        'vybe-border-hi': 'rgba(255,255,255,0.10)',

        // Brand cyan (primary CTA)
        'vybe-blue':        '#00D4FF',
        'vybe-blue-light':  '#00B8E0',
        'vybe-blue-dark':   '#0099BB',
        'vybe-blue-faint':  'rgba(0,212,255,0.12)',

        // Brand purple (accent)
        'vybe-purple':       '#7c3aed',
        'vybe-purple-light': '#a78bfa',
        'vybe-purple-dark':  '#5b21b6',
        'vybe-purple-faint': 'rgba(124,58,237,0.12)',

        // Text
        'vybe-text':    '#FFFFFF',
        'vybe-muted':   '#888899',
        'vybe-subtle':  '#1e1e2e',

        // Semantic
        'vybe-success': '#00FF87',
        'vybe-danger':  '#FF4444',
        'vybe-warn':    '#FFB800',
      },

      // ── Spacing Scale (4px base) ───────────────────────────────────────────
      // Extends default Tailwind spacing; no overrides needed.
      // Semantic aliases for consistent component spacing:
      spacing: {
        'btn-sm-x':   '12px',
        'btn-sm-y':   '6px',
        'btn-md-x':   '20px',
        'btn-md-y':   '10px',
        'btn-lg-x':   '28px',
        'btn-lg-y':   '14px',
        'card-pad':   '20px',
        'section-x':  '16px',
        'section-y':  '24px',
      },

      // ── Border Radius Scale ────────────────────────────────────────────────
      borderRadius: {
        'btn':    '12px',   // standard button
        'card':   '16px',   // panel cards
        'card-lg':'20px',   // main content cards
        'modal':  '20px',   // modals/overlays
        'pill':   '9999px', // pills/tags
        'icon':   '10px',   // icon buttons
      },

      // ── Typography ─────────────────────────────────────────────────────────
      fontFamily: {
        space: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'label': ['10px', { lineHeight: '14px', letterSpacing: '0.06em', fontWeight: '700' }],
        'tag':   ['11px', { lineHeight: '16px', letterSpacing: '0.02em', fontWeight: '600' }],
        'body':  ['14px', { lineHeight: '1.6',  letterSpacing: '0'       }],
        'ui':    ['13px', { lineHeight: '1.4',  letterSpacing: '-0.01em' }],
        'h1':    ['28px', { lineHeight: '1.15', letterSpacing: '-0.03em', fontWeight: '900' }],
        'h2':    ['22px', { lineHeight: '1.2',  letterSpacing: '-0.025em', fontWeight: '800' }],
        'h3':    ['17px', { lineHeight: '1.3',  letterSpacing: '-0.02em', fontWeight: '700' }],
      },

      // ── Shadows / Elevation ────────────────────────────────────────────────
      boxShadow: {
        // Glow system — brand blue
        'glow-sm':  '0 0 18px rgba(0,212,255,0.28)',
        'glow-md':  '0 0 36px rgba(0,212,255,0.38)',
        'glow-lg':  '0 0 72px rgba(0,212,255,0.46)',
        'glow-xl':  '0 0 120px rgba(0,212,255,0.52)',
        // Glow system — purple
        'glow-purple-sm': '0 0 18px rgba(124,58,237,0.28)',
        'glow-purple-md': '0 0 36px rgba(124,58,237,0.38)',
        'glow-purple-lg': '0 0 72px rgba(124,58,237,0.46)',
        // Legacy aliases
        'purple':    '0 0 40px rgba(0,212,255,0.36)',
        'purple-sm': '0 0 22px rgba(0,212,255,0.26)',
        'purple-lg': '0 0 72px rgba(0,212,255,0.46)',
        // Elevation system
        'lift-1':  '0 2px 12px rgba(0,0,0,0.4)',
        'lift-2':  '0 4px 24px rgba(0,0,0,0.5)',
        'lift-3':  '0 8px 48px rgba(0,0,0,0.6)',
        // Cards
        'card':    '0 4px 32px rgba(0,0,0,0.55), 0 1px 0 rgba(255,255,255,0.04) inset',
        'card-hi': '0 4px 32px rgba(0,0,0,0.55), 0 0 0 1px rgba(124,58,237,0.25)',
        'float':   '0 8px 56px rgba(0,0,0,0.65)',
        // Inset glass highlight
        'inset-hi': 'inset 0 1px 0 rgba(255,255,255,0.08)',
      },

      // ── Transitions ────────────────────────────────────────────────────────
      transitionDuration: {
        '80':  '80ms',
        '120': '120ms',
        '200': '200ms',
        '280': '280ms',
        '350': '350ms',
        '400': '400ms',
        '500': '500ms',
      },
      transitionTimingFunction: {
        'spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        'smooth': 'cubic-bezier(0.22, 1, 0.36, 1)',
        'in-out': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },

      // ── Animations ─────────────────────────────────────────────────────────
      animation: {
        'pulse-ring':   'pulse-ring 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow':         'cta-glow 2.8s ease-in-out infinite alternate',
        'fade-in':      'dropdown-appear 0.18s ease-out',
        'slide-up':     'slide-up 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
        'slide-down':   'slide-down 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
        'scale-in':     'scale-in 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
        'match-flash':  'match-flash 0.8s ease-out forwards',
      },
      keyframes: {
        'pulse-ring': {
          '0%':   { boxShadow: '0 0 0 0 rgba(0, 212, 255, 0.5)' },
          '70%':  { boxShadow: '0 0 0 22px rgba(0, 212, 255, 0)' },
          '100%': { boxShadow: '0 0 0 0 rgba(0, 212, 255, 0)' },
        },
        'slide-up': {
          from: { transform: 'translateY(16px)', opacity: '0' },
          to:   { transform: 'translateY(0)',    opacity: '1' },
        },
        'slide-down': {
          from: { transform: 'translateY(-16px)', opacity: '0' },
          to:   { transform: 'translateY(0)',     opacity: '1' },
        },
        'scale-in': {
          from: { transform: 'scale(0.92)', opacity: '0' },
          to:   { transform: 'scale(1)',    opacity: '1' },
        },
        'match-flash': {
          '0%':   { opacity: '0.9', transform: 'scale(0.96)' },
          '50%':  { opacity: '1',   transform: 'scale(1)' },
          '100%': { opacity: '0',   transform: 'scale(1.04)' },
        },
      },

      // ── Max-width breakpoints for ultrawide ────────────────────────────────
      maxWidth: {
        'content': '1280px',
        'wide':    '1440px',
        'chat':    '1600px',
      },
    },
  },
  plugins: [],
}
