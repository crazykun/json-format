/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#0fd59d',
        'primary-dark': '#0cb885',
      },
      maxWidth: {
        'screen-2xl': '1600px',
      },
      keyframes: {
        'slide-in-right': {
          '0%': { transform: 'translateX(400px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
      },
      animation: {
        'slide-in-right': 'slide-in-right 0.3s ease-out',
      },
    },
  },
  plugins: [],
}
