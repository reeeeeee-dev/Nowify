import type { Config } from "tailwindcss"

export default {
  theme: {
    extend: {
      keyframes: {
        "nowify-fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "nowify-fade-up": {
          from: { opacity: "0", transform: "translate3d(0, 12px, 0)" },
          to: { opacity: "1", transform: "translate3d(0, 0, 0)" },
        },
        "nowify-scale-in": {
          from: { opacity: "0", transform: "scale(0.96)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        "nowify-fade-in-muted": {
          from: { opacity: "0" },
          to: { opacity: "0.8" },
        },
      },
      animation: {
        "fade-in": "nowify-fade-in 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "fade-up":
          "nowify-fade-up 0.55s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "fade-in-muted":
          "nowify-fade-in-muted 0.45s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "scale-in":
          "nowify-scale-in 0.45s cubic-bezier(0.16, 1, 0.3, 1) forwards",
      },
      transitionDuration: {
        theme: "var(--transition-slow)",
        interactive: "var(--transition-base)",
      },
      fontFamily: {
        sans: ["Source Sans Pro", "Helvetica", "Arial", "sans-serif"],
        display: [
          "Spotify Mix UI Title",
          "Source Sans Pro",
          "Helvetica",
          "Arial",
          "sans-serif",
        ],
      },
      colors: {
        spotify: "#1DB954",
      },
    },
  },
  plugins: [],
} satisfies Config
