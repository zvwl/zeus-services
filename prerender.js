import path from 'node:path'
import { fileURLToPath } from 'node:url'
import Prerenderer from '@prerenderer/prerenderer'
import JSDOMRenderer from '@prerenderer/renderer-jsdom'

process.on('uncaughtException', (error) => {
  console.warn('[prerender] Uncaught exception, skipping prerender step:', error?.message || error)
  process.exit(0)
})

process.on('unhandledRejection', (reason) => {
  console.warn('[prerender] Unhandled rejection, skipping prerender step:', reason)
  process.exit(0)
})

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const SITE_URL = process.env.PRERENDER_SITE_URL || 'https://zeuservices.com'
const MAX_SITEMAP_ROUTES = Number(process.env.PRERENDER_MAX_SITEMAP_ROUTES || '200')

const coreRoutes = [
  // Home and main pages
  '/',
  '/topups',
  '/boosting',
  '/accounts',
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
  
  // Auth pages (for breadcrumb and structure)
  '/login',
  '/signup'
]

const getSitemapRoutes = async () => {
  try {
    const response = await fetch(`${SITE_URL}/sitemap.xml`, {
      headers: {
        'User-Agent': 'zeuservices-prerender/1.0'
      }
    })

    if (!response.ok) {
      throw new Error(`Sitemap fetch failed with status ${response.status}`)
    }

    const xml = await response.text()
    const matches = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)]

    return matches
      .map((match) => {
        const loc = match[1]
        try {
          const parsed = new URL(loc)
          return parsed.pathname || '/'
        } catch {
          return null
        }
      })
      .filter((route) => typeof route === 'string' && route.startsWith('/'))
  } catch (error) {
    console.warn('[prerender] Failed to load sitemap routes, using core routes only:', error.message)
    return []
  }
}

const sitemapRoutes = await getSitemapRoutes()
const limitedSitemapRoutes = sitemapRoutes.slice(0, MAX_SITEMAP_ROUTES)
const routes = [...new Set([...coreRoutes, ...limitedSitemapRoutes])]

const prerenderer = new Prerenderer({
  staticDir: path.join(__dirname, 'dist'),
  routes,
  renderer: new JSDOMRenderer({
    runScripts: 'dangerously',
    pretendToBeVisual: true
  })
})

try {
  await prerenderer.initialize()
  try {
    await prerenderer.renderRoutes(routes)
  } catch (error) {
    console.warn('[prerender] Failed to render full route set, retrying with core routes only:', error.message)
    await prerenderer.renderRoutes(coreRoutes)
  }
} finally {
  await prerenderer.destroy()
}
