import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@valorecon/contracts': path.resolve(__dirname, '../packages/contracts/src/index.ts'),
    },
  },
  server: {
    port: 5173,
    host: '127.0.0.1',
  },
});

