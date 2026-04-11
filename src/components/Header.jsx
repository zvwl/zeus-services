import { useState, useEffect, useRef } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  DollarSign,
  Euro,
  PoundSterling,
  Search,
  ShoppingCart,
  UserRound,
  X,
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../supabaseClient'
import UserMenu from './UserMenu'
import CategoryDropdown from './CategoryDropdown'
import AnimatedLucideIcon from './AnimatedLucideIcon'
import AnimatedBurgerIcon from './AnimatedBurgerIcon'
import './Header.css'
import './AnimatedMenuIcon.css'

export default function Header({ cartCount, currency, onCurrencyChange, onCartClick, isCartDrawerOpen, onCloseCart, onUserMenuToggle }) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isCurrencyOpen, setIsCurrencyOpen] = useState(false)
  const [categories, setCategories] = useState([])
  const [isCartCountAnimating, setIsCartCountAnimating] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isSearching, setIsSearching] = useState(false)

  const searchRef = useRef(null)
  const currencyRef = useRef(null)
  const cartIconRef = useRef(null)
  const currencyIconRefs = useRef({})
  const prevCartCountRef = useRef(cartCount)
  const cartCountAnimTimeoutRef = useRef(null)

  useEffect(() => {
    if (isCartDrawerOpen) {
      setIsMenuOpen(false)
    }
  }, [isCartDrawerOpen])

  useEffect(() => {
    onUserMenuToggle?.(isMenuOpen)
  }, [isMenuOpen, onUserMenuToggle])

  useEffect(() => {
    if (isMenuOpen) {
      setIsCurrencyOpen(false)
      setIsSearchOpen(false)
    }
  }, [isMenuOpen])

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
          { id: '1', name: 'Boosting', slug: 'boosting', display_order: 1 },
          { id: '2', name: 'Accounts', slug: 'accounts', display_order: 2 },
          { id: '3', name: 'Topups', slug: 'topups', display_order: 3 },
        ])
      }
    }
    fetchCategories()
  }, [])

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

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsSearchOpen(false)
      }

      if (currencyRef.current && !currencyRef.current.contains(event.target)) {
        setIsCurrencyOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    const timer = setTimeout(async () => {
      const query = searchQuery.trim()

      if (query.length < 2) {
        setSearchResults([])
        setIsSearching(false)
        return
      }

      setIsSearching(true)
      try {
        const pattern = `%${query.toLowerCase().replace(/[%,()]/g, ' ').replace(/\s+/g, ' ').trim()}%`

        const [directNameResults, directSlugResults, categoryResults, gameResults] = await Promise.all([
          supabase
            .from('items')
            .select('id, name, slug, categories(slug, name), games(slug, name)')
            .ilike('name', pattern)
            .limit(6),
          supabase
            .from('items')
            .select('id, name, slug, categories(slug, name), games(slug, name)')
            .ilike('slug', pattern)
            .limit(6),
          supabase
            .from('categories')
            .select('id')
            .or(`name.ilike.${pattern},slug.ilike.${pattern}`)
            .limit(12),
          supabase
            .from('games')
            .select('id')
            .or(`name.ilike.${pattern},slug.ilike.${pattern}`)
            .limit(12)
        ])

        const categoryIds = (categoryResults.data || []).map((category) => category.id)
        const gameIds = (gameResults.data || []).map((game) => game.id)

        const [categoryItems, gameItems] = await Promise.all([
          categoryIds.length
            ? supabase
              .from('items')
              .select('id, name, slug, categories(slug, name), games(slug, name)')
              .in('category_id', categoryIds)
              .limit(6)
            : Promise.resolve({ data: [] }),
          gameIds.length
            ? supabase
              .from('items')
              .select('id, name, slug, categories(slug, name), games(slug, name)')
              .in('game_id', gameIds)
              .limit(6)
            : Promise.resolve({ data: [] })
        ])

        const mergedResults = [
          ...(directNameResults.data || []),
          ...(directSlugResults.data || []),
          ...(categoryItems.data || []),
          ...(gameItems.data || [])
        ]

        setSearchResults(Array.from(new Map(mergedResults.map((item) => [item.id, item])).values()).slice(0, 6))
      } catch (err) {
        console.error('Header search error:', err)
        setSearchResults([])
      } finally {
        setIsSearching(false)
      }
    }, 250)

    return () => clearTimeout(timer)
  }, [searchQuery])

  useEffect(() => {
    const prevCount = prevCartCountRef.current
    if (cartCount > prevCount) {
      setIsCartCountAnimating(false)
      requestAnimationFrame(() => setIsCartCountAnimating(true))

      if (cartCountAnimTimeoutRef.current) {
        clearTimeout(cartCountAnimTimeoutRef.current)
      }
      cartCountAnimTimeoutRef.current = setTimeout(() => {
        setIsCartCountAnimating(false)
      }, 520)
    }

    prevCartCountRef.current = cartCount

    return () => {
      if (cartCountAnimTimeoutRef.current) {
        clearTimeout(cartCountAnimTimeoutRef.current)
      }
    }
  }, [cartCount])

  const closeDrawerState = () => {
    onCloseCart?.()
    setIsMenuOpen(false)
    setIsCurrencyOpen(false)
    setIsSearchOpen(false)
  }

  const getRelatedRecord = (value) => (Array.isArray(value) ? value[0] : value)

  const handleSearchNavigate = (item) => {
    const category = getRelatedRecord(item.categories)
    const game = getRelatedRecord(item.games)
    const categorySlug = category?.slug || ''
    const gameSlug = game?.slug || ''

    if (categorySlug && gameSlug) {
      closeDrawerState()
      navigate(`/${categorySlug}/${gameSlug}/${item.slug}`)
      setSearchQuery('')
      setSearchResults([])
    }
  }

  const handleSearchSubmit = (event) => {
    event.preventDefault()
    if (searchResults[0]) {
      handleSearchNavigate(searchResults[0])
    }
  }

  const handleActionNavigation = (path) => {
    closeDrawerState()
    navigate(path)
  }


  return (
    <>
      <header className="header">
        <div className="header-shell">
          <div className="header-brand">
            <button className="brand" onClick={() => handleActionNavigation('/')}>
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
          </div>

          <form className="header-search" ref={searchRef} onSubmit={handleSearchSubmit} role="search">
            <div className="search-shell">
              <Search className="search-icon" size={18} aria-hidden="true" />
              <input
                type="text"
                name="site-search"
                id="site-search"
                placeholder="Search Zeus services"
                value={searchQuery}
                onChange={(event) => {
                  setSearchQuery(event.target.value)
                  setIsSearchOpen(true)
                }}
                onFocus={() => setIsSearchOpen(true)}
                autoComplete="off"
                spellCheck="false"
              />
              {searchQuery && (
                <button
                  type="button"
                  className="search-clear"
                  onClick={() => {
                    setSearchQuery('')
                    setSearchResults([])
                  }}
                  aria-label="Clear search"
                >
                  <X size={16} aria-hidden="true" />
                </button>
              )}
            </div>

            {isSearchOpen && (
              <div className="search-results-panel">
                {isSearching ? (
                  <div className="search-state">Searching...</div>
                ) : searchQuery.trim().length < 2 ? (
                  <div className="search-state">Type at least 2 characters to search</div>
                ) : searchResults.length === 0 ? (
                  <div className="search-state">No matching services found</div>
                ) : (
                  <div className="search-results-list">
                    {searchResults.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        className="search-result"
                        onClick={() => handleSearchNavigate(item)}
                      >
                        <span className="search-result-title">{item.name}</span>
                        <span className="search-result-meta">
                          {getRelatedRecord(item.categories)?.name || 'Category'}
                          {getRelatedRecord(item.games)?.name ? ` • ${getRelatedRecord(item.games).name}` : ''}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </form>

          <div className="header-actions" ref={currencyRef}>
            <button
              type="button"
              className="header-action header-action-link action-account"
              onClick={() => handleActionNavigation(user ? '/settings' : '/login')}
            >
              <UserRound size={18} aria-hidden="true" />
              <span className="header-action-label">{user ? 'Account' : 'Sign in'}</span>
            </button>

            <div className="currency-wrap">
              <button
                type="button"
                className="header-action currency-badge"
                onClick={() => {
                  setIsMenuOpen(false)
                  setIsSearchOpen(false)
                  setIsCurrencyOpen(!isCurrencyOpen)
                }}
                aria-haspopup="menu"
                aria-expanded={isCurrencyOpen}
                aria-label={`Current currency ${currency}`}
              >
                <span className="currency-label">{currency}</span>
                <span className="currency-chevron">⌄</span>
              </button>

              {isCurrencyOpen && (
                <div className="currency-dropdown" role="menu">
                  {currencies.map((curr) => {
                    const IconComponent = currencyIcons[curr]

                    return (
                      <button
                        key={curr}
                        type="button"
                        className={`currency-option ${curr === currency ? 'active' : ''}`}
                        onClick={(event) => {
                          event.stopPropagation()
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
              type="button"
              className="header-action cart-button"
              onClick={() => {
                setIsMenuOpen(false)
                setIsCurrencyOpen(false)
                onCartClick?.()
              }}
              onMouseEnter={() => cartIconRef.current?.startAnimation?.()}
              onMouseLeave={() => cartIconRef.current?.stopAnimation?.()}
              onFocus={() => cartIconRef.current?.startAnimation?.()}
              onBlur={() => cartIconRef.current?.stopAnimation?.()}
            >
              <span className="cart-icon">
                <AnimatedLucideIcon
                  ref={cartIconRef}
                  icon={ShoppingCart}
                  size={20}
                  animation="bounce"
                  animateOnHover={false}
                />
              </span>
              <span className="header-action-label cart-label">Cart</span>
              <span className={`cart-count ${isCartCountAnimating ? 'is-animating' : ''}`}>{cartCount}</span>
            </button>

            <button
              type="button"
              className="animated-menu-button menu-button-mobile header-menu-toggle"
              onClick={() => {
                setIsSearchOpen(false)
                setIsCurrencyOpen(false)
                setIsMenuOpen(!isMenuOpen)
              }}
              aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
              title={isMenuOpen ? 'Close menu' : 'Open menu'}
            >
              <AnimatedBurgerIcon isOpen={isMenuOpen} size={28} />
            </button>

          </div>

          <nav className="header-nav" aria-label="Primary navigation">
            <NavLink to="/" className={navLinkClass} onClick={() => onCloseCart?.()}>Home</NavLink>
            {categories.map(category => (
              <CategoryDropdown key={category.id} category={category} onCloseCart={onCloseCart} />
            ))}
            <NavLink to="/reviews" className={fixedNavLinkClass} onClick={() => onCloseCart?.()}>Reviews</NavLink>
            <NavLink to="/faq" className={fixedNavLinkClass} onClick={() => onCloseCart?.()}>FAQ</NavLink>
          </nav>
        </div>
      </header>

      <UserMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} onCloseCart={onCloseCart} user={user} />
    </>
  )
}
