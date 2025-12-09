/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
        fontFamily: {
      sans: ['Inter', 'system-ui', 'sans-serif'],
    },
      colors: {
        border: '#0000',
        card: '#FAFAFA',
        button: '#FAFAFA',
        primary: '#0047EC',
      },
    },
  },
  plugins: [],
}
