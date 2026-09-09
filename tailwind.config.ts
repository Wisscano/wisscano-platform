import type { Config } from "tailwindcss";

// Wisscano design tokens — mirrors the approved prototype's inline palette
// so Tailwind utilities and hand-rolled styles stay in sync as components
// are migrated off inline style objects over time.
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        wc: {
          bg: "#060B14",
          panel: "#0C1526",
          panelAlt: "#101B30",
          line: "rgba(148,163,184,0.14)",
          lineStrong: "rgba(148,163,184,0.28)",
          blue: "#2F6FED",
          cyan: "#48D8E8",
          text: "#EDF1F7",
          textSoft: "#93A1B8",
          textMute: "#5C6B85",
          metal: "#C9D3E0",
        },
      },
      fontFamily: {
        display: ["var(--font-manrope)", "sans-serif"],
        body: ["var(--font-plex-sans)", "sans-serif"],
        mono: ["var(--font-plex-mono)", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;
