import type { Config } from "tailwindcss";
import daisyui from "daisyui";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [daisyui],
  daisyui: {
    // cupcake = light, forest = dark. First entry is the default light theme;
    // darkTheme is used when the system prefers dark (and by our toggle).
    themes: ["cupcake", "forest"],
    darkTheme: "forest",
    logs: false,
  },
};

export default config;
