import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': './src',
      '@features': './src/features',
      '@shared': './src/shared',
      '@styles': './src/styles',
    },
  },
  server: {
    port: 5173,
    open: true,
    host: 'localhost',
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false
      }
    }
  },
}) 