// Zafiro profundo, blanco perla y naranja brasa, en proporción 60 / 30 / 10:
// el zafiro es el fondo, el perla son las superficies donde se lee (paneles y
// filas del ranking) y la brasa queda para lo que hay que mirar primero.
//
// Los valores viven en `src/index.css` como variables CSS, no aquí, porque
// cambian según la superficie: el mismo `text-fg2` es azul claro sobre zafiro
// y azul oscuro sobre perla. Aquí solo se les da nombre.
const token = (name) => `rgb(var(--${name}) / <alpha-value>)`;

const colors = {
  bg: token('bg'),
  bg2: token('bg2'),
  panel: token('panel'),
  row: token('row'),
  line: token('line'),
  edge: token('edge'),
  fg: token('fg'),
  fg2: token('fg2'),
  brasa: { DEFAULT: token('brasa'), text: token('brasa-text') },
  focus: token('focus'),
  ink: token('ink'),
  ok: token('ok'),
  bad: token('bad'),
  silver: token('silver'),
  bronze: token('bronze'),
  // Fondo del QR: las cámaras lo necesitan claro.
  paper: token('paper'),
};

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors,
      fontFamily: {
        // Condensada para cifras y titulares, legible de lejos.
        display: ['Rajdhani', 'Arial Narrow', 'system-ui', 'sans-serif'],
        sans: ['Barlow', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
      boxShadow: {
        // Las luces encendidas de la pared: el brillo es lo que son, no decoración.
        light: '0 0 8px rgb(var(--brasa))',
        toast: '0 8px 30px rgb(0 0 0 / 0.5)',
      },
      keyframes: {
        flash: {
          from: { boxShadow: '0 0 0 3px rgb(var(--focus))' },
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
