import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        bg: "#07070e",
        surface: "#0c0c16",
        raised: "#12121f",
        edge: {
          DEFAULT: "#1e1e30",
          strong: "#2a2a42",
        },
        primary: {
          DEFAULT: "#8b5cf6",
          dark: "#7c3aed",
          light: "#a78bfa",
        },
        gold: "#fbbf24",
      },
      fontFamily: {
        // --font-inter is set by next/font in app/layout.tsx (self-hosted Inter).
        sans: [
          "var(--font-inter)",
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
      },
      boxShadow: {
        glow: "0 0 40px -8px rgba(139, 92, 246, 0.45)",
        "glow-sm": "0 0 24px -6px rgba(139, 92, 246, 0.35)",
        "glow-gold": "0 0 32px -8px rgba(251, 191, 36, 0.4)",
      },
      keyframes: {
        "fade-up": {
          from: { opacity: "0", transform: "translateY(12px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        // Opacity ONLY — animating transform here would leave the route
        // wrapper with a non-none transform (fill-mode both), making it the
        // containing block for every position:fixed descendant (e.g. the
        // BuyBox mobile sticky bar) and breaking their viewport pinning.
        "page-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        shimmer: {
          from: { backgroundPosition: "200% 0" },
          to: { backgroundPosition: "-200% 0" },
        },
        "glow-pulse": {
          "0%, 100%": { opacity: "0.7" },
          "50%": { opacity: "1" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.5s ease both",
        "page-in": "page-in 0.35s ease both",
        shimmer: "shimmer 3s linear infinite",
        "glow-pulse": "glow-pulse 4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
