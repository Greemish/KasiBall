import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./frontend/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        kasi: {
          green: "#0B6B3A",
          "green-dark": "#08502B",
          gold: "#E8A33D",
          "gold-dark": "#C4862A",
          ink: "#1A1A1A",
          muted: "#4A4A4A",
          surface: "#F5F5F4",
          border: "#E2E2E0",
        },
      },
      fontFamily: {
        sans: ["Roboto", "Verdana", "Helvetica", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;