/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{vue,js,ts}'
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        display: ['Nunito', 'system-ui', 'sans-serif'],
        mono:    ['DM Mono', 'Consolas', 'monospace'],
        sans:    ['Nunito', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Backed by CSS variables (see src/style.css) so every existing
        // `garden-*` utility automatically re-themes when `.dark` is toggled
        // on <html> — no need to sprinkle dark: variants everywhere.
        garden: {
          void:     'rgb(var(--garden-void) / <alpha-value>)',
          base:     'rgb(var(--garden-base) / <alpha-value>)',
          surface:  'rgb(var(--garden-surface) / <alpha-value>)',
          card:     'rgb(var(--garden-card) / <alpha-value>)',
          border:   'rgb(var(--garden-border) / <alpha-value>)',
          muted:    'rgb(var(--garden-muted) / <alpha-value>)',

          text:     'rgb(var(--garden-text) / <alpha-value>)',
          dim:      'rgb(var(--garden-dim) / <alpha-value>)',

          primary:  'rgb(var(--garden-primary) / <alpha-value>)',
          live:     'rgb(var(--garden-live) / <alpha-value>)',
          sky:      'rgb(var(--garden-sky) / <alpha-value>)',
          earth:    'rgb(var(--garden-earth) / <alpha-value>)',

          tomato:   'rgb(var(--garden-tomato) / <alpha-value>)',
          okra:     'rgb(var(--garden-okra) / <alpha-value>)',
          eggplant: 'rgb(var(--garden-eggplant) / <alpha-value>)',

          warn:     'rgb(var(--garden-warn) / <alpha-value>)',
          danger:   'rgb(var(--garden-danger) / <alpha-value>)',
          good:     'rgb(var(--garden-good) / <alpha-value>)',
        }
      },
      borderRadius: {
        sm: '8px',
        md: '12px',
        lg: '16px',
        xl: '20px',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in':    'fadeIn 0.6s ease forwards',
        'slide-up':   'slideUp 0.5s ease forwards',
        'loading-bar': 'loadingBar 1s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0' },
          to:   { opacity: '1' }
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to:   { opacity: '1', transform: 'translateY(0)' }
        },
        loadingBar: {
          '0%':   { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(300%)' }
        }
      },
      boxShadow: {
        'glow-tomato':   '0 0 24px 0 rgba(217, 79,  79,  0.14)',
        'glow-okra':     '0 0 24px 0 rgba(46,  158, 110, 0.14)',
        'glow-eggplant': '0 0 24px 0 rgba(156, 107, 174, 0.14)',
        'glow-live':     '0 0 12px 0 rgba(0,   165, 80,  0.28)',
        'card':          '0 2px 16px 0 rgba(27,  58, 42,  0.08)',
      }
    }
  },
  plugins: []
}