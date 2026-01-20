import './Cart.css'

export default function Cart({ items, onRemove, onUpdateQuantity, onCheckout, checkoutStatus, currency, formatPrice, paymentMethod, onPaymentMethodChange, isDevUser }) {
  const totalUsd = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const isLoading = checkoutStatus?.state === 'loading'
  const hasMessage = checkoutStatus?.message
  const buttonLabel = (() => {
    if (paymentMethod === 'dev_skip') return isLoading ? 'Placing order...' : 'Buy now (dev skip payment)'
    if (paymentMethod === 'invoice') return isLoading ? 'Placing order...' : 'Place order (invoice)'
    return isLoading ? 'Redirecting to Stripe...' : 'Pay with Stripe'
  })()

  if (items.length === 0) {
    return (
      <div className="cart-container">
        {hasMessage && checkoutStatus.state === 'success' && (
          <div className="success-banner">
            <p className={`checkout-message ${checkoutStatus.state}`}>
              {checkoutStatus.message}
            </p>
          </div>
        )}
        <div className="empty-cart">
          <p>Your cart is empty</p>
          <span className="empty-icon">🛒</span>
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
      <div className="payment-section">
        <h3>Payment</h3>
        <div className="payment-options">
          <label className="payment-option">
            <input
              type="radio"
              name="payment-method"
              value="stripe"
              checked={paymentMethod === 'stripe'}
              onChange={() => onPaymentMethodChange('stripe')}
            />
            <div className="option-copy">
              <span className="option-title">Card (Stripe)</span>
              <span className="option-desc">Pay securely via Stripe Checkout.</span>
            </div>
          </label>

          <label className="payment-option">
            <input
              type="radio"
              name="payment-method"
              value="invoice"
              checked={paymentMethod === 'invoice'}
              onChange={() => onPaymentMethodChange('invoice')}
            />
            <div className="option-copy">
              <span className="option-title">Invoice / manual</span>
              <span className="option-desc">We will contact you to finalize payment.</span>
            </div>
          </label>

          {isDevUser && (
            <label className="payment-option dev-option">
              <input
                type="radio"
                name="payment-method"
                value="dev_skip"
                checked={paymentMethod === 'dev_skip'}
                onChange={() => onPaymentMethodChange('dev_skip')}
              />
              <div className="option-copy">
                <span className="option-title">Dev: skip payment</span>
                <span className="option-desc">Insert order with payment skipped (dev only).</span>
              </div>
            </label>
          )}
        </div>
      </div>

      <div className="cart-total">
        <div className="cart-total-text">
          <h3>Total: {formatPrice ? formatPrice(totalUsd) : `$${totalUsd}`}</h3>
          {hasMessage && (
            <p className={`checkout-message ${checkoutStatus.state}`}>
              {checkoutStatus.message}
            </p>
          )}
        </div>
        <button
          className="checkout-btn"
          onClick={onCheckout}
          disabled={!items.length || isLoading}
        >
          {buttonLabel}
        </button>
      </div>
    </div>
  )
}
