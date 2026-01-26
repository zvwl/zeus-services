import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import './AdminOrdersPage.css'

export default function AdminDashboard() {
  const { user, isAdmin, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [adminLogs, setAdminLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [dateRange, setDateRange] = useState('all') // 'all', '7days', '30days', '90days'

  // FIRST: Check if user is authenticated and is admin
  useEffect(() => {
    if (authLoading) return // Still checking auth status
    
    // Not authenticated
    if (!user) {
      setError('Please log in to access this page')
      navigate('/login')
      return
    }
    
    // Not admin
    if (!isAdmin) {
      setError('Admin access required - this incident will be logged')
      console.warn(`Non-admin user ${user.id} (${user.email}) attempted to access admin dashboard`)
      setLoading(false)
      // Redirect after a short delay
      setTimeout(() => navigate('/'), 2000)
      return
    }
    
    // User is authenticated and is admin - fetch data
    fetchDashboardData()
  }, [isAdmin, authLoading, user, navigate])

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
        .select('id, admin_user_id, admin_name, action_type, order_id, old_status, new_status, notes, created_at')
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
      default: return '#6b7280'
    }
  }

  if (authLoading) {
    return (
      <div className="admin-orders-container">
        <div className="loading">Verifying admin access...</div>
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
        <div className="error-message">❌ Admin access required - this incident has been logged</div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="admin-orders-container">
        <div className="loading">Loading dashboard...</div>
      </div>
    )
  }

  return (
    <div className="admin-orders-container">
      <h1>Activity Logs</h1>

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
                  <th>Order ID</th>
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
                        {log.action_type.toUpperCase()}
                      </span>
                    </td>
                    <td className="order-id">{log.order_id.substring(0, 8)}...</td>
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
