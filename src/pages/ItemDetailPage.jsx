import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useAuth } from '../contexts/AuthContext'
import SEO from '../components/SEO'
import Breadcrumb from '../components/Breadcrumb'
import LoadingSpinner from '../components/LoadingSpinner'
import { isPrerender } from '../utils/isPrerender'
import '../App.css'

export default function ItemDetailPage({ formatPrice, addToCart, platformOptions }) {
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

        // Set default selections
        if (itemData.platforms && itemData.platforms.length > 0) {
          setSelectedPlatform(itemData.platforms[0])
        } else {
          setSelectedPlatform('Any Platform')
        }
        if (itemData.versions && itemData.versions.length > 0) {
          setSelectedVersion(itemData.versions[0])
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
    const requiresPlatform = item?.platforms && item.platforms.length > 0
    if (requiresPlatform && !selectedPlatform) {
      alert('Please select a platform')
      return
    }

    setAddingToCart(true)
    try {
      // Create cart item object compatible with existing cart system
      const cartItem = {
        ...item,
        platform: selectedPlatform,
        version: selectedVersion,
        game_id: game.id,
        game_name: game.name,
        category_id: category.id,
        category_name: category.name
      }
      
      // Add to cart once
      addToCart(cartItem, selectedPlatform)
      setIsInCart(true)
      setCartQuantity(1)
    } catch (err) {
      console.error('Error adding to cart:', err)
      alert('Failed to add item to cart')
    } finally {
      setAddingToCart(false)
    }
  }

  const handleQuantityChange = (newQuantity) => {
    if (newQuantity >= 1 && newQuantity <= 100) {
      setCartQuantity(newQuantity)
    }
  }

  const handleAddMore = () => {
    const cartItem = {
      ...item,
      platform: selectedPlatform,
      version: selectedVersion,
      game_id: game.id,
      game_name: game.name,
      category_id: category.id,
      category_name: category.name
    }
    addToCart(cartItem, selectedPlatform)
    setCartQuantity(cartQuantity + 1)
  }

  const handleRemoveOne = () => {
    if (cartQuantity > 1) {
      setCartQuantity(cartQuantity - 1)
    } else {
      // If quantity reaches 0, remove from cart
      setIsInCart(false)
      setCartQuantity(1)
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

  return (
    <>
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
              <p className="service-detail-price">{formatPrice(item.price)}</p>
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
            {item.platforms && item.platforms.length > 0 && (
              <div className="option-group">
                <label htmlFor="platform-select">Select Platform:</label>
                <select
                  id="platform-select"
                  value={selectedPlatform}
                  onChange={(e) => setSelectedPlatform(e.target.value)}
                  className="option-select"
                >
                  {item.platforms.map((platform) => (
                    <option key={platform} value={platform}>
                      {platform}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {item.versions && item.versions.length > 0 && (
              <div className="option-group">
                <label htmlFor="version-select">Select Version:</label>
                <select
                  id="version-select"
                  value={selectedVersion}
                  onChange={(e) => setSelectedVersion(e.target.value)}
                  className="option-select"
                >
                  {item.versions.map((version) => (
                    <option key={version} value={version}>
                      {version}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="service-detail-actions">
            {!isInCart ? (
              <button
                className="cta-button"
                onClick={handleAddToCart}
                disabled={addingToCart || (item?.platforms?.length > 0 && !selectedPlatform)}
              >
                {addingToCart ? 'Adding to Cart...' : 'Add to Cart'}
              </button>
            ) : (
              <>
                <div className="quantity-inline-controls">
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
                <button
                  className="cta-button"
                  onClick={() => navigate('/cart')}
                >
                  Go to Checkout
                </button>
              </>
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
