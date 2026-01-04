import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#e6f9ef',
          100: '#b1edcf',
          200: '#8be4b7',
          300: '#55d796',
          400: '#35d082',
          500: '#02c463', // Main Primary Color
          600: '#02b25a',
          700: '#018b46',
          800: '#016c36',
          900: '#01522a',
        },
        coolgray: {
          25: '#EDEFF0', // 전체 배경용
          50: '#E6E7E8',
          75: '#D7D8D9',
          100: '#CECFD1', // 연한 테두리
          200: '#B7B9BD',
          300: '#9C9EA6',
          400: '#83868F', // 보조 텍스트
          500: '#70737C', // 보조 텍스트 - 진함
          600: '#63666E',
          700: '#4D4E54',
          800: '#37383D', // 본문 텍스트
          900: '#292A2E', // 제목 텍스트
        },
      },
    },
  },
  plugins: [],
}

export default config

