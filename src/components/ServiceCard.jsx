import { useState, useMemo } from 'react'
import './ServiceCard.css'

export default function ServiceCard({ service, onAddToCart, cartItems, onUpdateQuantity, onRemoveFromCart, currency, formatPrice }) {
  const [platform, setPlatform] = useState('')
  const [isFlipped, setIsFlipped] = useState(false)

  // Find if this service with selected platform is in cart
  const cartItem = useMemo(() => {
    if (!platform) return null
    return cartItems.find(item => 
      item.id === service.id && item.platform === platform
    )
  }, [cartItems, service.id, platform])

  const handleAdd = () => {
    if (!platform) return
    onAddToCart(service, platform)
  }

  const handleIncrement = () => {
    if (cartItem) {
      onUpdateQuantity(cartItem.cartId, cartItem.quantity + 1)
    }
  }

  const handleDecrement = () => {
    if (cartItem) {
      if (cartItem.quantity === 1) {
        onRemoveFromCart(cartItem.cartId)
        setPlatform('')
      } else {
        onUpdateQuantity(cartItem.cartId, cartItem.quantity - 1)
      }
    }
  }

  const toggleFlip = () => {
    setIsFlipped(!isFlipped)
  }

  return (
    <div className="service-card-container">
      <div className={`service-card ${isFlipped ? 'flipped' : ''}`} onClick={toggleFlip}>
        {/* Front Side */}
        <div className="card-front">
          <img
            src="/zeusservicesPackage.png"
            alt={`${service.name} package`}
            className="card-image"
          />
          <h3 className="card-title">{service.name}</h3>
          <p className="card-description">{service.description}</p>

          <label className="platform-label" htmlFor={`platform-${service.id}`}>
            Choose platform
          </label>
          <select
            id={`platform-${service.id}`}
            className="platform-select"
            value={platform}
            onChange={(e) => {
              e.stopPropagation()
              setPlatform(e.target.value)
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <option value="">Select a platform</option>
            {service.platforms?.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>

          <div className="card-footer">
            <span className="card-price">{formatPrice ? formatPrice(service.price) : `$${service.price}`}</span>
            {cartItem ? (
              <div className="quantity-controls">
                <button className="qty-btn" onClick={(e) => { e.stopPropagation(); handleDecrement(); }}>−</button>
                <span className="qty-display">{cartItem.quantity}</span>
                <button className="qty-btn" onClick={(e) => { e.stopPropagation(); handleIncrement(); }}>+</button>
              </div>
            ) : (
              <button
                className="add-to-cart-btn"
                onClick={(e) => { e.stopPropagation(); handleAdd(); }}
                disabled={!platform}
              >
                Add to Cart
              </button>
            )}
          </div>
          <p className="flip-hint">Click to see details</p>
        </div>

        {/* Back Side */}
        <div className="card-back">
          <h3 className="back-title">{service.name}</h3>
          <div className="details-list">
            {service.details?.map((detail, index) => (
              <p key={index} className="detail-item">{detail}</p>
            ))}
          </div>
          <p className="flip-hint">Click to go back</p>
        </div>
      </div>
    </div>
  )
}
