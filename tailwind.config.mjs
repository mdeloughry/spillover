/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        // Spillover brand colors
        spillover: {
          obsidian: '#0D0D0D',
          cyan: '#00F0FF',
          cyan_dim: 'rgba(0, 240, 255, 0.15)',
          indigo: '#6366F1',
          gold: '#FFD700',
          black: '#0A0A0A',
          white: '#FAFAFA',
          gray: '#333333',
          lightgray: '#A1A1AA'
        },
        // Kept for backward compatibility with existing comps temporarily
        spotify: {
          green: '#00F0FF',  // Mapped to Cyan for seamless transition
          black: '#0D0D0D',  // Mapped to Obsidian
          white: '#FAFAFA',
          gray: '#333333',
          lightgray: '#A1A1AA'
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Outfit', 'sans-serif'],
      },
      backgroundImage: {
        'glass-gradient': 'linear-gradient(145deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 100%)',
      }
    }
  },
  plugins: []
};
