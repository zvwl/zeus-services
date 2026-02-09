import path from 'node:path'
import { fileURLToPath } from 'node:url'
import Prerenderer from '@prerenderer/prerenderer'
import JSDOMRenderer from '@prerenderer/renderer-jsdom'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const routes = [
  '/',
  '/services',
  '/products',
  '/reviews',
  '/safety',
  '/trust',
  '/process',
  '/terms',
  '/privacy',
  '/refund'
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
