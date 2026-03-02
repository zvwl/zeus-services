import { useState, useEffect, useRef } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { DollarSign, Euro, PoundSterling, ShoppingCart } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../supabaseClient'
import UserMenu from './UserMenu'
import CategoryDropdown from './CategoryDropdown'
import AnimatedLucideIcon from './AnimatedLucideIcon'
import AnimatedBurgerIcon from './AnimatedBurgerIcon'
import './Header.css'
import './AnimatedMenuIcon.css'

export default function Header({ cartCount, currency, onCurrencyChange }) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isCurrencyOpen, setIsCurrencyOpen] = useState(false)
  const [categories, setCategories] = useState([])
  const cartIconRef = useRef(null)
  const currencyIconRefs = useRef({})

  const currencies = ['GBP', 'USD', 'EUR']
  const currencyIcons = {
    GBP: PoundSterling,
    USD: DollarSign,
    EUR: Euro,
  }
  const navLinkClass = ({ isActive }) => `nav-link${isActive ? ' active' : ''}`
  const fixedNavLinkClass = ({ isActive }) => `nav-link nav-link-fixed${isActive ? ' active' : ''}`

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
        setCategories([
          { id: '1', name: 'Topups', slug: 'topups', display_order: 1 },
          { id: '2', name: 'Boosting', slug: 'boosting', display_order: 2 },
          { id: '3', name: 'Accounts', slug: 'accounts', display_order: 3 }
        ])
      }
    }
    fetchCategories()
  }, [])

  // Simple scroll tracking - just for at-top class, no hiding
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.pageYOffset || document.documentElement.scrollTop || 0
      if (currentScrollY <= 5) {
        document.body.classList.add('at-top')
      } else {
        document.body.classList.remove('at-top')
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()

    return () => window.removeEventListener('scroll', handleScroll)
  }, [])


  return (
    <>
      <header className="header">
        <div className="header-content">
          {/* Left: Logo */}
          <button className="brand" onClick={() => navigate('/')}>
            <span className="logo-icon">
              <img
                src="/zeus-logo-main-96.webp"
                srcSet="/zeus-logo-main-64.webp 64w, /zeus-logo-main-96.webp 96w, /zeus-logo-main-128.webp 128w, /zeus-logo-main-192.webp 192w"
                sizes="(max-width: 480px) 62px, (max-width: 768px) 72px, 84px"
                alt="Zeus Services"
                width="84"
                height="84"
                decoding="async"
                fetchPriority="high"
              />
            </span>
            <span className="brand-name">Zeus Services</span>
          </button>

          {/* Center: Desktop Navigation */}
          <nav className="nav-desktop">
            <NavLink to="/" className={navLinkClass}>Home</NavLink>
            {categories.map(category => (
              <CategoryDropdown key={category.id} category={category} />
            ))}
            <NavLink to="/reviews" className={fixedNavLinkClass}>Reviews</NavLink>
            {user && <NavLink to="/settings" className={fixedNavLinkClass}>Settings</NavLink>}
          </nav>

          {/* Right: Actions */}
          <div className="nav-actions">
            <div className="currency-badge" onClick={() => setIsCurrencyOpen(!isCurrencyOpen)}>
              {currency}
              {isCurrencyOpen && (
                <div className="currency-dropdown">
                  {currencies.map((curr) => {
                    const IconComponent = currencyIcons[curr]
                    return (
                      <button
                        key={curr}
                        className={`currency-option ${curr === currency ? 'active' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation()
                          onCurrencyChange?.(curr)
                          setIsCurrencyOpen(false)
                        }}
                        onMouseEnter={() => currencyIconRefs.current[curr]?.startAnimation?.()}
                        onMouseLeave={() => currencyIconRefs.current[curr]?.stopAnimation?.()}
                        onFocus={() => currencyIconRefs.current[curr]?.startAnimation?.()}
                        onBlur={() => currencyIconRefs.current[curr]?.stopAnimation?.()}
                      >
                        <AnimatedLucideIcon
                          ref={(el) => {
                            currencyIconRefs.current[curr] = el
                          }}
                          icon={IconComponent}
                          size={18}
                          animation="spin"
                          animateOnHover={false}
                        />
                        <span>{curr}</span>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            <button
              className="cart-button"
              onClick={() => navigate('/cart')}
              onMouseEnter={() => cartIconRef.current?.startAnimation?.()}
              onMouseLeave={() => cartIconRef.current?.stopAnimation?.()}
              onFocus={() => cartIconRef.current?.startAnimation?.()}
              onBlur={() => cartIconRef.current?.stopAnimation?.()}
            >
              <div className="cart-icon">
                <AnimatedLucideIcon
                  ref={cartIconRef}
                  icon={ShoppingCart}
                  size={24}
                  animation="bounce"
                  animateOnHover={false}
                />
              </div>
              <span className="cart-text">Cart</span>
              <span className="cart-count">({cartCount})</span>
            </button>

            <button
              type="button"
              className="animated-menu-button menu-button-mobile"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
              title={isMenuOpen ? 'Close menu' : 'Open menu'}
            >
              <AnimatedBurgerIcon isOpen={isMenuOpen} size={28} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Sidebar Menu */}
      <UserMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} categories={categories} user={user} />
    </>
  )
}
