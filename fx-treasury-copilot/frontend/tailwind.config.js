/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // "Obsidian & Champagne" — warm ink, champagne gold, editorial.
        bg: "#0a0a0c",
        panel: "#121116",
        raised: "#1a181f",
        border: "#2a2732",
        line: "#3a3542",
        muted: "#8f897d",
        accent: "#c9a96b",      // champagne gold
        goldsoft: "#e6cf9c",
        bull: "#63a583",        // sage green
        bear: "#c86a63",        // oxblood
        flat: "#c9a96b",
        paper: "#f2efe8",       // primary warm text
        silver: "#c6c1b6",      // secondary
        ash: "#948e83",         // tertiary
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        serif: ["var(--font-serif)", "ui-serif", "Georgia", "serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      height: { "13": "3.25rem", "15": "3.75rem" },
      letterSpacing: { luxe: "0.28em" },
    },
  },
  plugins: [],
};
