import type { Config } from "tailwindcss";

// ponytail: Bloomberg-ish dark palette lives here so components stay class-only.
export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0a0e14",
        panel: "#0f1621",
        border: "#1c2733",
        muted: "#7d8da1",
        bull: "#22c55e",
        bear: "#ef4444",
        flat: "#eab308",
        accent: "#f59e0b",
      },
    },
  },
  plugins: [],
} satisfies Config;
