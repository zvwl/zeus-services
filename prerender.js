import path from 'node:path'
import { fileURLToPath } from 'node:url'
import Prerenderer from '@prerenderer/prerenderer'
import JSDOMRenderer from '@prerenderer/renderer-jsdom'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const routes = [
  // Home and main pages
  '/',
  '/services',
  '/products',
  '/reviews',
  
  // Information pages (Google loves these for SEO)
  '/safety',
  '/trust',
  '/process',
  '/faq',
  '/comparison',
  
  // Legal pages
  '/terms',
  '/privacy',
  '/refund',
  
  // Category pages for better indexing and sitemap coverage
  '/boosting/gta5',
  '/topups/gta5',
  '/accounts/verification',
  
  // Auth pages (for breadcrumb and structure)
  '/login',
  '/signup'
]

const prerenderer = new Prerenderer({
  staticDir: path.join(__dirname, 'dist'),
  routes,
  renderer: new JSDOMRenderer({
    runScripts: 'dangerously',
    resources: 'usable',
    pretendToBeVisual: true
  })
})

try {
  await prerenderer.initialize()
  await prerenderer.renderRoutes(routes)
} finally {
  await prerenderer.destroy()
}
