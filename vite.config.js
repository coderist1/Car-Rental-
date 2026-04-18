import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const proxyTarget = env.VITE_PROXY_TARGET || env.VITE_API_URL || 'http://127.0.0.1:8000';

  return {
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
      proxy: {
        '/api': {
          target: proxyTarget,
          changeOrigin: true,
          secure: false,
        },
      },
    },
    preview: {
      proxy: {
        '/api': {
          target: proxyTarget,
          changeOrigin: true,
          secure: false,
        },
      },
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
  };
});
