import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import DOMPurify from 'dompurify'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../supabaseClient'
import './UserMenu.css'

export default function UserMenu({ isOpen, onClose }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, isAdmin, logout } = useAuth()
  const [expandedCategory, setExpandedCategory] = useState(null)
  const [games, setGames] = useState({})
  const [loadingGames, setLoadingGames] = useState(false)

  const handleNavigation = (path) => {
    navigate(path)
    onClose()
  }

  const handleLogout = async () => {
    onClose()
    await logout()
    navigate('/')
  }

  const isActive = (path) => location.pathname === path

  // Load games for a category when it's expanded
  const handleExpandCategory = async (categorySlug) => {
    if (expandedCategory === categorySlug) {
      setExpandedCategory(null)
      return
    }

    setExpandedCategory(categorySlug)
    
    if (games[categorySlug]) {
      return // Already loaded
    }

    setLoadingGames(true)
    try {
      // Fetch games that have items in this category
      const { data, error } = await supabase
        .rpc('get_games_for_category', { category_slug_param: categorySlug })

      if (error) throw error
      
      // Map the RPC response to the expected format
      const mappedGames = (data || []).map(game => ({
        id: game.game_id,
        name: game.game_name,
        slug: game.game_slug,
        icon_url: game.game_icon_url
      }))
      
      setGames(prev => ({
        ...prev,
        [categorySlug]: mappedGames
      }))
    } catch (err) {
      console.error(`Error loading games for ${categorySlug}:`, err)
      setGames(prev => ({
        ...prev,
        [categorySlug]: []
      }))
    } finally {
      setLoadingGames(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="user-menu-backdrop" onClick={onClose}>
      <div
        className={`user-menu ${isOpen ? 'open' : ''}`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="user-menu-header">
          <button className="close-btn" onClick={onClose}>×</button>
          {user ? (
            <div className="user-info">
              <div className="user-avatar">{user.name?.[0]?.toUpperCase() || '👤'}</div>
              <div className="user-details">
                <div className="user-name">{DOMPurify.sanitize(user.name)}</div>
                <div className="user-email">{DOMPurify.sanitize(user.email)}</div>
              </div>
            </div>
          ) : (
            <div className="user-info">
              <div className="guest-text">Not logged in</div>
            </div>
          )}
        </div>

        <div className="user-menu-content">
          {/* Browse section - always visible */}
          <div className="menu-section">
            <div className="menu-section-title">Browse</div>
            <button
              className={`menu-item ${isActive('/') ? 'active' : ''}`}
              onClick={() => handleNavigation('/')}
            >
              <span className="menu-icon">🏠</span>
              <span className="menu-label">Home</span>
            </button>
            
            {/* Boosting with game submenu */}
            <div className="menu-category-group">
              <button
                className={`menu-item ${expandedCategory === 'boosting' ? 'expanded' : ''}`}
                onClick={() => handleExpandCategory('boosting')}
              >
                <span className="menu-icon">🛍️</span>
                <span className="menu-label">Boosting</span>
                <span className="menu-expand-arrow">▶</span>
              </button>
              {expandedCategory === 'boosting' && (
                <div className="game-submenu">
                  {loadingGames ? (
                    <div className="submenu-item loading">Loading games...</div>
                  ) : games['boosting']?.length > 0 ? (
                    games['boosting'].map(game => (
                      <button
                        key={game.id}
                        className={`submenu-item ${
                          location.pathname === `/boosting/${game.slug}` ? 'active' : ''
                        }`}
                        onClick={() => handleNavigation(`/boosting/${game.slug}`)}
                      >
                        {game.name}
                      </button>
                    ))
                  ) : (
                    <div className="submenu-item empty">No games available</div>
                  )}
                </div>
              )}
            </div>
            
            {/* Accounts with game submenu */}
            <div className="menu-category-group">
              <button
                className={`menu-item ${expandedCategory === 'accounts' ? 'expanded' : ''}`}
                onClick={() => handleExpandCategory('accounts')}
              >
                <span className="menu-icon">📦</span>
                <span className="menu-label">Accounts</span>
                <span className="menu-expand-arrow">▶</span>
              </button>
              {expandedCategory === 'accounts' && (
                <div className="game-submenu">
                  {loadingGames ? (
                    <div className="submenu-item loading">Loading games...</div>
                  ) : games['accounts']?.length > 0 ? (
                    games['accounts'].map(game => (
                      <button
                        key={game.id}
                        className={`submenu-item ${
                          location.pathname === `/accounts/${game.slug}` ? 'active' : ''
                        }`}
                        onClick={() => handleNavigation(`/accounts/${game.slug}`)}
                      >
                        {game.name}
                      </button>
                    ))
                  ) : (
                    <div className="submenu-item empty">No games available</div>
                  )}
                </div>
              )}
            </div>

            {/* Topups with game submenu */}
            <div className="menu-category-group">
              <button
                className={`menu-item ${expandedCategory === 'topups' ? 'expanded' : ''}`}
                onClick={() => handleExpandCategory('topups')}
              >
                <span className="menu-icon">💰</span>
                <span className="menu-label">Topups</span>
                <span className="menu-expand-arrow">▶</span>
              </button>
              {expandedCategory === 'topups' && (
                <div className="game-submenu">
                  {loadingGames ? (
                    <div className="submenu-item loading">Loading games...</div>
                  ) : games['topups']?.length > 0 ? (
                    games['topups'].map(game => (
                      <button
                        key={game.id}
                        className={`submenu-item ${
                          location.pathname === `/topups/${game.slug}` ? 'active' : ''
                        }`}
                        onClick={() => handleNavigation(`/topups/${game.slug}`)}
                      >
                        {game.name}
                      </button>
                    ))
                  ) : (
                    <div className="submenu-item empty">No games available</div>
                  )}
                </div>
              )}
            </div>

            <button
              className={`menu-item ${isActive('/reviews') ? 'active' : ''}`}
              onClick={() => handleNavigation('/reviews')}
            >
              <span className="menu-icon">⭐</span>
              <span className="menu-label">Reviews</span>
            </button>
            <button
              className={`menu-item ${isActive('/cart') ? 'active' : ''}`}
              onClick={() => handleNavigation('/cart')}
            >
              <span className="menu-icon">🛒</span>
              <span className="menu-label">Cart</span>
            </button>
          </div>

          {/* Information section */}
          <div className="menu-section">
            <div className="menu-section-title">Information</div>
            <button
              className={`menu-item ${isActive('/faq') ? 'active' : ''}`}
              onClick={() => handleNavigation('/faq')}
            >
              <span className="menu-icon">❓</span>
              <span className="menu-label">FAQ</span>
            </button>
            <button
              className={`menu-item ${isActive('/process') ? 'active' : ''}`}
              onClick={() => handleNavigation('/process')}
            >
              <span className="menu-icon">📍</span>
              <span className="menu-label">How It Works</span>
            </button>
            <button
              className={`menu-item ${isActive('/comparison') ? 'active' : ''}`}
              onClick={() => handleNavigation('/comparison')}
            >
              <span className="menu-icon">⚖️</span>
              <span className="menu-label">Modded vs Boosting</span>
            </button>
            <button
              className={`menu-item ${isActive('/safety') ? 'active' : ''}`}
              onClick={() => handleNavigation('/safety')}
            >
              <span className="menu-icon">🛡️</span>
              <span className="menu-label">Safety & Security</span>
            </button>
            <button
              className={`menu-item ${isActive('/trust') ? 'active' : ''}`}
              onClick={() => handleNavigation('/trust')}
            >
              <span className="menu-icon">✓</span>
              <span className="menu-label">Why Trust Us</span>
            </button>
          </div>

          {user ? (
            <>
              <div className="menu-section">
                <div className="menu-section-title">Account</div>
                <button
                  className={`menu-item ${isActive('/settings') ? 'active' : ''}`}
                  onClick={() => handleNavigation('/settings')}
                >
                  <span className="menu-icon">⚙️</span>
                  <span className="menu-label">Settings</span>
                </button>
                <button
                  className={`menu-item ${isActive('/orders') ? 'active' : ''}`}
                  onClick={() => handleNavigation('/orders')}
                >
                  <span className="menu-icon">📋</span>
                  <span className="menu-label">My Orders</span>
                </button>
              </div>

              {isAdmin && (
                <div className="menu-section">
                  <div className="menu-section-title">Admin</div>
                  <button
                    className={`menu-item ${isActive('/admin/orders') ? 'active' : ''}`}
                    onClick={() => handleNavigation('/admin/orders')}
                  >
                    <span className="menu-icon">👨‍💼</span>
                    <span className="menu-label">Manage Orders</span>
                  </button>
                  <button
                    className={`menu-item ${isActive('/admin/items') ? 'active' : ''}`}
                    onClick={() => handleNavigation('/admin/items')}
                  >
                    <span className="menu-icon">🎮</span>
                    <span className="menu-label">Manage Items</span>
                  </button>
                  <button
                    className={`menu-item ${isActive('/admin/games') ? 'active' : ''}`}
                    onClick={() => handleNavigation('/admin/games')}
                  >
                    <span className="menu-icon">🎯</span>
                    <span className="menu-label">Manage Games</span>
                  </button>
                  <button
                    className={`menu-item ${isActive('/admin/reviews') ? 'active' : ''}`}
                    onClick={() => handleNavigation('/admin/reviews')}
                  >
                    <span className="menu-icon">⭐</span>
                    <span className="menu-label">Manage Reviews</span>
                  </button>
                  <button
                    className={`menu-item ${isActive('/admin/dashboard') ? 'active' : ''}`}
                    onClick={() => handleNavigation('/admin/dashboard')}
                  >
                    <span className="menu-icon">📊</span>
                    <span className="menu-label">Activity Logs</span>
                  </button>
                </div>
              )}

              <div className="menu-section">
                <button className="menu-item logout" onClick={handleLogout}>
                  <span className="menu-icon">🚪</span>
                  <span className="menu-label">Logout</span>
                </button>
              </div>
            </>
          ) : (
            <div className="menu-section">
              <div className="menu-section-title">Account</div>
              <button
                className="menu-item"
                onClick={() => handleNavigation('/login')}
              >
                <span className="menu-icon">🔑</span>
                <span className="menu-label">Login</span>
              </button>
              <button
                className="menu-item"
                onClick={() => handleNavigation('/signup')}
              >
                <span className="menu-icon">📝</span>
                <span className="menu-label">Sign Up</span>
              </button>
            </div>
          )}
        </div>

        <div className="user-menu-footer">
          <a
            href="https://discord.gg/KTmYbqxBBU"
            className="menu-item discord-item"
            target="_blank"
            rel="noreferrer"
          >
            <picture>
              <source
                type="image/webp"
                srcSet="/discordLogo-40.webp 40w, /discordLogo-80.webp 80w"
                sizes="20px"
              />
              <img
                src="/discordLogo.png"
                alt="Discord"
                className="discord-icon-small"
                width="20"
                height="20"
                loading="lazy"
                decoding="async"
              />
            </picture>
            <span className="menu-label">Join our Discord</span>
          </a>
        </div>
      </div>
    </div>
  )
}
