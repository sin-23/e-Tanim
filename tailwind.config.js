/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{vue,js,ts}'
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['Nunito', 'system-ui', 'sans-serif'],
        mono:    ['DM Mono', 'Consolas', 'monospace'],
        sans:    ['Nunito', 'system-ui', 'sans-serif'],
      },
      colors: {
        garden: {
          // Base
          void:     '#F4F8F5',  // page background
          base:     '#EEF3F0',  // muted tint layer (was "muted")
          surface:  '#FFFFFF',  // primary white surface / card
          card:     '#FFFFFF',  // card fill
          border:   '#D8E8DE',  // soft border
          muted:    '#6B8070',  // de-emphasized ui elements (muted-foreground)

          // Text
          text:     '#1A2E22',  // primary body text / foreground
          dim:      '#6B8070',  // secondary / captions (muted-foreground)

          // Brand / accent
          primary:  '#2D7A4F',  // primary green
          live:     '#22C55E',  // active/live indicator (success)
          sky:      '#3B9DD2',  // accent blue
          earth:    '#8B5E3C',  // earth tone

          // Plant identities
          tomato:   '#EF4444',
          okra:     '#22C55E',
          eggplant: '#9C6BAE',

          // Status
          warn:     '#F59E0B',
          danger:   '#EF4444',
          good:     '#22C55E',
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
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0' },
          to:   { opacity: '1' }
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to:   { opacity: '1', transform: 'translateY(0)' }
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
