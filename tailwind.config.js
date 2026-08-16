/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./index.html', './app.js', './background.js'],
  theme: {
    extend: {
      fontFamily: { sans: ['Sora', 'system-ui', 'sans-serif'] },
      colors: {
        nexus: {
          50: '#f3f1ff', 100: '#e9e5ff', 200: '#d5cdff', 300: '#b8a8ff',
          400: '#9675ff', 500: '#7c5cff', 600: '#6a3fe8', 700: '#5a30c4',
          800: '#4a2a9e', 900: '#3d2580'
        },
        cyanx: '#00d4ff',
        rosex: '#ff5c8a'
      },
      animation: {
        'float-slow': 'floatY 7s ease-in-out infinite',
        'float-slower': 'floatY 11s ease-in-out infinite',
        'fade-up': 'fadeUp .6s cubic-bezier(.22,1,.36,1) both',
        'fade-in': 'fadeIn .8s ease both',
        'shimmer': 'shimmer 2.6s linear infinite',
        'bounce-dot': 'bounceDot 1.3s ease-in-out infinite'
      },
      keyframes: {
        floatY: {
          '0%,100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-14px)' }
        },
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(26px) scale(.96)' },
          to: { opacity: '1', transform: 'translateY(0) scale(1)' }
        },
        fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
        shimmer: {
          from: { backgroundPosition: '-200% center' },
          to: { backgroundPosition: '200% center' }
        },
        bounceDot: {
          '0%,60%,100%': { transform: 'translateY(0)', opacity: '.4' },
          '30%': { transform: 'translateY(-7px)', opacity: '1' }
        }
      }
    }
  },
  plugins: []
}
