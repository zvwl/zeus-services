import { useNavigate } from 'react-router-dom'
import { ShoppingCart, Gamepad2 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import AnimatedLucideIcon from './AnimatedLucideIcon'
import './Cart.css'

export default function CartSummary({ items, onRemove, onUpdateQuantity, currency, formatPrice }) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const totalUsd = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)

  const toSlug = (value) => {
    if (!value) return ''
    return String(value)
      .toLowerCase()
      .trim()
      .replace(/["']/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }

  const getItemPath = (item) => {
    const categorySlug = item.category_slug || item.categorySlug || toSlug(item.category_name)
    const gameSlug = item.game_slug || item.gameSlug || toSlug(item.game_name)
    const itemSlug = item.item_slug || item.itemSlug || item.slug

    if (!categorySlug || !gameSlug || !itemSlug) return null
    return `/${categorySlug}/${gameSlug}/${itemSlug}`
  }

  const handleItemClick = (item) => {
    const itemPath = getItemPath(item)
    if (!itemPath) return
    navigate(itemPath)
  }

  const handleCheckout = () => {
    if (!user) {
      navigate('/login?redirect=/checkout')
      return
    }
    navigate('/checkout')
  }

  if (items.length === 0) {
    return (
      <div className="cart-container">
        <div className="empty-cart">
          <p>Your cart is empty</p>
          <span className="empty-icon"><AnimatedLucideIcon icon={ShoppingCart} size={80} animation="swing" animateOnHover={false} /></span>
          <button onClick={() => navigate('/boosting/gta5')} className="primary-btn">
            Start Shopping
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="cart-container">
      <h2 className="cart-title">Shopping Cart</h2>
      <div className="cart-items">
        {items.map(item => (
          <div
            key={item.cartId}
            className={`cart-item${getItemPath(item) ? ' clickable' : ''}`}
            onClick={() => handleItemClick(item)}
            role={getItemPath(item) ? 'button' : undefined}
            tabIndex={getItemPath(item) ? 0 : undefined}
            onKeyDown={(event) => {
              if (!getItemPath(item)) return
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                handleItemClick(item)
              }
            }}
            title={getItemPath(item) ? 'View item details' : undefined}
          >
            <div className="item-header">
              <div className="item-icon">
                {item.icon && typeof item.icon === 'string' && (item.icon.startsWith('/') || item.icon.startsWith('http')) ? (
                  <img 
                    src={item.icon} 
                    alt={item.name}
                    onError={(e) => {
                      e.target.style.display = 'none'
                      e.target.parentElement.textContent = ' '
                    }}
                  />
                ) : (
                  <span><AnimatedLucideIcon icon={Gamepad2} size={20} animation="bounce" animateOnHover={false} /></span>
                )}
              </div>
              <div className="item-info">
                <h4>{item.name}</h4>
                {item.customSelections && Object.keys(item.customSelections).length > 0 ? (
                  Object.entries(item.customSelections)
                    .filter(([, value]) => Boolean(value))
                    .map(([field, value]) => (
                      <p key={`${item.cartId}-${field}`} className={field.toLowerCase() === 'version' ? 'item-version' : 'platform'}>
                        {field}: {value}
                      </p>
                    ))
                ) : (
                  <>
                    {item.platform && (
                      <p className="platform">
                        {item.platform.includes(':') ? item.platform : `Platform: ${item.platform}`}
                      </p>
                    )}
                    {item.version && item.version !== 'Standard' && (
                      <p className="item-version">Version: {item.version}</p>
                    )}
                  </>
                )}
                <p>{formatPrice ? `${formatPrice(item.price)} each` : `$${item.price} each`}</p>
              </div>
            </div>
            <div className="item-controls">
              <div className="item-quantity">
                <button onClick={(event) => {
                  event.stopPropagation()
                  onUpdateQuantity(item.cartId, item.quantity - 1)
                }}>−</button>
                <span>{item.quantity}</span>
                <button onClick={(event) => {
                  event.stopPropagation()
                  onUpdateQuantity(item.cartId, item.quantity + 1)
                }}>+</button>
              </div>
              <button
                className="remove-btn"
                onClick={(event) => {
                  event.stopPropagation()
                  onRemove(item.cartId)
                }}
                aria-label="Remove item"
                title="Remove item"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="cart-total">
        <div className="cart-total-text">
          <h3>Total: {formatPrice ? formatPrice(totalUsd) : `$${totalUsd}`}</h3>
        </div>
        <button
          className="checkout-btn"
          onClick={handleCheckout}
        >
          {user ? 'Proceed to Checkout' : 'Login to Checkout'}
        </button>
      </div>
    </div>
  )
}
