/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        canvas: '#f6f8fc',
        panel: '#ffffff',
        surface: '#f8fafc',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 2.6s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float-slow': 'floatSlow 9s ease-in-out infinite',
        'shimmer-slide': 'shimmerSlide 2s linear infinite',
        'scan-sweep': 'scanSweep 5.5s linear infinite',
      },
      keyframes: {
        floatSlow: {
          '0%, 100%': { transform: 'translate3d(0, 0, 0) scale(1)' },
          '50%': { transform: 'translate3d(14px, -10px, 0) scale(1.04)' },
        },
        shimmerSlide: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(220%)' },
        },
        scanSweep: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(320%)' },
        },
      },
    },
  },
  plugins: [],
};
