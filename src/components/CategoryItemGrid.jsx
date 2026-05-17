'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useCart } from '@/contexts/CartContext'
import { stripEmojis } from '@/components/SEO'
import Breadcrumb from '@/components/Breadcrumb'
import ServiceCard from '@/components/ServiceCard'
import QuickAddModal from '@/components/QuickAddModal'
import Pagination from '@/components/Pagination'
import { Search, SlidersHorizontal, ChevronDown } from 'lucide-react'
import './CategoryItemGrid.css'

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
  const [showFilters, setShowFilters] = useState(false)

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

  const breadcrumbItems = isAllGamesView
    ? [{ label: 'Home', path: '/' }, { label: category.name, path: `/${categorySlug}` }]
    : [{ label: 'Home', path: '/' }, { label: category.name, path: `/${categorySlug}` }, { label: game.name, path: `/${categorySlug}/${gameSlug}` }]

  const hasActiveFilters = selectedPlatform !== 'all' || selectedGameId !== 'all' || sortBy !== 'none'

  return (
    <div className="cig-page">
      {/* ── Hero ── */}
      <div className="cig-hero">
        <div className="cig-hero-inner">
          <Breadcrumb customItems={breadcrumbItems} />
          <div className="cig-hero-content">
            {!isAllGamesView && game?.icon_url && (
              <img
                src={game.icon_url}
                alt={game.name}
                className="cig-hero-icon"
                onError={e => { e.target.style.display = 'none' }}
              />
            )}
            <div>
              <p className="cig-eyebrow">{categoryName}</p>
              <h1 className="cig-title">
                {isAllGamesView ? categoryName : `${gameName} ${categoryName}`}
              </h1>
              <p className="cig-subtitle">
                {isAllGamesView
                  ? `Premium ${categoryName.toLowerCase()} across GTA 5, Fortnite, Rocket League, and more — safe, manual delivery via Discord.`
                  : `Premium ${categoryName.toLowerCase()} for ${gameName} — safe, manual delivery with Discord support throughout.`}
              </p>
            </div>
          </div>
          <div className="cig-hero-stats">
            <div className="cig-stat">
              <span className="cig-stat-val">{initialItems.length}</span>
              <span className="cig-stat-label">Items</span>
            </div>
            <div className="cig-stat-divider" />
            <div className="cig-stat">
              <span className="cig-stat-val">9+</span>
              <span className="cig-stat-label">Years trusted</span>
            </div>
            <div className="cig-stat-divider" />
            <div className="cig-stat">
              <span className="cig-stat-val">Discord</span>
              <span className="cig-stat-label">Delivery method</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Game pills (all-games view) ── */}
      {isAllGamesView && games.length > 0 && (
        <div className="cig-game-bar">
          <div className="cig-game-bar-inner">
            <button
              className={`cig-game-pill ${selectedGameId === 'all' ? 'active' : ''}`}
              onClick={() => setSelectedGameId('all')}
            >
              All Games
            </button>
            {games.map(g => (
              <button
                key={g.id}
                className={`cig-game-pill ${selectedGameId === String(g.id) ? 'active' : ''}`}
                onClick={() => setSelectedGameId(String(g.id))}
              >
                {g.icon_url && (
                  <img src={g.icon_url} alt={g.name} className="cig-game-pill-icon" />
                )}
                {stripEmojis(g.name)}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Filter bar ── */}
      <div className="cig-filter-bar">
        <div className="cig-filter-bar-inner">
          <div className="cig-search-wrap">
            <Search size={15} className="cig-search-icon" />
            <input
              type="text"
              name="category_search"
              placeholder={`Search ${categoryName.toLowerCase()}...`}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="cig-search-input"
            />
          </div>

          <button
            className={`cig-filter-toggle ${showFilters ? 'open' : ''} ${hasActiveFilters ? 'has-active' : ''}`}
            onClick={() => setShowFilters(v => !v)}
          >
            <SlidersHorizontal size={14} />
            Filters
            {hasActiveFilters && <span className="cig-filter-dot" />}
            <ChevronDown size={13} className="cig-filter-chevron" />
          </button>

          <div className="cig-results-count">
            {filteredItems.length} result{filteredItems.length !== 1 ? 's' : ''}
          </div>
        </div>

        {showFilters && (
          <div className="cig-filter-panel">
            <div className="cig-filter-group">
              <label className="cig-filter-label">Platform</label>
              <div className="cig-filter-pills">
                <button
                  className={`cig-pill ${selectedPlatform === 'all' ? 'active' : ''}`}
                  onClick={() => setSelectedPlatform('all')}
                >All</button>
                {PLATFORM_OPTIONS.map(p => (
                  <button
                    key={p}
                    className={`cig-pill ${selectedPlatform === p ? 'active' : ''}`}
                    onClick={() => setSelectedPlatform(p)}
                  >{p}</button>
                ))}
              </div>
            </div>
            <div className="cig-filter-group">
              <label className="cig-filter-label">Sort by price</label>
              <div className="cig-filter-pills">
                {[['none','Default'],['low-to-high','Lowest first'],['high-to-low','Highest first']].map(([val, label]) => (
                  <button
                    key={val}
                    className={`cig-pill ${sortBy === val ? 'active' : ''}`}
                    onClick={() => setSortBy(val)}
                  >{label}</button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Grid ── */}
      <div className="cig-body">
        {filteredItems.length === 0 ? (
          <div className="cig-empty">
            <p>No items found{searchQuery ? ` for "${searchQuery}"` : ''}.</p>
            {(searchQuery || hasActiveFilters) && (
              <button className="cig-clear-btn" onClick={() => { setSearchQuery(''); setSelectedPlatform('all'); setSortBy('none'); setSelectedGameId('all') }}>
                Clear filters
              </button>
            )}
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
      </div>

      {showQuickAddModal && selectedItem && (
        <QuickAddModal
          item={selectedItem}
          onClose={() => { setShowQuickAddModal(false); setSelectedItem(null) }}
          onAddToCart={(item, platform) => addToCart(item, platform)}
          formatPrice={formatPrice}
        />
      )}
    </div>
  )
}
