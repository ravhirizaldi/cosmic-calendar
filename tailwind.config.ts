import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        space: {
          900: '#000000',
          800: '#0B0D17',
          700: '#151932',
          600: '#1E2342',
          DEFAULT: '#0B0D17'
        },
        cosmic: {
          accent: '#7D5FFF',
          glow: '#A29BFE'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif']
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite'
      }
    }
  },
  plugins: []
} satisfies Config
