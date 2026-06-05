import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ['@lobehub/icons']
  },
  build: {
    sourcemap: true,
  },
  server: {
    port: 8888,
    strictPort: true
  }
})
