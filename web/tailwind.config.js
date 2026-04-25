/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,jsx,tsx,ts}',
  ],
  theme: {
    extend: {
      colors: {
        success: '#B5E18B',
        'success-light': '#F0FFC2',
        accent: '#FF9A86',
        'accent-light': '#FFB399',
        bg: '#FFD6A6',
        'bg-light': '#FFF0BE',
        'bg-dark': '#EAE6BC',
        dark: '#28396C',
      },
    },
  },
  plugins: [],
}