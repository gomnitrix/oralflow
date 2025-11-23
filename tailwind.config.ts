import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#2563EB",
          foreground: "#FFFFFF",
          muted: "#93C5FD",
        },
        surface: {
          DEFAULT: "#0F172A",
          subtle: "#111827",
          card: "#1F2937",
        },
        accent: {
          DEFAULT: "#22D3EE",
          warm: "#FBBF24",
        },
      },
      spacing: {
        13: "3.25rem",
        15: "3.75rem",
        18: "4.5rem",
      },
      fontFamily: {
        display: ["Inter", "ui-sans-serif", "system-ui"],
        body: ["Inter", "ui-sans-serif", "system-ui"],
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.5rem",
      },
      boxShadow: {
        card: "0 10px 40px rgba(0,0,0,0.2)",
      },
    },
  },
  plugins: [],
};

export default config;
