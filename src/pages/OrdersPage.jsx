import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../supabaseClient'
import './OrdersPage.css'

export default function OrdersPage() {
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [orderReviews, setOrderReviews] = useState({})
  const { user, loading: authLoading } = useAuth()

  useEffect(() => {
    // Wait for auth to finish loading before checking if user is logged in
    if (authLoading) return

    let isActive = true

    const init = async () => {
      setLoading(true)
      setError(null)

      // Give Supabase a brief moment to hydrate session after Stripe redirect
      let session = null
      try {
        const { data: { session: s } } = await Promise.race([
          supabase.auth.getSession(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 2000))
        ])
        session = s
      } catch {
        session = null
      }

      const hasUser = !!(user || session?.user)
      if (!hasUser) {
        if (isActive) {
          setLoading(false)
          setError('Please log in to view your orders')
        }
        return
      }

      await fetchOrders(session)
    }

    init()

    return () => {
      isActive = false
    }
  }, [user, authLoading])

  const fetchOrders = async (sessionOverride = null) => {
    try {
      setLoading(true)
      setError(null)

      const sessionData = sessionOverride
        ? { session: sessionOverride }
        : (await supabase.auth.getSession()).data
      const authUser = sessionData?.session?.user
      const accessToken = sessionData?.session?.access_token

      if (!authUser || !accessToken) {
        setError('Please log in to view your orders')
        setLoading(false)
        return
      }

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
        throw new Error(body?.error || 'Failed to load orders')
      }

      setOrders(body.orders || [])
      
      // Fetch reviews for all orders
      if (body.orders && body.orders.length > 0) {
        const orderIds = body.orders.map(order => order.id)
        const { data: reviewsData } = await supabase
          .from('reviews')
          .select('order_id, id')
          .in('order_id', orderIds)
        
        const reviewsMap = {}
        if (reviewsData) {
          reviewsData.forEach(review => {
            reviewsMap[review.order_id] = review
          })
        }
        setOrderReviews(reviewsMap)
      }
    } catch (err) {
      console.error('Error fetching orders:', err)
      setError(err.message || 'Failed to load orders')
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status) => {
    const statusMap = {
      created: { label: 'Created', className: 'status-created' },
      pending: { label: 'Pending', className: 'status-pending' },
      processing: { label: 'Processing', className: 'status-processing' },
      completed: { label: 'Completed', className: 'status-completed' },
      cancelled: { label: 'Cancelled', className: 'status-cancelled' }
    }
    return statusMap[status] || { label: status, className: 'status-default' }
  }

  const getPaymentStatusBadge = (paymentStatus) => {
    const statusMap = {
      pending: { label: 'Pending', className: 'payment-pending' },
      paid: { label: 'Paid', className: 'payment-paid' },
      failed: { label: 'Failed', className: 'payment-failed' },
      skipped: { label: 'Skipped (Dev)', className: 'payment-skipped' },
      refunded: { label: 'Refunded', className: 'payment-refunded' }
    }
    return statusMap[paymentStatus] || { label: paymentStatus, className: 'payment-default' }
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

  const formatCurrency = (amount, currency) => {
    const symbols = { USD: '$', GBP: '£', EUR: '€' }
    const symbol = symbols[currency] || currency
    return `${symbol}${Number(amount).toFixed(2)}`
  }

  if (loading) {
    return (
      <section className="section orders-section">
        <div className="orders-container">
          <div className="loading-message">Loading your orders...</div>
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section className="section orders-section">
        <div className="orders-container">
          <div className="error-message">
            <p>{error}</p>
            {error.toLowerCase().includes('log in') && (
              <button
                className="view-orders-btn"
                onClick={() => window.location.assign('/login')}
              >
                Go to Login
              </button>
            )}
          </div>
        </div>
      </section>
    )
  }

  if (!user) {
    return (
      <section className="section orders-section">
        <div className="orders-container">
          <div className="empty-state">
            <h2>Please log in</h2>
            <p>You need to be logged in to view your orders.</p>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="section orders-section">
      <div className="orders-container">
        <div className="orders-header">
          <h1>Your Orders</h1>
          <p>View and track all your orders</p>
        </div>

        {orders.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">📦</span>
            <h2>No orders yet</h2>
            <p>Start shopping to see your orders here!</p>
          </div>
        ) : (
          <div className="orders-list">
            {orders.map(order => {
              const orderStatus = getStatusBadge(order.status)
              const paymentStatus = getPaymentStatusBadge(order.payment_status)
              const items = Array.isArray(order.items) ? order.items : []

              return (
                <div key={order.id} className="order-card">
                  <div className="order-header-row">
                    <div className="order-info">
                      <div className="order-id">
                        Order #{order.id.slice(0, 8)}
                      </div>
                      <div className="order-date">
                        {formatDate(order.created_at)}
                      </div>
                    </div>
                    <div className="order-badges">
                      <span className={`status-badge ${orderStatus.className}`}>
                        {orderStatus.label}
                      </span>
                      <span className={`payment-badge ${paymentStatus.className}`}>
                        {paymentStatus.label}
                      </span>
                    </div>
                  </div>

                  <div className="order-items">
                    {items.map((item, idx) => (
                      <div key={idx} className="order-item">
                        <div className="item-info">
                          <span className="item-name">{item.name}</span>
                          {item.platform && (
                            <span className="item-platform">• {item.platform}</span>
                          )}
                        </div>
                        <div className="item-details">
                          <span className="item-quantity">x{item.quantity}</span>
                          <span className="item-price">
                            {formatCurrency(item.price_converted || item.price_usd, order.currency)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="order-footer">
                    <div className="order-total">
                      <span className="total-label">Total:</span>
                      <span className="total-amount">
                        {formatCurrency(order.total_amount, order.currency)}
                      </span>
                    </div>
                    {order.payment_method && (
                      <div className="payment-method">
                        Payment: {order.payment_method.replace('_', ' ')}
                      </div>
                    )}
                  </div>

                  {(order.note_plaintext || order.notes) && (
                    <div className="order-notes">
                      <strong>Notes:</strong> {order.note_plaintext || order.notes}
                    </div>
                  )}
                  
                  {order.status === 'completed' && !orderReviews[order.id] && (
                    <div className="order-review-section">
                      <button
                        className="btn-review"
                        onClick={() => navigate(`/review?order=${order.id}`)}
                      >
                        ⭐ Write a Review
                      </button>
                    </div>
                  )}
                  
                  {orderReviews[order.id] && (
                    <div className="order-review-status">
                      <span className="review-submitted">✓ Review Submitted</span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}
