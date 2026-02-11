import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import './CartPage.css'

export default function CheckoutPage({ cartItems, onCheckout, checkoutStatus, currency, formatPrice, paymentMethod, onPaymentMethodChange, isDevUser, orderNote, onOrderNoteChange }) {
  const navigate = useNavigate()
  const { user, loading: authLoading, emailVerified } = useAuth()
  const totalUsd = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const isLoading = checkoutStatus?.state === 'loading'
  const hasMessage = checkoutStatus?.message

  // Redirect to login if not logged in (but wait for auth to finish loading)
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login')
    }
  }, [user, authLoading, navigate])

  const buttonLabel = (() => {
    if (paymentMethod === 'dev_skip') return isLoading ? 'Placing order...' : 'Buy now (dev skip payment)'
    return isLoading ? 'Redirecting to Stripe...' : 'Pay with Stripe'
  })()

  const handleCheckout = () => {
    if (!user) {
      navigate('/login')
      return
    }
    if (!emailVerified) {
      alert('Please verify your email before checking out')
      return
    }
    onCheckout()
  }

  // Show loading while auth is being checked
  if (authLoading) {
    return (
      <section className="section services" id="checkout">
        <div className="order-summary-container">
          <div className="loading-message">Loading...</div>
        </div>
      </section>
    )
  }

  // This shouldn't happen due to useEffect redirect, but just in case
  if (!user) {
    return null
  }

  if (cartItems.length === 0) {
    return (
      <section className="section services" id="checkout">
        <p className="eyebrow">Checkout</p>
        <h2 className="section-title">Your cart is empty</h2>
        <p className="section-subtitle">Add items to your cart to proceed to checkout.</p>
        <div className="empty-checkout">
          <button onClick={() => navigate('/services')} className="primary-btn">
            Continue Shopping
          </button>
        </div>
      </section>
    )
  }

  return (
    <section className="section services" id="checkout">
      <p className="eyebrow">Checkout</p>
      <h2 className="section-title">Complete your purchase</h2>
      <p className="section-subtitle">Review your order and choose a payment method.</p>

      <div className="checkout-container">
        <div className="checkout-order-summary">
          <h3>Order Summary</h3>
          <div className="checkout-items">
            {cartItems.map((item) => (
              <div key={item.cartId} className="checkout-item">
                <div className="checkout-item-info">
                  <span className="checkout-item-icon">{item.icon}</span>
                  <div>
                    <h4>{item.name}</h4>
                    <p className="platform">Platform: {item.platform}</p>
                  </div>
                </div>
                <div className="checkout-item-details">
                  <span className="checkout-item-qty">x{item.quantity}</span>
                  <span className="checkout-item-price">
                    {formatPrice ? formatPrice(item.price) : `$${item.price}`}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="checkout-total">
            <span className="total-label">Total:</span>
            <span className="total-amount">
              {formatPrice ? formatPrice(totalUsd) : `$${totalUsd}`}
            </span>
          </div>

          <button
            onClick={() => navigate('/cart')}
            className="secondary-btn edit-cart-btn"
          >
            Edit Cart
          </button>
        </div>

        <div className="checkout-payment-form">
          <h3>Payment Method</h3>
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

          <div className="order-note">
            <div className="order-note-header">
              <h3>Order Notes (Optional)</h3>
              <p>Share account email, login details, or specific instructions for this order. Login details are encrypted and handled securely.</p>
            </div>
            <textarea
              value={orderNote}
              onChange={(e) => onOrderNoteChange?.(e.target.value)}
              placeholder="Example: Account email is user@example.com, password is ********, please add cars to Slot 1 and keep outfits #3 and #4."
              maxLength={1000}
            />
            <div className="order-note-hint">Up to 1000 characters. Login details are encrypted and sent securely with your order.</div>
          </div>

          {hasMessage && (
            <p className={`checkout-message ${checkoutStatus.state}`}>
              {checkoutStatus.message}
            </p>
          )}

          <button
            className="checkout-btn"
            onClick={handleCheckout}
            disabled={isLoading || !emailVerified}
            title={!emailVerified ? 'Please verify your email to checkout' : ''}
          >
            {!emailVerified ? '✉️ Verify email to checkout' : buttonLabel}
          </button>

          {!emailVerified && (
            <p className="email-verification-notice">
              You must verify your email before placing an order. Check your inbox for a verification link.
            </p>
          )}

          <button
            onClick={() => navigate('/cart')}
            className="ghost-btn continue-shopping-btn"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    </section>
  )
}
