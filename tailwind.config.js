/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      colors: {
        navy: {
          950: '#080c17',
          900: '#0d1424',
          850: '#111a30',
          800: '#16213c',
          700: '#1c2a4d',
          600: '#243761',
          500: '#324879',
          400: '#5067a0',
          300: '#8493c2',
          200: '#b7c0e0',
          100: '#dde3f4',
          50: '#f0f3fb',
        },
        live: {
          600: '#0891a8',
          500: '#0fb3cc',
          400: '#35c9e0',
          300: '#7ddcec',
          100: '#dbf6fb',
        },
        status: {
          good: '#0ca30c',
          goodBg: '#e7f7e6',
          warning: '#c47f00',
          warningBg: '#fef3d9',
          serious: '#c2551f',
          seriousBg: '#fbe6dc',
          critical: '#c22b2b',
          criticalBg: '#fbe2e2',
        },
        ink: {
          900: '#0b1220',
          700: '#28324a',
          500: '#5b6478',
          400: '#767f93',
          300: '#98a1b5',
          200: '#c7ccdb',
          100: '#e4e8f1',
        },
      },
      boxShadow: {
        card: '0 1px 2px rgba(11,18,32,0.04), 0 8px 24px -12px rgba(15,30,70,0.16)',
        pop: '0 12px 32px -8px rgba(15,30,70,0.28)',
        glow: '0 0 0 1px rgba(15,179,204,0.35), 0 0 24px rgba(15,179,204,0.35)',
      },
      keyframes: {
        pulseRing: {
          '0%': { transform: 'scale(0.8)', opacity: '0.7' },
          '80%': { transform: 'scale(1.9)', opacity: '0' },
          '100%': { transform: 'scale(2)', opacity: '0' },
        },
        dashFlow: {
          to: { strokeDashoffset: -40 },
        },
        wave: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        rise: {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        flowX: {
          '0%': { backgroundPosition: '0 0' },
          '100%': { backgroundPosition: '22px 0' },
        },
      },
      animation: {
        pulseRing: 'pulseRing 2.2s cubic-bezier(0.2,0.6,0.4,1) infinite',
        dashFlow: 'dashFlow 1s linear infinite',
        wave: 'wave 6s linear infinite',
        rise: 'rise 0.4s ease-out both',
        flowX: 'flowX 0.7s linear infinite',
      },
    },
  },
  plugins: [],
}
