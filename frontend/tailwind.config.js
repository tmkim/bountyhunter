// frontend/tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
content: [
  "./pages/**/*.{ts,tsx}",
  "./components/**/*.{ts,tsx}",
  "./app/**/*.{ts,tsx}",
  "./src/**/*.{ts,tsx}",
],

  theme: {
    extend: {
      colors: {
        maya: "#60BFF5",
        lapis: "#2E63A4",
        brown: "#AF6528",
        tangerine: "#FFCE00",
        rosso: "#D70000",
        black: "#000000",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
