/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#FFC245',
          secondary: '#689482',
          accent: '#E1B648',
          background: '#FAFAFA',
          surface: '#FFFFFF',
          text: '#111827',
          muted: '#6B7280'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
