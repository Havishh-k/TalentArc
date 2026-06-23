/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        surface: {
          bg:       '#0F1117',
          panel:    '#1A1D27',
          elevated: '#22263A',
          border:   '#2E3250',
        },
        brand: {
          primary:  '#6C63FF',
          glow:     '#8B85FF',
        },
        score: {
          semantic: '#6C63FF',
          career:   '#3ECFCF',
          velocity: '#A78BFA',
        },
        risk: {
          low:      '#22C55E',
          medium:   '#F59E0B',
          high:     '#EF4444',
        },
        gap: {
          fill:     '#F59E0B',
        },
        text: {
          primary:  '#F1F5F9',
          secondary:'#94A3B8',
          tertiary: '#475569',
        },
        state: {
          success:  '#22C55E',
          warning:  '#F59E0B',
          error:    '#EF4444',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        card: '0 0 0 1px rgba(108, 99, 255, 0.0), 0 4px 24px rgba(0,0,0,0.4)',
        'card-hover': '0 0 0 1px rgba(108, 99, 255, 0.3), 0 8px 32px rgba(108, 99, 255, 0.12)',
        'glow-sm': '0 0 12px rgba(108, 99, 255, 0.25)',
      },
      keyframes: {
        'fade-slide-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200px 0' },
          '100%': { backgroundPosition: 'calc(200px + 100%) 0' },
        },
        'expand-panel': {
          '0%': { maxHeight: '0', opacity: '0' },
          '100%': { maxHeight: '600px', opacity: '1' },
        },
      },
      animation: {
        'fade-slide-up': 'fade-slide-up 0.3s ease-out forwards',
        shimmer: 'shimmer 1.4s ease-in-out infinite',
        'expand-panel': 'expand-panel 0.35s cubic-bezier(0.4,0,0.2,1) forwards',
      },
    },
  },
  plugins: [],
}
