import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      globals: { Buffer: true, global: true, process: true },
      protocolImports: true,
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
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'framer-motion', 'axios', 'lucide-react', 'simple-peer'],
    esbuildOptions: {
      define: { global: 'globalThis' },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          if (id.includes('framer-motion'))               return 'vendor-motion'
          if (id.includes('lucide-react'))                return 'vendor-icons'
          if (id.includes('react-dom') || id.includes('react-router')) return 'vendor-react'
          if (id.includes('socket.io'))                   return 'vendor-socket'
          if (id.includes('axios') || id.includes('stripe')) return 'vendor-http'
          return 'vendor'
        },
      },
    },
    commonjsOptions: {
      transformMixedEsModules: true,
    },
    chunkSizeWarningLimit: 900,
    minify: 'esbuild',
  },
})
