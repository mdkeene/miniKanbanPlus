import type { Config } from "tailwindcss";

const configuracion: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./componentes/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      boxShadow: {
        panel: "0 24px 60px -32px rgba(15, 23, 42, 0.45)",
        tarjeta: "0 16px 30px -24px rgba(15, 23, 42, 0.35)"
      },
      fontFamily: {
        sans: ["Avenir Next", "Trebuchet MS", "Segoe UI", "sans-serif"]
      }
    }
  },
  plugins: []
};

export default configuracion;
