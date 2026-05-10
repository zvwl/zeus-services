import { notFound } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { stripEmojis } from '@/lib/seo-utils'
import CategoryItemGrid from '@/components/CategoryItemGrid'

export async function generateMetadata({ params }) {
  const { categorySlug } = await params
  const supabase = await createSupabaseServerClient()
  const { data: category } = await supabase
    .from('categories')
    .select('name')
    .eq('slug', categorySlug)
    .single()

  if (!category) return { title: 'Not Found' }

  const name = stripEmojis(category.name)
  return {
    title: `${name} - All Games`,
    description: `Browse premium ${name.toLowerCase()} across all supported games on Zeuservices. GTA 5, Fortnite, Rocket League, Forza Horizon 6 and more. Safe, manual delivery via Discord.`,
    robots: { index: true, follow: true },
  }
}

export default async function CategoryPage({ params }) {
  const { categorySlug } = await params
  const supabase = await createSupabaseServerClient()

  const { data: category, error: catError } = await supabase
    .from('categories')
    .select('*')
    .eq('slug', categorySlug)
    .single()

  if (catError || !category) return notFound()

  // Fetch games that have items in this category
  const { data: gamesData } = await supabase
    .rpc('get_games_for_category', { category_slug_param: categorySlug })

  const gameIds = (gamesData || []).map(g => g.game_id)
  const { data: fullGames } = gameIds.length
    ? await supabase.from('games').select('*').in('id', gameIds)
    : { data: [] }

  const gamesMap = {}
  ;(fullGames || []).forEach(g => { gamesMap[g.id] = g })

  const games = (gamesData || []).map(g => ({
    id: g.game_id,
    name: g.game_name,
    slug: g.game_slug,
    icon_url: g.game_icon_url,
    is_coming_soon: gamesMap[g.game_id]?.is_coming_soon || false,
    is_active: gamesMap[g.game_id]?.is_active || false,
  }))

  const { data: items } = await supabase
    .from('items')
    .select('*')
    .eq('category_id', category.id)
    .eq('active', true)
    .order('featured', { ascending: false })
    .order('created_at', { ascending: true })

  return (
    <CategoryItemGrid
      category={category}
      game={null}
      games={games}
      items={items || []}
      categorySlug={categorySlug}
      gameSlug={null}
    />
  )
}
