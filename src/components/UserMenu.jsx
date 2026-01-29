import { useNavigate, useLocation } from 'react-router-dom'
import DOMPurify from 'dompurify'
import { useAuth } from '../contexts/AuthContext'
import './UserMenu.css'

export default function UserMenu({ isOpen, onClose }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, isAdmin, logout } = useAuth()

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

  if (!isOpen) return null

  return (
    <>
      <div className="user-menu-overlay" onClick={onClose}></div>
      <div className={`user-menu ${isOpen ? 'open' : ''}`}>
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
            <button
              className={`menu-item ${isActive('/services') ? 'active' : ''}`}
              onClick={() => handleNavigation('/services')}
            >
              <span className="menu-icon">🛍️</span>
              <span className="menu-label">Services</span>
            </button>
            <button
              className={`menu-item ${isActive('/products') ? 'active' : ''}`}
              onClick={() => handleNavigation('/products')}
            >
              <span className="menu-icon">📦</span>
              <span className="menu-label">Products</span>
            </button>
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
                  <button                    className={`menu-item ${isActive('/admin/services') ? 'active' : ''}`}
                    onClick={() => handleNavigation('/admin/services')}
                  >
                    <span className="menu-icon">⚙️</span>
                    <span className="menu-label">Manage Services</span>
                  </button>
                  <button
                    className={`menu-item ${isActive('/admin/products') ? 'active' : ''}`}
                    onClick={() => handleNavigation('/admin/products')}
                  >
                    <span className="menu-icon">📦</span>
                    <span className="menu-label">Manage Products</span>
                  </button>
                  <button
                    className={`menu-item ${isActive('/admin/reviews') ? 'active' : ''}`}
                    onClick={() => handleNavigation('/admin/reviews')}
                  >
                    <span className="menu-icon">⭐</span>
                    <span className="menu-label">Manage Reviews</span>
                  </button>
                  <button                    className={`menu-item ${isActive('/admin/dashboard') ? 'active' : ''}`}
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
            href="http://discord.gg/zeusservices"
            className="menu-item discord-item"
            target="_blank"
            rel="noreferrer"
          >
            <img src="/discordLogo.png" alt="Discord" className="discord-icon-small" />
            <span className="menu-label">Join our Discord</span>
          </a>
        </div>
      </div>
    </>
  )
}
