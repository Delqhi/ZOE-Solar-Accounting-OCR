import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0A0E14',
        surface: '#151A23',
        'surface-hover': '#1E2532',
        border: '#2A3142',
        text: '#E6EDF3',
        'text-muted': '#8B949E',
        primary: '#0066FF',
        secondary: '#FF6B00',
        accent: '#00D4FF',
        success: '#00CC66',
        warning: '#FFB020',
        error: '#FF4757',
      },
      spacing: {
        xs: '4px',
        sm: '8px',
        md: '16px',
        lg: '24px',
        xl: '32px',
        '2xl': '48px',
        '3xl': '64px',
      },
      borderRadius: {
        sm: '4px',
        md: '8px',
        lg: '12px',
        xl: '16px',
        '2xl': '24px',
        full: '9999px',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      fontSize: {
        xs: ['12px', { lineHeight: '1.5' }],
        sm: ['14px', { lineHeight: '1.5' }],
        base: ['16px', { lineHeight: '1.5' }],
        lg: ['18px', { lineHeight: '1.5' }],
        xl: ['20px', { lineHeight: '1.5' }],
        '2xl': ['24px', { lineHeight: '1.3' }],
        '3xl': ['30px', { lineHeight: '1.2' }],
      },
      shadows: {
        sm: '0 1px 2px 0 rgba(0, 0, 0, 0.3)',
        md: '0 4px 8px 0 rgba(0, 0, 0, 0.4)',
        lg: '0 8px 16px 0 rgba(0, 0, 0, 0.5)',
        xl: '0 16px 32px 0 rgba(0, 0, 0, 0.6)',
      },
    },
  },
  plugins: [],
}

export default config