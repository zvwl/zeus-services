import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { supabase } from '../supabaseClient'
import { useAuth } from '../contexts/AuthContext'
import SEO from '../components/SEO'
import Breadcrumb from '../components/Breadcrumb'
import LoadingSpinner from '../components/LoadingSpinner'
import FlyingCartAnimation from '../components/FlyingCartAnimation'
import { isPrerender } from '../utils/isPrerender'
import '../App.css'

export default function ItemDetailPage({ formatPrice, addToCart, platformOptions, cartItems = [], updateQuantity, removeFromCart }) {
  const { categorySlug, gameSlug, itemSlug } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [item, setItem] = useState(null)
  const [game, setGame] = useState(null)
  const [category, setCategory] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedPlatform, setSelectedPlatform] = useState('')
  const [selectedVersion, setSelectedVersion] = useState('')
  const [addingToCart, setAddingToCart] = useState(false)
  const [isInCart, setIsInCart] = useState(false)
  const [cartQuantity, setCartQuantity] = useState(1)
  const [attemptedSubmit, setAttemptedSubmit] = useState(false)
  const [showFlyingAnimation, setShowFlyingAnimation] = useState(false)

  // Check if item is already in cart and update state
  useEffect(() => {
    if (item && selectedPlatform && cartItems) {
      const cartId = `${item.id}-${selectedPlatform}`
      const existingItem = cartItems.find(cartItem => cartItem.cartId === cartId)
      if (existingItem) {
        setIsInCart(true)
        setCartQuantity(existingItem.quantity)
      } else {
        setIsInCart(false)
        setCartQuantity(1)
      }
    }
  }, [item, selectedPlatform, cartItems])

  useEffect(() => {
    const fetchData = async () => {
      if (isPrerender()) {
        setLoading(false)
        return
      }
      setLoading(true)
      try {
        // Fetch game
        const { data: gameData, error: gameError } = await supabase
          .from('games')
          .select('*')
          .eq('slug', gameSlug)
          .single()

        if (gameError) throw gameError
        setGame(gameData)

        // Fetch category
        const { data: categoryData, error: categoryError } = await supabase
          .from('categories')
          .select('*')
          .eq('slug', categorySlug)
          .single()

        if (categoryError) throw categoryError
        setCategory(categoryData)

        // Fetch item
        const { data: itemData, error: itemError } = await supabase
          .from('items')
          .select('*')
          .eq('slug', itemSlug)
          .eq('game_id', gameData.id)
          .eq('category_id', categoryData.id)
          .single()

        if (itemError) throw itemError
        setItem(itemData)

        // Require explicit selection when options are available
        if (itemData.platforms && itemData.platforms.length > 0) {
          setSelectedPlatform('')
        } else {
          setSelectedPlatform('Any Platform')
        }
        if (itemData.versions && itemData.versions.length > 0) {
          setSelectedVersion('')
        } else {
          setSelectedVersion('Standard')
        }
      } catch (err) {
        console.error('Error fetching item:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [categorySlug, gameSlug, itemSlug])

  // Check for pending cart item after login
  useEffect(() => {
    if (user && item && game && category) {
      const pendingItem = localStorage.getItem('pendingCartItem')
      if (pendingItem) {
        try {
          const { itemId, gameSlug: pendingGame, categorySlug: pendingCategory } = JSON.parse(pendingItem)
          if (itemId === item.id && pendingGame === gameSlug && pendingCategory === categorySlug) {
            // Auto-add to cart
            handleAddToCart()
            localStorage.removeItem('pendingCartItem')
          }
        } catch (err) {
          console.error('Error processing pending cart item:', err)
          localStorage.removeItem('pendingCartItem')
        }
      }
    }
  }, [user, item, game, category, gameSlug, categorySlug])

  const handleAddToCart = async () => {
    // Check if out of stock
    if (item.stock_enabled && !item.stock_unlimited && (item.stock_quantity === null || item.stock_quantity === 0)) {
      alert('This item is out of stock')
      return
    }
    
    const requiresPlatform = item?.platforms && item.platforms.length > 0
    if (requiresPlatform && !selectedPlatform) {
      setAttemptedSubmit(true)
      return
    }
    const requiresVersion = item?.versions && item.versions.length > 0
    if (requiresVersion && !selectedVersion) {
      setAttemptedSubmit(true)
      return
    }

    // Start the flying animation
    setShowFlyingAnimation(true)
  }

  const handleAnimationComplete = async () => {
    setShowFlyingAnimation(false)
    setAddingToCart(true)
    try {
      // Create cart item object compatible with existing cart system
      const cartItem = {
        ...item,
        platform: selectedPlatform,
        version: selectedVersion,
        category_slug: categorySlug,
        game_slug: gameSlug,
        item_slug: itemSlug,
        game_id: game.id,
        game_name: game.name,
        category_id: category.id,
        category_name: category.name
      }
      
      // Add to cart
      addToCart(cartItem, selectedPlatform)
    } catch (err) {
      console.error('Error adding to cart:', err)
      alert('Failed to add item to cart')
    } finally {
      setAddingToCart(false)
    }
  }

  const handleQuantityChange = (newQuantity) => {
    if (newQuantity >= 1 && newQuantity <= 100 && isInCart && updateQuantity) {
      const cartId = `${item.id}-${selectedPlatform}`
      updateQuantity(cartId, newQuantity)
    }
  }

  const handleAddMore = () => {
    const cartItem = {
      ...item,
      platform: selectedPlatform,
      version: selectedVersion,
      category_slug: categorySlug,
      game_slug: gameSlug,
      item_slug: itemSlug,
      game_id: game.id,
      game_name: game.name,
      category_id: category.id,
      category_name: category.name
    }
    addToCart(cartItem, selectedPlatform)
  }

  const handleRemoveOne = () => {
    if (isInCart && cartQuantity > 1 && updateQuantity) {
      const cartId = `${item.id}-${selectedPlatform}`
      updateQuantity(cartId, cartQuantity - 1)
    } else if (isInCart && cartQuantity === 1 && removeFromCart) {
      const cartId = `${item.id}-${selectedPlatform}`
      removeFromCart(cartId)
    }
  }

  if (loading) {
    return <LoadingSpinner message="Loading item..." />
  }

  if (!item || !game || !category) {
    return (
      <div className="section">
        <h1>Not Found</h1>
        <p>The requested item could not be found.</p>
      </div>
    )
  }

  const pageTitle = `${item.name} - ${game.name} ${category.name}`
  const pageDescription = item.description || `Get ${item.name} for ${game.name}`

  // Check stock status
  const isOutOfStock = item.stock_enabled && 
    !item.stock_unlimited && 
    (item.stock_quantity === null || item.stock_quantity === 0)
  
  const stockBadgeText = item.stock_enabled && !item.stock_unlimited && item.stock_quantity !== null
    ? `${item.stock_quantity} in stock`
    : null

  return (
    <>
      <FlyingCartAnimation 
        isActive={showFlyingAnimation}
        itemIcon={item?.icon || game?.icon_url}
        onComplete={handleAnimationComplete}
      />
      <SEO
        title={pageTitle}
        description={pageDescription}
        path={`/${categorySlug}/${gameSlug}/${itemSlug}`}
      />
      <section className="section service-detail">
        <Breadcrumb
          customItems={[
            { label: 'Home', path: '/' },
            { label: game.name, path: `/${categorySlug}/${gameSlug}` },
            { label: item.name, path: `/${categorySlug}/${gameSlug}/${itemSlug}` }
          ]}
        />

        <div className="service-detail-container">
          <div className="service-detail-header">
            <div className="service-detail-icon">
              <picture>
                <source type="image/webp" srcSet={item.icon || game?.icon_url || '/zeusservicesPackage.webp'} />
                <img
                  src={item.icon || game?.icon_url || '/zeusservicesPackage.png'}
                  alt={item.name}
                  onError={(e) => {
                    if (e.target.dataset.fallbackApplied === '1') return
                    e.target.dataset.fallbackApplied = '1'
                    e.target.src = game?.icon_url || '/zeusservicesPackage.png'
                  }}
                />
              </picture>
            </div>
            <div className="service-detail-info">
              <p className="eyebrow">{game.name} - {category.name}</p>
              <h1 className="service-detail-title">{item.name}</h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                <p className="service-detail-price">{formatPrice(item.price)}</p>
                {stockBadgeText && !isOutOfStock && (
                  <span style={{
                    padding: '0.4rem 0.9rem',
                    background: 'rgba(34, 197, 94, 0.15)',
                    color: '#22c55e',
                    borderRadius: '6px',
                    fontSize: '0.85rem',
                    fontWeight: '600',
                    border: '1px solid rgba(34, 197, 94, 0.3)'
                  }}>
                    {stockBadgeText}
                  </span>
                )}
                {isOutOfStock && (
                  <span style={{
                    padding: '0.4rem 0.9rem',
                    background: 'rgba(239, 68, 68, 0.15)',
                    color: '#ef4444',
                    borderRadius: '6px',
                    fontSize: '0.85rem',
                    fontWeight: '700',
                    border: '1px solid rgba(239, 68, 68, 0.3)'
                  }}>
                    Out of Stock
                  </span>
                )}
              </div>
            </div>
          </div>

          {item.description && (
            <div className="service-detail-description">
              <h2>Description</h2>
              <p>{item.description}</p>
            </div>
          )}

          {item.details && item.details.length > 0 && (
            <div className="service-detail-features">
              <h2>Details</h2>
              <ul className="features-list">
                {item.details.map((detail, idx) => (
                  <li key={idx}>{detail}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="service-detail-options">
            {item.platforms && item.platforms.length > 0 && !game.is_coming_soon && (
              <div className="option-group">
                <label htmlFor="platform-select">Select Platform:</label>
                <select
                  id="platform-select"
                  value={selectedPlatform}
                  onChange={(e) => setSelectedPlatform(e.target.value)}
                  className="option-select"
                >
                  <option value="">Select a platform</option>
                  {item.platforms.map((platform) => (
                    <option key={platform} value={platform}>
                      {platform}
                    </option>
                  ))}
                </select>
                {attemptedSubmit && selectedPlatform === '' && (
                  <p style={{ marginTop: '0.5rem', color: '#fbbf24', fontSize: '0.9rem', fontWeight: 600 }}>
                    Please select a platform to continue.
                  </p>
                )}
              </div>
            )}

            {item.versions && item.versions.length > 0 && !game.is_coming_soon && (
              <div className="option-group">
                <label htmlFor="version-select">Select Version:</label>
                <select
                  id="version-select"
                  value={selectedVersion}
                  onChange={(e) => setSelectedVersion(e.target.value)}
                  className="option-select"
                >
                  <option value="">Select a version</option>
                  {item.versions.map((version) => (
                    <option key={version} value={version}>
                      {version}
                    </option>
                  ))}
                </select>
                {attemptedSubmit && selectedVersion === '' && (
                  <p style={{ marginTop: '0.5rem', color: '#fbbf24', fontSize: '0.9rem', fontWeight: 600 }}>
                    Please select a version to continue.
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="service-detail-actions">
            {game.is_coming_soon ? (
              <div style={{
                padding: '1.5rem',
                background: 'rgba(251, 191, 36, 0.1)',
                border: '1px solid rgba(251, 191, 36, 0.3)',
                borderRadius: '12px',
                textAlign: 'center'
              }}>
                <p style={{
                  margin: 0,
                  fontSize: '1.1rem',
                  fontWeight: 700,
                  color: '#fbbf24'
                }}>
                  Coming Soon
                </p>
                <p style={{
                  margin: '0.5rem 0 0 0',
                  fontSize: '0.95rem',
                  color: '#cbd5e1'
                }}>
                  This item is not yet available for purchase. Check back soon!
                </p>
              </div>
            ) : isOutOfStock ? (
              <div style={{
                padding: '1.5rem',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '12px',
                textAlign: 'center'
              }}>
                <p style={{
                  margin: 0,
                  fontSize: '1.1rem',
                  fontWeight: 700,
                  color: '#ef4444'
                }}>
                  Out of Stock
                </p>
                <p style={{
                  margin: '0.5rem 0 0 0',
                  fontSize: '0.95rem',
                  color: '#cbd5e1'
                }}>
                  This item is currently unavailable. Check back later for restock!
                </p>
              </div>
            ) : !isInCart ? (
              <motion.div
                initial={{ opacity: 1, scale: 1, y: 0 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 10 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
              >
                <button
                  className="cta-button"
                  onClick={handleAddToCart}
                  disabled={addingToCart || showFlyingAnimation}
                >
                  {addingToCart ? 'Adding to Cart...' : 'Add to Cart'}
                </button>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 10 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
              >
                <div className="quantity-inline-controls button-style">
                  <button
                    className="quantity-button"
                    onClick={handleRemoveOne}
                  >
                    −
                  </button>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={cartQuantity}
                    onChange={(e) => handleQuantityChange(Math.max(1, parseInt(e.target.value) || 1))}
                    className="quantity-input"
                  />
                  <button
                    className="quantity-button"
                    onClick={handleAddMore}
                  >
                    +
                  </button>
                </div>
              </motion.div>
            )}
            <button
              className="secondary-button"
              onClick={() => navigate(`/${categorySlug}/${gameSlug}`)}
            >
              Back to {category.name}
            </button>
          </div>
        </div>
      </section>
    </>
  )
}
