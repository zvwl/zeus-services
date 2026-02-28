import { useNavigate } from 'react-router-dom'
import { ShoppingCart, Gamepad2 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import AnimatedLucideIcon from './AnimatedLucideIcon'
import './Cart.css'

export default function CartSummary({ items, onRemove, onUpdateQuantity, currency, formatPrice }) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const totalUsd = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)

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
          <div key={item.cartId} className="cart-item">
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
                <p className="platform">Platform: {item.platform}</p>
                <p>{formatPrice ? `${formatPrice(item.price)} each` : `$${item.price} each`}</p>
              </div>
            </div>
            <div className="item-controls">
              <div className="item-quantity">
                <button onClick={() => onUpdateQuantity(item.cartId, item.quantity - 1)}>−</button>
                <span>{item.quantity}</span>
                <button onClick={() => onUpdateQuantity(item.cartId, item.quantity + 1)}>+</button>
              </div>
              <button
                className="remove-btn"
                onClick={() => onRemove(item.cartId)}
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
