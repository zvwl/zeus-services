'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import {
  Package, Clock, Star, TrendingUp,
  ShoppingCart, RefreshCw, ChevronDown, ChevronUp,
  Check, X
} from 'lucide-react'
import LoadingSpinner from '@/components/LoadingSpinner'
import './AdminDashboard.css'
import './AdminOrdersPage.css'

function StatusPill({ status }) {
  const s = (status || '').toLowerCase()
  const colors = {
    pending:    { color: '#fbbf24', bg: 'rgba(251,191,36,0.12)' },
    processing: { color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
    paid:       { color: '#22c55e', bg: 'rgba(34,197,94,0.12)'  },
    completed:  { color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
    cancelled:  { color: '#ef4444', bg: 'rgba(239,68,68,0.12)'  },
  }
  const { color = '#94a3b8', bg = 'rgba(148,163,184,0.1)' } = colors[s] || {}
  return (
    <span style={{
      display: 'inline-block', padding: '0.18rem 0.55rem', borderRadius: '5px',
      fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase',
      letterSpacing: '0.4px', color, background: bg,
    }}>
      {status || '—'}
    </span>
  )
}

function fmtCurrency(amount, currency) {
  const sym = { GBP: '£', USD: '$', EUR: '€' }
  return `${sym[currency] || ''}${parseFloat(amount || 0).toFixed(2)}`
}

export default function AdminDashboard() {
  const { user, isAdmin, loading: authLoading } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [stats, setStats] = useState({
    pendingReviews: null, pendingOrders: null,
    todayOrders: null, monthRevenue: null,
  })
  const [recentOrders, setRecentOrders] = useState([])
  const [customerNames, setCustomerNames] = useState({})
  const [pendingReviews, setPendingReviews] = useState([])
  const [reviewCustomerNames, setReviewCustomerNames] = useState({})
  const [adminLogs, setAdminLogs] = useState([])
  const [logsOpen, setLogsOpen] = useState(false)
  const [dateRange, setDateRange] = useState('30days')
  const [actionTypeFilter, setActionTypeFilter] = useState('all')
  const [reviewActions, setReviewActions] = useState({})

  useEffect(() => { fetchDashboardData() }, [dateRange])

  const fetchDashboardData = async () => {
    setLoading(true)
    setError('')
    try {
      const now = new Date()
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
      const dayOffset = dateRange === '7days' ? 7 : dateRange === '30days' ? 30 : dateRange === '90days' ? 90 : null

      let logsQuery = supabase
        .from('admin_actions_with_names')
        .select('id, admin_user_id, admin_name, action_type, order_id, review_id, old_status, new_status, notes, created_at')
        .order('created_at', { ascending: false })
        .limit(200)

      if (dayOffset) {
        const cutoff = new Date()
        cutoff.setDate(cutoff.getDate() - dayOffset)
        logsQuery = logsQuery.gte('created_at', cutoff.toISOString())
      }

      const [
        { data: actions, error: actionsErr },
        { count: pendingReviewsCount },
        { count: pendingOrdersCount },
        { count: todayOrdersCount },
        { data: monthOrders },
        { data: recentOrdersData },
        { data: pendingReviewsData },
      ] = await Promise.all([
        logsQuery,
        supabase.from('reviews').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('orders').select('id', { count: 'exact', head: true }).in('status', ['pending', 'processing', 'paid']),
        supabase.from('orders').select('id', { count: 'exact', head: true }).gte('created_at', startOfToday),
        supabase.from('orders').select('total_amount, currency').gte('created_at', startOfMonth).neq('payment_status', 'refunded'),
        supabase.from('orders').select('id, status, total_amount, currency, created_at, user_id').order('created_at', { ascending: false }).limit(8),
        supabase.from('reviews').select('id, rating, comment, created_at, user_id').eq('status', 'pending').order('created_at', { ascending: false }).limit(5),
      ])

      if (actionsErr) throw actionsErr

      // Fetch customer names for orders and reviews in one batch
      const allUserIds = [
        ...new Set([
          ...(recentOrdersData || []).map(o => o.user_id),
          ...(pendingReviewsData || []).map(r => r.user_id),
        ].filter(Boolean))
      ]

      let names = {}
      if (allUserIds.length > 0) {
        const { data: customers } = await supabase
          .from('customers')
          .select('user_id, name')
          .in('user_id', allUserIds)
        customers?.forEach(c => { names[c.user_id] = c.name })
      }

      const orderUserIds = new Set((recentOrdersData || []).map(o => o.user_id))
      const reviewUserIds = new Set((pendingReviewsData || []).map(r => r.user_id))
      const orderNames = {}
      const reviewNames = {}
      Object.entries(names).forEach(([id, name]) => {
        if (orderUserIds.has(id)) orderNames[id] = name
        if (reviewUserIds.has(id)) reviewNames[id] = name
      })

      let monthRevenue = null
      if (monthOrders) {
        monthRevenue = monthOrders
          .filter(o => o.currency === 'GBP' || !o.currency)
          .reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0)
      }

      setStats({
        pendingReviews: pendingReviewsCount ?? null,
        pendingOrders: pendingOrdersCount ?? null,
        todayOrders: todayOrdersCount ?? null,
        monthRevenue,
      })
      setRecentOrders(recentOrdersData || [])
      setCustomerNames(orderNames)
      setPendingReviews(pendingReviewsData || [])
      setReviewCustomerNames(reviewNames)
      setAdminLogs(actions || [])
    } catch (err) {
      console.error('Dashboard fetch error:', err)
      setError(err.message || 'Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const handleReviewAction = async (reviewId, action) => {
    setReviewActions(prev => ({ ...prev, [reviewId]: action }))
    try {
      const newStatus = action === 'approve' ? 'approved' : 'rejected'
      const { error: updateErr } = await supabase
        .from('reviews')
        .update({ status: newStatus })
        .eq('id', reviewId)
      if (updateErr) throw updateErr

      // Log the admin action (non-blocking — fails silently in dev bypass)
      const actionType = action === 'approve' ? 'review_approve' : 'review_reject'
      await supabase.from('admin_actions').insert([{
        admin_user_id: user?.id,
        action_type: actionType,
        review_id: reviewId,
        order_id: '00000000-0000-0000-0000-000000000000',
        old_status: 'pending',
        new_status: newStatus,
      }]).then(() => {}).catch(() => {})

      setPendingReviews(prev => prev.filter(r => r.id !== reviewId))
      setStats(prev => ({
        ...prev,
        pendingReviews: Math.max(0, (prev.pendingReviews || 1) - 1),
      }))
    } catch (err) {
      console.error('Review action error:', err)
    } finally {
      setReviewActions(prev => { const n = { ...prev }; delete n[reviewId]; return n })
    }
  }

  const getActionColor = (type) => ({
    complete: '#10b981', refund: '#ef4444', cancel: '#f97316',
    status_change: '#3b82f6', review_approve: '#10b981',
    review_reject: '#ef4444', review_delete: '#f97316',
    review_pending: '#f59e0b',
  })[type] || '#6b7280'

  const getActionLabel = (type) => ({
    complete: 'Completed', refund: 'Refunded', cancel: 'Cancelled',
    status_change: 'Status Change', review_approve: 'Review Approved',
    review_reject: 'Review Rejected', review_delete: 'Review Deleted',
    review_pending: 'Review Pending',
  })[type] || type.replace(/_/g, ' ')

  const filteredLogs = actionTypeFilter === 'all'
    ? adminLogs
    : adminLogs.filter(l => l.action_type === actionTypeFilter)

  if (authLoading || loading) {
    return (
      <div className="dash-container">
        <LoadingSpinner message={authLoading ? 'Verifying admin access...' : 'Loading dashboard...'} />
      </div>
    )
  }

  if (!user || !isAdmin) {
    return (
      <div className="dash-container">
        <div className="error-message">
          {!user ? 'Unauthorized – please log in.' : 'Admin access required.'}
        </div>
      </div>
    )
  }

  return (
    <div className="dash-container">
      {/* Header */}
      <div className="dash-header">
        <div>
          <h1 className="dash-title">Dashboard</h1>
          <p className="dash-subtitle">Welcome back. Here's what needs your attention.</p>
        </div>
        <button className="dash-refresh-btn" onClick={fetchDashboardData} title="Refresh dashboard">
          <RefreshCw size={14} />
          Refresh
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {/* Stat Cards */}
      <div className="dash-stats">
        <div className="dash-stat">
          <div className="dash-stat-icon" style={{ color: '#fbbf24' }}><Package size={20} /></div>
          <div>
            <div className="dash-stat-val">{stats.todayOrders ?? '—'}</div>
            <div className="dash-stat-label">Orders Today</div>
          </div>
        </div>
        <div
          className="dash-stat clickable"
          onClick={() => router.push('/admin/orders')}
          title="View pending orders"
        >
          <div className="dash-stat-icon" style={{ color: stats.pendingOrders > 0 ? '#fbbf24' : '#10b981' }}>
            <Clock size={20} />
          </div>
          <div>
            <div className="dash-stat-val" style={{ color: stats.pendingOrders > 0 ? '#fbbf24' : '#10b981' }}>
              {stats.pendingOrders ?? '—'}
            </div>
            <div className="dash-stat-label">Pending Orders</div>
          </div>
          {stats.pendingOrders > 0 && <div className="dash-stat-badge">Action needed</div>}
        </div>
        <div
          className="dash-stat clickable"
          onClick={() => router.push('/admin/reviews')}
          title="View pending reviews"
        >
          <div className="dash-stat-icon" style={{ color: stats.pendingReviews > 0 ? '#f97316' : '#10b981' }}>
            <Star size={20} />
          </div>
          <div>
            <div className="dash-stat-val" style={{ color: stats.pendingReviews > 0 ? '#f97316' : '#10b981' }}>
              {stats.pendingReviews ?? '—'}
            </div>
            <div className="dash-stat-label">Pending Reviews</div>
          </div>
          {stats.pendingReviews > 0 && (
            <div className="dash-stat-badge" style={{ background: 'rgba(249,115,22,0.12)', color: '#f97316' }}>
              Review queue
            </div>
          )}
        </div>
        <div className="dash-stat">
          <div className="dash-stat-icon" style={{ color: '#10b981' }}><TrendingUp size={20} /></div>
          <div>
            <div className="dash-stat-val" style={{ color: '#10b981' }}>
              {stats.monthRevenue !== null ? `£${stats.monthRevenue.toFixed(2)}` : '—'}
            </div>
            <div className="dash-stat-label">Revenue This Month</div>
          </div>
        </div>
      </div>

      {/* Two-column grid: recent orders + pending reviews */}
      <div className="dash-grid">
        {/* Recent Orders */}
        <section className="dash-panel">
          <div className="dash-panel-header">
            <h2 className="dash-panel-title"><ShoppingCart size={14} /> Recent Orders</h2>
            <Link href="/admin/orders" className="dash-panel-link">View all →</Link>
          </div>
          {recentOrders.length === 0 ? (
            <p className="dash-empty">No orders yet.</p>
          ) : (
            <div className="dash-orders-list">
              {recentOrders.map(order => (
                <div
                  key={order.id}
                  className="dash-order-row"
                  onClick={() => router.push('/admin/orders')}
                  title="Go to orders"
                >
                  <div className="dash-order-id" title={order.id}>
                    #{order.id.substring(0, 8)}…
                  </div>
                  <div className="dash-order-customer">
                    {customerNames[order.user_id] || 'Guest'}
                  </div>
                  <div className="dash-order-meta">
                    <StatusPill status={order.status} />
                    <span className="dash-order-amount">
                      {fmtCurrency(order.total_amount, order.currency)}
                    </span>
                    <span className="dash-order-date">
                      {new Date(order.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Pending Reviews */}
        <section className="dash-panel">
          <div className="dash-panel-header">
            <h2 className="dash-panel-title"><Star size={14} /> Pending Reviews</h2>
            <Link href="/admin/reviews" className="dash-panel-link">View all →</Link>
          </div>
          {pendingReviews.length === 0 ? (
            <p className="dash-empty" style={{ color: '#10b981' }}>
              <Check size={14} />
              All caught up
            </p>
          ) : (
            <div className="dash-reviews-list">
              {pendingReviews.map(review => (
                <div key={review.id} className="dash-review-row">
                  <div className="dash-review-meta">
                    <span className="dash-review-stars">
                      {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                    </span>
                    <span className="dash-review-author">
                      {reviewCustomerNames[review.user_id] || 'Unknown user'}
                    </span>
                    <span className="dash-review-date">
                      {new Date(review.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                  <p className="dash-review-comment">
                    {review.comment?.length > 110
                      ? `${review.comment.substring(0, 110)}…`
                      : review.comment}
                  </p>
                  <div className="dash-review-actions">
                    <button
                      className="dash-review-btn approve"
                      onClick={() => handleReviewAction(review.id, 'approve')}
                      disabled={!!reviewActions[review.id]}
                    >
                      <Check size={12} />
                      {reviewActions[review.id] === 'approve' ? 'Approving…' : 'Approve'}
                    </button>
                    <button
                      className="dash-review-btn reject"
                      onClick={() => handleReviewAction(review.id, 'reject')}
                      disabled={!!reviewActions[review.id]}
                    >
                      <X size={12} />
                      {reviewActions[review.id] === 'reject' ? 'Rejecting…' : 'Reject'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Activity Logs (collapsible) */}
      <div className="dash-logs-section">
        <button
          className="dash-logs-toggle"
          onClick={() => setLogsOpen(v => !v)}
        >
          <span>Activity Logs</span>
          <div className="dash-logs-right">
            <div className="dash-logs-filters" onClick={e => e.stopPropagation()}>
              <select value={dateRange} onChange={e => setDateRange(e.target.value)}>
                <option value="all">All time</option>
                <option value="7days">Last 7 days</option>
                <option value="30days">Last 30 days</option>
                <option value="90days">Last 90 days</option>
              </select>
              <select value={actionTypeFilter} onChange={e => setActionTypeFilter(e.target.value)}>
                <option value="all">All actions</option>
                <option value="complete">Completed</option>
                <option value="refund">Refunded</option>
                <option value="cancel">Cancelled</option>
                <option value="status_change">Status Change</option>
                <option value="review_approve">Review Approved</option>
                <option value="review_reject">Review Rejected</option>
              </select>
              <span className="dash-log-count">{filteredLogs.length} entries</span>
            </div>
            {logsOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
        </button>

        {logsOpen && (
          <>
            {filteredLogs.length === 0 ? (
              <p className="no-data" style={{ padding: '2rem' }}>
                No admin activities for this period.
              </p>
            ) : (
              <div className="logs-table-wrapper" style={{ borderTopLeftRadius: 0, borderTopRightRadius: 0, borderTop: 'none' }}>
                <table className="logs-table">
                  <thead>
                    <tr>
                      <th>Timestamp</th>
                      <th>Admin</th>
                      <th>Action</th>
                      <th>Order / Review</th>
                      <th>Status Change</th>
                      <th>Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLogs.map(log => (
                      <tr key={log.id}>
                        <td>
                          {new Date(log.created_at).toLocaleString('en-GB', {
                            year: 'numeric', month: 'short', day: 'numeric',
                            hour: '2-digit', minute: '2-digit',
                          })}
                        </td>
                        <td><span className="admin-name">{log.admin_name || 'Unknown'}</span></td>
                        <td>
                          <span
                            className="action-badge"
                            style={{ backgroundColor: getActionColor(log.action_type) }}
                          >
                            {getActionLabel(log.action_type)}
                          </span>
                        </td>
                        <td className="order-id">
                          {log.action_type?.startsWith('review_')
                            ? `Review: ${log.review_id?.substring(0, 8) ?? '—'}…`
                            : `Order: ${log.order_id?.substring(0, 8) ?? '—'}…`}
                        </td>
                        <td className="status-change">
                          {log.old_status && log.new_status ? (
                            <>
                              <span className="old-status">{log.old_status}</span>
                              <span className="arrow"> → </span>
                              <span className="new-status">{log.new_status}</span>
                            </>
                          ) : (
                            <span className="no-change">—</span>
                          )}
                        </td>
                        <td className="notes">{log.notes || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
