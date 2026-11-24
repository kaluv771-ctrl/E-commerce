/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#17221d",
        forest: "#174d3a",
        lime: "#d7f36a",
        cream: "#f7f8f4"
      },
      boxShadow: { soft: "0 14px 40px rgba(23,34,29,.08)" }
    }
  },
  plugins: []
};
