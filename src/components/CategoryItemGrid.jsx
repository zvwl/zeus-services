'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useCart } from '@/contexts/CartContext'
import { stripEmojis } from '@/components/SEO'
import Breadcrumb from '@/components/Breadcrumb'
import ServiceCard from '@/components/ServiceCard'
import QuickAddModal from '@/components/QuickAddModal'
import Pagination from '@/components/Pagination'

const PLATFORM_OPTIONS = ['PC', 'PlayStation', 'Xbox', 'Nintendo Switch', 'Mobile']

export default function CategoryItemGrid({ category, game, games, items: initialItems, categorySlug, gameSlug }) {
  const router = useRouter()
  const { formatPrice, addToCart } = useCart()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedPlatform, setSelectedPlatform] = useState('all')
  const [selectedGameId, setSelectedGameId] = useState('all')
  const [sortBy, setSortBy] = useState('none')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(12)
  const [showQuickAddModal, setShowQuickAddModal] = useState(false)
  const [selectedItem, setSelectedItem] = useState(null)

  const isAllGamesView = !gameSlug

  useEffect(() => {
    const update = () => setItemsPerPage(window.innerWidth < 768 ? 6 : 12)
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, selectedPlatform, sortBy, selectedGameId])

  const filteredItems = useMemo(() => {
    let filtered = initialItems

    if (isAllGamesView && selectedGameId !== 'all') {
      filtered = filtered.filter(item => String(item.game_id) === selectedGameId)
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(q) ||
        (item.description && item.description.toLowerCase().includes(q))
      )
    }

    if (selectedPlatform !== 'all') {
      filtered = filtered.filter(item => item.platforms && item.platforms.includes(selectedPlatform))
    }

    if (sortBy === 'low-to-high') {
      filtered = [...filtered].sort((a, b) => a.price - b.price)
    } else if (sortBy === 'high-to-low') {
      filtered = [...filtered].sort((a, b) => b.price - a.price)
    }

    return filtered
  }, [initialItems, searchQuery, selectedPlatform, sortBy, selectedGameId, isAllGamesView])

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage)
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filteredItems.slice(start, start + itemsPerPage)
  }, [filteredItems, currentPage, itemsPerPage])

  const handleItemClick = (item) => {
    const itemGameSlug = gameSlug || games.find(g => g.id === item.game_id)?.slug || ''
    router.push(`/${categorySlug}/${itemGameSlug}/${item.slug}`)
  }

  const handleQuickAdd = (item) => {
    const hasOptions = Array.isArray(item.custom_fields) &&
      item.custom_fields.some(field => {
        const opts = Array.isArray(field?.availableOptions) && field.availableOptions.length > 0
          ? field.availableOptions
          : (Array.isArray(field?.selectedOptions) ? field.selectedOptions : [])
        return opts.length > 0
      })

    if (hasOptions) {
      setSelectedItem(item)
      setShowQuickAddModal(true)
    } else {
      addToCart(item, '')
    }
  }

  const categoryName = stripEmojis(category.name)
  const gameName = game ? stripEmojis(game.name) : null

  const pageDescription = isAllGamesView
    ? `Browse premium ${categoryName.toLowerCase()} across all supported games on Zeuservices.`
    : `Browse ${categoryName.toLowerCase()} for ${gameName} on Zeuservices. Premium ${categoryName.toLowerCase()} with safe, manual delivery.`

  const breadcrumbItems = isAllGamesView
    ? [{ label: 'Home', path: '/' }, { label: category.name, path: `/${categorySlug}` }]
    : [{ label: 'Home', path: '/' }, { label: category.name, path: `/${categorySlug}` }, { label: game.name, path: `/${categorySlug}/${gameSlug}` }]

  return (
    <section className="section services" id={isAllGamesView ? categorySlug : `${categorySlug}-${gameSlug}`}>
      <Breadcrumb customItems={breadcrumbItems} />

      <div className="game-header">
        {!isAllGamesView && game?.icon_url && (
          <img
            src={game.icon_url}
            alt={game.name}
            className="game-header-icon"
            onError={e => { e.target.style.display = 'none' }}
          />
        )}
        <div>
          <p className="eyebrow">{categoryName}</p>
          <h1 className="section-title">{isAllGamesView ? categoryName : `${gameName} ${categoryName}`}</h1>
          <p className="section-subtitle">{pageDescription}</p>
        </div>
      </div>

      <div className="filters-container">
        <div className="search-box">
          <input
            type="text"
            name="category_search"
            placeholder={`Search ${category.name.toLowerCase()}...`}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>

        {isAllGamesView && (
          <div className="filter-controls">
            <label htmlFor="game-filter">Game:</label>
            <select id="game-filter" value={selectedGameId} onChange={e => setSelectedGameId(e.target.value)} className="filter-select">
              <option value="all">All Games</option>
              {games.map(g => <option key={g.id} value={String(g.id)}>{g.name}</option>)}
            </select>
          </div>
        )}

        <div className="filter-controls">
          <label htmlFor="platform-filter">Platform:</label>
          <select id="platform-filter" value={selectedPlatform} onChange={e => setSelectedPlatform(e.target.value)} className="filter-select">
            <option value="all">All Platforms</option>
            {PLATFORM_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>

        <div className="filter-controls">
          <label htmlFor="sort-filter">Sort by Price:</label>
          <select id="sort-filter" value={sortBy} onChange={e => setSortBy(e.target.value)} className="filter-select">
            <option value="none">None</option>
            <option value="low-to-high">Low to High</option>
            <option value="high-to-low">High to Low</option>
          </select>
        </div>
      </div>

      {filteredItems.length === 0 ? (
        <div className="no-items-message">
          <h2>Not Found</h2>
          <p>No items available{!isAllGamesView && gameName ? ` for ${gameName} ${categoryName.toLowerCase()}` : ''}.</p>
          {searchQuery && <p>Try adjusting your search.</p>}
        </div>
      ) : (
        <>
          <div className="services-grid">
            {paginatedItems.map(item => {
              const itemGameIcon = isAllGamesView
                ? games.find(g => g.id === item.game_id)?.icon_url || '/zeusservicesPackage.webp'
                : game?.icon_url || '/zeusservicesPackage.webp'
              const itemGame = isAllGamesView ? games.find(g => g.id === item.game_id) : game
              const isComingSoon = itemGame?.is_coming_soon || false

              return (
                <ServiceCard
                  key={item.id}
                  item={item}
                  gameIcon={itemGameIcon}
                  isComingSoon={isComingSoon}
                  onClick={handleItemClick}
                  onQuickAdd={handleQuickAdd}
                  formatPrice={formatPrice}
                />
              )
            })}
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={page => {
              setCurrentPage(page)
              window.scrollTo({ top: 0, behavior: 'smooth' })
            }}
          />
        </>
      )}

      {showQuickAddModal && selectedItem && (
        <QuickAddModal
          item={selectedItem}
          onClose={() => { setShowQuickAddModal(false); setSelectedItem(null) }}
          onAddToCart={(item, platform) => addToCart(item, platform)}
          formatPrice={formatPrice}
        />
      )}
    </section>
  )
}
