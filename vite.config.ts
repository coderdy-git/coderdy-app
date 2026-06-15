import { defineConfig } from 'vite';
import pkg from './package.json';

export default defineConfig({
  root: './src',
  envDir: '../',
  define: {
    __APP_VERSION__: JSON.stringify(process.env.VITE_APP_VERSION || pkg.version),
  },
  build: {
    outDir: '../dist',
    minify: false,
    emptyOutDir: true,
  },
  server: {
    allowedHosts: true,
    host: true,
    port: 5173,
  },
  optimizeDeps: {
    exclude: ['@capacitor-community/sqlite', 'jeep-sqlite']
  }
});
