/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'vybe-bg':    '#07070e',
        'vybe-bg2':   '#0a0a16',
        'vybe-card':  '#0d0d1b',
        'vybe-card2': '#101020',
        'vybe-border': '#181828',
        'vybe-purple':       '#1B62F5',
        'vybe-purple-light': '#4B88F7',
        'vybe-purple-dark':  '#0f44cc',
        'vybe-muted':  '#55606e',
        'vybe-subtle': '#252535',
      },
      fontFamily: {
        space: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'purple':    '0 0 40px rgba(27, 98, 245, 0.36)',
        'purple-sm': '0 0 22px rgba(27, 98, 245, 0.26)',
        'purple-lg': '0 0 72px rgba(27, 98, 245, 0.46)',
        'card':      '0 4px 32px rgba(0, 0, 0, 0.55), 0 1px 0 rgba(255,255,255,0.04) inset',
        'float':     '0 8px 56px rgba(0, 0, 0, 0.65)',
      },
      animation: {
        'pulse-ring': 'pulse-ring 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow':       'cta-glow 2.8s ease-in-out infinite alternate',
        'fade-in':    'dropdown-appear 0.18s ease-out',
        'slide-up':   'slide-up 0.4s ease-out',
      },
      keyframes: {
        'pulse-ring': {
          '0%':   { boxShadow: '0 0 0 0 rgba(27, 98, 245, 0.6)' },
          '70%':  { boxShadow: '0 0 0 22px rgba(27, 98, 245, 0)' },
          '100%': { boxShadow: '0 0 0 0 rgba(27, 98, 245, 0)' },
        },
        'slide-up': {
          'from': { transform: 'translateY(20px)', opacity: '0' },
          'to':   { transform: 'translateY(0)',    opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
