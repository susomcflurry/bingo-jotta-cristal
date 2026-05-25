/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gold: '#b8953a',
        goldLight: '#e8d48a',
        goldDark: '#7a6a3a',
        cream: '#fdfaf3',
        cream2: '#f0e6c0',
        darkBg: '#1a1a1a',
        brown: '#2c2416',
      },
      fontFamily: {
        serif: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        sans: ['Montserrat', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
