import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // ── Dark shell (outer chrome, always dark) ───────────────────────
        bg:          '#1C1917',   // near-black warm — topbars, pages, sidebars
        surface:     '#252220',   // card / panel surface on dark bg
        'surface-2': '#2E2A27',   // elevated / hover surface
        edge:        '#3A3530',   // borders on dark bg

        // ── Content areas (warm cream — content creation only) ───────────
        canvas:      '#F5F0E8',   // editor bg, scene blocks, preview frames
        'warm-edge': '#E8E4DE',   // borders inside canvas areas

        // ── Brand ────────────────────────────────────────────────────────
        accent:      '#E8623A',   // orange — primary CTA
        'accent-h':  '#D4532F',   // orange hover
        teal:        '#0D9488',   // completion / success
        'teal-l':    '#CCFBF1',   // teal light backgrounds
        violet:      '#7C3AED',   // step-3 transition accent
        muted:       '#8A8178',   // secondary text on dark
        live:        '#4CAF7D',   // active / live status
      },
      fontFamily: {
        sans:    ['var(--font-dm-sans)',    'DM Sans',         'sans-serif'],
        display: ['var(--font-playfair)',   'Playfair Display','serif'],
        mono:    ['var(--font-space-mono)', 'Space Mono',      'monospace'],
      },
      borderRadius: {
        '10': '10px', '12': '12px', '16': '16px', '20': '20px', '24': '24px',
      },
      boxShadow: {
        'card':      '0 2px 12px rgba(0,0,0,0.4)',
        'stage':     '0 20px 60px rgba(0,0,0,0.6), 0 4px 20px rgba(0,0,0,0.4)',
        'glow':      '0 0 32px rgba(232,98,58,0.25)',
        'teal-glow': '0 0 32px rgba(13,148,136,0.25)',
        'toast':     '0 8px 32px rgba(0,0,0,0.6)',
      },
      animation: {
        'fade-up':      'fade-up 0.5s ease-out forwards',
        'breathe':      'breathe 4s ease-in-out infinite',
        'pulse-dot':    'pulse-dot 2s ease-in-out infinite',
        'record-pulse': 'record-pulse 1.5s ease-out infinite',
        'ring-expand':  'ring-expand 1s ease-out infinite',
        'shimmer':      'shimmer 2s linear infinite',
        'wave-bar':     'wave-bar 0.8s ease-in-out infinite',
        'slide-up':     'slide-up 0.35s ease-out forwards',
        'toast-in':     'toast-in 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards',
      },
    },
  },
  plugins: [],
}

export default config
