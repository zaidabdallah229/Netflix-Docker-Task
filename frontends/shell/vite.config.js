import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import federation from '@originjs/vite-plugin-federation';

// Host micro-frontend. Remotes are loaded at runtime from the gateway paths,
// so each one can be rebuilt and redeployed without rebuilding the shell.
export default defineConfig({
  plugins: [
    react(),
    federation({
      name: 'shell',
      remotes: {
        authApp: '/mfe/auth/assets/remoteEntry.js',
        browseApp: '/mfe/browse/assets/remoteEntry.js',
      },
      shared: ['react', 'react-dom'],
    }),
  ],
  build: { target: 'esnext' },
  // `npm run dev` while the rest of the stack runs in Docker (gateway on :8080)
  server: {
    port: 5000,
    proxy: {
      '/api': 'http://localhost:8080',
      '/mfe': 'http://localhost:8080',
      '/netflix-media': 'http://localhost:8080',
    },
  },
});
