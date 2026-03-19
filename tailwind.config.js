/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: '#fffaf5',
        ink: '#20313f',
        coral: '#f47c6b',
        apricot: '#f3b67a',
        mint: '#87c9bb',
        sky: '#87b6d9',
        plum: '#7c6aa6',
        sunflower: '#f4cf61',
      },
      boxShadow: {
        soft: '0 20px 45px rgba(32, 49, 63, 0.08)',
      },
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
        display: ['Outfit', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
