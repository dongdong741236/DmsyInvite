/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'sans': ['Microsoft YaHei', '微软雅黑', 'Consolas', 'Monaco', 'Courier New', 'monospace', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        'mono': ['Consolas', 'Monaco', 'Courier New', 'monospace'],
        'code': ['Consolas', 'Monaco', 'Courier New', 'monospace'],
      },
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
      },
      boxShadow: {
        'neumorphic': '20px 20px 60px #d1d5db, -20px -20px 60px #ffffff',
        'neumorphic-inset': 'inset 20px 20px 60px #d1d5db, inset -20px -20px 60px #ffffff',
        'neumorphic-sm': '5px 5px 15px #d1d5db, -5px -5px 15px #ffffff',
        'neumorphic-hover': '10px 10px 30px #d1d5db, -10px -10px 30px #ffffff',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}