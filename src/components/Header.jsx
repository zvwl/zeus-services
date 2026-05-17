'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import {
  DollarSign,
  Euro,
  PoundSterling,
  Search,
  ShoppingCart,
  UserRound,
  X,
  Sun,
  Moon,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useCart } from '@/contexts/CartContext'
import { supabase } from '@/lib/supabase/client'
import UserMenu from './UserMenu'
import CategoryDropdown from './CategoryDropdown'
import AnimatedLucideIcon from './AnimatedLucideIcon'
import AnimatedBurgerIcon from './AnimatedBurgerIcon'
import './Header.css'
import './AnimatedMenuIcon.css'

export default function Header() {
  const router = useRouter()
  const pathname = usePathname()
  const { user } = useAuth()
  const { cartCount, currency, setCurrency, openCart, closeCart, isCartOpen } = useCart()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isCurrencyOpen, setIsCurrencyOpen] = useState(false)
  const [categories, setCategories] = useState([])
  const [isCartCountAnimating, setIsCartCountAnimating] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [theme, setTheme] = useState('dark')

  const searchRef = useRef(null)
  const currencyRef = useRef(null)
  const cartIconRef = useRef(null)
  const currencyIconRefs = useRef({})
  const prevCartCountRef = useRef(cartCount)
  const cartCountAnimTimeoutRef = useRef(null)

  useEffect(() => {
    const saved = localStorage.getItem('theme') || 'dark'
    setTheme(saved)
    document.documentElement.setAttribute('data-theme', saved)
  }, [])

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    document.documentElement.setAttribute('data-theme', next)
    localStorage.setItem('theme', next)
  }

  useEffect(() => {
    if (isCartOpen) setIsMenuOpen(false)
  }, [isCartOpen])

  useEffect(() => {
    if (isMenuOpen) {
      setIsCurrencyOpen(false)
      setIsSearchOpen(false)
    }
  }, [isMenuOpen])

  const currencies = ['GBP', 'USD', 'EUR']
  const currencyIcons = { GBP: PoundSterling, USD: DollarSign, EUR: Euro }

  const navLinkClass = (href) => {
    const active = href === '/' ? pathname === '/' : pathname.startsWith(href)
    return `nav-link${active ? ' active' : ''}`
  }
  const fixedNavLinkClass = (href) => {
    const active = pathname === href
    return `nav-link nav-link-fixed${active ? ' active' : ''}`
  }

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data, error } = await supabase
          .from('categories')
          .select('*')
          .order('display_order', { ascending: true })
        if (error) throw error
        setCategories(data || [])
      } catch {
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
      const y = window.pageYOffset || document.documentElement.scrollTop || 0
      document.body.classList.toggle('at-top', y <= 5)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) setIsSearchOpen(false)
      if (currencyRef.current && !currencyRef.current.contains(e.target)) setIsCurrencyOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    const timer = setTimeout(async () => {
      const query = searchQuery.trim()
      if (query.length < 2) { setSearchResults([]); setIsSearching(false); return }

      setIsSearching(true)
      try {
        const pattern = `%${query.toLowerCase().replace(/[%,()]/g, ' ').replace(/\s+/g, ' ').trim()}%`
        const [directName, directSlug, catResults, gameResults] = await Promise.all([
          supabase.from('items').select('id, name, slug, categories(slug, name), games(slug, name)').ilike('name', pattern).limit(6),
          supabase.from('items').select('id, name, slug, categories(slug, name), games(slug, name)').ilike('slug', pattern).limit(6),
          supabase.from('categories').select('id').or(`name.ilike.${pattern},slug.ilike.${pattern}`).limit(12),
          supabase.from('games').select('id').or(`name.ilike.${pattern},slug.ilike.${pattern}`).limit(12),
        ])

        const categoryIds = (catResults.data || []).map(c => c.id)
        const gameIds = (gameResults.data || []).map(g => g.id)

        const [catItems, gameItems] = await Promise.all([
          categoryIds.length
            ? supabase.from('items').select('id, name, slug, categories(slug, name), games(slug, name)').in('category_id', categoryIds).limit(6)
            : Promise.resolve({ data: [] }),
          gameIds.length
            ? supabase.from('items').select('id, name, slug, categories(slug, name), games(slug, name)').in('game_id', gameIds).limit(6)
            : Promise.resolve({ data: [] }),
        ])

        const merged = [
          ...(directName.data || []),
          ...(directSlug.data || []),
          ...(catItems.data || []),
          ...(gameItems.data || []),
        ]
        setSearchResults(Array.from(new Map(merged.map(item => [item.id, item])).values()).slice(0, 6))
      } catch {
        setSearchResults([])
      } finally {
        setIsSearching(false)
      }
    }, 250)
    return () => clearTimeout(timer)
  }, [searchQuery])

  useEffect(() => {
    if (cartCount > prevCartCountRef.current) {
      setIsCartCountAnimating(false)
      requestAnimationFrame(() => setIsCartCountAnimating(true))
      if (cartCountAnimTimeoutRef.current) clearTimeout(cartCountAnimTimeoutRef.current)
      cartCountAnimTimeoutRef.current = setTimeout(() => setIsCartCountAnimating(false), 520)
    }
    prevCartCountRef.current = cartCount
    return () => { if (cartCountAnimTimeoutRef.current) clearTimeout(cartCountAnimTimeoutRef.current) }
  }, [cartCount])

  const closeAll = () => {
    closeCart()
    setIsMenuOpen(false)
    setIsCurrencyOpen(false)
    setIsSearchOpen(false)
  }

  const getRelated = (value) => Array.isArray(value) ? value[0] : value

  const handleSearchNavigate = (item) => {
    const category = getRelated(item.categories)
    const game = getRelated(item.games)
    if (category?.slug && game?.slug) {
      closeAll()
      router.push(`/${category.slug}/${game.slug}/${item.slug}`)
      setSearchQuery('')
      setSearchResults([])
    }
  }

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    if (searchResults[0]) handleSearchNavigate(searchResults[0])
  }

  const handleNav = (path) => {
    closeAll()
    router.push(path)
  }

  return (
    <>
      <header className="header">
        <div className="header-shell">
          <div className="header-brand">
            <button className="brand" onClick={() => handleNav('/')}>
              <span className="logo-icon">
                <img
                  src="/zeus-logo-main-96.webp"
                  srcSet="/zeus-logo-main-64.webp 64w, /zeus-logo-main-96.webp 96w, /zeus-logo-main-128.webp 128w, /zeus-logo-main-192.webp 192w"
                  sizes="(max-width: 480px) 62px, (max-width: 768px) 72px, 84px"
                  alt="Zeuservices"
                  width="84"
                  height="84"
                  decoding="async"
                  fetchPriority="high"
                />
              </span>
              <span className="brand-name">Zeuservices</span>
            </button>
          </div>

          <form className="header-search" ref={searchRef} onSubmit={handleSearchSubmit} role="search">
            <div className="search-shell">
              <Search className="search-icon" size={18} aria-hidden="true" />
              <input
                type="text"
                name="site-search"
                id="site-search"
                placeholder="Search services"
                value={searchQuery}
                onChange={e => { setSearchQuery(e.target.value); setIsSearchOpen(true) }}
                onFocus={() => setIsSearchOpen(true)}
                autoComplete="off"
                spellCheck="false"
              />
              {searchQuery && (
                <button type="button" className="search-clear" onClick={() => { setSearchQuery(''); setSearchResults([]) }} aria-label="Clear search">
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
                    {searchResults.map(item => (
                      <button key={item.id} type="button" className="search-result" onClick={() => handleSearchNavigate(item)}>
                        <span className="search-result-title">{item.name}</span>
                        <span className="search-result-meta">
                          {getRelated(item.categories)?.name || 'Category'}
                          {getRelated(item.games)?.name ? ` • ${getRelated(item.games).name}` : ''}
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
              onClick={() => handleNav(user ? '/settings' : '/login')}
            >
              <UserRound size={18} aria-hidden="true" />
              <span className="header-action-label">{user ? 'Account' : 'Sign in'}</span>
            </button>

            <div className="currency-wrap">
              <button
                type="button"
                className="header-action currency-badge"
                onClick={() => { setIsMenuOpen(false); setIsSearchOpen(false); setIsCurrencyOpen(!isCurrencyOpen) }}
                aria-haspopup="menu"
                aria-expanded={isCurrencyOpen}
                aria-label={`Current currency ${currency}`}
              >
                <span className="currency-label">{currency}</span>
                <span className="currency-chevron">⌄</span>
              </button>

              {isCurrencyOpen && (
                <div className="currency-dropdown" role="menu">
                  {currencies.map(curr => {
                    const Icon = currencyIcons[curr]
                    return (
                      <button
                        key={curr}
                        type="button"
                        className={`currency-option ${curr === currency ? 'active' : ''}`}
                        onClick={e => { e.stopPropagation(); setCurrency(curr); setIsCurrencyOpen(false) }}
                        onMouseEnter={() => currencyIconRefs.current[curr]?.startAnimation?.()}
                        onMouseLeave={() => currencyIconRefs.current[curr]?.stopAnimation?.()}
                        onFocus={() => currencyIconRefs.current[curr]?.startAnimation?.()}
                        onBlur={() => currencyIconRefs.current[curr]?.stopAnimation?.()}
                      >
                        <AnimatedLucideIcon
                          ref={el => { currencyIconRefs.current[curr] = el }}
                          icon={Icon}
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
              onClick={() => { setIsMenuOpen(false); setIsCurrencyOpen(false); openCart() }}
              onMouseEnter={() => cartIconRef.current?.startAnimation?.()}
              onMouseLeave={() => cartIconRef.current?.stopAnimation?.()}
              onFocus={() => cartIconRef.current?.startAnimation?.()}
              onBlur={() => cartIconRef.current?.stopAnimation?.()}
            >
              <span className="cart-icon">
                <AnimatedLucideIcon ref={cartIconRef} icon={ShoppingCart} size={20} animation="bounce" animateOnHover={false} />
              </span>
              <span className="header-action-label cart-label">Cart</span>
              <span className={`cart-count ${isCartCountAnimating ? 'is-animating' : ''}`}>{cartCount}</span>
            </button>

            <button
              type="button"
              className="header-action theme-toggle"
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
            >
              {theme === 'dark' ? <Sun size={18} strokeWidth={2} /> : <Moon size={18} strokeWidth={2} />}
            </button>

            <button
              type="button"
              className="animated-menu-button menu-button-mobile header-menu-toggle"
              onClick={() => { setIsSearchOpen(false); setIsCurrencyOpen(false); setIsMenuOpen(!isMenuOpen) }}
              aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
            >
              <AnimatedBurgerIcon isOpen={isMenuOpen} size={28} />
            </button>
          </div>

          <nav className="header-nav" aria-label="Primary navigation">
            <Link href="/" className={navLinkClass('/')} onClick={closeCart}>Home</Link>
            {categories.map(category => (
              <CategoryDropdown key={category.id} category={category} onCloseCart={closeCart} />
            ))}
            <Link href="/reviews" className={fixedNavLinkClass('/reviews')} onClick={closeCart}>Reviews</Link>
            <Link href="/faq" className={fixedNavLinkClass('/faq')} onClick={closeCart}>FAQ</Link>
          </nav>
        </div>
      </header>

      <UserMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} onCloseCart={closeCart} user={user} />
    </>
  )
}
