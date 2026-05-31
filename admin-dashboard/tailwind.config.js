/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          darkBg: '#080808',       // Pure monochromatic dark background
          cardBg: '#121212',       // True neutral charcoal container
          panelBg: '#1a1a1a',      // Ash panel surface
          border: '#262626',       // High-contrast clean gray borders
          
          // Shaker Group Corporate Emerald Green
          accent: '#117b5d',       
          accentHover: '#0e634b',  
          textMuted: '#737373'     
        }
      }
    },
  },
  plugins: [],
}
