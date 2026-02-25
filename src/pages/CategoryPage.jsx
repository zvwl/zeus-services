import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useAuth } from '../contexts/AuthContext'
import SEO from '../components/SEO'
import Breadcrumb from '../components/Breadcrumb'
import LoadingSpinner from '../components/LoadingSpinner'
import { isPrerender } from '../utils/isPrerender'
import '../App.css'
import '../components/ServiceCard.css'

export default function CategoryPage({ formatPrice, addToCart, platformOptions }) {
  const { categorySlug, gameSlug } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [items, setItems] = useState([])
  const [games, setGames] = useState([]) // For "all games" view
  const [game, setGame] = useState(null) // Single game
  const [category, setCategory] = useState(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedPlatform, setSelectedPlatform] = useState('all')
  const [selectedGameId, setSelectedGameId] = useState('all') // Game ID for filtering
  const [sortBy, setSortBy] = useState('none')

  // Fetch game, category, and items
  useEffect(() => {
    const fetchData = async () => {
      if (isPrerender()) {
        setItems([])
        setLoading(false)
        return
      }
      setLoading(true)
      try {
        // Fetch category
        const { data: categoryData, error: categoryError } = await supabase
          .from('categories')
          .select('*')
          .eq('slug', categorySlug)
          .single()

        if (categoryError) throw categoryError
        setCategory(categoryData)

        // If gameSlug is provided, fetch single game view
        if (gameSlug) {
          // Fetch game
          const { data: gameData, error: gameError } = await supabase
            .from('games')
            .select('*')
            .eq('slug', gameSlug)
            .single()

          if (gameError) throw gameError
          setGame(gameData)

          // Fetch items for this game
          const { data: itemsData, error: itemsError } = await supabase
            .from('items')
            .select('*')
            .eq('game_id', gameData.id)
            .eq('category_id', categoryData.id)
            .eq('active', true)
            .order('featured', { ascending: false })
            .order('created_at', { ascending: true })

          if (itemsError) throw itemsError
          setItems(itemsData || [])
        } else {
          // Fetch all games with items in this category
          const { data: gamesData, error: gamesError } = await supabase
            .rpc('get_games_for_category', { category_slug_param: categorySlug })

          if (gamesError) throw gamesError
          
          // Fetch full game details including is_coming_soon status
          const gameIds = (gamesData || []).map(g => g.game_id)
          const { data: fullGamesData, error: fullGamesError } = await supabase
            .from('games')
            .select('*')
            .in('id', gameIds)
          
          if (fullGamesError) throw fullGamesError
          
          // Create a map for easy lookup
          const gamesMap = {}
          fullGamesData.forEach(g => {
            gamesMap[g.id] = g
          })
          
          const mappedGames = (gamesData || []).map(game => ({
            id: game.game_id,
            name: game.game_name,
            slug: game.game_slug,
            icon_url: game.game_icon_url,
            is_coming_soon: gamesMap[game.game_id]?.is_coming_soon || false,
            is_active: gamesMap[game.game_id]?.is_active || false
          }))
          setGames(mappedGames)

          // Fetch items for all games in this category
          const { data: itemsData, error: itemsError } = await supabase
            .from('items')
            .select('*')
            .eq('category_id', categoryData.id)
            .eq('active', true)
            .order('featured', { ascending: false })
            .order('created_at', { ascending: true })

          if (itemsError) throw itemsError
          setItems(itemsData || [])
        }
      } catch (err) {
        console.error('Error fetching data:', err)
        setItems([])
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [categorySlug, gameSlug])

  const filteredItems = useMemo(() => {
    let filtered = items

    // Game filter (when viewing all games)
    if (!gameSlug && selectedGameId !== 'all') {
      filtered = filtered.filter(item => String(item.game_id) === selectedGameId)
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(query) ||
        (item.description && item.description.toLowerCase().includes(query))
      )
    }

    // Platform filter
    if (selectedPlatform !== 'all') {
      filtered = filtered.filter(item =>
        item.platforms && item.platforms.includes(selectedPlatform)
      )
    }

    // Sort by price
    if (sortBy === 'low-to-high') {
      filtered = [...filtered].sort((a, b) => a.price - b.price)
    } else if (sortBy === 'high-to-low') {
      filtered = [...filtered].sort((a, b) => b.price - a.price)
    }

    return filtered
  }, [items, searchQuery, selectedPlatform, sortBy, selectedGameId, gameSlug])

  const handleItemClick = (item) => {
    // Navigate to item detail page
    // If in "all games" view, use the item's game slug
    const itemGameSlug = gameSlug || games.find(g => g.id === item.game_id)?.slug || 'gta5'
    navigate(`/${categorySlug}/${itemGameSlug}/${item.slug}`)
  }

  if (loading) {
    return <LoadingSpinner message="Loading items..." />
  }

  if (!category) {
    return (
      <div className="section">
        <h1>Not Found</h1>
        <p>The requested category could not be found.</p>
      </div>
    )
  }

  if (gameSlug && !game) {
    return (
      <div className="section">
        <h1>Not Found</h1>
        <p>The requested game could not be found.</p>
      </div>
    )
  }

  const isAllGamesView = !gameSlug
  const gameName = game?.name || 'Game'
  const pageTitle = isAllGamesView 
    ? `${category.name} - All Games` 
    : `${gameName} ${category.name}`
  const pageDescription = isAllGamesView
    ? `Browse ${category.name.toLowerCase()} across all games.`
    : `Browse ${category.name.toLowerCase()} for ${gameName}. Premium ${category.name.toLowerCase()} available now.`

  return (
    <>
      <SEO
        title={pageTitle}
        description={pageDescription}
        path={isAllGamesView ? `/${categorySlug}` : `/${categorySlug}/${gameSlug}`}
      />
      <section className="section services" id={isAllGamesView ? categorySlug : `${categorySlug}-${gameSlug}`}>
        <Breadcrumb
          customItems={isAllGamesView ? [
            { label: 'Home', path: '/' },
            { label: category.name, path: `/${categorySlug}` }
          ] : [
            { label: 'Home', path: '/' },
            { label: gameName, path: `/${categorySlug}/${gameSlug}` }
          ]}
        />
        
        <div className="game-header">
          {!isAllGamesView && game?.icon_url && (
            <img
              src={game.icon_url}
              alt={game.name}
              className="game-header-icon"
              onError={(e) => {
                e.target.style.display = 'none'
              }}
            />
          )}
          <div>
            <p className="eyebrow">{category.name}</p>
            <h1 className="section-title">{isAllGamesView ? `${category.name}` : `${gameName} ${category.name}`}</h1>
            <p className="section-subtitle">{pageDescription}</p>
          </div>
        </div>

        <div className="filters-container">
          <div className="search-box">
            <input
              type="text"
              placeholder={`Search ${category.name.toLowerCase()}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>

          {isAllGamesView && (
            <div className="filter-controls">
              <label htmlFor="game-filter">Game:</label>
              <select
                id="game-filter"
                value={selectedGameId}
                onChange={(e) => setSelectedGameId(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Games</option>
                {games.map(g => (
                  <option key={g.id} value={String(g.id)}>{g.name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="filter-controls">
            <label htmlFor="platform-filter">Platform:</label>
            <select
              id="platform-filter"
              value={selectedPlatform}
              onChange={(e) => setSelectedPlatform(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Platforms</option>
              {platformOptions.map(platform => (
                <option key={platform} value={platform}>{platform}</option>
              ))}
            </select>
          </div>

          <div className="filter-controls">
            <label htmlFor="sort-filter">Sort by Price:</label>
            <select
              id="sort-filter"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="filter-select"
            >
              <option value="none">None</option>
              <option value="low-to-high">Low to High</option>
              <option value="high-to-low">High to Low</option>
            </select>
          </div>
        </div>

        {filteredItems.length === 0 ? (
          <div className="no-items-message">
            <p>No items found{searchQuery ? ' matching your search' : ''}.</p>
            {!isAllGamesView && game?.is_coming_soon && (
              <p>This game is coming soon. Check back later!</p>
            )}
          </div>
        ) : (
          <div className="services-grid">
            {filteredItems.map((item) => {
              const itemGameIcon = isAllGamesView 
                ? games.find(g => g.id === item.game_id)?.icon_url || '/zeusservicesPackage.webp'
                : game?.icon_url || '/zeusservicesPackage.webp'
              
              // Check if item's parent game is coming soon
              const itemGame = isAllGamesView 
                ? games.find(g => g.id === item.game_id)
                : game
              const isComingSoon = itemGame?.is_coming_soon || false
              
              // Check stock status
              const isOutOfStock = item.stock_enabled && 
                !item.stock_unlimited && 
                (item.stock_quantity === null || item.stock_quantity === 0)
              
              const stockBadgeText = item.stock_enabled && !item.stock_unlimited && item.stock_quantity !== null
                ? `${item.stock_quantity} in stock`
                : null
              
              return (
                <div
                  key={item.id}
                  className="service-card"
                  onClick={() => !isComingSoon && !isOutOfStock && handleItemClick(item)}
                  style={{ cursor: (isComingSoon || isOutOfStock) ? 'not-allowed' : 'pointer', opacity: (isComingSoon || isOutOfStock) ? 0.7 : 1 }}
                >
                  <picture>
                    <source type="image/webp" srcSet={item.icon || itemGameIcon} />
                    <img
                      src={item.icon || itemGameIcon}
                      alt={item.name}
                      className="card-image"
                      loading="lazy"
                      decoding="async"
                      onError={(e) => {
                        if (e.target.dataset.fallbackApplied === '1') return
                        e.target.dataset.fallbackApplied = '1'
                        e.target.src = itemGameIcon
                      }}
                    />
                  </picture>
                  
                  {/* Stock badges */}
                  {isOutOfStock && (
                    <div style={{
                      position: 'absolute',
                      top: '1rem',
                      right: '1rem',
                      background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                      color: '#fff',
                      padding: '0.4rem 0.85rem',
                      borderRadius: '6px',
                      fontSize: '0.85rem',
                      fontWeight: '700',
                      boxShadow: '0 4px 12px rgba(239, 68, 68, 0.4)',
                      zIndex: 2
                    }}>
                      Out of Stock
                    </div>
                  )}
                  
                  {stockBadgeText && !isOutOfStock && !isComingSoon && (
                    <div style={{
                      position: 'absolute',
                      top: '1rem',
                      right: '1rem',
                      background: 'rgba(34, 197, 94, 0.9)',
                      color: '#fff',
                      padding: '0.3rem 0.75rem',
                      borderRadius: '6px',
                      fontSize: '0.8rem',
                      fontWeight: '600',
                      boxShadow: '0 2px 8px rgba(34, 197, 94, 0.3)',
                      zIndex: 2
                    }}>
                      {stockBadgeText}
                    </div>
                  )}
                  
                  {item.featured && !isComingSoon && !isOutOfStock && (
                    <div className="featured-badge">Featured</div>
                  )}
                  {isComingSoon && (
                    <div className="featured-badge" style={{ background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)' }}>
                      Coming Soon
                    </div>
                  )}
                  <h3 className="card-title">{item.name}</h3>
                  <p className="card-description">{item.description || ''}</p>
                  {item.platforms && item.platforms.length > 0 && (
                    <div className="service-platforms">
                      {item.platforms.slice(0, 3).map((platform, idx) => (
                        <span key={idx} className="platform-badge">{platform}</span>
                      ))}
                      {item.platforms.length > 3 && (
                        <span className="platform-badge">+{item.platforms.length - 3}</span>
                      )}
                    </div>
                  )}
                  <div className="card-footer">
                    {isComingSoon ? (
                      <div style={{
                        padding: '0.85rem 1.6rem',
                        textAlign: 'center',
                        background: 'rgba(251, 191, 36, 0.15)',
                        border: '1px solid rgba(251, 191, 36, 0.35)',
                        borderRadius: '10px',
                        fontWeight: 700,
                        fontSize: '0.9rem',
                        color: '#fbbf24',
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em'
                      }}>
                        Coming Soon
                      </div>
                    ) : isOutOfStock ? (
                      <div style={{
                        padding: '0.85rem 1.6rem',
                        textAlign: 'center',
                        background: 'rgba(239, 68, 68, 0.15)',
                        border: '1px solid rgba(239, 68, 68, 0.35)',
                        borderRadius: '10px',
                        fontWeight: 700,
                        fontSize: '0.9rem',
                        color: '#ef4444',
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em'
                      }}>
                        Out of Stock
                      </div>
                    ) : (
                      <button
                        className="view-details-btn"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleItemClick(item)
                        }}
                      >
                        View Details
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </>
  )
}
