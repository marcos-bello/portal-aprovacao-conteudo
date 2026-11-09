import type { Config } from "tailwindcss";

export default {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#7C3AED", // roxo (acento do portal de referência)
          600: "#6D28D9",
        },
        status: {
          rascunho: "#9CA3AF",
          aprovacao: "#F59E0B",
          ajuste: "#F97316",
          aprovado: "#22C55E",
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
