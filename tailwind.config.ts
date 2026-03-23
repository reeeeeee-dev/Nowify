import type { Config } from "tailwindcss"

export default {
  theme: {
    extend: {
      fontFamily: {
        sans: ["Source Sans Pro", "Helvetica", "Arial", "sans-serif"],
      },
      colors: {
        spotify: "#1DB954",
      },
    },
  },
  plugins: [],
} satisfies Config
