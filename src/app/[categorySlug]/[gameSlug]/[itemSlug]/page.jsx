import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { stripEmojis } from '@/lib/seo-utils'
import Breadcrumb from '@/components/Breadcrumb'
import ItemPurchaseSection from '@/components/ItemPurchaseSection'

export async function generateMetadata({ params }) {
  const { categorySlug, gameSlug, itemSlug } = await params
  const supabase = await createSupabaseServerClient()

  const [{ data: category }, { data: game }, { data: item }] = await Promise.all([
    supabase.from('categories').select('name').eq('slug', categorySlug).single(),
    supabase.from('games').select('name').eq('slug', gameSlug).single(),
    supabase.from('items').select('name, description, price, slug').eq('slug', itemSlug).single(),
  ])

  if (!category || !game || !item) return { title: 'Not Found' }

  const cleanItemName = stripEmojis(item.name)
  const cleanGameName = stripEmojis(game.name)
  const cleanCategoryName = stripEmojis(category.name)

  const description = item.description
    ? item.description.length > 155 ? item.description.slice(0, 152) + '...' : item.description
    : `Buy ${cleanItemName} for ${cleanGameName} on Zeuservices. Premium ${cleanCategoryName.toLowerCase()} delivered safely via Discord. 9+ years trusted.`

  return {
    title: `${cleanItemName} - ${cleanGameName} ${cleanCategoryName}`,
    description,
    robots: { index: true, follow: true },
    alternates: { canonical: `/${categorySlug}/${gameSlug}/${itemSlug}` },
  }
}

export default async function ItemDetailPage({ params }) {
  const { categorySlug, gameSlug, itemSlug } = await params
  const supabase = await createSupabaseServerClient()

  const [{ data: category, error: catError }, { data: game, error: gameError }] = await Promise.all([
    supabase.from('categories').select('*').eq('slug', categorySlug).single(),
    supabase.from('games').select('*').eq('slug', gameSlug).single(),
  ])

  if (catError || !category || gameError || !game) return notFound()

  const { data: item, error: itemError } = await supabase
    .from('items')
    .select('*')
    .eq('slug', itemSlug)
    .eq('game_id', game.id)
    .eq('category_id', category.id)
    .single()

  if (itemError || !item) return notFound()

  const cleanItemName = stripEmojis(item.name)
  const cleanGameName = stripEmojis(game.name)
  const cleanCategoryName = stripEmojis(category.name)

  const isOutOfStock = item.stock_enabled && !item.stock_unlimited &&
    (item.stock_quantity === null || item.stock_quantity === 0)

  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: cleanItemName,
    description: item.description || `${cleanItemName} for ${cleanGameName} – professional ${cleanCategoryName.toLowerCase()} delivered safely via Discord.`,
    image: item.icon || game.icon_url || 'https://zeuservices.com/zeus-logo-main.webp',
    brand: { '@type': 'Brand', name: 'Zeuservices' },
    sku: item.slug,
    offers: {
      '@type': 'Offer',
      url: `https://zeuservices.com/${categorySlug}/${gameSlug}/${itemSlug}`,
      priceCurrency: 'GBP',
      price: parseFloat(item.price).toFixed(2),
      availability: isOutOfStock ? 'https://schema.org/OutOfStock' : 'https://schema.org/InStock',
      seller: { '@type': 'Organization', name: 'Zeuservices' },
    },
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      <section className="section service-detail">
        <Breadcrumb customItems={[
          { label: 'Home', path: '/' },
          { label: game.name, path: `/${categorySlug}/${gameSlug}` },
          { label: item.name, path: `/${categorySlug}/${gameSlug}/${itemSlug}` },
        ]} />

        <div className="service-detail-container">
          <div className="service-detail-header">
            <div className="service-detail-icon">
              <picture>
                <source type="image/webp" srcSet={item.icon || game.icon_url || '/zeusservicesPackage.webp'} />
                <img
                  src={item.icon || game.icon_url || '/zeusservicesPackage.png'}
                  alt={item.name}
                />
              </picture>
            </div>
            <div className="service-detail-info">
              <p className="eyebrow">{cleanGameName} - {cleanCategoryName}</p>
              <h1 className="service-detail-title">{cleanItemName}</h1>
            </div>
          </div>

          {item.description && (
            <div className="service-detail-description">
              <h2>Description</h2>
              <p>{item.description}</p>
            </div>
          )}

          {item.details && item.details.length > 0 && (
            <div className="service-detail-features">
              <h2>Details</h2>
              <ul className="features-list">
                {item.details.map((detail, idx) => <li key={idx}>{detail}</li>)}
              </ul>
            </div>
          )}

          <div className="service-detail-info-blocks" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', margin: '1.5rem 0' }}>
            <div style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.25)', borderRadius: '8px', padding: '1rem' }}>
              <p style={{ fontWeight: 700, color: '#fbbf24', marginBottom: '0.35rem', fontSize: '0.9rem' }}>Delivery Method</p>
              <p style={{ color: '#cbd5e1', fontSize: '0.875rem', lineHeight: '1.5' }}>Delivered manually via Discord. You'll receive full instructions and updates throughout the process.</p>
            </div>
            <div style={{ background: 'rgba(96,165,250,0.08)', border: '1px solid rgba(96,165,250,0.25)', borderRadius: '8px', padding: '1rem' }}>
              <p style={{ fontWeight: 700, color: '#60a5fa', marginBottom: '0.35rem', fontSize: '0.9rem' }}>Delivery Time</p>
              <p style={{ color: '#cbd5e1', fontSize: '0.875rem', lineHeight: '1.5' }}>Most orders are completed within 20 minutes to 5 hours depending on the service type and current workload.</p>
            </div>
            <div style={{ background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.25)', borderRadius: '8px', padding: '1rem' }}>
              <p style={{ fontWeight: 700, color: '#a78bfa', marginBottom: '0.35rem', fontSize: '0.9rem' }}>Safe & Secure</p>
              <p style={{ color: '#cbd5e1', fontSize: '0.875rem', lineHeight: '1.5' }}>All payments via Stripe. Services are handled carefully with game-specific safety practices to protect your account.</p>
            </div>
          </div>

          <Suspense fallback={null}>
            <ItemPurchaseSection
              item={item}
              game={game}
              category={category}
              categorySlug={categorySlug}
              gameSlug={gameSlug}
              itemSlug={itemSlug}
            />
          </Suspense>
        </div>
      </section>
    </>
  )
}
