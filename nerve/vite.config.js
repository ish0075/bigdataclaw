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
      // Python API Server (bigdataclaw.db + DBeaver data)
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
      '/api/paperclip': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/api/obsidian': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/api/realtor-assistant': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/api/mission-control': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      // Mission Control V3 Backend (port 18002) — MUST be before generic /api/agents
      '/api/buyer-intelligence': {
        target: 'http://localhost:18002',
        changeOrigin: true,
      },
      '/api/property-feature-sheet': {
        target: 'http://localhost:18002',
        changeOrigin: true,
      },
      '/api/outreach-pack': {
        target: 'http://localhost:18002',
        changeOrigin: true,
      },
      '/api/outreach-tracking': {
        target: 'http://localhost:18002',
        changeOrigin: true,
      },
      '/api/contextkeep': {
        target: 'http://localhost:18002',
        changeOrigin: true,
      },
      '/api/agents/live': {
        target: 'http://localhost:18002',
        changeOrigin: true,
      },
      '/api/orchestrate': {
        target: 'http://localhost:18002',
        changeOrigin: true,
      },
      '/feature-sheet': {
        target: 'http://localhost:18002',
        changeOrigin: true,
      },
      '/api/agents': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/api/buyers': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/api/transactions': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/api/data-manager': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/api/openclaw': {
        target: 'http://localhost:10000',
        changeOrigin: true,
      },
      '/api/voice/agent': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/api/agent/upload': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/api/tts': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      // NERVE Server (WebSocket, missions)
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
    chunkSizeWarningLimit: 3000,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          ui: ['lucide-react'],
        },
      },
    },
  },
})
