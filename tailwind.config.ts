import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: "#0b1220",
          raised: "#111a2c",
          overlay: "#182338",
        },
        line: "#22304a",
        accent: {
          DEFAULT: "#22d3ee",
          soft: "#67e8f9",
        },
        good: "#34d399",
        warn: "#fbbf24",
        bad: "#f87171",
        muted: "#7d8da5",
      },
    },
  },
  plugins: [],
};
export default config;
