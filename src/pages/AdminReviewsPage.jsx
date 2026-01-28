import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../supabaseClient'
import './AdminReviewsPage.css'

export default function AdminReviewsPage() {
  const { user } = useAuth()
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)
  const [statusFilter, setStatusFilter] = useState('pending')
  const [updatingReviewId, setUpdatingReviewId] = useState(null)
  const [adminNotes, setAdminNotes] = useState({})

  useEffect(() => {
    checkAdminStatus()
  }, [user])

  const checkAdminStatus = async () => {
    if (!user?.id) {
      setError('Please log in')
      setLoading(false)
      return
    }

    try {
      const { data, error } = await supabase
        .from('admin_users')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (error || !data) {
        setError('Access denied. Admin privileges required.')
        setIsAdmin(false)
        setLoading(false)
        return
      }

      setIsAdmin(true)
      fetchReviews()
    } catch (err) {
      setError('Error checking admin status')
      setLoading(false)
    }
  }

  const fetchReviews = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('reviews')
        .select(`
          id,
          rating,
          comment,
          status,
          admin_notes,
          created_at,
          order_id,
          user_id
        `)
        .order('created_at', { ascending: false })

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter)
      }

      const { data, error: fetchError } = await query

      if (fetchError) throw fetchError

      setReviews(data || [])
      setError('')
    } catch (err) {
      setError('Error loading reviews: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isAdmin) {
      fetchReviews()
    }
  }, [isAdmin, statusFilter])

  const updateReviewStatus = async (reviewId, newStatus) => {
    setUpdatingReviewId(reviewId)
    try {
      const updateData = {
        status: newStatus,
        updated_at: new Date().toISOString()
      }

      // Add admin notes if provided
      if (adminNotes[reviewId]) {
        updateData.admin_notes = adminNotes[reviewId]
      }

      const { error } = await supabase
        .from('reviews')
        .update(updateData)
        .eq('id', reviewId)

      if (error) throw error

      // Clear notes after update
      setAdminNotes(prev => ({ ...prev, [reviewId]: '' }))

      // Update local state
      setReviews(reviews.map(review =>
        review.id === reviewId ? { ...review, ...updateData } : review
      ))
    } catch (err) {
      setError('Error updating review: ' + err.message)
    } finally {
      setUpdatingReviewId(null)
    }
  }

  const deleteReview = async (reviewId) => {
    if (!confirm('Are you sure you want to delete this review? This action cannot be undone.')) {
      return
    }

    setUpdatingReviewId(reviewId)
    try {
      const { error } = await supabase
        .from('reviews')
        .delete()
        .eq('id', reviewId)

      if (error) throw error

      setReviews(reviews.filter(review => review.id !== reviewId))
    } catch (err) {
      setError('Error deleting review: ' + err.message)
    } finally {
      setUpdatingReviewId(null)
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-GB', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const renderStars = (rating) => {
    return [...Array(5)].map((_, index) => (
      <span
        key={index}
        className={`star ${index < rating ? 'filled' : ''}`}
      >
        ★
      </span>
    ))
  }

  if (loading) {
    return (
      <section className="section admin-section">
        <div className="admin-container">
          <div className="loading">Loading...</div>
        </div>
      </section>
    )
  }

  if (!isAdmin) {
    return (
      <section className="section admin-section">
        <div className="admin-container">
          <div className="error-card">
            <h2>Access Denied</h2>
            <p>{error || 'You do not have permission to view this page.'}</p>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="section admin-section">
      <div className="admin-container">
        <div className="admin-header">
          <h1>Review Management</h1>
          <p>Moderate customer reviews</p>
        </div>

        <div className="filter-bar">
          <label htmlFor="statusFilter">Filter by status:</label>
          <select
            id="statusFilter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Reviews</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          <span className="review-count">{reviews.length} reviews</span>
        </div>

        {error && <div className="error-message">{error}</div>}

        {reviews.length === 0 ? (
          <div className="no-reviews">
            <p>No reviews found</p>
          </div>
        ) : (
          <div className="reviews-grid">
            {reviews.map(review => (
              <div key={review.id} className="review-card">
                <div className="review-header">
                  <div className="review-rating">
                    {renderStars(review.rating)}
                  </div>
                  <span className={`status-badge status-${review.status}`}>
                    {review.status}
                  </span>
                </div>

                <div className="review-meta">
                  <div className="meta-row">
                    <span className="label">Order ID:</span>
                    <span className="value" title={review.order_id}>
                      {review.order_id.slice(0, 8)}
                    </span>
                  </div>
                  <div className="meta-row">
                    <span className="label">User ID:</span>
                    <span className="value" title={review.user_id}>
                      {review.user_id.slice(0, 8)}
                    </span>
                  </div>
                  <div className="meta-row">
                    <span className="label">Date:</span>
                    <span className="value">{formatDate(review.created_at)}</span>
                  </div>
                </div>

                <div className="review-content">
                  <h4>Customer Review:</h4>
                  <p>{review.comment}</p>
                </div>

                {review.admin_notes && (
                  <div className="admin-notes-display">
                    <strong>Admin Notes:</strong>
                    <p>{review.admin_notes}</p>
                  </div>
                )}

                <div className="admin-notes-section">
                  <label htmlFor={`notes-${review.id}`}>Add/Update Admin Notes:</label>
                  <textarea
                    id={`notes-${review.id}`}
                    value={adminNotes[review.id] || ''}
                    onChange={(e) => setAdminNotes(prev => ({ ...prev, [review.id]: e.target.value }))}
                    placeholder="Add notes about this review..."
                    className="admin-notes-input"
                  />
                </div>

                <div className="review-actions">
                  {review.status !== 'approved' && (
                    <button
                      className="btn-approve"
                      onClick={() => updateReviewStatus(review.id, 'approved')}
                      disabled={updatingReviewId === review.id}
                    >
                      ✓ Approve
                    </button>
                  )}
                  {review.status !== 'rejected' && (
                    <button
                      className="btn-reject"
                      onClick={() => updateReviewStatus(review.id, 'rejected')}
                      disabled={updatingReviewId === review.id}
                    >
                      ✗ Reject
                    </button>
                  )}
                  {review.status !== 'pending' && (
                    <button
                      className="btn-pending"
                      onClick={() => updateReviewStatus(review.id, 'pending')}
                      disabled={updatingReviewId === review.id}
                    >
                      ⟲ Set Pending
                    </button>
                  )}
                  <button
                    className="btn-delete"
                    onClick={() => deleteReview(review.id)}
                    disabled={updatingReviewId === review.id}
                  >
                    🗑 Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
