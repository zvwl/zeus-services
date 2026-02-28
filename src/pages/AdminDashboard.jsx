import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import LoadingSpinner from '../components/LoadingSpinner'
import './AdminOrdersPage.css'

export default function AdminDashboard() {
  const { user } = useAuth()
  const [adminLogs, setAdminLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [dateRange, setDateRange] = useState('all') // 'all', '7days', '30days', '90days'

  // Fetch dashboard data on mount (auth handled by ProtectedAdminRoute wrapper)
  useEffect(() => {
    fetchDashboardData()
  }, [dateRange])

  const getDayOffset = () => {
    switch(dateRange) {
      case '7days': return 7
      case '30days': return 30
      case '90days': return 90
      default: return null
    }
  }

  const fetchDashboardData = async () => {
    setLoading(true)
    setError('')
    try {
      const dayOffset = getDayOffset()
      
      // Fetch admin actions with names from the view
      let logsQuery = supabase
        .from('admin_actions_with_names')
        .select('id, admin_user_id, admin_name, action_type, order_id, review_id, old_status, new_status, notes, created_at')
        .order('created_at', { ascending: false })

      if (dayOffset) {
        const dateLimit = new Date()
        dateLimit.setDate(dateLimit.getDate() - dayOffset)
        logsQuery = logsQuery.gte('created_at', dateLimit.toISOString())
      }

      const { data: actions, error: actionsError } = await logsQuery

      if (actionsError) throw actionsError

      setAdminLogs(actions || [])

    } catch (err) {
      console.error('Dashboard fetch error:', err)
      setError(err.message || 'Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const getActionColor = (actionType) => {
    switch(actionType) {
      case 'complete': return '#10b981'
      case 'refund': return '#ef4444'
      case 'cancel': return '#f97316'
      case 'status_change': return '#3b82f6'
      case 'review_approve': return '#10b981'
      case 'review_reject': return '#ef4444'
      case 'review_delete': return '#f97316'
      case 'review_pending': return '#f59e0b'
      default: return '#6b7280'
    }
  }

  const getActionLabel = (actionType) => {
    switch(actionType) {
      case 'review_approve': return 'REVIEW APPROVED'
      case 'review_reject': return 'REVIEW REJECTED'
      case 'review_delete': return 'REVIEW DELETED'
      case 'review_pending': return 'REVIEW PENDING'
      default: return actionType.toUpperCase().replace(/_/g, ' ')
    }
  }

  const isReviewAction = (actionType) => {
    return actionType.startsWith('review_')
  }

  if (authLoading) {
    return (
      <div className="admin-orders-container">
        <LoadingSpinner message="Verifying admin access..." />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="admin-orders-container">
        <div className="error-message">Unauthorized - redirecting to login...</div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="admin-orders-container">
        <div className="error-message">Admin access required - this incident has been logged</div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="admin-orders-container">
        <LoadingSpinner message="Loading dashboard..." />
      </div>
    )
  }

  return (
    <div className="admin-orders-container">
      <h1>Admin Dashboard</h1>

      <div className="admin-nav-cards">
        <button className="admin-nav-card" onClick={() => navigate('/admin/orders')}>
          <div className="nav-card-icon">Orders</div>
          <div className="nav-card-title">Orders</div>
          <div className="nav-card-desc">Manage customer orders</div>
        </button>
        <button className="admin-nav-card" onClick={() => navigate('/admin/items')}>
          <div className="nav-card-icon">Items</div>
          <div className="nav-card-title">Items</div>
          <div className="nav-card-desc">Manage all items</div>
        </button>
        <button className="admin-nav-card" onClick={() => navigate('/admin/games')}>
          <div className="nav-card-icon">Games</div>
          <div className="nav-card-title">Games</div>
          <div className="nav-card-desc">Manage games</div>
        </button>
        <button className="admin-nav-card" onClick={() => navigate('/admin/reviews')}>
          <div className="nav-card-icon">Reviews</div>
          <div className="nav-card-title">Reviews</div>
          <div className="nav-card-desc">Moderate reviews</div>
        </button>
      </div>

      <h2 style={{ marginTop: '3rem' }}>Activity Logs</h2>

      <div className="dashboard-controls">
        <div className="date-filter">
          <label>Date Range:</label>
          <select value={dateRange} onChange={(e) => setDateRange(e.target.value)}>
            <option value="all">All Time</option>
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
            <option value="90days">Last 90 Days</option>
          </select>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="logs-section">
        {adminLogs.length === 0 ? (
          <p className="no-data">No admin activities recorded</p>
        ) : (
          <div className="logs-table-wrapper">
            <table className="logs-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Admin</th>
                  <th>Action</th>
                  <th>Order/Review ID</th>
                  <th>Status Change</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {adminLogs.map(log => (
                  <tr key={log.id}>
                    <td>{new Date(log.created_at).toLocaleString()}</td>
                    <td>
                      <span className="admin-name">
                        {log.admin_name || 'Unknown'}
                      </span>
                    </td>
                    <td>
                      <span 
                        className="action-badge"
                        style={{ backgroundColor: getActionColor(log.action_type) }}
                      >
                        {getActionLabel(log.action_type)}
                      </span>
                    </td>
                    <td className="order-id">
                      {isReviewAction(log.action_type) 
                        ? `Review: ${log.review_id?.substring(0, 8)}...`
                        : `Order: ${log.order_id?.substring(0, 8)}...`
                      }
                    </td>
                    <td className="status-change">
                      {log.old_status && log.new_status ? (
                        <>
                          <span className="old-status">{log.old_status}</span>
                          <span className="arrow">→</span>
                          <span className="new-status">{log.new_status}</span>
                        </>
                      ) : (
                        <span className="no-change">-</span>
                      )}
                    </td>
                    <td className="notes">{log.notes || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
