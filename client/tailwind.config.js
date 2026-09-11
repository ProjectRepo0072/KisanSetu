/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f2f8f0",
          100: "#e1efdc",
          200: "#c3dfb9",
          300: "#9cc98c",
          400: "#72ad5f",
          500: "#4f8a3c",
          600: "#3d6f2e",
          700: "#325b26",
          800: "#2a4a21",
          900: "#233d1d",
        },
        wheat: {
          50: "#fdf9ef",
          100: "#f8edd0",
          500: "#c8952e",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
      },
    },
  },
  plugins: [],
};
