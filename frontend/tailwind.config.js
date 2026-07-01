/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          bg: '#070a13',
          card: '#0f1424',
          border: '#1e294b',
          text: '#f1f5f9',
          muted: '#64748b'
        },
        primary: {
          DEFAULT: '#3b82f6',
          dark: '#1d4ed8',
          light: '#60a5fa',
        },
        secondary: {
          DEFAULT: '#8b5cf6',
          dark: '#6d28d9',
          light: '#a78bfa',
        },
        accent: {
          cyan: '#06b6d4',
          green: '#10b981',
          red: '#ef4444',
          yellow: '#f59e0b',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        'glow-cyan': '0 0 20px rgba(6, 182, 212, 0.25)',
        'glow-purple': '0 0 20px rgba(139, 92, 246, 0.25)',
        'glow-green': '0 0 20px rgba(16, 185, 129, 0.25)',
        'glow-red': '0 0 20px rgba(239, 68, 68, 0.25)',
      }
    },
  },
  plugins: [],
}
