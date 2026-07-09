/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}', './public/index.html'],
  theme: {
    extend: {
      colors: {
        pf: {
          ink: '#12233a',
          muted: '#617086',
          surface: '#f8faf7',
          accent: '#193b68',
          gold: '#f2c94f',
          green: '#1f7a4d',
          danger: '#be3d34',
        },
      },
      boxShadow: {
        pf: '0 18px 48px rgba(18, 35, 58, 0.12)',
        'pf-soft': '0 10px 28px rgba(18, 35, 58, 0.08)',
      },
      borderRadius: {
        panel: '1.375rem',
      },
      fontFamily: {
        body: ["var(--font-body, 'Public Sans')", 'system-ui', 'sans-serif'],
        display: ["var(--font-display, 'Public Sans')", 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
