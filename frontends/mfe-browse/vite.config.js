import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import federation from '@originjs/vite-plugin-federation';

// Remote micro-frontend: everything about finding and watching titles.
export default defineConfig({
  base: '/mfe/browse/',
  plugins: [
    react(),
    federation({
      name: 'browseApp',
      filename: 'remoteEntry.js',
      exposes: {
        './Home': './src/Home.jsx',
        './TitleDetails': './src/TitleDetails.jsx',
        './Player': './src/Player.jsx',
        './MyList': './src/MyList.jsx',
      },
      shared: ['react', 'react-dom'],
    }),
  ],
  build: { target: 'esnext', cssCodeSplit: false },
});
