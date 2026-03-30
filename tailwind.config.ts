import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#000000",
        secondary: "#666666",
        muted: "#999999",
        border: "#E5E5E5",
        surface: "#FAFAFA",
        background: "#FFFFFF",
      },
      fontFamily: {
        serif: ['"Playfair Display"', "serif"],
        sans: ['"Pretendard"', '"Inter"', "sans-serif"],
        mono: ['"JetBrains Mono"', "monospace"],
      },
      fontSize: {
        display: ["3rem", { lineHeight: "1.1", letterSpacing: "-0.02em" }],
        h1: ["2.25rem", { lineHeight: "1.2", letterSpacing: "-0.01em" }],
        h2: ["1.5rem", { lineHeight: "1.3" }],
        h3: ["1.25rem", { lineHeight: "1.4" }],
        body: ["1rem", { lineHeight: "1.7" }],
        small: ["0.875rem", { lineHeight: "1.5" }],
        caption: ["0.75rem", { lineHeight: "1.4", letterSpacing: "0.05em" }],
      },
      maxWidth: {
        content: "720px",
        wide: "1080px",
      },
    },
  },
  plugins: [],
};

export default config;
