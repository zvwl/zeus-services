import { useState, useMemo } from 'react'
import './ServiceCard.css'

export default function ServiceCard({ service, onAddToCart, cartItems, onUpdateQuantity, onRemoveFromCart }) {
  const [platform, setPlatform] = useState('')

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

  return (
    <div className="service-card">
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
        onChange={(e) => setPlatform(e.target.value)}
      >
        <option value="">Select a platform</option>
        {service.platforms?.map(option => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>

      <div className="card-footer">
        <span className="card-price">${service.price}</span>
        {cartItem ? (
          <div className="quantity-controls">
            <button className="qty-btn" onClick={handleDecrement}>−</button>
            <span className="qty-display">{cartItem.quantity}</span>
            <button className="qty-btn" onClick={handleIncrement}>+</button>
          </div>
        ) : (
          <button
            className="add-to-cart-btn"
            onClick={handleAdd}
            disabled={!platform}
          >
            Add to Cart
          </button>
        )}
      </div>
    </div>
  )
}
