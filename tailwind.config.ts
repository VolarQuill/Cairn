import type { Config } from "tailwindcss";

/**
 * Cairn design system — a warm, earthy palette intentionally free of blue/purple.
 * Forest greens + amber/gold + terracotta on cream surfaces.
 */
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: {
          DEFAULT: "#FBF6EC",
          50: "#FEFCF8",
          100: "#FBF6EC",
          200: "#F3E9D6",
          300: "#E9D9BC",
        },
        bark: {
          DEFAULT: "#2A2118",
          50: "#6B5D4D",
          100: "#4A3D2E",
          200: "#3A2F22",
          300: "#2A2118",
        },
        forest: {
          DEFAULT: "#14503B",
          50: "#2E6B52",
          100: "#1E5A43",
          200: "#14503B",
          300: "#0E3D2E",
          400: "#0A2C21",
        },
        moss: {
          DEFAULT: "#5C8A4A",
          50: "#7BA863",
          100: "#5C8A4A",
          200: "#46703A",
        },
        amber: {
          DEFAULT: "#E29426",
          50: "#F2B454",
          100: "#E29426",
          200: "#C77A14",
        },
        terracotta: {
          DEFAULT: "#C9683F",
          50: "#DA825A",
          100: "#C9683F",
          200: "#A8512E",
        },
        clay: {
          DEFAULT: "#E4C9A8",
          100: "#EFD9BD",
          200: "#E4C9A8",
        },
      },
      fontFamily: {
        // Warm, book-like typography — Times New Roman throughout.
        sans: [
          "var(--font-sans)",
          "Times New Roman",
          "Times",
          "Georgia",
          "Liberation Serif",
          "serif",
        ],
        display: [
          "var(--font-display)",
          "Times New Roman",
          "Times",
          "Georgia",
          "Liberation Serif",
          "serif",
        ],
        serif: [
          "Times New Roman",
          "Times",
          "Georgia",
          "serif",
        ],
        mono: [
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Consolas",
          "monospace",
        ],
      },
      borderRadius: {
        xl: "0.9rem",
        "2xl": "1.25rem",
        "3xl": "1.75rem",
      },
      boxShadow: {
        soft: "0 2px 8px -2px rgba(42,33,24,0.10), 0 8px 24px -8px rgba(42,33,24,0.12)",
        lift: "0 8px 30px -10px rgba(20,80,59,0.25)",
        glow: "0 0 0 1px rgba(226,148,38,0.25), 0 10px 40px -12px rgba(226,148,38,0.35)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.55" },
        },
        "grow": {
          "0%": { transform: "scaleX(0)" },
          "100%": { transform: "scaleX(1)" },
        },
        "sway": {
          "0%, 100%": { transform: "rotate(-2deg)" },
          "50%": { transform: "rotate(2deg)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.5s ease-out both",
        "pulse-soft": "pulse-soft 2.4s ease-in-out infinite",
        "grow": "grow 1.2s ease-out both",
        "sway": "sway 6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
