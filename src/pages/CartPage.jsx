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
  const { user, loading: authLoading, isRecoveringFromRedirect } = useAuth()

  const success = searchParams.get('success')
  const canceled = searchParams.get('canceled')
  const sessionId = searchParams.get('session_id')

  // Redirect to home if user logs out while on success page,
  // but only after auth has finished loading AND recovery attempt is complete
  // UNLESS we have a valid session_id (proves payment succeeded)
  useEffect(() => {
    // Don't redirect if we're on success page with a session_id
    // The order fetch will handle showing results or fallback messaging
    if (success === 'true') {
      console.log('Success page check:', { authLoading, isRecoveringFromRedirect, hasUser: !!user, hasSessionId: !!sessionId, hasOrderDetails: !!orderDetails, loadingOrder })
      
      if (!authLoading && !isRecoveringFromRedirect && !user && !sessionId && !orderDetails && !loadingOrder) {
        console.log('Auth recovery failed, no session ID, no order yet, redirecting to home')
        navigate('/')
      }
    }
  }, [user, authLoading, isRecoveringFromRedirect, success, sessionId, navigate, orderDetails, loadingOrder])

  useEffect(() => {
    if (success === 'true') {
      // Clear the cart when payment successful
      if (clearCart && cartItems.length > 0) {
        clearCart()
      }
      // Fetch the order by session ID (with retry logic for webhook delay)
      if (sessionId) {
        console.log('Payment success, fetching order by sessionId:', sessionId, { authLoading, isRecoveringFromRedirect })
        
        // Only start fetching when auth is ready (not loading and not recovering)
        if (!authLoading && !isRecoveringFromRedirect) {
          console.log('Auth ready, starting order fetch immediately')
          fetchOrderBySessionId(sessionId)
        } else {
          console.log('Waiting for auth to finish loading/recovery before fetching order...')
        }
        
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
  }, [success, sessionId, authLoading, isRecoveringFromRedirect])

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
      
      // IMPORTANT: Wait for Supabase session hydration
      // The session might not be restored yet on initial page load
      console.log('Waiting for Supabase session hydration...')
      
      let sessionData = null
      let userSession = null
      
      try {
        // Try to get existing session (first attempt)
        const { data: s1 } = await supabase.auth.getSession()
        sessionData = s1
        userSession = s1?.session
        console.log('Session check result:', { hasSession: !!userSession, email: userSession?.user?.email })
        
        // If no session yet, wait briefly for SIGNED_IN event (up to 10 seconds)
        if (!userSession) {
          console.log('No session found, waiting for auth state change...')
          userSession = await new Promise((resolve) => {
            const timeout = setTimeout(() => {
              console.log('Session hydration timeout (10s), continuing without user session')
              sub?.unsubscribe()
              resolve(null)
            }, 10000)
            
            const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
              console.log('Auth state changed during wait:', _event, !!session?.user)
              if (session?.user) {
                clearTimeout(timeout)
                sub?.unsubscribe()
                resolve(session)
              }
            })
          })
        }
      } catch (err) {
        console.error('Error waiting for session hydration:', err)
        // Continue anyway - we don't strictly need user auth to fetch by session_id
      }
      
      const accessToken = userSession?.access_token
      console.log('Access token available:', !!accessToken)
      
      // Check environment variables
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
      
      if (!supabaseUrl || !anonKey) {
        console.error('Missing Supabase environment variables')
        setFetchError('Configuration error. Please refresh the page.')
        setLoadingOrder(false)
        return
      }

      // Fetch order directly by checkout session ID using new edge function
      let res
      try {
        res = await fetch(`${supabaseUrl}/functions/v1/get-order-by-session?session_id=${checkoutSessionId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            apikey: anonKey,
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {})
          }
        })
      } catch (fetchErr) {
        console.error('Network error fetching order:', fetchErr)
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
          console.log(`Error fetching order, retrying... (${retryCount + 1}/${MAX_RETRIES})`)
          setTimeout(() => {
            fetchOrderBySessionId(checkoutSessionId, retryCount + 1)
          }, RETRY_DELAY)
          return
        }
        setFetchError('Failed to load order. Please check "Your Orders" page.')
        setLoadingOrder(false)
        return
      }

      const order = body.order

      if (order) {
        console.log('✅ Order found:', order.id)
        setOrderDetails(order)
        setLoadingOrder(false)
      } else if (retryCount < MAX_RETRIES) {
        // Order not found yet, webhook might still be processing
        console.log(`Order not found, retrying... (${retryCount + 1}/${MAX_RETRIES})`)
        setTimeout(() => {
          fetchOrderBySessionId(checkoutSessionId, retryCount + 1)
        }, RETRY_DELAY)
      } else {
        console.error('Max retries reached - order still not created. Webhook may have failed.')
        
        // Fallback: if no user and no order found, show confirmation message using lastPaymentAttempt
        if (!userSession) {
          try {
            const lastPayment = localStorage.getItem('lastPaymentAttempt')
            if (lastPayment) {
              const paymentData = JSON.parse(lastPayment)
              console.log('✅ Using cached payment data for confirmation:', paymentData)
              // Create a minimal order object from payment data
              const fallbackOrder = {
                id: 'pending-' + checkoutSessionId.substring(0, 8),
                customer_email: 'Order confirmation',
                items: paymentData.cartItems || [],
                total_amount: paymentData.cartItems?.reduce((sum, item) => sum + (item.price_converted * item.quantity), 0) || 0,
                currency: paymentData.currency || 'GBP',
                status: 'processing',
                payment_status: 'paid',
                created_at: new Date(paymentData.timestamp).toISOString(),
                checkout_session_id: checkoutSessionId
              }
              setOrderDetails(fallbackOrder)
              setLoadingOrder(false)
              return
            }
          } catch (fallbackErr) {
            console.warn('Could not use fallback payment data:', fallbackErr)
          }
        }
        
        setFetchError('Order is taking longer than expected. Please check "Your Orders" page.')
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
