import { notFound } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { stripEmojis } from '@/lib/seo-utils'
import CategoryItemGrid from '@/components/CategoryItemGrid'

export async function generateMetadata({ params }) {
  const { categorySlug, gameSlug } = await params
  const supabase = await createSupabaseServerClient()

  const [{ data: category }, { data: game }] = await Promise.all([
    supabase.from('categories').select('name').eq('slug', categorySlug).single(),
    supabase.from('games').select('name').eq('slug', gameSlug).single(),
  ])

  if (!category || !game) return { title: 'Not Found' }

  const catName = stripEmojis(category.name)
  const gameName = stripEmojis(game.name)

  return {
    title: `${gameName} ${catName}`,
    description: `Browse ${catName.toLowerCase()} for ${gameName} on Zeuservices. Premium ${catName.toLowerCase()} with safe, manual delivery. Secure checkout via Stripe. 9+ years trusted.`,
    robots: { index: true, follow: true },
    alternates: { canonical: `/${categorySlug}/${gameSlug}` },
  }
}

export default async function CategoryGamePage({ params }) {
  const { categorySlug, gameSlug } = await params
  const supabase = await createSupabaseServerClient()

  const [{ data: category, error: catError }, { data: game, error: gameError }] = await Promise.all([
    supabase.from('categories').select('*').eq('slug', categorySlug).single(),
    supabase.from('games').select('*').eq('slug', gameSlug).single(),
  ])

  if (catError || !category || gameError || !game) return notFound()

  const { data: items } = await supabase
    .from('items')
    .select('*')
    .eq('game_id', game.id)
    .eq('category_id', category.id)
    .eq('active', true)
    .order('featured', { ascending: false })
    .order('created_at', { ascending: true })

  if (!items || items.length === 0) return notFound()

  return (
    <CategoryItemGrid
      category={category}
      game={game}
      games={[]}
      items={items}
      categorySlug={categorySlug}
      gameSlug={gameSlug}
    />
  )
}
