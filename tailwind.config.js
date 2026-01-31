/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#3B82F6',
        secondary: '#10B981',
        // Dark mode specific colors
        dark: {
          bg: '#0f172a',
          surface: '#1e293b',
          'surface-light': '#334155',
          text: '#f1f5f9',
          'text-secondary': '#cbd5e1',
          border: '#475569',
        }
      }
    },
  },
  plugins: [],
}
