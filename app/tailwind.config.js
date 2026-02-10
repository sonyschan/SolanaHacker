/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'meme-purple': '#8B5CF6',
        'meme-pink': '#EC4899',
        'meme-blue': '#3B82F6',
        'meme-green': '#10B981',
      }
    },
  },
  plugins: [],
}