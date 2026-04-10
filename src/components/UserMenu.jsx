import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import DOMPurify from 'dompurify'
import * as Dialog from '@radix-ui/react-dialog'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../supabaseClient'
import {
  HomeIcon,
  BoostIcon,
  AccountsIcon,
  TopupIcon,
  ReviewsIcon,
  CartMenuIcon,
  FaqIcon,
  ProcessIcon,
  ComparisonIcon,
  SafetyIcon,
  TrustIcon,
  AnimatedSettingsIcon,
  OrdersIcon,
  AdminOrdersIcon,
  AdminItemsIcon,
  AdminGamesIcon,
  ActivityIcon,
  LoginIcon,
  SignupIcon,
  AnimatedLogoutIcon,
} from './SidebarIcons'
import tiktokLogo from '../assets/tiktok-logo.svg'
import './UserMenu.css'

export default function UserMenu({ isOpen, onClose, onCloseCart, user: propUser = null }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { user: contextUser, isAdmin, logout } = useAuth()
  const user = propUser || contextUser
  const [expandedCategory, setExpandedCategory] = useState(null)
  const [games, setGames] = useState({})
  const [loadingGames, setLoadingGames] = useState(false)
  
  // Refs for all animated icons
  const homeIconRef = useRef(null)
  const boostIconRef = useRef(null)
  const accountsIconRef = useRef(null)
  const topupsIconRef = useRef(null)
  const reviewsIconRef = useRef(null)
  const cartIconRef = useRef(null)
  const faqIconRef = useRef(null)
  const processIconRef = useRef(null)
  const comparisonIconRef = useRef(null)
  const safetyIconRef = useRef(null)
  const trustIconRef = useRef(null)
  const settingsIconRef = useRef(null)
  const ordersIconRef = useRef(null)
  const adminOrdersIconRef = useRef(null)
  const adminItemsIconRef = useRef(null)
  const adminGamesIconRef = useRef(null)
  const adminReviewsIconRef = useRef(null)
  const activityIconRef = useRef(null)
  const loginIconRef = useRef(null)
  const signupIconRef = useRef(null)
  const logoutIconRef = useRef(null)

  const handleNavigation = (path) => {
    onCloseCart?.()
    navigate(path)
    onClose()
  }

  const handleLogout = async () => {
    onCloseCart?.()
    onClose()
    await logout()
    navigate('/')
  }

  const isActive = (path) => location.pathname === path

  // Scroll lock when menu is open to prevent page jump
  useEffect(() => {
    if (!isOpen) return

    // Simply prevent scrolling by disabling overflow
    const htmlElement = document.documentElement
    const originalOverflow = htmlElement.style.overflow
    htmlElement.style.overflow = 'hidden'

    return () => {
      // Restore original overflow
      htmlElement.style.overflow = originalOverflow
    }
  }, [isOpen])

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
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="user-menu-backdrop open" onClick={onClose} />
        <Dialog.Content className="user-menu open" onPointerDownOutside={onClose} onEscapeKeyDown={onClose}>
          <Dialog.Title className="visually-hidden">Navigation Menu</Dialog.Title>
          <Dialog.Description className="visually-hidden">User navigation menu with account options and browsing categories</Dialog.Description>
          <div className="user-menu-header">
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
              onMouseEnter={() => homeIconRef.current?.startAnimation()}
              onMouseLeave={() => homeIconRef.current?.stopAnimation()}
            >
              <HomeIcon ref={homeIconRef} className="menu-icon" size={20} />
              <span className="menu-label">Home</span>
            </button>
            
            {/* Boosting with game submenu */}
            <div className="menu-category-group">
              <button
                className={`menu-item ${expandedCategory === 'boosting' ? 'expanded' : ''}`}
                onClick={() => handleExpandCategory('boosting')}
                onMouseEnter={() => boostIconRef.current?.startAnimation()}
                onMouseLeave={() => boostIconRef.current?.stopAnimation()}
              >
                <BoostIcon ref={boostIconRef} className="menu-icon" size={20} />
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
                onMouseEnter={() => accountsIconRef.current?.startAnimation()}
                onMouseLeave={() => accountsIconRef.current?.stopAnimation()}
              >
                <AccountsIcon ref={accountsIconRef} className="menu-icon" size={20} />
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
                onMouseEnter={() => topupsIconRef.current?.startAnimation()}
                onMouseLeave={() => topupsIconRef.current?.stopAnimation()}
              >
                <TopupIcon ref={topupsIconRef} className="menu-icon" size={20} />
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
              onMouseEnter={() => reviewsIconRef.current?.startAnimation()}
              onMouseLeave={() => reviewsIconRef.current?.stopAnimation()}
            >
              <ReviewsIcon ref={reviewsIconRef} className="menu-icon" size={20} />
              <span className="menu-label">Reviews</span>
            </button>
            <button
              className={`menu-item ${isActive('/cart') ? 'active' : ''}`}
              onClick={() => handleNavigation('/cart')}
              onMouseEnter={() => cartIconRef.current?.startAnimation()}
              onMouseLeave={() => cartIconRef.current?.stopAnimation()}
            >
              <CartMenuIcon ref={cartIconRef} className="menu-icon" size={20} />
              <span className="menu-label">Cart</span>
            </button>
          </div>

          {/* Information section */}
          <div className="menu-section">
            <div className="menu-section-title">Information</div>
            <button
              className={`menu-item ${isActive('/faq') ? 'active' : ''}`}
              onClick={() => handleNavigation('/faq')}
              onMouseEnter={() => faqIconRef.current?.startAnimation()}
              onMouseLeave={() => faqIconRef.current?.stopAnimation()}
            >
              <FaqIcon ref={faqIconRef} className="menu-icon" size={20} />
              <span className="menu-label">FAQ</span>
            </button>
            <button
              className={`menu-item ${isActive('/process') ? 'active' : ''}`}
              onClick={() => handleNavigation('/process')}
              onMouseEnter={() => processIconRef.current?.startAnimation()}
              onMouseLeave={() => processIconRef.current?.stopAnimation()}
            >
              <ProcessIcon ref={processIconRef} className="menu-icon" size={20} />
              <span className="menu-label">How It Works</span>
            </button>
            <button
              className={`menu-item ${isActive('/comparison') ? 'active' : ''}`}
              onClick={() => handleNavigation('/comparison')}
              onMouseEnter={() => comparisonIconRef.current?.startAnimation()}
              onMouseLeave={() => comparisonIconRef.current?.stopAnimation()}
            >
              <ComparisonIcon ref={comparisonIconRef} className="menu-icon" size={20} />
              <span className="menu-label">Modded vs Boosting</span>
            </button>
            <button
              className={`menu-item ${isActive('/safety') ? 'active' : ''}`}
              onClick={() => handleNavigation('/safety')}
              onMouseEnter={() => safetyIconRef.current?.startAnimation()}
              onMouseLeave={() => safetyIconRef.current?.stopAnimation()}
            >
              <SafetyIcon ref={safetyIconRef} className="menu-icon" size={20} />
              <span className="menu-label">Safety & Security</span>
            </button>
            <button
              className={`menu-item ${isActive('/trust') ? 'active' : ''}`}
              onClick={() => handleNavigation('/trust')}
              onMouseEnter={() => trustIconRef.current?.startAnimation()}
              onMouseLeave={() => trustIconRef.current?.stopAnimation()}
            >
              <TrustIcon ref={trustIconRef} className="menu-icon" size={20} />
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
                  onMouseEnter={() => settingsIconRef.current?.startAnimation()}
                  onMouseLeave={() => settingsIconRef.current?.stopAnimation()}
                  onFocus={() => settingsIconRef.current?.startAnimation()}
                  onBlur={() => settingsIconRef.current?.stopAnimation()}
                >
                  <AnimatedSettingsIcon ref={settingsIconRef} className="menu-icon" size={20} />
                  <span className="menu-label">Settings</span>
                </button>
                <button
                  className={`menu-item ${isActive('/orders') ? 'active' : ''}`}
                  onClick={() => handleNavigation('/orders')}
                  onMouseEnter={() => ordersIconRef.current?.startAnimation()}
                  onMouseLeave={() => ordersIconRef.current?.stopAnimation()}
                >
                  <OrdersIcon ref={ordersIconRef} className="menu-icon" size={20} />
                  <span className="menu-label">My Orders</span>
                </button>
              </div>

              {isAdmin && (
                <div className="menu-section">
                  <div className="menu-section-title">Admin</div>
                  <button
                    className={`menu-item ${isActive('/admin/orders') ? 'active' : ''}`}
                    onClick={() => handleNavigation('/admin/orders')}
                    onMouseEnter={() => adminOrdersIconRef.current?.startAnimation()}
                    onMouseLeave={() => adminOrdersIconRef.current?.stopAnimation()}
                  >
                    <AdminOrdersIcon ref={adminOrdersIconRef} className="menu-icon" size={20} />
                    <span className="menu-label">Manage Orders</span>
                  </button>
                  <button
                    className={`menu-item ${isActive('/admin/items') ? 'active' : ''}`}
                    onClick={() => handleNavigation('/admin/items')}
                    onMouseEnter={() => adminItemsIconRef.current?.startAnimation()}
                    onMouseLeave={() => adminItemsIconRef.current?.stopAnimation()}
                  >
                    <AdminItemsIcon ref={adminItemsIconRef} className="menu-icon" size={20} />
                    <span className="menu-label">Manage Items</span>
                  </button>
                  <button
                    className={`menu-item ${isActive('/admin/games') ? 'active' : ''}`}
                    onClick={() => handleNavigation('/admin/games')}
                    onMouseEnter={() => adminGamesIconRef.current?.startAnimation()}
                    onMouseLeave={() => adminGamesIconRef.current?.stopAnimation()}
                  >
                    <AdminGamesIcon ref={adminGamesIconRef} className="menu-icon" size={20} />
                    <span className="menu-label">Manage Games</span>
                  </button>
                  <button
                    className={`menu-item ${isActive('/admin/reviews') ? 'active' : ''}`}
                    onClick={() => handleNavigation('/admin/reviews')}
                    onMouseEnter={() => adminReviewsIconRef.current?.startAnimation()}
                    onMouseLeave={() => adminReviewsIconRef.current?.stopAnimation()}
                  >
                    <ReviewsIcon ref={adminReviewsIconRef} className="menu-icon" size={20} />
                    <span className="menu-label">Manage Reviews</span>
                  </button>
                  <button
                    className={`menu-item ${isActive('/admin/dashboard') ? 'active' : ''}`}
                    onClick={() => handleNavigation('/admin/dashboard')}
                    onMouseEnter={() => activityIconRef.current?.startAnimation()}
                    onMouseLeave={() => activityIconRef.current?.stopAnimation()}
                  >
                    <ActivityIcon ref={activityIconRef} className="menu-icon" size={20} />
                    <span className="menu-label">Activity Logs</span>
                  </button>
                </div>
              )}

              <div className="menu-section">
                <button
                  className="menu-item logout"
                  onClick={handleLogout}
                  onMouseEnter={() => logoutIconRef.current?.startAnimation()}
                  onMouseLeave={() => logoutIconRef.current?.stopAnimation()}
                  onFocus={() => logoutIconRef.current?.startAnimation()}
                  onBlur={() => logoutIconRef.current?.stopAnimation()}
                >
                  <AnimatedLogoutIcon ref={logoutIconRef} className="menu-icon" size={20} />
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
                onMouseEnter={() => loginIconRef.current?.startAnimation()}
                onMouseLeave={() => loginIconRef.current?.stopAnimation()}
              >
                <LoginIcon ref={loginIconRef} className="menu-icon" size={20} />
                <span className="menu-label">Login</span>
              </button>
              <button
                className="menu-item"
                onClick={() => handleNavigation('/signup')}
                onMouseEnter={() => signupIconRef.current?.startAnimation()}
                onMouseLeave={() => signupIconRef.current?.stopAnimation()}
              >
                <SignupIcon ref={signupIconRef} className="menu-icon" size={20} />
                <span className="menu-label">Sign Up</span>
              </button>
            </div>
          )}

          <div className="user-menu-footer">
            <a
              href="http://discord.gg/zeusservices"
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
            <a
              href="https://www.tiktok.com/@zxzeusxzz"
              className="menu-item tiktok-item"
              target="_blank"
              rel="noreferrer"
            >
              <img
                src={tiktokLogo}
                alt="TikTok"
                className="tiktok-icon-small"
                width="20"
                height="20"
                loading="lazy"
                decoding="async"
              />
              <span className="menu-label">Follow on TikTok</span>
            </a>
            <a
              href="https://buymeacoffee.com/zeuservices"
              className="menu-item donate-item"
              target="_blank"
              rel="noreferrer"
            >
              <img
                src="https://cdn.buymeacoffee.com/buttons/bmc-new-btn-logo.svg"
                alt="Buy Me a Coffee"
                className="donate-icon-small"
                width="20"
                height="20"
                loading="lazy"
                decoding="async"
              />
              <span className="menu-label">Donate Here!</span>
            </a>
          </div>
        </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
