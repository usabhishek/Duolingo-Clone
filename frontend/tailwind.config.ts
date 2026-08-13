/** Tailwind CSS configuration with Duolingo-inspired color palette. */
module.exports = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        duo: {
          green: "#58CC02",
          blue: "#1CB0F6",
          orange: "#FF9600",
          red: "#FF4B4B",
          yellow: "#FFC800",
          purple: "#CE82FF",
        },
      },
      fontFamily: {
        sans: ["Nunito", "sans-serif"],
      },
    },
  },
  plugins: [],
};
