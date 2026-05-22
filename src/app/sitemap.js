import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getBlogPosts } from '@/data/blog-posts'

const BASE = 'https://zeuservices.com'

export default async function sitemap() {
  const now = new Date()

  const staticPages = [
    { url: BASE, changeFrequency: 'daily', priority: 1.0 },
    { url: `${BASE}/reviews`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE}/blog`, changeFrequency: 'weekly', priority: 0.85 },
    { url: `${BASE}/faq`, changeFrequency: 'monthly', priority: 0.75 },
    { url: `${BASE}/process`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE}/safety`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE}/trust`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE}/terms`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE}/privacy`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE}/refund`, changeFrequency: 'monthly', priority: 0.5 },
  ].map(p => ({ ...p, lastModified: now }))

  const blogPages = getBlogPosts().map(post => ({
    url: `${BASE}/blog/${post.slug}`,
    lastModified: new Date(post.publishedAt),
    changeFrequency: 'monthly',
    priority: 0.75,
  }))

  try {
    const supabase = await createSupabaseServerClient()

    const [
      { data: categories },
      { data: games },
      { data: items },
    ] = await Promise.all([
      supabase.from('categories').select('slug').eq('active', true),
      supabase.from('games').select('id, slug').eq('is_active', true),
      supabase.from('items')
        .select('slug, game_id, category_id, updated_at')
        .eq('active', true),
    ])

    // /topups, /boosting, /accounts
    const categoryPages = (categories || []).map(cat => ({
      url: `${BASE}/${cat.slug}`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.9,
    }))

    // /topups/gta5 — find which categories each game has items in
    const { data: gameCategoryPairs } = await supabase
      .from('items')
      .select('game_id, category_id, games(slug), categories(slug)')
      .eq('active', true)

    const gamePageSet = new Set()
    const gamePages = []
    for (const row of (gameCategoryPairs || [])) {
      const key = `${row.categories?.slug}/${row.games?.slug}`
      if (!gamePageSet.has(key) && row.categories?.slug && row.games?.slug) {
        gamePageSet.add(key)
        gamePages.push({
          url: `${BASE}/${key}`,
          lastModified: now,
          changeFrequency: 'weekly',
          priority: 0.85,
        })
      }
    }

    // /topups/gta5/item-slug
    const gamesMap = {}
    for (const g of (games || [])) gamesMap[g.id] = g.slug

    const { data: itemsWithSlugs } = await supabase
      .from('items')
      .select('slug, game_id, updated_at, categories(slug), games(slug)')
      .eq('active', true)

    const itemPages = (itemsWithSlugs || [])
      .filter(item => item.categories?.slug && item.games?.slug)
      .map(item => ({
        url: `${BASE}/${item.categories.slug}/${item.games.slug}/${item.slug}`,
        lastModified: item.updated_at ? new Date(item.updated_at) : now,
        changeFrequency: 'weekly',
        priority: 0.8,
      }))

    return [...staticPages, ...blogPages, ...categoryPages, ...gamePages, ...itemPages]
  } catch {
    return [...staticPages, ...blogPages]
  }
}
