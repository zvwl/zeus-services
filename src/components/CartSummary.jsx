import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
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
          <span className="empty-icon">🛒</span>
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
            <div className="item-info">
              <span className="item-icon">{item.icon}</span>
              <div>
                <h4>{item.name}</h4>
                <p className="platform">Platform: {item.platform}</p>
                <p>{formatPrice ? `${formatPrice(item.price)} each` : `$${item.price} each`}</p>
              </div>
            </div>
            <div className="item-quantity">
              <button onClick={() => onUpdateQuantity(item.cartId, item.quantity - 1)}>−</button>
              <span>{item.quantity}</span>
              <button onClick={() => onUpdateQuantity(item.cartId, item.quantity + 1)}>+</button>
            </div>
            <div className="item-subtotal">
              <p>{formatPrice ? formatPrice(item.price * item.quantity) : `$${item.price * item.quantity}`}</p>
            </div>
            <button
              className="remove-btn"
              onClick={() => onRemove(item.cartId)}
            >
              ✕
            </button>
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
