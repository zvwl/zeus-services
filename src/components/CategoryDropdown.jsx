import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import './CategoryDropdown.css'

export default function CategoryDropdown({ category }) {
  const navigate = useNavigate()
  const location = useLocation()
  const fallbackIcon = '/game-icons/default.svg'
  const [games, setGames] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  // Check if this category is currently active
  const isActive = location.pathname.startsWith(`/${category.slug}`)

  useEffect(() => {
    const fetchGames = async () => {
      setIsLoading(true)
      try {
        const { data, error } = await supabase
          .rpc('get_games_for_category', { category_slug_param: category.slug })

        if (error) throw error
        setGames(data || [])
      } catch (err) {
        console.error('Error fetching games for category:', err)
        setGames([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchGames()
  }, [category.slug])

  const filteredGames = games.filter(game =>
    game.game_name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleGameClick = (game) => {
    if (game.is_coming_soon) return
    navigate(`/${category.slug}/${game.game_slug}`)
    setMobileOpen(false)
  }

  const handleTriggerClick = (e) => {
    e.preventDefault()
    // Click category name = show ALL items from all games in this category
    navigate(`/${category.slug}`)
    setMobileOpen(false)
  }

  return (
    <div className="category-dropdown">
      <button 
        className={`category-dropdown-trigger ${isActive ? 'active' : ''}`}
        onClick={handleTriggerClick}
      >
        {category.name}
        <span className="dropdown-arrow">▼</span>
      </button>

      <div className={`category-dropdown-content ${mobileOpen ? 'mobile-open' : ''}`}>
        <div className="dropdown-header">
          <h2 className="dropdown-title">{category.name}</h2>
        </div>

        <div className="dropdown-search">
          <input
            type="text"
            placeholder="Search games..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onClick={(e) => e.stopPropagation()}
          />
        </div>

        <div className="popular-games-section">
          <h3>Popular Games</h3>
          {isLoading ? (
            <div className="no-games-message">Loading games...</div>
          ) : filteredGames.length === 0 ? (
            <div className="no-games-message">
              {searchQuery ? 'No games found matching your search' : 'No games available'}
            </div>
          ) : (
            <div className="games-grid">
              {filteredGames.map((game) => (
                <div
                  key={game.game_id}
                  className={`game-item ${game.is_coming_soon ? 'coming-soon' : ''}`}
                  onClick={() => handleGameClick(game)}
                >
                  <img
                    src={game.game_icon_url || fallbackIcon}
                    alt={game.game_name}
                    className="game-icon"
                    onError={(e) => {
                      if (e.target.dataset.fallbackApplied === '1') return
                      e.target.dataset.fallbackApplied = '1'
                      e.target.src = fallbackIcon
                    }}
                  />
                  <div className="game-info">
                    <div className="game-name">{game.game_name}</div>
                    {game.is_coming_soon && (
                      <span className="game-badge">Coming Soon</span>
                    )}
                    {!game.is_coming_soon && game.item_count > 0 && (
                      <span className="game-badge">{game.item_count} items</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
