import { useState, useEffect } from 'react'
import { Star } from 'lucide-react'
import DOMPurify from 'dompurify'
import { supabase } from '../supabaseClient'
import SEO, { SEO_CONFIGS } from '../components/SEO'
import Breadcrumb from '../components/Breadcrumb'
import LoadingSpinner from '../components/LoadingSpinner'
import AnimatedLucideIcon from '../components/AnimatedLucideIcon'
import { isPrerender } from '../utils/isPrerender'
import './ReviewsPage.css'

export default function ReviewsPage() {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filterRating, setFilterRating] = useState('all')
  const [sortBy, setSortBy] = useState('newest')

  useEffect(() => {
    if (isPrerender()) {
      setReviews([])
      setLoading(false)
      return
    }
    fetchReviews()
  }, [])

  const fetchReviews = async () => {
    try {
      setLoading(true)
      setError('')

      const { data, error: fetchError } = await supabase
        .from('reviews')
        .select(`
          id,
          rating,
          comment,
          created_at,
          order_id,
          user_id
        `)
        .eq('status', 'approved')
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError

      // Fetch user info for all reviews
      if (data && data.length > 0) {
        const userIds = [...new Set(data.map(r => r.user_id))]
        const { data: usersData } = await supabase
          .from('customers')
          .select('user_id, name')
          .in('user_id', userIds)

        const userMap = {}
        usersData?.forEach(user => {
          userMap[user.user_id] = user.name || 'Anonymous'
        })

        // Attach user names to reviews
        const reviewsWithNames = data.map(review => ({
          ...review,
          userName: userMap[review.user_id] || 'Anonymous'
        }))

        setReviews(reviewsWithNames)
      } else {
        setReviews(data || [])
      }
    } catch (err) {
      console.error('Error fetching reviews:', err)
      setError('Failed to load reviews')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getFilteredAndSortedReviews = () => {
    let filtered = [...reviews]

    // Filter by rating
    if (filterRating !== 'all') {
      const rating = parseInt(filterRating)
      filtered = filtered.filter(review => review.rating === rating)
    }

    // Sort
    if (sortBy === 'newest') {
      filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    } else if (sortBy === 'oldest') {
      filtered.sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
    } else if (sortBy === 'highest') {
      filtered.sort((a, b) => b.rating - a.rating)
    } else if (sortBy === 'lowest') {
      filtered.sort((a, b) => a.rating - b.rating)
    }

    return filtered
  }

  const getAverageRating = () => {
    if (reviews.length === 0) return 0
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0)
    return (sum / reviews.length).toFixed(1)
  }

  const getRatingDistribution = () => {
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    reviews.forEach(review => {
      distribution[review.rating]++
    })
    return distribution
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

  const getDisplayNameInitials = (userName) => {
    if (!userName) return '***'
    const trimmedName = userName.trim()
    if (trimmedName.length <= 3) {
      return trimmedName.toUpperCase()
    }
    const firstThree = trimmedName.substring(0, 3).toUpperCase()
    const remainingCount = trimmedName.length - 3
    return firstThree + '*'.repeat(remainingCount)
  }

  const filteredReviews = getFilteredAndSortedReviews()
  const averageRating = getAverageRating()
  const ratingDistribution = getRatingDistribution()

  if (loading) {
    return (
      <section className="section reviews-section">
        <div className="reviews-container">
          <LoadingSpinner message="Loading reviews..." />
        </div>
      </section>
    )
  }

  return (
    <>
      <SEO {...SEO_CONFIGS.reviews} />
      
      {/* Aggregate Rating Schema for SEO */}
      {reviews.length > 0 && (
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": "ZeuServices",
            "aggregateRating": {
              "@type": "AggregateRating",
              "ratingValue": averageRating,
              "bestRating": "5",
              "worstRating": "1",
              "ratingCount": reviews.length
            }
          })}
        </script>
      )}
      
      <section className="section reviews-section">
        <Breadcrumb customItems={[{ label: 'Home', path: '/' }, { label: 'Reviews', path: '/reviews' }]} />
        <div className="reviews-container">
        <div className="reviews-header">
          <h1>Customer Reviews</h1>
          <p>See what our customers are saying about their experience</p>
        </div>

        {reviews.length > 0 && (
          <div className="reviews-stats">
            <div className="average-rating-card">
              <div className="rating-number">{averageRating}</div>
              <div className="stars-display">
                {renderStars(Math.round(averageRating))}
              </div>
              <div className="review-count">{reviews.length} {reviews.length === 1 ? 'Review' : 'Reviews'}</div>
            </div>

            <div className="rating-distribution">
              {[5, 4, 3, 2, 1].map(star => {
                const count = ratingDistribution[star]
                const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : 0
                return (
                  <div key={star} className="distribution-row">
                    <span className="star-label">{star} ★</span>
                    <div className="distribution-bar">
                      <div
                        className="distribution-fill"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="distribution-count">{count}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {reviews.length > 0 && (
          <div className="reviews-filters">
            <div className="filter-group">
              <label htmlFor="rating-filter">Filter by rating:</label>
              <select
                id="rating-filter"
                value={filterRating}
                onChange={(e) => setFilterRating(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Ratings</option>
                <option value="5">5 Stars</option>
                <option value="4">4 Stars</option>
                <option value="3">3 Stars</option>
                <option value="2">2 Stars</option>
                <option value="1">1 Star</option>
              </select>
            </div>

            <div className="filter-group">
              <label htmlFor="sort-select">Sort by:</label>
              <select
                id="sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="filter-select"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="highest">Highest Rating</option>
                <option value="lowest">Lowest Rating</option>
              </select>
            </div>
          </div>
        )}

        {error && <div className="error-message">{error}</div>}

        {filteredReviews.length === 0 && !error && (
          <div className="empty-state">
            <span className="empty-icon"><AnimatedLucideIcon icon={Star} size={28} /></span>
            <h2>No reviews yet</h2>
            <p>Be the first to share your experience!</p>
          </div>
        )}

        {filteredReviews.length > 0 && (
          <div className="reviews-list">
            {filteredReviews.map(review => (
              <div key={review.id} className="review-card">
                <div className="review-header">
                  <div className="review-rating">
                    {renderStars(review.rating)}
                  </div>
                  <div className="review-date">
                    {formatDate(review.created_at)}
                  </div>
                </div>

                <div className="review-content">
                  <p>{review.comment}</p>
                </div>

                <div className="review-footer">
                  <span className="verified-badge">✓ Verified Purchase</span>
                  <span className="reviewer-initials">{getDisplayNameInitials(DOMPurify.sanitize(review.userName))}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
    </>
  )
}
