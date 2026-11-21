import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // El front consume el código fuente del paquete compartido, no su dist.
      // El dist es CommonJS porque lo necesita NestJS, y Rollup no sabe sacar
      // los exports nombrados de un `export *` compilado a CJS. Además así el
      // front recoge los cambios sin recompilar shared.
      '@batak/shared': fileURLToPath(
        new URL('../../packages/shared/src/index.ts', import.meta.url),
      ),
    },
  },
  server: { port: 5173 },
  build: { outDir: 'dist', sourcemap: false },
});
