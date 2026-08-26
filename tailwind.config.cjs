/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}', './lib/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        floodbg: '#08111f',
        floodcard: '#0d1a2a',
        floodborder: '#152a3d',
        floodmuted: '#8295a8',
        floodprimary: '#2389d9',
      },
      borderRadius: {
        lg: '0.75rem',
      },
    },
  },
  plugins: [],
}
