import { useEffect } from 'react'
import { X, ShoppingCart, Plus, Minus, Trash2, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import './CartDrawer.css'
import AnimatedLucideIcon from './AnimatedLucideIcon'

export default function CartDrawer({ 
  isOpen, 
  onClose, 
  cartItems, 
  onRemove, 
  onUpdateQuantity, 
  formatPrice
}) {
  const navigate = useNavigate()

  const totalUsd = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)

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
    onClose()
    navigate(`${itemPath}?cartId=${encodeURIComponent(item.cartId)}`)
  }

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])


  const handleCheckout = () => {
    onClose()
    navigate('/checkout')
  }

  const handleViewCart = () => {
    onClose()
    navigate('/cart')
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div 
        className="cart-drawer-backdrop"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="cart-drawer">
        {/* Header */}
        <div className="cart-drawer-header">
          <div>
            <h2 className="cart-drawer-title">
              <ShoppingCart size={24} />
              Shopping Cart
            </h2>
            <p className="cart-drawer-subtitle">
              {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'} in your cart
            </p>
          </div>
          <button 
            className="cart-drawer-close" 
            onClick={onClose}
            aria-label="Close cart"
          >
            <X size={24} />
          </button>
        </div>

        {/* Items */}
        <div className="cart-drawer-items">
          {cartItems.length === 0 ? (
            <div className="cart-drawer-empty">
              <AnimatedLucideIcon 
                icon={ShoppingCart} 
                size={64} 
                animation="swing"
                animateOnHover={false}
              />
              <h3>Your cart is empty</h3>
              <p>Add items to get started</p>
            </div>
          ) : (
            <>
              {cartItems.map((item) => (
                <div
                  key={item.cartId}
                  className={`cart-drawer-item${getItemPath(item) ? ' clickable' : ''}`}
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
                  <div className="cart-drawer-item-image">
                    <img 
                      src={item.icon || '/zeusservicesPackage.webp'} 
                      alt={item.name}
                      onError={(e) => {
                        e.target.src = '/zeusservicesPackage.webp'
                      }}
                    />
                  </div>
                  
                  <div className="cart-drawer-item-details">
                    <h4>{item.name}</h4>
                    <p className="cart-drawer-item-platform">
                      {item.platform}
                    </p>
                    
                    <div className="cart-drawer-item-footer">
                      <div className="cart-drawer-item-quantity">
                        <button
                          onClick={(event) => {
                            event.stopPropagation()
                            onUpdateQuantity(item.cartId, Math.max(1, item.quantity - 1), false)
                          }}
                          className="quantity-btn"
                          aria-label="Decrease quantity"
                        >
                          <Minus size={14} />
                        </button>
                        <span>{item.quantity}</span>
                        <button
                          onClick={(event) => {
                            event.stopPropagation()
                            onUpdateQuantity(item.cartId, item.quantity + 1, false)
                          }}
                          className="quantity-btn"
                          aria-label="Increase quantity"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                      
                      <div className="cart-drawer-item-price">
                        {formatPrice ? formatPrice(item.price) : `£${item.price}`}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={(event) => {
                      event.stopPropagation()
                      onRemove(item.cartId, false)
                    }}
                    className="cart-drawer-item-remove"
                    aria-label="Remove item"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}

              <div className="cart-drawer-summary">
                <div className="cart-drawer-total">
                  <div className="cart-drawer-total-row">
                    <span className="cart-drawer-total-label">Subtotal</span>
                    <span className="cart-drawer-total-value">
                      {formatPrice ? formatPrice(totalUsd) : `£${totalUsd.toFixed(2)}`}
                    </span>
                  </div>
                  <div className="cart-drawer-total-row cart-drawer-total-final">
                    <span className="cart-drawer-total-label">Total</span>
                    <span className="cart-drawer-total-value">
                      {formatPrice ? formatPrice(totalUsd) : `£${totalUsd.toFixed(2)}`}
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {cartItems.length > 0 && (
          <div className="cart-drawer-footer">
            <div className="cart-drawer-actions">
              <button className="cart-drawer-btn cart-drawer-btn-primary" onClick={handleCheckout}>
                Proceed to Checkout
                <ArrowRight size={18} />
              </button>
              <button className="cart-drawer-btn cart-drawer-btn-secondary" onClick={handleViewCart}>
                View Full Cart
              </button>
              <button className="cart-drawer-btn cart-drawer-btn-ghost" onClick={onClose}>
                Continue Shopping
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
