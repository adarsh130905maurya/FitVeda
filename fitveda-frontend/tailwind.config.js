/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        primary:   "#2563EB",
        primaryDk: "#1D4ED8",
        surface:   "#F8FAFC",
        muted:     "#64748B",
        success:   "#22C55E",
        danger:    "#EF4444",
      },
      fontFamily: { sans: ["Inter", "sans-serif"] },
      borderRadius: { xl: "1rem", "2xl": "1.5rem" },
      keyframes: {
        slideIn: {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' }
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        }
      },
      animation: {
        'slide-in': 'slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'slide-down': 'slideDown 0.2s ease-out forwards'
      }
    },
  },
  plugins: [],
}
