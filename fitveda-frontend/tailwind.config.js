/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        veda: {
          light: "#52B13E",
          DEFAULT: "#4B9B38",
          dark: "#3A8728",
          deep: "#2D6A1E",
        },
        brandCharcoal: "#1E252B",
        primary:   "#3A8728",
        primaryDk: "#2D6A1E",
        surface:   "#F8FAFC",
        muted:     "#64748B",
        success:   "#22C55E",
        danger:    "#EF4444",
      },
      fontFamily: {
        sans: ["'Plus Jakarta Sans'", "Inter", "sans-serif"],
        display: ["'Plus Jakarta Sans'", "sans-serif"],
      },
      borderRadius: { xl: "1rem", "2xl": "1.5rem", "3xl": "2rem" },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        'glow-emerald': '0 0 25px -5px rgba(58, 135, 40, 0.4)',
        'glow-cyan': '0 0 25px -5px rgba(6, 182, 212, 0.4)',
      },
      keyframes: {
        slideIn: {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' }
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        },
        pulseSlow: {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '0.8' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        }
      },
      animation: {
        'slide-in': 'slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'slide-down': 'slideDown 0.2s ease-out forwards',
        'pulse-slow': 'pulseSlow 4s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
      }
    },
  },
  plugins: [],
}
