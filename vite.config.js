import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/Car-Rental-/',
  root: '.',
  publicDir: 'public',
  build: {
    outDir: 'dist',
  },
  server: {
    port: 3000,
    open: true,
  },
  resolve: {
    alias: {
      '@': '/src',
      '@components': '/src/components',
      '@pages': '/src/pages',
      '@context': '/src/context',
      '@styles': '/src/styles',
      '@hooks': '/src/hooks',
    },
  },
});
