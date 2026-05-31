/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          darkBg: '#080808',       // Pure dark onyx background
          cardBg: '#121212',       // Rich charcoal container
          panelBg: '#1a1a1a',      // Subtle ash panel surface
          border: '#262626',       // Neutral dark gray borders (no blue tint)
          
          // Shaker Group True Corporate Green Palette
          accent: '#117b5d',       // Deep corporate emerald green
          accentHover: '#0e634b',  // Refined hover emerald
          textMuted: '#737373'     // Neutral middle gray
        }
      }
    },
  },
  plugins: [],
}
