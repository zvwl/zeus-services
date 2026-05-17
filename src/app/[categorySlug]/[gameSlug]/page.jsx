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
  const title = `Buy ${gameName} ${catName} | Zeuservices`
  const description = `Buy ${catName.toLowerCase()} for ${gameName} — fast, safe delivery via Discord. Trusted service for 9+ years. Secure checkout via Stripe.`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://zeuservices.com/${categorySlug}/${gameSlug}`,
    },
    robots: { index: true, follow: true },
    alternates: { canonical: `https://zeuservices.com/${categorySlug}/${gameSlug}` },
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
