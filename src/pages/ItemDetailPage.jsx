import { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'motion/react'
import { supabase } from '../supabaseClient'
import { useAuth } from '../contexts/AuthContext'
import SEO from '../components/SEO'
import Breadcrumb from '../components/Breadcrumb'
import LoadingSpinner from '../components/LoadingSpinner'
import FlyingCartAnimation from '../components/FlyingCartAnimation'
import NotFoundPage from './NotFoundPage'
import { isPrerender } from '../utils/isPrerender'
import '../App.css'

export default function ItemDetailPage({ formatPrice, addToCart, platformOptions, cartItems = [], updateQuantity, removeFromCart }) {
  const { categorySlug, gameSlug, itemSlug } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const [item, setItem] = useState(null)
  const [game, setGame] = useState(null)
  const [category, setCategory] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedOptions, setSelectedOptions] = useState({})
  const [addingToCart, setAddingToCart] = useState(false)
  const [isInCart, setIsInCart] = useState(false)
  const [cartQuantity, setCartQuantity] = useState(1)
  const [attemptedSubmit, setAttemptedSubmit] = useState(false)
  const [showFlyingAnimation, setShowFlyingAnimation] = useState(false)

  const getSelectableFields = (itemData) => {
    if (!itemData) return []

    const customFields = Array.isArray(itemData.custom_fields)
      ? itemData.custom_fields
          .filter(field => field && field.fieldName)
          .map(field => {
            const availableOptions = Array.isArray(field.availableOptions) && field.availableOptions.length > 0
              ? field.availableOptions
              : (Array.isArray(field.selectedOptions) ? field.selectedOptions : [])
            return {
              fieldName: field.fieldName,
              options: availableOptions
            }
          })
          .filter(field => field.options.length > 0)
      : []

    return customFields
  }

  const parseSelectionsFromCartItem = (cartItem, fields) => {
    const parsed = {}
    if (!cartItem || !Array.isArray(fields) || fields.length === 0) return parsed

    // 1) Trust explicit custom selections first
    if (cartItem.customSelections && typeof cartItem.customSelections === 'object') {
      fields.forEach((field) => {
        const candidate = cartItem.customSelections[field.fieldName]
        if (candidate && field.options.includes(candidate)) {
          parsed[field.fieldName] = candidate
        }
      })
    }

    const platformRaw = String(cartItem.platform || '').trim()
    const versionRaw = String(cartItem.version || '').trim()

    // 2) Parse labeled summary format: "Platform: X | Region: Y"
    if (platformRaw.includes(':')) {
      platformRaw.split('|').forEach((segment) => {
        const [rawField, ...rawValueParts] = segment.split(':')
        if (!rawField || rawValueParts.length === 0) return
        const fieldName = rawField.trim().toLowerCase()
        const value = rawValueParts.join(':').trim()
        const field = fields.find(f => f.fieldName.toLowerCase() === fieldName)
        if (field && value && field.options.includes(value)) {
          parsed[field.fieldName] = value
        }
      })
    }

    // 3) Handle plain platform only
    const platformField = fields.find(f => f.fieldName.toLowerCase() === 'platform')
    const versionField = fields.find(f => f.fieldName.toLowerCase() === 'version')

    if (platformField && !parsed[platformField.fieldName] && platformRaw && !platformRaw.includes(':')) {
      if (platformField.options.includes(platformRaw)) {
        parsed[platformField.fieldName] = platformRaw
      }
    }

    // 4) Version fallback from explicit cart version field
    if (versionField && !parsed[versionField.fieldName] && versionRaw && versionField.options.includes(versionRaw)) {
      parsed[versionField.fieldName] = versionRaw
    }

    return parsed
  }

  const selectableFields = getSelectableFields(item)
  const [selectedCartId] = useState(() => new URLSearchParams(location.search).get('cartId') || '')

  // cartId is only a local variant hint; strip it from the URL to avoid sharing it.
  useEffect(() => {
    if (!location.search.includes('cartId=')) return

    const nextParams = new URLSearchParams(location.search)
    nextParams.delete('cartId')

    const nextSearch = nextParams.toString()
    navigate(
      {
        pathname: location.pathname,
        search: nextSearch ? `?${nextSearch}` : ''
      },
      { replace: true }
    )
  }, [location.pathname, location.search, navigate])

  const selectedEntries = selectableFields
    .filter(field => selectedOptions[field.fieldName])
    .map(field => [field.fieldName, selectedOptions[field.fieldName]])

  const selectionSummary = selectedEntries
    .map(([fieldName, value]) => `${fieldName}: ${value}`)
    .join(' | ')

  const singlePlatformSelection = selectedEntries.length === 1
    && String(selectedEntries[0][0]).toLowerCase() === 'platform'

  const normalizedPlatform = singlePlatformSelection
    ? String(selectedEntries[0][1])
    : selectionSummary

  const versionValue = selectedOptions.Version || ''
  const platformDisplay = normalizedPlatform || ''
  const cartId = item ? `${item.id}-${platformDisplay}-${versionValue}` : ''

  // Check if item is already in cart and update state
  useEffect(() => {
    if (!item || !cartItems || !cartId) {
      setIsInCart(false)
      setCartQuantity(1)
      return
    }

    const hasMissingSelections = selectableFields.some(field => !selectedOptions[field.fieldName])
    if (hasMissingSelections) {
      setIsInCart(false)
      setCartQuantity(1)
      return
    }

    const existingItem = cartItems.find(cartItem => cartItem.cartId === cartId)
    if (existingItem) {
      setIsInCart(true)
      setCartQuantity(existingItem.quantity)
    } else {
      setIsInCart(false)
      setCartQuantity(1)
    }
  }, [item, cartItems, cartId, selectableFields, selectedOptions])

  // If arriving from cart, auto-select the variant so quantity controls match existing cart item.
  useEffect(() => {
    if (!item || !cartItems || selectableFields.length === 0) return

    const hasMissingSelections = selectableFields.some(field => !selectedOptions[field.fieldName])
    if (!hasMissingSelections) return

    let sourceCartItem = null

    if (selectedCartId) {
      sourceCartItem = cartItems.find(ci => ci.cartId === selectedCartId) || null
    }

    if (!sourceCartItem) {
      const sameItemEntries = cartItems.filter(ci => ci.id === item.id)
      if (sameItemEntries.length === 1) {
        sourceCartItem = sameItemEntries[0]
      }
    }

    if (!sourceCartItem) return

    const inferred = parseSelectionsFromCartItem(sourceCartItem, selectableFields)
    if (Object.keys(inferred).length === 0) return

    setSelectedOptions((prev) => {
      const next = { ...prev }
      let changed = false

      selectableFields.forEach((field) => {
        if (!next[field.fieldName] && inferred[field.fieldName]) {
          next[field.fieldName] = inferred[field.fieldName]
          changed = true
        }
      })

      return changed ? next : prev
    })
  }, [item, cartItems, selectableFields, selectedOptions, selectedCartId])

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

        // Require explicit selection when a field has multiple options
        const fields = getSelectableFields(itemData)
        const nextSelections = {}
        fields.forEach((field) => {
          nextSelections[field.fieldName] = field.options.length === 1 ? field.options[0] : ''
        })
        setSelectedOptions(nextSelections)
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
    
    const missingSelection = selectableFields.some(field => !selectedOptions[field.fieldName])
    if (missingSelection) {
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
        platform: platformDisplay,
        version: versionValue,
        customSelections: selectedOptions,
        category_slug: categorySlug,
        game_slug: gameSlug,
        item_slug: itemSlug,
        game_id: game.id,
        game_name: game.name,
        category_id: category.id,
        category_name: category.name
      }
      
      // Add to cart
      addToCart(cartItem, platformDisplay)
    } catch (err) {
      console.error('Error adding to cart:', err)
      alert('Failed to add item to cart')
    } finally {
      setAddingToCart(false)
    }
  }

  const handleQuantityChange = (newQuantity) => {
    if (newQuantity >= 1 && newQuantity <= 100 && isInCart && updateQuantity) {
      updateQuantity(cartId, newQuantity)
    }
  }

  const handleAddMore = () => {
    const cartItem = {
      ...item,
      platform: platformDisplay,
      version: versionValue,
      customSelections: selectedOptions,
      category_slug: categorySlug,
      game_slug: gameSlug,
      item_slug: itemSlug,
      game_id: game.id,
      game_name: game.name,
      category_id: category.id,
      category_name: category.name
    }
    addToCart(cartItem, platformDisplay)
  }

  const handleRemoveOne = () => {
    if (isInCart && cartQuantity > 1 && updateQuantity) {
      updateQuantity(cartId, cartQuantity - 1)
    } else if (isInCart && cartQuantity === 1 && removeFromCart) {
      removeFromCart(cartId)
    }
  }

  if (loading) {
    return <LoadingSpinner message="Loading item..." />
  }

  if (!item || !game || !category) {
    return <NotFoundPage />
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
            {!game.is_coming_soon && selectableFields.map((field) => {
              const fieldKey = `field-${field.fieldName.toLowerCase().replace(/\s+/g, '-')}`
              const currentValue = selectedOptions[field.fieldName] || ''
              return (
                <div className="option-group" key={field.fieldName}>
                  <label htmlFor={fieldKey}>Select {field.fieldName}:</label>
                  <select
                    id={fieldKey}
                    value={currentValue}
                    onChange={(e) => {
                      const nextValue = e.target.value
                      setSelectedOptions(prev => ({ ...prev, [field.fieldName]: nextValue }))
                    }}
                    className="option-select"
                  >
                    <option value="">Select {field.fieldName.toLowerCase()}</option>
                    {field.options.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                  {attemptedSubmit && currentValue === '' && (
                    <p style={{ marginTop: '0.5rem', color: '#fbbf24', fontSize: '0.9rem', fontWeight: 600 }}>
                      Please select {field.fieldName.toLowerCase()} to continue.
                    </p>
                  )}
                </div>
              )
            })}
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
                    name="item_quantity"
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
