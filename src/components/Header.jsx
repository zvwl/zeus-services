import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import './Header.css'

export default function Header({ cartCount, currency, onCurrencyChange }) {
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  const navLinkClass = ({ isActive }) => `nav-link${isActive ? ' active' : ''}`

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <header className="header">
      <div className="header-content">
        <button className="brand" onClick={() => navigate('/')}> 
          <span className="logo-icon">
            <img src="/zeus-logo.png" alt="Zeus Services" />
          </span>
          <span className="brand-name">Zeus Services</span>
        </button>

        <nav className="nav">
          <NavLink to="/" className={navLinkClass}>Home</NavLink>
          <NavLink to="/products" className={navLinkClass}>Products</NavLink>
          <NavLink to="/services" className={navLinkClass}>Services</NavLink>
          {user && <NavLink to="/settings" className={navLinkClass}>Settings</NavLink>}
        </nav>

        <div className="nav-actions">
          <div className="currency-switcher">
            <label htmlFor="currency-select">Currency</label>
            <select
              id="currency-select"
              value={currency}
              onChange={(e) => onCurrencyChange(e.target.value)}
            >
              <option value="USD">USD ($)</option>
              <option value="GBP">GBP (£)</option>
              <option value="EUR">EUR (€)</option>
            </select>
          </div>

          <a
            href="https://discord.gg/NSNSmmaA"
            className="discord-link"
            target="_blank"
            rel="noreferrer"
          >
            <img src="/discordLogo.png" alt="Discord" className="discord-icon" />
            Discord
          </a>
          
          {user ? (
            <>
              <span className="user-greeting">Hey, {user.name}!</span>
              <button className="ghost-link logout-btn" onClick={handleLogout}>Logout</button>
            </>
          ) : (
            <>
              <NavLink to="/login" className="ghost-link">Login</NavLink>
              <NavLink to="/signup" className="primary-link">Sign up</NavLink>
            </>
          )}
          
          <button className="cart-button" onClick={() => navigate('/cart')}>
            🛒 Cart ({cartCount})
          </button>
        </div>
      </div>
    </header>
  )
}
