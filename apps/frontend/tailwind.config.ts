import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}", 
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#0056D2', // Deep Ocean Blue
        secondary: '#FF8C00', // Energetic Orange
        background: '#F9FAFB', // Off-White
        surface: '#FFFFFF',
      },
      fontFamily: {
        sans: ['var(--font-kanit)', 'sans-serif'], 
        serif: ['var(--font-noto-serif)', 'serif'],
      },
      borderRadius: {
        DEFAULT: '12px',
      }
    },
  },
  plugins: [],
};
export default config;