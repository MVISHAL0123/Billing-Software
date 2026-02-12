/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      animation: {
        'pulse': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'blob': 'blob 7s infinite',
      },
      keyframes: {
        blob: {
          '0%': {
            transform: 'translate(0px, 0px) scale(1)',
          },
          '33%': {
            transform: 'translate(30px, -50px) scale(1.1)',
          },
          '66%': {
            transform: 'translate(-20px, 20px) scale(0.9)',
          },
          '100%': {
            transform: 'translate(0px, 0px) scale(1)',
          },
        },
      },
    },
  },
  plugins: [],
  safelist: [
    'bg-gradient-to-r',
    'bg-gradient-to-br',
    'from-purple-100',
    'from-purple-500',
    'from-purple-600',
    'from-emerald-500',
    'from-orange-500',
    'from-blue-500',
    'from-green-400',
    'from-orange-400',
    'to-indigo-600',
    'to-teal-600',
    'to-pink-600',
    'to-cyan-500',
    'to-emerald-500',
    'to-pink-500',
    'via-pink-50',
    'via-pink-600',
  ],
}
