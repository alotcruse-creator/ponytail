/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#080c12",
        panel: "#0d1117",
        border: "#21262d",
        muted: "#8b949e",
        bull: "#3fb950",
        bear: "#f85149",
        flat: "#d29922",
        accent: "#f0883e",
        info: "#58a6ff",
      },
      fontFamily: {
        mono: ["'JetBrains Mono'", "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      height: { "13": "3.25rem" },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
    },
  },
  plugins: [],
};
