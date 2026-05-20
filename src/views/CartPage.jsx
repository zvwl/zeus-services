'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useCart } from '@/contexts/CartContext'
import { supabase } from '@/lib/supabase/client'
import { CheckCircle } from 'lucide-react'
import CartSummary from '@/components/CartSummary'
import SEO, { SEO_CONFIGS } from '@/components/SEO'
import LoadingSpinner from '@/components/LoadingSpinner'
import '../App.css'
import './CartPage.css'

export default function CartPage() {
  const { cartItems, removeFromCart, updateQuantity, currency, formatPrice, clearCart } = useCart()
  const searchParams = useSearchParams()
  const [orderDetails, setOrderDetails] = useState(null)
  const [loadingOrder, setLoadingOrder] = useState(false)
  const [fetchError, setFetchError] = useState(null)
  const orderDetailsRef = useRef(null)
  const hardTimeoutRef = useRef(null)
  const stopPollingRef = useRef(false)
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()

  const success = searchParams.get('success')
  const canceled = searchParams.get('canceled')
  const sessionId = searchParams.get('session_id')

  useEffect(() => {
    orderDetailsRef.current = orderDetails
    if (orderDetails && hardTimeoutRef.current) {
      clearTimeout(hardTimeoutRef.current)
      hardTimeoutRef.current = null
      setFetchError(null)
      stopPollingRef.current = true
    }
  }, [orderDetails])

  // Redirect to home if user logs out while on success page,
  // UNLESS we have a valid session_id (proves payment succeeded)
  useEffect(() => {
    if (success === 'true') {
      // Only redirect if we're truly logged out AND have no session ID
      if (!authLoading && !user && !sessionId) {
        router.push('/')
      }
    }
  }, [user, authLoading, success, sessionId, router])

  useEffect(() => {
    if (success === 'true') {
      stopPollingRef.current = false
      // Clear the cart when payment successful
      if (clearCart && cartItems.length > 0) {
        clearCart()
      }
      // Fetch the order by session ID (with retry logic for webhook delay)
      // Order will be created by Stripe webhook and indexed in database
      if (sessionId) {
        fetchOrderBySessionId(sessionId)
        
        // Set a hard timeout of 60 seconds - stop retrying after that
        hardTimeoutRef.current = setTimeout(() => {
          stopPollingRef.current = true
          setLoadingOrder(false)
          if (!orderDetailsRef.current) {
            setFetchError('Order is taking longer than expected. Please go to "Your Orders" to see your payment status.')
          }
        }, 60000)

        return () => {
          stopPollingRef.current = true
          if (hardTimeoutRef.current) {
            clearTimeout(hardTimeoutRef.current)
            hardTimeoutRef.current = null
          }
        }
      } else {
        fetchMostRecentOrder()
      }
    }
  }, [success, sessionId])

  // Show message if payment was cancelled
  useEffect(() => {
    if (canceled === 'true') {
      const timer = setTimeout(() => {
        router.replace('/cart')
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [canceled])

  const fetchOrderBySessionId = async (checkoutSessionId, retryCount = 0) => {
    const MAX_RETRIES = 15
    const RETRY_DELAY = 2000 // 2 seconds between retries
    const REQUEST_TIMEOUT_MS = 12000

    if (stopPollingRef.current) {
      return
    }

    try {
      setLoadingOrder(true)
      setFetchError(null)
      
      // Check environment variables FIRST
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      
      if (!supabaseUrl || !anonKey) {
        console.error('Missing Supabase environment variables')
        setFetchError('Configuration error. Please refresh the page.')
        setLoadingOrder(false)
        return
      }

      // Try to get session, but don't block if it's not available
      // The edge function uses SERVICE_ROLE so it doesn't need auth
      // No authentication required - webhook verified the payment
      let accessToken = null
      try {
        const { data: { session } } = await Promise.race([
          supabase.auth.getSession(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 2000))
        ])
        accessToken = session?.access_token
      } catch (_err) {
        // No user session available, continue without auth
      }

      // Fetch order directly by checkout session ID using edge function
      let res
      try {
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
        res = await fetch(`${supabaseUrl}/functions/v1/get-order-by-session?session_id=${checkoutSessionId}`, {
          method: 'GET',
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json',
            'apikey': anonKey,
            ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {})
          }
        })
        clearTimeout(timeout)
      } catch (fetchErr) {
        console.error('Network error fetching order:', fetchErr)
        if (!stopPollingRef.current && retryCount < MAX_RETRIES) {
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
        if (!stopPollingRef.current && retryCount < MAX_RETRIES) {
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
        stopPollingRef.current = true
        setOrderDetails(order)
        setFetchError(null)
        setLoadingOrder(false)
      } else if (!stopPollingRef.current && retryCount < MAX_RETRIES) {
        // Order not found yet, webhook might still be processing
        setTimeout(() => {
          fetchOrderBySessionId(checkoutSessionId, retryCount + 1)
        }, RETRY_DELAY)
      } else {
        console.error('Max retries reached - order not found')
        
        if (user) {
          await fetchMostRecentOrder()
          return
        }

        // Fallback: if no user and no order found, show confirmation message using lastPaymentAttempt
        if (!user) {
          try {
            const lastPayment = localStorage.getItem('lastPaymentAttempt')
            if (lastPayment) {
              const paymentData = JSON.parse(lastPayment)
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
            console.error('Fallback payment data error:', fallbackErr)
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
      const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/get-user-orders`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
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
            <LoadingSpinner message="Loading order details..." />
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
                onClick={() => router.push('/orders')} 
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
              <div className="success-icon"><CheckCircle size={56} strokeWidth={1.4} color="#10b981" /></div>
              <h1>Payment Successful!</h1>
              <p>Thank you for your order. We'll get started right away.</p>
            </div>

            <div className="discord-cta">
              <div className="discord-cta-text">
                <strong>Action Required: Join Discord to Continue Your Order</strong>
                <span>You must join our Discord server and create a support ticket to proceed with your order. Our team will contact you there to complete delivery.</span>
              </div>
              <a
                href="http://discord.gg/zeusservices"
                className="discord-btn"
                target="_blank"
                rel="noreferrer"
              >
                <img
                  src="/discordLogo.png"
                  alt="Discord"
                  className="discord-btn-icon"
                  width="22"
                  height="22"
                  loading="lazy"
                  decoding="async"
                />
                Join Discord & Create Ticket
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
                  <p>A confirmation email has been sent to <strong>{orderDetails.customer_email}</strong></p>
                </div>
              )}

              <div className="order-actions">
                <a href="/orders" className="primary-btn">View All Orders</a>
                <a href="/boosting" className="secondary-btn">Continue Shopping</a>
              </div>
            </div>
          </div>
        </section>
      )
    }
  }

  return (
    <>
      <SEO {...SEO_CONFIGS.cart} />
      <section className="section" id="cart" style={{ paddingTop: '2rem', paddingBottom: 0 }}>
        <div style={{ maxWidth: '1060px', margin: '0 auto' }}>
          <h1 className="section-title" style={{ marginBottom: '0.25rem' }}>Your Cart</h1>
          <p className="section-subtitle" style={{ marginBottom: canceled === 'true' ? '1rem' : '1.5rem' }}>
            Review your items and proceed to checkout.
          </p>
          {canceled === 'true' && (
            <div className="payment-cancelled-banner">
              Payment was cancelled. Your items are still in your cart.
            </div>
          )}
        </div>
        <CartSummary
          items={cartItems}
          onRemove={removeFromCart}
          onUpdateQuantity={updateQuantity}
          currency={currency}
          formatPrice={formatPrice}
        />
      </section>
    </>
  )
}
