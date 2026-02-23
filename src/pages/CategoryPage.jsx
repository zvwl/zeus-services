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
  const [game, setGame] = useState(null)
  const [category, setCategory] = useState(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedPlatform, setSelectedPlatform] = useState('all')
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
        // Fetch game
        const { data: gameData, error: gameError } = await supabase
          .from('games')
          .select('*')
          .eq('slug', gameSlug)
          .single()

        if (gameError) throw gameError
        setGame(gameData)

        // Fetch category
        const { data: categoryData, error: categoryError } = await supabase
          .from('categories')
          .select('*')
          .eq('slug', categorySlug)
          .single()

        if (categoryError) throw categoryError
        setCategory(categoryData)

        // Fetch items
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
  }, [items, searchQuery, selectedPlatform, sortBy])

  const handleItemClick = (item) => {
    // Navigate to item detail page (viewable by anyone, auth required only for add to cart)
    navigate(`/${categorySlug}/${gameSlug}/${item.slug}`)
  }

  if (loading) {
    return <LoadingSpinner message="Loading items..." />
  }

  if (!game || !category) {
    return (
      <div className="section">
        <h1>Not Found</h1>
        <p>The requested game or category could not be found.</p>
      </div>
    )
  }

  const pageTitle = `${game.name} ${category.name}`
  const pageDescription = `Browse ${category.name.toLowerCase()} for ${game.name}. Premium ${category.name.toLowerCase()} available now.`

  return (
    <>
      <SEO
        title={pageTitle}
        description={pageDescription}
        path={`/${categorySlug}/${gameSlug}`}
      />
      <section className="section services" id={`${categorySlug}-${gameSlug}`}>
        <Breadcrumb
          customItems={[
            { label: 'Home', path: '/' },
            { label: game.name, path: `/${categorySlug}/${gameSlug}` }
          ]}
        />
        
        <div className="game-header">
          {game.icon_url && (
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
            <h1 className="section-title">{game.name} {category.name}</h1>
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
            {game.is_coming_soon && (
              <p>This game is coming soon. Check back later!</p>
            )}
          </div>
        ) : (
          <div className="services-grid">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="service-card"
                onClick={() => handleItemClick(item)}
              >
                <picture>
                  <source type="image/webp" srcSet={item.icon || game?.icon_url || '/zeusservicesPackage.webp'} />
                  <img
                    src={item.icon || game?.icon_url || '/zeusservicesPackage.png'}
                    alt={item.name}
                    className="card-image"
                    loading="lazy"
                    decoding="async"
                    onError={(e) => {
                      if (e.target.dataset.fallbackApplied === '1') return
                      e.target.dataset.fallbackApplied = '1'
                      e.target.src = game?.icon_url || '/zeusservicesPackage.png'
                    }}
                  />
                </picture>
                {item.featured && (
                  <div className="featured-badge">Featured</div>
                )}
                <h3 className="service-name">{item.name}</h3>
                <p className="service-price">{formatPrice(item.price)}</p>
                {item.description && (
                  <p className="service-description">{item.description}</p>
                )}
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
                <button className="cta-button" onClick={(e) => {
                  e.stopPropagation()
                  handleItemClick(item)
                }}>
                  View Details
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  )
}
