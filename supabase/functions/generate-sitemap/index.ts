import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

type UrlEntry = {
  loc: string
  lastmod: string
  changefreq: 'daily' | 'weekly' | 'monthly'
  priority: string
}

type DbId = string | number

type CategoryRow = {
  id: DbId
  slug: string
  updated_at: string | null
}

type GameRow = {
  id: DbId
  slug: string
  updated_at: string | null
  is_active: boolean | null
}

type ItemRow = {
  slug: string
  updated_at: string | null
  game_id: DbId
  category_id: DbId
  active: boolean
}

const BASE_URL = 'https://zeuservices.com'

const toDate = (value: string | null | undefined, fallback: string) => {
  if (!value || typeof value !== 'string') return fallback
  return value.includes('T') ? value.split('T')[0] : value
}

const escapeXml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')

const normalizePath = (path: string) => (path.startsWith('/') ? path : `/${path}`)

const encodePath = (path: string) =>
  normalizePath(path)
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/')

// Slugs that resolve to redirects in the app — exclude from sitemap
const REDIRECT_CATEGORY_SLUGS = new Set(['products', 'product'])

// True if a string contains emoji characters
const hasEmoji = (str: string) =>
  /[\u{1F000}-\u{1FFFF}]|[☀-➿]|[\u{1F300}-\u{1FAFF}]/u.test(str)

Deno.serve(async () => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? Deno.env.get('SUPABASE_ANON_KEY') ?? ''

    if (!supabaseUrl || !supabaseKey) {
      return new Response('Missing Supabase env configuration', { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseKey)
    const today = new Date().toISOString().split('T')[0]

    const staticEntries: UrlEntry[] = [
      { loc: `${BASE_URL}/`, lastmod: today, changefreq: 'daily', priority: '1.0' },
      { loc: `${BASE_URL}/reviews`, lastmod: today, changefreq: 'weekly', priority: '0.85' },
      { loc: `${BASE_URL}/safety`, lastmod: today, changefreq: 'monthly', priority: '0.8' },
      { loc: `${BASE_URL}/trust`, lastmod: today, changefreq: 'monthly', priority: '0.8' },
      { loc: `${BASE_URL}/process`, lastmod: today, changefreq: 'monthly', priority: '0.8' },
      { loc: `${BASE_URL}/faq`, lastmod: today, changefreq: 'monthly', priority: '0.8' },
      { loc: `${BASE_URL}/comparison`, lastmod: today, changefreq: 'monthly', priority: '0.8' },
      { loc: `${BASE_URL}/terms`, lastmod: today, changefreq: 'monthly', priority: '0.5' },
      { loc: `${BASE_URL}/privacy`, lastmod: today, changefreq: 'monthly', priority: '0.5' },
      { loc: `${BASE_URL}/refund`, lastmod: today, changefreq: 'monthly', priority: '0.5' }
    ]

    const [categoriesResult, gamesResult, itemsResult] = await Promise.all([
      supabase.from('categories').select('id, slug, updated_at'),
      supabase.from('games').select('id, slug, updated_at, is_active'),
      supabase.from('items').select('slug, updated_at, game_id, category_id, active').eq('active', true)
    ])

    if (categoriesResult.error) throw categoriesResult.error
    if (gamesResult.error) throw gamesResult.error
    if (itemsResult.error) throw itemsResult.error

    const categories = ((categoriesResult.data ?? []) as CategoryRow[])
      .filter((category) => Boolean(category.slug))
      .filter((category) => !REDIRECT_CATEGORY_SLUGS.has(category.slug))
    const games = ((gamesResult.data ?? []) as GameRow[])
      .filter((game) => Boolean(game.slug))
      .filter((game) => !hasEmoji(game.slug))
      .filter((game) => game.is_active !== false)
    const items = ((itemsResult.data ?? []) as ItemRow[])
      .filter((item) => Boolean(item.slug))
      .filter((item) => !hasEmoji(item.slug))

    const categoryById = new Map(categories.map((category) => [category.id, category]))
    const gameById = new Map(games.map((game) => [game.id, game]))

    const dynamicEntries: UrlEntry[] = []

    for (const category of categories) {
      const categoryPath = encodePath(category.slug)
      dynamicEntries.push({
        loc: `${BASE_URL}${categoryPath}`,
        lastmod: toDate(category.updated_at, today),
        changefreq: 'daily',
        priority: '0.95'
      })
    }

    // Track which category+game combinations have items
    const categoryGameSeen = new Set<string>()

    // Add only category+game pages that have items, plus individual item pages
    for (const item of items) {
      const category = categoryById.get(item.category_id)
      const game = gameById.get(item.game_id)
      if (!category || !game) continue

      const categoryPath = encodePath(category.slug)
      const categoryGamePath = `${categoryPath}/${encodeURIComponent(game.slug)}`
      const itemPath = `${categoryGamePath}/${encodeURIComponent(item.slug)}`

      // Add category+game page once per combination
      const comboKey = `${category.id}:${game.id}`
      if (!categoryGameSeen.has(comboKey)) {
        categoryGameSeen.add(comboKey)
        dynamicEntries.push({
          loc: `${BASE_URL}${categoryGamePath}`,
          lastmod: toDate(game.updated_at, today),
          changefreq: 'daily',
          priority: '0.9'
        })
      }

      // Add individual item page
      dynamicEntries.push({
        loc: `${BASE_URL}${itemPath}`,
        lastmod: toDate(item.updated_at, today),
        changefreq: 'weekly',
        priority: '0.85'
      })
    }

    const allEntries = [...staticEntries, ...dynamicEntries]

    const deduped = Array.from(
      allEntries.reduce((map, entry) => {
        if (!map.has(entry.loc)) {
          map.set(entry.loc, entry)
          return map
        }

        const existing = map.get(entry.loc) as UrlEntry
        if (entry.lastmod > existing.lastmod) {
          map.set(entry.loc, entry)
        }

        return map
      }, new Map<string, UrlEntry>()).values()
    )

    deduped.sort((a, b) => a.loc.localeCompare(b.loc))

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${deduped
  .map(
    (entry) => `  <url>
    <loc>${escapeXml(entry.loc)}</loc>
    <lastmod>${entry.lastmod}</lastmod>
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>`

    return new Response(xml, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=600, must-revalidate'
      }
    })
  } catch (error) {
    console.error('Error generating sitemap:', error)
    return new Response('Error generating sitemap', { status: 500 })
  }
})
