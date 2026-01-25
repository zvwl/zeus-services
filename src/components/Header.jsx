import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import UserMenu from './UserMenu'
import './Header.css'

export default function Header({ cartCount, currency, onCurrencyChange }) {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isCurrencyOpen, setIsCurrencyOpen] = useState(false)

  const currencies = ['GBP', 'USD', 'EUR']

  const navLinkClass = ({ isActive }) => `nav-link${isActive ? ' active' : ''}`

  const handleLogout = async () => {
    await logout()
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
          <div className="currency-badge" onClick={() => setIsCurrencyOpen(!isCurrencyOpen)}>
            {currency}
            {isCurrencyOpen && (
              <div className="currency-dropdown">
                {currencies.map((curr) => (
                  <button
                    key={curr}
                    className={`currency-option ${curr === currency ? 'active' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation()
                      onCurrencyChange?.(curr)
                      setIsCurrencyOpen(false)
                    }}
                  >
                    {curr}
                  </button>
                ))}
              </div>
            )}
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
          
          <button className="cart-button" onClick={() => navigate('/cart')}>
            🛒 Cart ({cartCount})
          </button>

          <button className="menu-button" onClick={() => setIsMenuOpen(true)}>
            <span className="menu-icon">☰</span>
          </button>
        </div>
      </div>

      <UserMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
    </header>
  )
}
