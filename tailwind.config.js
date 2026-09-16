/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
      colors: {
        sidebar: {
          bg: '#1e2433',
          hover: '#2a3245',
          active: '#273142',
          text: '#94a3b8',
          textActive: '#ffffff',
          border: '#2d3748',
        },
        crm: {
          blue: '#2563eb',
          blueHover: '#1d4ed8',
          lightBg: '#f8fafc',
          badge: '#eff6ff',
          badgeText: '#1d4ed8',
        },
        yadea: {
          orange: '#EB5F1B',
          dark: '#c94e15',
          black: '#111827',
        },
      },
    },
  },
  plugins: [],
};
