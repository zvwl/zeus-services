import { useState, useEffect } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../supabaseClient'
import UserMenu from './UserMenu'
import CategoryDropdown from './CategoryDropdown'
import './Header.css'

export default function Header({ cartCount, currency, onCurrencyChange }) {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isCurrencyOpen, setIsCurrencyOpen] = useState(false)
  const [categories, setCategories] = useState([])

  const currencies = ['GBP', 'USD', 'EUR']

  const navLinkClass = ({ isActive }) => `nav-link${isActive ? ' active' : ''}`

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data, error } = await supabase
          .from('categories')
          .select('*')
          .order('display_order', { ascending: true })

        if (error) throw error
        setCategories(data || [])
      } catch (err) {
        console.error('Error fetching categories:', err)
        // Fallback to default categories
        setCategories([
          { id: '1', name: 'Topups', slug: 'topups', display_order: 1 },
          { id: '2', name: 'Boosting', slug: 'boosting', display_order: 2 },
          { id: '3', name: 'Accounts', slug: 'accounts', display_order: 3 }
        ])
      }
    }

    fetchCategories()
  }, [])

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  return (
    <>
      <header className="header">
        <div className="header-content">
          <button className="brand" onClick={() => navigate('/')}>
            <span className="logo-icon">
              <img
                src="/zeus-logo-main-96.webp"
                srcSet="/zeus-logo-main-64.webp 64w, /zeus-logo-main-96.webp 96w, /zeus-logo-main-128.webp 128w, /zeus-logo-main-192.webp 192w"
                sizes="(max-width: 480px) 56px, (max-width: 768px) 62px, (max-width: 1024px) 120px, 86px"
                alt="Zeus Services"
                width="86"
                height="86"
                decoding="async"
                fetchPriority="high"
              />
            </span>
            <span className="brand-name">Zeus Services</span>
          </button>

          <nav className="nav">
            <NavLink to="/" className={navLinkClass}>Home</NavLink>
            {categories.map(category => (
              <CategoryDropdown key={category.id} category={category} />
            ))}
            <NavLink to="/reviews" className={navLinkClass}>Reviews</NavLink>
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

            <button className="cart-button" onClick={() => navigate('/cart')}>
              🛒 Cart ({cartCount})
            </button>

            <button className="menu-button" onClick={() => setIsMenuOpen(true)}>
              <span className="menu-icon">☰</span>
            </button>
          </div>
        </div>
      </header>

      <UserMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
    </>
  )
}
