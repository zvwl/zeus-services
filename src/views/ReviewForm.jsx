'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase/client'
import { Star, CheckCircle } from 'lucide-react'
import LoadingSpinner from '@/components/LoadingSpinner'
import SEO from '@/components/SEO'
import './ReviewForm.css'

export default function ReviewForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const orderId = searchParams.get('order')
  const { user, loading: authLoading } = useAuth()
  
  const [order, setOrder] = useState(null)
  const [rating, setRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (authLoading) return
    
    if (!user) {
      const redirectTarget = orderId ? `/review?order=${orderId}` : '/orders'
      router.push(`/login?redirect=${encodeURIComponent(redirectTarget)}`)
      return
    }
    
    if (!orderId) {
      setError('Order ID is required')
      setLoading(false)
      return
    }
    
    fetchOrderDetails()
  }, [user, authLoading, orderId, router])

  const fetchOrderDetails = async () => {
    try {
      setLoading(true)
      setError('')

      // Fetch order details
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .eq('user_id', user.id)
        .single()

      if (orderError) throw new Error('Order not found')
      if (!orderData) throw new Error('Order not found')
      
      // Check if order is completed
      if (orderData.status !== 'completed') {
        throw new Error('You can only review completed orders')
      }

      // Check if review already exists
      const { data: existingReview, error: reviewError } = await supabase
        .from('reviews')
        .select('*')
        .eq('order_id', orderId)
        .maybeSingle()

      if (reviewError && reviewError.code !== 'PGRST116') {
        throw reviewError
      }

      if (existingReview) {
        throw new Error('You have already submitted a review for this order')
      }

      setOrder(orderData)
    } catch (err) {
      console.error('Error fetching order:', err)
      setError(err.message || 'Failed to load order details')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (rating === 0) {
      setError('Please select a rating')
      return
    }
    
    if (comment.trim().length < 10) {
      setError('Review must be at least 10 characters')
      return
    }

    if (comment.trim().length > 2000) {
      setError('Review must be less than 2000 characters')
      return
    }

    try {
      setSubmitting(true)
      setError('')

      const { error: insertError } = await supabase
        .from('reviews')
        .insert([{
          order_id: orderId,
          user_id: user.id,
          rating,
          comment: comment.trim(),
          status: 'pending'
        }])

      if (insertError) throw insertError

      setSuccess(true)
      setTimeout(() => {
        router.push('/orders')
      }, 2000)
    } catch (err) {
      console.error('Error submitting review:', err)
      setError(err.message || 'Failed to submit review')
    } finally {
      setSubmitting(false)
    }
  }

  const formatCurrency = (amount, currency) => {
    const symbols = { USD: '$', GBP: '£', EUR: '€' }
    const symbol = symbols[currency] || currency
    return `${symbol}${Number(amount).toFixed(2)}`
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <section className="section review-form-section">
        <div className="review-form-container">
          <LoadingSpinner message="Loading order details..." />
        </div>
      </section>
    )
  }

  if (error && !order) {
    return (
      <section className="section review-form-section">
        <div className="review-form-container">
          <div className="error-message">{error}</div>
          <button className="btn-back" onClick={() => router.push('/orders')}>
            Back to Orders
          </button>
        </div>
      </section>
    )
  }

  if (success) {
    return (
      <section className="section review-form-section">
        <div className="review-form-container">
          <div className="success-message">
            <CheckCircle size={48} strokeWidth={1.5} className="success-icon" />
            <h2>Review Submitted!</h2>
            <p>Thank you for your feedback. Your review is pending approval and will be visible once approved by our team.</p>
            <p>Redirecting to your orders...</p>
          </div>
        </div>
      </section>
    )
  }

  return (
    <>
      <SEO
        title="Write a Review | zeuservices"
        description="Write a review for your zeuservices order."
        robots="noindex, follow"
      />
      <section className="section review-form-section">
        <div className="review-form-container">
        <div className="review-form-header">
          <h1>Write a Review</h1>
          <p>Share your experience with this order</p>
        </div>

        {order && (
          <div className="order-summary-box">
            <h3>Order Details</h3>
            <div className="order-info-row">
              <span className="label">Order ID:</span>
              <span className="value">#{order.id.slice(0, 8)}</span>
            </div>
            <div className="order-info-row">
              <span className="label">Date:</span>
              <span className="value">{formatDate(order.created_at)}</span>
            </div>
            <div className="order-info-row">
              <span className="label">Total:</span>
              <span className="value">{formatCurrency(order.total_amount, order.currency)}</span>
            </div>
            {order.items && order.items.length > 0 && (
              <div className="order-items-list">
                <span className="label">Items:</span>
                <ul>
                  {order.items.map((item, idx) => (
                    <li key={idx}>{item.name} {item.platform && `(${item.platform})`}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="review-form">
          <div className="form-group">
            <label>Rating *</label>
            <div className="star-rating">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className={`star ${star <= (hoveredRating || rating) ? 'filled' : ''}`}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                >
                  <Star size={28} strokeWidth={1.5} fill={star <= (hoveredRating || rating) ? 'currentColor' : 'none'} />
                </button>
              ))}
            </div>
            {rating > 0 && (
              <span className="rating-text">
                {rating === 1 && 'Poor'}
                {rating === 2 && 'Fair'}
                {rating === 3 && 'Good'}
                {rating === 4 && 'Very Good'}
                {rating === 5 && 'Excellent'}
              </span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="comment">Your Review *</label>
            <textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Tell us about your experience... (minimum 10 characters)"
              rows="6"
              maxLength="2000"
              required
            />
            <div className="character-count">
              {comment.length} / 2000 characters
              {comment.length < 10 && comment.length > 0 && (
                <span className="count-warning"> (minimum 10)</span>
              )}
            </div>
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="form-actions">
            <button
              type="button"
              className="btn-cancel"
              onClick={() => router.push('/orders')}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-submit"
              disabled={submitting || rating === 0 || comment.trim().length < 10}
            >
              {submitting ? 'Submitting...' : 'Submit Review'}
            </button>
          </div>
        </form>

        <div className="review-note">
          <p>
            <strong>Note:</strong> Your review will be reviewed by our team before being published.
            We appreciate honest feedback that helps other customers make informed decisions.
          </p>
        </div>
        </div>
      </section>
    </>
  )
}
