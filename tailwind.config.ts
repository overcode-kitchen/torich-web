import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Pretendard', 'var(--font-geist-sans)', 'system-ui', 'sans-serif'],
      },
      /* Layer 3: Tailwind Config - Primitives 변수 참조 (globals.css) */
      colors: {
        torich: {
          brown: 'var(--palette-torich-brown)',
          'brown-light': 'var(--palette-torich-brown-light)',
        },
        brand: {
          50: 'var(--palette-brand-50)',
          100: 'var(--palette-brand-100)',
          200: 'var(--palette-brand-200)',
          300: 'var(--palette-brand-300)',
          400: 'var(--palette-brand-400)',
          500: 'var(--palette-brand-500)',
          600: 'var(--palette-brand-600)',
          700: 'var(--palette-brand-700)',
          800: 'var(--palette-brand-800)',
          900: 'var(--palette-brand-900)',
        },
        coolgray: {
          25: 'var(--palette-coolgray-25)',
          50: 'var(--palette-coolgray-50)',
          75: 'var(--palette-coolgray-75)',
          100: 'var(--palette-coolgray-100)',
          200: 'var(--palette-coolgray-200)',
          300: 'var(--palette-coolgray-300)',
          400: 'var(--palette-coolgray-400)',
          500: 'var(--palette-coolgray-500)',
          600: 'var(--palette-coolgray-600)',
          700: 'var(--palette-coolgray-700)',
          800: 'var(--palette-coolgray-800)',
          850: 'var(--palette-coolgray-850)',
          900: 'var(--palette-coolgray-900)',
          950: 'var(--palette-coolgray-950)',
          1000: 'var(--palette-coolgray-1000)',
        },
      },
    },
  },
  plugins: [],
}

export default config

