/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0B0D10",
        panel: {
          dark: "#0F1216",
          DEFAULT: "#13171C",
          elevated: "#191F26",
          border: "#242D38",
          hover: "#222A33",
        },
        accent: {
          lime: "#C7F464",
          cyan: "#65D8D0",
          amber: "#F4B860",
          coral: "#FF626E",
        },
        forensic: {
          muted: "#7A889B",
          dim: "#4A5568",
          text: "#E2E8F0",
          bright: "#FFFFFF",
        }
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', '"Fira Code"', 'Consolas', 'monospace'],
        sans: ['Inter', 'Outfit', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'forensic-sm': '0 1px 3px 0 rgba(0, 0, 0, 0.6), 0 1px 2px -1px rgba(0, 0, 0, 0.4)',
        'forensic-glow': '0 0 15px -3px rgba(199, 244, 100, 0.15)',
        'coral-glow': '0 0 15px -3px rgba(255, 98, 110, 0.25)',
      },
      keyframes: {
        scanline: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(1000%)' },
        },
        pulseSlow: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.4' },
        }
      },
      animation: {
        'scanline': 'scanline 8s linear infinite',
        'pulse-slow': 'pulseSlow 3s ease-in-out infinite',
      }
    },
  },
  plugins: [],
}
