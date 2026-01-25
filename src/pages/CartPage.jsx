import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import Cart from '../components/Cart'
import '../App.css'
import './CartPage.css'

export default function CartPage({ cartItems, removeFromCart, updateQuantity, onCheckout, checkoutStatus, currency, formatPrice, paymentMethod, onPaymentMethodChange, isDevUser, orderNote, onOrderNoteChange, clearCart }) {
  const [searchParams, setSearchParams] = useSearchParams()
  const [orderDetails, setOrderDetails] = useState(null)
  const [loadingOrder, setLoadingOrder] = useState(false)
  const [fetchError, setFetchError] = useState(null)
  const navigate = useNavigate()

  const success = searchParams.get('success')
  const canceled = searchParams.get('canceled')

  useEffect(() => {
    if (success === 'true') {
      // Clear the cart when payment successful
      if (clearCart && cartItems.length > 0) {
        clearCart()
      }
      // Fetch the most recent order (just created by Stripe webhook)
      fetchMostRecentOrder()
    }
  }, [success])

  // Show message if payment was cancelled
  useEffect(() => {
    if (canceled === 'true') {
      // Clear URL params after a moment
      const timer = setTimeout(() => {
        setSearchParams({})
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [canceled])

  const fetchMostRecentOrder = async () => {
    try {
      setLoadingOrder(true)
      setFetchError(null)
      const { data: sessionData } = await supabase.auth.getSession()
      const accessToken = sessionData?.session?.access_token

      if (!accessToken) {
        throw new Error('Please log in to view your order')
      }

      // Fetch user's orders and get the most recent one
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-user-orders`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
          Authorization: `Bearer ${accessToken}`
        }
      })

      const body = await res.json()
      if (!res.ok || body?.error) {
        throw new Error(body?.error || 'Failed to load order')
      }

      // Get the most recent order (first in the array, should be sorted by created_at desc)
      const orders = body.orders || []
      if (orders.length > 0) {
        setOrderDetails(orders[0])
      } else {
        setFetchError('Order not found. It may still be processing.')
      }
    } catch (err) {
      console.error('Error fetching order:', err)
      setFetchError(err.message || 'Failed to load order')
    } finally {
      setLoadingOrder(false)
    }
  }

  const fetchOrderDetails = async (id) => {
    try {
      setLoadingOrder(true)
      const { data: sessionData } = await supabase.auth.getSession()
      const accessToken = sessionData?.session?.access_token

      if (!accessToken) {
        throw new Error('Please log in to view your order')
      }

      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-user-order?orderId=${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
          Authorization: `Bearer ${accessToken}`
        }
      })

      const body = await res.json()
      if (!res.ok || body?.error) {
        throw new Error(body?.error || 'Failed to load order')
      }

      setOrderDetails(body.order)
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

  const getNoteParts = (notes) => {
    if (!notes) return { userNote: '', systemNote: '' }
    const [userPart, ...rest] = notes.split('\nSystem:')
    return {
      userNote: userPart.trim(),
      systemNote: rest.join('\nSystem:').trim()
    }
  }

  if (success === 'true') {
    if (loadingOrder) {
      return (
        <section className="section services" id="cart">
          <div className="order-summary-container">
            <div className="loading-message">Loading order details...</div>
          </div>
        </section>
      )
    }

    if (fetchError) {
      return (
        <section className="section services" id="cart">
          <div className="order-summary-container">
            <div className="error-message">
              <p>{fetchError}</p>
              <p>Your payment was successful. The order may take a moment to appear.</p>
              <button onClick={() => navigate('/orders')} className="view-orders-btn">
                View All Orders
              </button>
            </div>
          </div>
        </section>
      )
    }

    if (orderDetails) {
      const items = Array.isArray(orderDetails.items) ? orderDetails.items : []
      const { userNote, systemNote } = getNoteParts(orderDetails.note_plaintext || orderDetails.notes)

      return (
        <section className="section services" id="cart">
          <div className="order-summary-container">
            <div className="success-header">
              <div className="success-icon">✓</div>
              <h1>Payment Successful!</h1>
              <p>Thank you for your order. We'll get started right away.</p>
            </div>

            <div className="discord-cta">
              <div className="discord-cta-text">
                <strong>Need updates or have a question?</strong>
                <span>Join our Discord and contact support for faster help.</span>
              </div>
              <a
                href="https://discord.gg/NSNSmmaA"
                className="discord-btn"
                target="_blank"
                rel="noreferrer"
              >
                <img src="/discordLogo.png" alt="Discord" className="discord-btn-icon" />
                Join our Discord
              </a>
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

              {(userNote || systemNote) && (
                <div className="order-notes-summary">
                  <h3>Notes</h3>
                  {userNote && (
                    <div className="note-block">
                      <span className="note-label">Your note</span>
                      <p>{userNote}</p>
                    </div>
                  )}
                  {systemNote && (
                    <div className="note-block system">
                      <span className="note-label">System</span>
                      <p>{systemNote}</p>
                    </div>
                  )}
                </div>
              )}

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
        orderNote={orderNote}
        onOrderNoteChange={onOrderNoteChange}
      />
    </section>
  )
}
