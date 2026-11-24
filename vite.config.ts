import path from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

// The production build is one self-contained HTML file, so it still opens with a double-click.
export default defineConfig({
  plugins: [react(), tailwindcss(), viteSingleFile()],
  resolve: { alias: { '@': path.resolve(import.meta.dirname, 'src') } },
  server: { port: 8000, strictPort: true, host: '127.0.0.1' },
  preview: { port: 8001, strictPort: true, host: '127.0.0.1' },
  build: { chunkSizeWarningLimit: 2500 },
});
