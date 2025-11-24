import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        primary: "#e97149",
        "background-light": "#f8f6f6",
        "background-dark": "#211511",
        "custom-primary": "#FFAB91",
        "custom-accent": "#80CBC4",
        "custom-bg": "#FDFBF8",
        "custom-text-dark": "#4E4A47",
        "custom-border": "#EAE6E1",
      },
      fontFamily: {
        display: ["Lexend", "sans-serif"],
        body: ["Lexend", "sans-serif"],
      },
      borderRadius: {
        DEFAULT: "1rem",
        lg: "2rem",
        xl: "3rem",
        full: "9999px",
      },
    },
  },
  plugins: [require("@tailwindcss/forms"), require("@tailwindcss/container-queries")],
};

export default config;
