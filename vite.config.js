import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Optimize bundle size with code splitting
    rollupOptions: {
      output: {
        entryFileNames: '[name]-[hash].js',
        chunkFileNames: '[name]-[hash].js',
        assetFileNames: '[name]-[hash][extname]',
        manualChunks(id) {
          // Vendor chunks for better caching
          if (id.includes('node_modules')) {
            if (id.includes('three') || id.includes('vanta')) {
              return 'vendor-three'
            }
            if (id.includes('supabase')) {
              return 'vendor-supabase'
            }
            if (id.includes('react-router-dom')) {
              return 'vendor-router'
            }
            // All other vendors together to reduce unused code
            return 'vendor'
          }
        }
      },
      // Tree-shake unused code more aggressively
      treeshake: {
        moduleSideEffects: false,
        propertyReadSideEffects: false,
        tryCatchDeoptimization: false
      }
    },
    // Target modern browsers for smaller builds
    target: 'es2020',
    // Reduce unused CSS and JS
    chunkSizeWarningLimit: 500,
    // Minify CSS and JS aggressively
    cssCodeSplit: true,
    minify: 'esbuild',
    // Enable compression
    reportCompressedSize: true,
    // Remove console logs in production
    esbuild: {
      drop: ['console', 'debugger']
    }
  },
  // Optimize dependencies
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom'],
    exclude: ['vanta', 'three'] // Lazy load heavy animation libraries
  }
})
