import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  let supabaseOrigin = ''

  try {
    if (env.VITE_SUPABASE_URL) {
      supabaseOrigin = new URL(env.VITE_SUPABASE_URL).origin
    }
  } catch {
    supabaseOrigin = ''
  }

  const asyncCssAndPreconnectPlugin = {
    name: 'async-css-and-preconnect',
    apply: 'build',
    enforce: 'post',
    transformIndexHtml(html) {
      let updated = html.replace(
        /<link\s+([^>]*?)rel="stylesheet"([^>]*?)href="([^"]+\.css)"([^>]*)>/g,
        (match, _before, _middle, href) => {
          let extraAttrs = ''

          if (/\scrossorigin(=|\s|>)/.test(match)) {
            extraAttrs += ' crossorigin'
          }

          const referrerPolicyMatch = match.match(/referrerpolicy="([^"]+)"/)
          if (referrerPolicyMatch) {
            extraAttrs += ` referrerpolicy="${referrerPolicyMatch[1]}"`
          }

          return (
            `<link rel="preload" as="style" href="${href}"${extraAttrs}>\n` +
            `<link rel="stylesheet" href="${href}" media="print" onload="this.media='all'"${extraAttrs}>\n` +
            `<noscript><link rel="stylesheet" href="${href}"${extraAttrs}></noscript>`
          )
        }
      )

      if (supabaseOrigin && !updated.includes(supabaseOrigin)) {
        const preconnectTag = `    <link rel="preconnect" href="${supabaseOrigin}" crossorigin />\n`
        if (updated.includes('</head>')) {
          updated = updated.replace('</head>', `${preconnectTag}  </head>`)
        }
      }

      return updated
    }
  }

  return {
    plugins: [react(), asyncCssAndPreconnectPlugin],
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
    // Target older Chromium for prerendering compatibility (react-snap)
    target: 'es2018',
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
  }
})
