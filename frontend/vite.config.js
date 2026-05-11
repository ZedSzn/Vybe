import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      globals: { Buffer: true, global: true, process: true },
    }),
  ],
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://localhost:3001',
        ws: true,
        changeOrigin: true,
      }
    }
  },
  define: {
    global: 'globalThis',
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
  },
  // Pre-bundle dependencies so first load doesn't hit cold CJS transforms
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'framer-motion', 'axios', 'lucide-react'],
  },
  build: {
    // Split vendors into separate cacheable chunks
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          if (id.includes('framer-motion'))               return 'vendor-motion'
          if (id.includes('lucide-react'))                return 'vendor-icons'
          if (id.includes('react-dom') || id.includes('react-router')) return 'vendor-react'
          if (id.includes('socket.io') || id.includes('simple-peer') || id.includes('webrtc'))
                                                          return 'vendor-rtc'
          if (id.includes('axios') || id.includes('stripe')) return 'vendor-http'
          return 'vendor'
        },
      },
    },
    chunkSizeWarningLimit: 900,
    // Slightly faster minification in CI; esbuild is the default and already fast
    minify: 'esbuild',
  },
})
