'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useCart } from '@/contexts/CartContext'
import { stripEmojis } from '@/components/SEO'
import Breadcrumb from '@/components/Breadcrumb'
import ServiceCard from '@/components/ServiceCard'
import QuickAddModal from '@/components/QuickAddModal'
import Pagination from '@/components/Pagination'
import { Search, SlidersHorizontal, X, ChevronDown, ChevronUp } from 'lucide-react'
import './CategoryItemGrid.css'

function SidebarSection({ title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="cig-sb-section">
      <button className="cig-sb-heading" onClick={() => setOpen(v => !v)}>
        <span>{title}</span>
        {open ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
      </button>
      {open && <div className="cig-sb-body">{children}</div>}
    </div>
  )
}

export default function CategoryItemGrid({ category, game, games, items: initialItems, categorySlug, gameSlug }) {
  const router = useRouter()
  const { formatPrice, addToCart } = useCart()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedGameId, setSelectedGameId] = useState('all')
  const [sortBy, setSortBy] = useState('none')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(12)
  const [showQuickAddModal, setShowQuickAddModal] = useState(false)
  const [selectedItem, setSelectedItem] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const isAllGamesView = !gameSlug

  useEffect(() => {
    const update = () => setItemsPerPage(window.innerWidth < 640 ? 6 : window.innerWidth < 1024 ? 9 : 12)
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, sortBy, selectedGameId])

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

    if (sortBy === 'low-to-high') filtered = [...filtered].sort((a, b) => a.price - b.price)
    else if (sortBy === 'high-to-low') filtered = [...filtered].sort((a, b) => b.price - a.price)

    return filtered
  }, [initialItems, searchQuery, sortBy, selectedGameId, isAllGamesView])

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
    if (hasOptions) { setSelectedItem(item); setShowQuickAddModal(true) }
    else addToCart(item, '')
  }

  const categoryName = stripEmojis(category.name)
  const gameName = game ? stripEmojis(game.name) : null

  const hasFilters = searchQuery || selectedGameId !== 'all' || sortBy !== 'none'

  const clearFilters = () => {
    setSearchQuery('')
    setSelectedGameId('all')
    setSortBy('none')
  }

  const breadcrumbItems = isAllGamesView
    ? [{ label: 'Home', path: '/' }, { label: category.name, path: `/${categorySlug}` }]
    : [{ label: 'Home', path: '/' }, { label: category.name, path: `/${categorySlug}` }, { label: game.name, path: `/${categorySlug}/${gameSlug}` }]

  return (
    <div className="cig-page">
      <div className="cig-header">
        <Breadcrumb customItems={breadcrumbItems} />
        <div className="cig-title-row">
          {!isAllGamesView && game?.icon_url && (
            <img src={game.icon_url} alt={game.name} className="cig-game-icon" onError={e => { e.target.style.display = 'none' }} />
          )}
          <h1 className="cig-title">
            {isAllGamesView ? categoryName : `${gameName} ${categoryName}`}
          </h1>
        </div>
      </div>

      <div className="cig-layout">
        {/* ── Sidebar overlay (mobile) ── */}
        {sidebarOpen && <div className="cig-sb-backdrop" onClick={() => setSidebarOpen(false)} />}

        {/* ── Sidebar ── */}
        <aside className={`cig-sidebar${sidebarOpen ? ' open' : ''}`}>
          <div className="cig-sb-close-row">
            <span className="cig-sb-title">Filters</span>
            <button className="cig-sb-close" onClick={() => setSidebarOpen(false)}>
              <X size={18} />
            </button>
          </div>

          {/* Search */}
          <SidebarSection title="Search">
            <div className="cig-sb-search">
              <Search size={14} className="cig-sb-search-icon" />
              <input
                type="text"
                placeholder={`Search ${categoryName.toLowerCase()}…`}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="cig-sb-search-input"
              />
              {searchQuery && (
                <button className="cig-sb-search-clear" onClick={() => setSearchQuery('')}><X size={13} /></button>
              )}
            </div>
          </SidebarSection>

          {/* Game filter */}
          {isAllGamesView && games.length > 0 && (
            <SidebarSection title="Game">
              <div className="cig-sb-radio-list">
                <label className="cig-sb-radio">
                  <input type="radio" name="game" checked={selectedGameId === 'all'} onChange={() => setSelectedGameId('all')} />
                  <span>All Games</span>
                </label>
                {games.map(g => (
                  <label key={g.id} className="cig-sb-radio">
                    <input type="radio" name="game" checked={selectedGameId === String(g.id)} onChange={() => setSelectedGameId(String(g.id))} />
                    {g.icon_url && <img src={g.icon_url} alt={g.name} className="cig-sb-game-icon" />}
                    <span>{stripEmojis(g.name)}</span>
                  </label>
                ))}
              </div>
            </SidebarSection>
          )}

          {/* Sort */}
          <SidebarSection title="Sort by Price">
            <div className="cig-sb-radio-list">
              {[['none', 'Default'], ['low-to-high', 'Lowest first'], ['high-to-low', 'Highest first']].map(([val, label]) => (
                <label key={val} className="cig-sb-radio">
                  <input type="radio" name="sort" checked={sortBy === val} onChange={() => setSortBy(val)} />
                  <span>{label}</span>
                </label>
              ))}
            </div>
          </SidebarSection>

          {hasFilters && (
            <button className="cig-sb-clear" onClick={clearFilters}>
              <X size={13} /> Clear all filters
            </button>
          )}
        </aside>

        {/* ── Main area ── */}
        <div className="cig-main">
          {/* Toolbar */}
          <div className="cig-toolbar">
            <button className="cig-filter-btn" onClick={() => setSidebarOpen(true)}>
              <SlidersHorizontal size={15} />
              Filters
              {hasFilters && <span className="cig-filter-dot" />}
            </button>
            <span className="cig-count">
              {filteredItems.length} result{filteredItems.length !== 1 ? 's' : ''}
            </span>
            <select
              className="cig-sort-select"
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              aria-label="Sort by"
            >
              <option value="none">Sort: Default</option>
              <option value="low-to-high">Price: Low to High</option>
              <option value="high-to-low">Price: High to Low</option>
            </select>
          </div>

          {/* Active filter chips */}
          {hasFilters && (
            <div className="cig-chips">
              {searchQuery && (
                <span className="cig-chip">"{searchQuery}" <button onClick={() => setSearchQuery('')}><X size={11} /></button></span>
              )}
              {selectedGameId !== 'all' && (
                <span className="cig-chip">{games.find(g => String(g.id) === selectedGameId)?.name || 'Game'} <button onClick={() => setSelectedGameId('all')}><X size={11} /></button></span>
              )}
              {sortBy !== 'none' && (
                <span className="cig-chip">{sortBy === 'low-to-high' ? 'Price ↑' : 'Price ↓'} <button onClick={() => setSortBy('none')}><X size={11} /></button></span>
              )}
              <button className="cig-chip-clear" onClick={clearFilters}>Clear all</button>
            </div>
          )}

          {/* Grid */}
          {filteredItems.length === 0 ? (
            <div className="cig-empty">
              <p>No items found{searchQuery ? ` for "${searchQuery}"` : ''}.</p>
              {hasFilters && <button className="cig-empty-clear" onClick={clearFilters}>Clear filters</button>}
            </div>
          ) : (
            <>
              <div className="cig-grid">
                {paginatedItems.map(item => {
                  const itemGameIcon = isAllGamesView
                    ? games.find(g => g.id === item.game_id)?.icon_url || '/zeusservicesPackage.webp'
                    : game?.icon_url || '/zeusservicesPackage.webp'
                  const itemGame = isAllGamesView ? games.find(g => g.id === item.game_id) : game
                  return (
                    <ServiceCard
                      key={item.id}
                      item={item}
                      gameIcon={itemGameIcon}
                      isComingSoon={itemGame?.is_coming_soon || false}
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
                onPageChange={page => { setCurrentPage(page); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
              />
            </>
          )}
        </div>
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
