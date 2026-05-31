import { defineConfig } from 'vite';

export default defineConfig({
  root: './src',
  envDir: '../',
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
