/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{js,jsx,ts,tsx}', './index.html'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#EEF2F9',
          100: '#D4E0F0',
          200: '#AAC1E1',
          300: '#7FA2D2',
          400: '#5483C3',
          500: '#2A5298',
          600: '#1A3C6E',
          700: '#0F2447',
          800: '#091729',
          900: '#040B14',
          DEFAULT: '#1A3C6E',
        },
        accent: {
          50: '#FEF9EC',
          100: '#FDEFC8',
          200: '#FBDF91',
          300: '#F9CF5A',
          400: '#F7BC57',
          500: '#F4A623',
          600: '#D4891A',
          700: '#A86A12',
          800: '#7C4D0B',
          900: '#503204',
          DEFAULT: '#F4A623',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.5rem',
      },
    },
  },
  plugins: [],
}
