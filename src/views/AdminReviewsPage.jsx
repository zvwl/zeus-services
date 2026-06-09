'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase, isDevBypassActive } from '@/lib/supabase/client'
import { Star, Check, X, RotateCcw, Trash2 } from 'lucide-react'
import LoadingSpinner from '@/components/LoadingSpinner'
import './AdminReviewsPage.css'

export default function AdminReviewsPage() {
  const { user } = useAuth()
  const [reviews, setReviews] = useState([])
  const [allReviews, setAllReviews] = useState([])
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
    if (isDevBypassActive) {
      setIsAdmin(true)
      fetchReviews()
      return
    }

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
    } catch (_err) {
      setError('Error checking admin status')
      setLoading(false)
    }
  }

  const fetchReviews = async () => {
    setLoading(true)
    try {
      const fields = 'id, rating, comment, status, admin_notes, created_at, order_id, user_id'

      // Fetch all reviews for counts, and filtered for display
      const [allResult, filteredResult] = await Promise.all([
        supabase.from('reviews').select('id, status').order('created_at', { ascending: false }),
        (() => {
          let q = supabase.from('reviews').select(fields).order('created_at', { ascending: false })
          if (statusFilter !== 'all') q = q.eq('status', statusFilter)
          return q
        })(),
      ])

      if (filteredResult.error) throw filteredResult.error

      setAllReviews(allResult.data || [])
      setReviews(filteredResult.data || [])
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

  // Realtime subscription for reviews
  useEffect(() => {
    if (!isAdmin) return

    const channel = supabase
      .channel('admin_reviews')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'reviews' },
        () => {
          fetchReviews()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [isAdmin])

  const updateReviewStatus = async (reviewId, newStatus) => {
    setUpdatingReviewId(reviewId)
    try {
      // Get the current review to capture old status
      const currentReview = reviews.find(r => r.id === reviewId)
      const oldStatus = currentReview?.status
      
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

      // Log admin action with old and new status
      await logAdminAction(reviewId, newStatus, oldStatus, adminNotes[reviewId] || null)

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

      // Log admin action for delete (get status before deleting)
      const reviewToDelete = reviews.find(r => r.id === reviewId)
      await logAdminAction(reviewId, 'delete', reviewToDelete?.status, 'Review permanently deleted')

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

  const logAdminAction = async (reviewId, actionType, oldStatus = null, notes = null) => {
    try {
      let mappedActionType = 'status_change'
      
      if (actionType === 'approved') {
        mappedActionType = 'review_approve'
      } else if (actionType === 'rejected') {
        mappedActionType = 'review_reject'
      } else if (actionType === 'pending') {
        mappedActionType = 'review_pending'
      } else if (actionType === 'delete') {
        mappedActionType = 'review_delete'
      }

      // Get the review to find the order_id
      const review = reviews.find(r => r.id === reviewId)
      const orderId = review?.order_id

      const { error } = await supabase
        .from('admin_actions')
        .insert([
          {
            admin_user_id: user.id,
            action_type: mappedActionType,
            order_id: orderId || '00000000-0000-0000-0000-000000000000', // Dummy UUID if not found
            review_id: reviewId,
            old_status: oldStatus,
            new_status: actionType === 'delete' ? 'deleted' : actionType,
            notes: notes || null
          }
        ])

      if (error) {
        console.error('Failed to log admin action:', error)
      }
    } catch (err) {
      console.error('Error logging admin action:', err)
    }
  }

  const renderStars = (rating) => {
    return [...Array(5)].map((_, index) => (
      <Star
        key={index}
        size={16}
        strokeWidth={1.5}
        className={`star ${index < rating ? 'filled' : ''}`}
        fill={index < rating ? 'currentColor' : 'none'}
      />
    ))
  }

  if (loading) {
    return (
      <section className="section admin-section">
        <div className="admin-container">
          <LoadingSpinner message="Loading reviews..." />
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

        {allReviews.length > 0 && (() => {
          const pendingCount = allReviews.filter(r => r.status === 'pending').length
          const approvedCount = allReviews.filter(r => r.status === 'approved').length
          const rejectedCount = allReviews.filter(r => r.status === 'rejected').length
          return (
            <div className="reviews-stats-bar">
              <button
                className={`rsb-chip ${statusFilter === 'all' ? 'rsb-active' : ''}`}
                onClick={() => setStatusFilter('all')}
              >
                All <span className="rsb-count">{allReviews.length}</span>
              </button>
              <button
                className={`rsb-chip rsb-pending ${statusFilter === 'pending' ? 'rsb-active' : ''}`}
                onClick={() => setStatusFilter('pending')}
              >
                Pending <span className="rsb-count">{pendingCount}</span>
              </button>
              <button
                className={`rsb-chip rsb-approved ${statusFilter === 'approved' ? 'rsb-active' : ''}`}
                onClick={() => setStatusFilter('approved')}
              >
                Approved <span className="rsb-count">{approvedCount}</span>
              </button>
              <button
                className={`rsb-chip rsb-rejected ${statusFilter === 'rejected' ? 'rsb-active' : ''}`}
                onClick={() => setStatusFilter('rejected')}
              >
                Rejected <span className="rsb-count">{rejectedCount}</span>
              </button>
            </div>
          )
        })()}

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
          <span className="review-count">{reviews.length} showing</span>
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
                      <Check size={14} strokeWidth={2.5} /> Approve
                    </button>
                  )}
                  {review.status !== 'rejected' && (
                    <button
                      className="btn-reject"
                      onClick={() => updateReviewStatus(review.id, 'rejected')}
                      disabled={updatingReviewId === review.id}
                    >
                      <X size={14} strokeWidth={2.5} /> Reject
                    </button>
                  )}
                  {review.status !== 'pending' && (
                    <button
                      className="btn-pending"
                      onClick={() => updateReviewStatus(review.id, 'pending')}
                      disabled={updatingReviewId === review.id}
                    >
                      <RotateCcw size={14} strokeWidth={2.5} /> Set Pending
                    </button>
                  )}
                  <button
                    className="btn-delete"
                    onClick={() => deleteReview(review.id)}
                    disabled={updatingReviewId === review.id}
                  >
                    <Trash2 size={14} strokeWidth={2} /> Delete
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
