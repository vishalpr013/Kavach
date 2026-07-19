/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Base palette — charcoal/near-black background matching vishalpr.is-a.dev
        surface: {
          900: '#0D0F12',   // Deepest background
          800: '#14161A',   // Primary background
          700: '#1A1D23',   // Card/panel background
          600: '#22262E',   // Elevated surface
          500: '#2A2F3A',   // Borders, dividers
          400: '#3A4050',   // Subtle borders
          300: '#4A5060',   // Muted text backgrounds
        },
        // Accent palette — amber/copper from reference site
        amber: {
          DEFAULT: '#D97706',
          50:  '#FFF8EB',
          100: '#FEECC7',
          200: '#FDD888',
          300: '#FCBF49',
          400: '#F59E0B',
          500: '#D97706',
          600: '#B45309',
          700: '#92400E',
          800: '#78350F',
          900: '#633112',
        },
        // Risk state colors — muted, not neon
        risk: {
          critical: '#DC4A4A',  // Muted red for high-risk
          high:     '#E07A3A',  // Orange-red
          elevated: '#D99A2B',  // Amber-ish
          moderate: '#7C8A3E',  // Olive/muted yellow-green
          low:      '#4A7C5C',  // Desaturated green
        },
        // Text colors
        text: {
          primary:   '#E8E6E1',  // Warm off-white
          secondary: '#9CA3AF',  // Muted gray
          muted:     '#6B7280',  // Subtle gray
          accent:    '#F59E0B',  // Amber accent text
        },
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        mono:    ['"JetBrains Mono"', '"Fira Code"', 'monospace'],
        sans:    ['"Inter"', 'system-ui', 'sans-serif'],
      },
      animation: {
        'score-pulse': 'score-pulse 0.6s ease-out',
        'fade-in': 'fade-in 0.3s ease-out',
        'slide-up': 'slide-up 0.4s ease-out',
        'shimmer': 'shimmer 2s infinite linear',
      },
      keyframes: {
        'score-pulse': {
          '0%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.08)', opacity: '0.8' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
}
