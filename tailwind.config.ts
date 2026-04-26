import type { Config } from 'tailwindcss';

// ─────────────────────────────────────────────────────────────────────────────
// Chargeback Assistant — "Ledger" DA
// Warm cream background (#FAFAF7), pure white cards, deep emerald accent
// (#047857) for trust + recovered money. Geist typography. Soft shadows.
// Token names preserved (accent-violet, accent-gold) so existing code keeps
// working — they now resolve to emerald.
// ─────────────────────────────────────────────────────────────────────────────

const ACCENT = '#047857';      // deep emerald
const ACCENT_DIM = '#065F46';  // emerald darker for hover

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          base: '#FAFAF7',     // warm cream page bg
          elevated: '#F1EFE9', // recessed surfaces (inputs, pills, sidebar)
          card: '#FFFFFF',     // lifted cards
          border: '#E5E2DA',   // hairline border
          hover: '#EAE7DE',    // subtle hover bg
        },
        accent: {
          // Legacy "gold" + "violet" tokens — both map to emerald so existing
          // pages automatically pick up the new DA without touching every file.
          gold: ACCENT,
          'gold-dim': ACCENT_DIM,
          violet: ACCENT,
          'violet-dim': ACCENT_DIM,
          blue: '#2563EB',
          'blue-dim': '#1D4ED8',
          green: '#15803D',
          red: '#E11D48',
          purple: '#7C3AED',
        },
        text: {
          primary: '#1A1818',
          secondary: '#525050',
          muted: '#9A9890',
          gold: ACCENT,    // legacy alias
          violet: ACCENT,  // legacy alias
        },
      },
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'JetBrains Mono', 'monospace'],
        display: ['var(--font-geist-sans)', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        // Soft elevation shadows (replace the violet glow halos)
        'glow-violet': '0 1px 2px rgba(0, 0, 0, 0.04), 0 4px 14px -2px rgba(4, 120, 87, 0.18)',
        'glow-violet-lg': '0 2px 5px rgba(0, 0, 0, 0.06), 0 12px 32px -4px rgba(4, 120, 87, 0.26)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        shimmer: 'shimmer 2s linear infinite',
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'glow-pulse': 'glowPulse 3s ease-in-out infinite',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(4, 120, 87, 0.30)' },
          '50%': { boxShadow: '0 0 0 6px rgba(4, 120, 87, 0)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
