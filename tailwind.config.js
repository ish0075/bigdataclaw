/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: {
          primary: '#0A0A0F',
          secondary: '#111111',
          tertiary: '#161616',
        },
        border: {
          DEFAULT: '#2A2A2A',
          hover: '#3A3A3A',
        },
        coral: {
          DEFAULT: '#E8503A',
          light: '#FF6B5A',
          dark: '#C43A27',
        },
        status: {
          active: '#22C55E',
          pending: '#F59E0B',
          sold: '#EF4444',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
