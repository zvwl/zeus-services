import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import './UserMenu.css'

export default function UserMenu({ isOpen, onClose }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()

  const handleNavigation = (path) => {
    navigate(path)
    onClose()
  }

  const handleLogout = () => {
    logout()
    navigate('/')
    onClose()
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
                <div className="user-name">{user.name}</div>
                <div className="user-email">{user.email}</div>
              </div>
            </div>
          ) : (
            <div className="user-info">
              <div className="guest-text">Not logged in</div>
            </div>
          )}
        </div>

        <div className="user-menu-content">
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
                  <span className="menu-icon">📦</span>
                  <span className="menu-label">My Orders</span>
                </button>
              </div>

              <div className="menu-section">
                <div className="menu-section-title">Shopping</div>
                <button
                  className={`menu-item ${isActive('/services') ? 'active' : ''}`}
                  onClick={() => handleNavigation('/services')}
                >
                  <span className="menu-icon">🛍️</span>
                  <span className="menu-label">Browse Services</span>
                </button>
                <button
                  className={`menu-item ${isActive('/cart') ? 'active' : ''}`}
                  onClick={() => handleNavigation('/cart')}
                >
                  <span className="menu-icon">🛒</span>
                  <span className="menu-label">Cart</span>
                </button>
              </div>

              <div className="menu-section">
                <button className="menu-item logout" onClick={handleLogout}>
                  <span className="menu-icon">🚪</span>
                  <span className="menu-label">Logout</span>
                </button>
              </div>
            </>
          ) : (
            <div className="menu-section">
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
            href="https://discord.gg/NSNSmmaA"
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
