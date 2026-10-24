/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        pg: { red: '#C8102E', dark: '#1a1a1a', gold: '#D4AF37', light: '#FFF8F0' },
      },
    },
  },
  plugins: [],
};
