/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: '#0f1117',
          card: '#1a1d27',
          elevated: '#22263a',
        },
        buy: { DEFAULT: '#10b981', dim: '#064e3b' },
        hold: { DEFAULT: '#f59e0b', dim: '#451a03' },
        avoid: { DEFAULT: '#ef4444', dim: '#450a0a' },
        accent: { DEFAULT: '#6366f1', light: '#818cf8' },
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
    },
  },
  plugins: [],
};
