import { defineConfig } from 'vite';

export default defineConfig({
  define: { 'process.env': {} },
  build: { chunkSizeWarningLimit: 6000 },
});
