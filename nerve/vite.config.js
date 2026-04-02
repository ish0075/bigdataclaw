import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api/lenders': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/api/recruiters': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/api/dbeaver': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/api/brokerages': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/api/health': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/api': {
        target: 'http://localhost:3090',
        changeOrigin: true,
      },
      '/ws': {
        target: 'ws://localhost:3090',
        ws: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
})
