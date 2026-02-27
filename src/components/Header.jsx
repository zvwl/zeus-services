import { useState, useEffect, useRef } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../supabaseClient'
import UserMenu from './UserMenu'
import CategoryDropdown from './CategoryDropdown'
import { AnimatedMenuIcon } from './AnimatedMenuIcon'
import { AnimatedCartIcon } from './AnimatedCartIcon'
import { DollarSignIcon, EuroIcon, PoundSterlingIcon } from './CurrencyIcons'
import './Header.css'

export default function Header({ cartCount, currency, onCurrencyChange }) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isCurrencyOpen, setIsCurrencyOpen] = useState(false)
  const [categories, setCategories] = useState([])
  const [headerVisible, setHeaderVisible] = useState(true)
  const lastScrollYRef = useRef(0)
  const menuIconRef = useRef(null)
  const cartIconRef = useRef(null)

  const currencies = ['GBP', 'USD', 'EUR']
  const currencyIcons = {
    GBP: PoundSterlingIcon,
    USD: DollarSignIcon,
    EUR: EuroIcon,
  }
  const currencyRefs = {
    GBP: useRef(null),
    USD: useRef(null),
    EUR: useRef(null),
  }
  const navLinkClass = ({ isActive }) => `nav-link${isActive ? ' active' : ''}`

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

  useEffect(() => {
    const icon = menuIconRef.current
    if (!icon) return
    if (isMenuOpen) {
      icon.startAnimation()
    } else {
      icon.stopAnimation()
    }
  }, [isMenuOpen])

  // Mobile header scroll behavior - hide on scroll down, show on scroll up or at top
  useEffect(() => {
    let ticking = false
    const isMobile = () => window.innerWidth <= 480
    const getScrollY = () => Math.max(0, window.pageYOffset || document.documentElement.scrollTop || 0)

    const applyVisibility = (currentScrollY) => {
      // Desktop always shows header
      if (!isMobile()) {
        setHeaderVisible(true)
        lastScrollYRef.current = currentScrollY
        return
      }

      // Always show header when at the very top
      if (currentScrollY <= 5) {
        setHeaderVisible(true)
        lastScrollYRef.current = currentScrollY
        return
      }

      const lastScrollY = lastScrollYRef.current
      const scrollDelta = currentScrollY - lastScrollY

      if (scrollDelta < -2) {
        setHeaderVisible(true)
      } else if (scrollDelta > 2 && currentScrollY > 80) {
        setHeaderVisible(false)
      }

      lastScrollYRef.current = currentScrollY
    }

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          applyVisibility(getScrollY())
          ticking = false
        })
        ticking = true
      }
    }

    const initialCheck = () => applyVisibility(getScrollY())

    initialCheck()
    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', initialCheck, { passive: true })

    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', initialCheck)
    }
  }, [])


  return (
    <>
      <header className={`header ${!headerVisible ? 'header-hidden' : ''}`}>
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
            <NavLink to="/reviews" className={navLinkClass}>Reviews</NavLink>
            {user && <NavLink to="/settings" className={navLinkClass}>Settings</NavLink>}
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
                        onMouseEnter={() => currencyRefs[curr].current?.startAnimation()}
                        onMouseLeave={() => currencyRefs[curr].current?.stopAnimation()}
                      >
                        <IconComponent ref={currencyRefs[curr]} size={18} />
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
              <AnimatedCartIcon ref={cartIconRef} className="cart-icon" size={28} />
              <span className="cart-text">Cart</span>
              <span className="cart-count">({cartCount})</span>
            </button>

            <AnimatedMenuIcon 
              ref={menuIconRef}
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="menu-button-mobile"
            />
          </div>
        </div>
      </header>

      {/* Mobile Sidebar Menu */}
      <UserMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} categories={categories} user={user} />
    </>
  )
}
