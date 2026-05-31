/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          // Deep charcoal slate for a softer, premium dark background (instead of pure blue/black)
          darkBg: '#0b0f17',       
          cardBg: '#161d26',       
          border: '#242f3d',       
          // Exact Shaker Group Emerald Greens
          accent: '#10b981',       // Vibrant Emerald
          accentMuted: '#047857',  // Deep Emerald
          accentHover: '#059669',  // Medium Hover Teal
          textMain: '#f1f5f9',
          textMuted: '#94a3b8'     
        }
      }
    },
  },
  plugins: [],
}