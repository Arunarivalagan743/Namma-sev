/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'inter': ['Inter', 'sans-serif'],
        'space': ['Space Grotesk', 'sans-serif'],
      },
      colors: {
        'kaamio': {
          primary: '#0F766E',
          secondary: '#38BDF8',
          base: '#F8FAFC',
          trust: {
            verified: '#22C55E',
            pending: '#FACC15',
            new: '#EF4444',
          },
        },
      },
    },
  },
  plugins: [],
}
