import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useAuth } from '../contexts/AuthContext'
import SEO from '../components/SEO'
import Breadcrumb from '../components/Breadcrumb'
import LoadingSpinner from '../components/LoadingSpinner'
import ServiceCard from '../components/ServiceCard'
import QuickAddModal from '../components/QuickAddModal'
import Pagination from '../components/Pagination'
import NotFoundPage from './NotFoundPage'
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
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(12)
  const [showQuickAddModal, setShowQuickAddModal] = useState(false)
  const [selectedItem, setSelectedItem] = useState(null)

  // Responsive items per page
  useEffect(() => {
    const updateItemsPerPage = () => {
      setItemsPerPage(window.innerWidth < 768 ? 6 : 12)
    }
    updateItemsPerPage()
    window.addEventListener('resize', updateItemsPerPage)
    return () => window.removeEventListener('resize', updateItemsPerPage)
  }, [])

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

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, selectedPlatform, sortBy, selectedGameId])

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

  // Pagination
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage)
  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return filteredItems.slice(startIndex, endIndex)
  }, [filteredItems, currentPage, itemsPerPage])

  const handlePageChange = (page) => {
    setCurrentPage(page)
    // Scroll to top of page
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleItemClick = (item) => {
    // Navigate to item detail page
    // If in "all games" view, use the item's game slug
    const itemGameSlug = gameSlug || games.find(g => g.id === item.game_id)?.slug || 'gta5'
    navigate(`/${categorySlug}/${itemGameSlug}/${item.slug}`)
  }

  const handleQuickAdd = (item) => {
    // Check if item needs option selection via custom fields
    const hasCustomFieldOptions = Array.isArray(item.custom_fields)
      && item.custom_fields.some((field) => {
        const options = Array.isArray(field?.availableOptions) && field.availableOptions.length > 0
          ? field.availableOptions
          : (Array.isArray(field?.selectedOptions) ? field.selectedOptions : [])
        return options.length > 0
      })
    const needsOptions = hasCustomFieldOptions
    
    if (needsOptions) {
      // Show modal for options selection
      setSelectedItem(item)
      setShowQuickAddModal(true)
    } else {
      // Add directly to cart without options
      addToCart(item, '')
    }
  }

  const handleModalAddToCart = (item, platform) => {
    addToCart(item, platform)
  }

  if (loading) {
    return <LoadingSpinner message="Loading items..." />
  }

  if (!category) {
    return <NotFoundPage />
  }

  if (gameSlug && !game) {
    return <NotFoundPage />
  }

  if (gameSlug && items.length === 0) {
    return <NotFoundPage />
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
              name="category_search"
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
            <h2>Not Found</h2>
            <p>No items available{!isAllGamesView && gameName ? ` for ${gameName} ${category.name.toLowerCase()}` : ''}.</p>
            {searchQuery && (
              <p>Try adjusting your search.</p>
            )}
          </div>
        ) : (
          <>
            <div className="services-grid">
              {paginatedItems.map((item) => {
                const itemGameIcon = isAllGamesView 
                  ? games.find(g => g.id === item.game_id)?.icon_url || '/zeusservicesPackage.webp'
                  : game?.icon_url || '/zeusservicesPackage.webp'
                
                // Check if item's parent game is coming soon
                const itemGame = isAllGamesView 
                  ? games.find(g => g.id === item.game_id)
                  : game
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
              onPageChange={handlePageChange}
            />
          </>
        )}

      {/* Quick Add Modal */}
      {showQuickAddModal && selectedItem && (
        <QuickAddModal
          item={selectedItem}
          onClose={() => {
            setShowQuickAddModal(false)
            setSelectedItem(null)
          }}
          onAddToCart={handleModalAddToCart}
          formatPrice={formatPrice}
        />
      )}
      </section>
    </>
  )
}
