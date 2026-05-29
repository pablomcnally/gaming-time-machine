import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "Inter", "Arial", "sans-serif"]
      },
      boxShadow: {
        exhibit: "0 24px 80px rgba(4, 6, 15, 0.28)"
      }
    }
  },
  plugins: []
};

export default config;
