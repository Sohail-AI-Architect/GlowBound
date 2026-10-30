import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        void: {
          950: '#04030b',
          900: '#070617',
          800: '#0c0a24',
          700: '#141132',
        },
        electric: {
          300: '#7fd8ff',
          400: '#38bdf8',
          500: '#0ea5e9',
        },
        neon: {
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
        },
        magenta: {
          400: '#f472b6',
          500: '#ec4899',
        },
      },
      fontFamily: {
        display: ['var(--font-display)', 'Orbitron', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        sans: ['var(--font-body)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 24px -4px rgba(139, 92, 246, 0.55)',
        'glow-strong': '0 0 40px -2px rgba(236, 72, 153, 0.6)',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '0.55' },
          '50%': { opacity: '1' },
        },
      },
      animation: {
        float: 'float 6s ease-in-out infinite',
        pulseGlow: 'pulseGlow 3s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};

export default config;
