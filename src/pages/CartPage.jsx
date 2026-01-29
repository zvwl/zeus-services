import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../supabaseClient'
import CartSummary from '../components/CartSummary'
import '../App.css'
import './CartPage.css'

export default function CartPage({ cartItems, removeFromCart, updateQuantity, currency, formatPrice, clearCart }) {
  const [searchParams, setSearchParams] = useSearchParams()
  const [orderDetails, setOrderDetails] = useState(null)
  const [loadingOrder, setLoadingOrder] = useState(false)
  const [fetchError, setFetchError] = useState(null)
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuth()

  const success = searchParams.get('success')
  const canceled = searchParams.get('canceled')
  const sessionId = searchParams.get('session_id')

  // Redirect to home if user logs out while on success page,
  // but only after auth has finished loading to avoid premature redirects.
  useEffect(() => {
    if (success === 'true' && !authLoading && !user) {
      navigate('/')
    }
  }, [user, authLoading, success, navigate])

  useEffect(() => {
    if (success === 'true') {
      // Clear the cart when payment successful
      if (clearCart && cartItems.length > 0) {
        clearCart()
      }
      // Fetch the order by session ID (with retry logic for webhook delay)
      if (sessionId) {
        console.log('Payment success, fetching order by sessionId:', sessionId)
        fetchOrderBySessionId(sessionId)
        
        // Set a hard timeout of 60 seconds - stop retrying after that
        const hardTimeout = setTimeout(() => {
          console.log('Hard timeout reached, stopping order fetch retries')
          setLoadingOrder(false)
          if (!orderDetails) {
            setFetchError('Order is taking longer than expected. Please go to "Your Orders" to see your payment status.')
          }
        }, 60000)
        
        return () => {
          clearTimeout(hardTimeout)
        }
      } else {
        console.log('Payment success, fetching most recent order')
        fetchMostRecentOrder()
      }
    }
  }, [success, sessionId])

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

  const fetchOrderBySessionId = async (checkoutSessionId, retryCount = 0) => {
    const MAX_RETRIES = 15
    const RETRY_DELAY = 2000 // 2 seconds between retries

    try {
      setLoadingOrder(true)
      setFetchError(null)
      
      // Get session safely
      let sessionData
      try {
        const result = await supabase.auth.getSession()
        sessionData = result?.data
      } catch (err) {
        console.error('Error getting session:', err)
        // Try to restore from localStorage backup
        try {
          const userBackup = localStorage.getItem('authUserBackup')
          if (userBackup) {
            console.warn('Session error, but found user backup - retrying with stored credentials')
            if (retryCount < 3) {
              setTimeout(() => {
                fetchOrderBySessionId(checkoutSessionId, retryCount + 1)
              }, 1000)
              return
            }
          }
        } catch (backupErr) {
          console.warn('Could not access localStorage backup:', backupErr)
        }
        setFetchError('Session error. Please refresh the page.')
        setLoadingOrder(false)
        return
      }
      
      const accessToken = sessionData?.session?.access_token

      if (!accessToken) {
        console.warn('No access token available')
        if (retryCount < 3) {
          // Retry a few times in case session is still loading
          console.log(`No token, retrying... (${retryCount + 1}/3)`)
          setTimeout(() => {
            fetchOrderBySessionId(checkoutSessionId, retryCount + 1)
          }, 1000)
          return
        }
        setFetchError('Your session expired. Please log in again.')
        setLoadingOrder(false)
        return
      }

      // Check environment variables
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
      
      if (!supabaseUrl || !anonKey) {
        console.error('Missing Supabase environment variables')
        setFetchError('Configuration error. Please refresh the page.')
        setLoadingOrder(false)
        return
      }

      // Fetch all user orders and find the one with matching checkout_session_id
      let res
      try {
        res = await fetch(`${supabaseUrl}/functions/v1/get-user-orders`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            apikey: anonKey,
            Authorization: `Bearer ${accessToken}`
          }
        })
      } catch (fetchErr) {
        console.error('Network error fetching orders:', fetchErr)
        if (retryCount < MAX_RETRIES) {
          setTimeout(() => {
            fetchOrderBySessionId(checkoutSessionId, retryCount + 1)
          }, RETRY_DELAY)
          return
        }
        setFetchError('Network error. Please check your connection.')
        setLoadingOrder(false)
        return
      }

      let body
      try {
        body = await res.json()
      } catch (parseErr) {
        console.error('Error parsing response:', parseErr)
        setFetchError('Server error. Please try again.')
        setLoadingOrder(false)
        return
      }
      
      if (!res.ok || body?.error) {
        const errorMsg = body?.error || `Server error (${res.status})`
        console.error('Order fetch error:', errorMsg)
        if (retryCount < MAX_RETRIES) {
          console.log(`Error fetching orders, retrying... (${retryCount + 1}/${MAX_RETRIES})`)
          setTimeout(() => {
            fetchOrderBySessionId(checkoutSessionId, retryCount + 1)
          }, RETRY_DELAY)
          return
        }
        setFetchError('Failed to load orders. Please refresh the page.')
        setLoadingOrder(false)
        return
      }

      const orders = body.orders || []
      const matchingOrder = orders.find(order => order.checkout_session_id === checkoutSessionId)

      if (matchingOrder) {
        console.log('Order found:', matchingOrder)
        setOrderDetails(matchingOrder)
        setLoadingOrder(false)
      } else if (retryCount < MAX_RETRIES) {
        // Order not found yet, webhook might still be processing
        console.log(`Order not found, retrying... (${retryCount + 1}/${MAX_RETRIES})`)
        setTimeout(() => {
          fetchOrderBySessionId(checkoutSessionId, retryCount + 1)
        }, RETRY_DELAY)
      } else {
        console.error('Max retries reached for order:', checkoutSessionId)
        setFetchError('Order is taking longer than expected to process. Your order should be in "Your Orders" shortly.')
        setLoadingOrder(false)
      }
    } catch (err) {
      console.error('Unexpected error in fetchOrderBySessionId:', err)
      setFetchError('An unexpected error occurred. Please refresh the page.')
      setLoadingOrder(false)
    }
  }

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
              <button 
                onClick={() => {
                  console.log('Navigating to /orders...')
                  navigate('/orders')
                }} 
                className="view-orders-btn"
              >
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
                href="http://discord.gg/zeusservices"
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
      
      <CartSummary
        items={cartItems}
        onRemove={removeFromCart}
        onUpdateQuantity={updateQuantity}
        currency={currency}
        formatPrice={formatPrice}
      />
    </section>
  )
}
