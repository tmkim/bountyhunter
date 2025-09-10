// frontend/tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}", // 👈 includes all your code under src
    "./public/index.html",        // optional if you use static HTML
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
  plugins: [],
};
