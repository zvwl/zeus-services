import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import Cart from '../components/Cart'
import '../App.css'
import './CartPage.css'

export default function CartPage({ cartItems, removeFromCart, updateQuantity, onCheckout, checkoutStatus, currency, formatPrice, paymentMethod, onPaymentMethodChange, isDevUser, clearCart }) {
  const [searchParams, setSearchParams] = useSearchParams()
  const [orderDetails, setOrderDetails] = useState(null)
  const [loadingOrder, setLoadingOrder] = useState(false)
  const navigate = useNavigate()

  const success = searchParams.get('success')
  const canceled = searchParams.get('canceled')
  const orderId = searchParams.get('orderId')

  useEffect(() => {
    if (success === 'true' && orderId) {
      // Clear the cart when showing order summary
      if (clearCart && cartItems.length > 0) {
        clearCart()
      }
      fetchOrderDetails(orderId)
    }
  }, [success, orderId])

  // Show message if payment was cancelled
  useEffect(() => {
    if (canceled === 'true') {
      // Optionally show a message or just clear the URL params
      const timer = setTimeout(() => {
        setSearchParams({})
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [canceled])

  const fetchOrderDetails = async (id) => {
    try {
      setLoadingOrder(true)
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      setOrderDetails(data)
    } catch (err) {
      console.error('Error fetching order:', err)
    } finally {
      setLoadingOrder(false)
    }
  }

  const formatCurrency = (amount, curr) => {
    const symbols = { USD: '$', GBP: '£', EUR: '€' }
    const symbol = symbols[curr] || curr
    return `${symbol}${Number(amount).toFixed(2)}`
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (success === 'true' && orderId) {
    if (loadingOrder) {
      return (
        <section className="section services" id="cart">
          <div className="order-summary-container">
            <div className="loading-message">Loading order details...</div>
          </div>
        </section>
      )
    }

    if (orderDetails) {
      const items = Array.isArray(orderDetails.items) ? orderDetails.items : []

      return (
        <section className="section services" id="cart">
          <div className="order-summary-container">
            <div className="success-header">
              <div className="success-icon">✓</div>
              <h1>Payment Successful!</h1>
              <p>Thank you for your order. We'll get started right away.</p>
            </div>

            <div className="order-summary-card">
              <div className="order-summary-header">
                <div>
                  <h2>Order Summary</h2>
                  <div className="order-meta">
                    <span className="order-id">Order #{orderDetails.id.slice(0, 8)}</span>
                    <span className="order-date">{formatDate(orderDetails.created_at)}</span>
                  </div>
                </div>
                <div className="order-status-badges">
                  <span className="status-badge status-completed">
                    {orderDetails.status}
                  </span>
                  <span className="payment-badge payment-paid">
                    {orderDetails.payment_status}
                  </span>
                </div>
              </div>

              <div className="order-items-list">
                <h3>Items</h3>
                {items.map((item, idx) => (
                  <div key={idx} className="summary-item">
                    <div className="summary-item-info">
                      <span className="summary-item-name">{item.name}</span>
                      {item.platform && (
                        <span className="summary-item-platform">• {item.platform}</span>
                      )}
                    </div>
                    <div className="summary-item-details">
                      <span className="summary-item-quantity">x{item.quantity}</span>
                      <span className="summary-item-price">
                        {formatCurrency(item.price_converted || item.price_usd, orderDetails.currency)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="order-summary-total">
                <span className="total-label">Total Paid:</span>
                <span className="total-amount">
                  {formatCurrency(orderDetails.total_amount, orderDetails.currency)}
                </span>
              </div>

              {orderDetails.customer_email && (
                <div className="order-confirmation-note">
                  <p>📧 A confirmation email has been sent to <strong>{orderDetails.customer_email}</strong></p>
                </div>
              )}

              <div className="order-actions">
                <a href="/orders" className="primary-btn">View All Orders</a>
                <a href="/services" className="secondary-btn">Continue Shopping</a>
              </div>
            </div>
          </div>
        </section>
      )
    }
  }

  return (
    <section className="section services" id="cart">
      <p className="eyebrow">Cart</p>
      <h2 className="section-title">Your selections</h2>
      <p className="section-subtitle">Adjust quantities or remove items before checkout.</p>
      
      {canceled === 'true' && (
        <div className="payment-cancelled-banner">
          <p>⚠️ Payment was cancelled. Your items are still in your cart.</p>
        </div>
      )}
      
      <Cart
        items={cartItems}
        onRemove={removeFromCart}
        onUpdateQuantity={updateQuantity}
        onCheckout={onCheckout}
        checkoutStatus={checkoutStatus}
        currency={currency}
        formatPrice={formatPrice}
        paymentMethod={paymentMethod}
        onPaymentMethodChange={onPaymentMethodChange}
        isDevUser={isDevUser}
      />
    </section>
  )
}
