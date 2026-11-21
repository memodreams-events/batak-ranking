/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Pared de luces del Batak en un stand a oscuras: fondos azulados y
        // un único acento ámbar que se lee desde el otro lado del pasillo.
        bg: '#0d1220',
        bg2: '#141b2e',
        panel: '#1a2238',
        line: '#2a3450',
        fg: '#eef1f8',
        fg2: '#9aa6c4',
        amber: '#ffb627',
        ink: '#1a1200',
        ok: '#4ad67f',
        bad: '#ff5c6c',
        silver: '#c9d1e3',
        bronze: '#d9915a',
      },
      fontFamily: {
        // Condensada para cifras y titulares, legible de lejos.
        display: ['Rajdhani', 'Arial Narrow', 'system-ui', 'sans-serif'],
        sans: ['Barlow', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
      letterSpacing: {
        label: '0.12em',
      },
      keyframes: {
        flash: {
          from: { boxShadow: '0 0 0 3px #ffb627' },
          to: { boxShadow: '0 0 0 0 transparent' },
        },
      },
      animation: {
        flash: 'flash 1.2s ease-out',
      },
    },
  },
  plugins: [],
};
