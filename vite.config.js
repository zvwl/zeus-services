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
        manualChunks: {
          'vendor-three': ['three', 'vanta'],
          'vendor-supabase': ['@supabase/supabase-js'],
        }
      }
    },
    // Target modern browsers for smaller builds
    target: 'es2020',
    // Increase chunk size limits slightly to reduce request overhead
    chunkSizeWarningLimit: 600,
    // Minify CSS
    cssCodeSplit: true,
    minify: 'esbuild'
  }
})
