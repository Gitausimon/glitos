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
          primary: '#FFC533',
          secondary: '#00A082',
          'green-light': '#8EC042',
          accent: '#E1B648',
          background: '#FFFDF8',
          surface: '#FFFFFF',
          text: '#222222',
          muted: '#6B7280'
        }
      },
      fontFamily: {
        sans: ['Poppins', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
