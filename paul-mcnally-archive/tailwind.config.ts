import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./data/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      boxShadow: {
        terminal: "0 18px 50px rgba(0, 0, 0, 0.32)"
      },
      colors: {
        terminal: {
          black: "#070807",
          blue: "#1624ff",
          cyan: "#00e5ff",
          green: "#31ff65",
          paper: "#f3f0db",
          red: "#ff3347",
          yellow: "#fff45c"
        }
      },
      fontFamily: {
        mono: ["var(--font-mono)", "Consolas", "Monaco", "monospace"],
        sans: ["var(--font-sans)", "Arial", "sans-serif"]
      }
    }
  },
  plugins: []
};

export default config;
