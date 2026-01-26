import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import './AdminOrdersPage.css'

export default function AdminDashboard() {
  const { user, isAdmin, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [adminStats, setAdminStats] = useState([])
  const [adminLogs, setAdminLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('stats') // 'stats' or 'logs'
  const [dateRange, setDateRange] = useState('all') // 'all', '7days', '30days', '90days'
  const [adminNames, setAdminNames] = useState({})

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
      
      // Fetch all admin users first
      const { data: adminUsersData, error: adminUsersError } = await supabase
        .from('admin_users')
        .select('user_id, id')

      if (adminUsersError) throw adminUsersError

      const adminUserIds = adminUsersData?.map(a => a.user_id) || []

      // Fetch admin names from customers table
      const { data: customersData, error: customersError } = await supabase
        .from('customers')
        .select('user_id, name, email')
        .in('user_id', adminUserIds)

      if (customersError) throw customersError

      const adminNamesTemp = {}
      customersData?.forEach(customer => {
        adminNamesTemp[customer.user_id] = customer.name || customer.email || 'Unknown'
      })
      setAdminNames(adminNamesTemp)

      // Fetch orders handled by admins
      let ordersQuery = supabase
        .from('orders')
        .select('id, admin_user_id, total_amount, currency, status, payment_status, items, created_at')
        .in('admin_user_id', adminUserIds)

      if (dayOffset) {
        const dateLimit = new Date()
        dateLimit.setDate(dateLimit.getDate() - dayOffset)
        ordersQuery = ordersQuery.gte('created_at', dateLimit.toISOString())
      }

      const { data: orders, error: ordersError } = await ordersQuery

      if (ordersError) throw ordersError

      // Fetch admin actions logs
      let logsQuery = supabase
        .from('admin_actions')
        .select('id, admin_user_id, action_type, order_id, old_status, new_status, notes, created_at')
        .order('created_at', { ascending: false })

      if (dayOffset) {
        const dateLimit = new Date()
        dateLimit.setDate(dateLimit.getDate() - dayOffset)
        logsQuery = logsQuery.gte('created_at', dateLimit.toISOString())
      }

      const { data: actions, error: actionsError } = await logsQuery

      if (actionsError) throw actionsError

      // Build admin stats from orders
      const stats = {}
      orders?.forEach(order => {
        const adminId = order.admin_user_id
        if (!adminId) return
        
        if (!stats[adminId]) {
          stats[adminId] = {
            adminId,
            servicesCount: 0,
            productsCount: 0,
            totalRevenue: 0,
            totalOrders: 0,
            currencies: {},
            completedOrders: 0,
            cancelledOrders: 0,
            refundedOrders: 0
          }
        }

        stats[adminId].totalOrders += 1
        stats[adminId].totalRevenue += order.total_amount || 0
        
        if (!stats[adminId].currencies[order.currency]) {
          stats[adminId].currencies[order.currency] = 0
        }
        stats[adminId].currencies[order.currency] += order.total_amount || 0

        // Count statuses
        if (order.status === 'completed') stats[adminId].completedOrders += 1
        if (order.status === 'cancelled') stats[adminId].cancelledOrders += 1
        if (order.payment_status === 'refunded') stats[adminId].refundedOrders += 1

        // Count services vs products from items
        const items = order.items || []
        items.forEach(item => {
          if (item.type === 'service') stats[adminId].servicesCount += item.quantity || 1
          else if (item.type === 'product') stats[adminId].productsCount += item.quantity || 1
        })
      })

      // Convert stats to array with names
      const statsArray = Object.values(stats).map(stat => ({
        ...stat,
        adminName: adminNamesTemp[stat.adminId] || 'Unknown Admin'
      }))

      setAdminStats(statsArray)
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
      <h1>Admin Dashboard</h1>

      <div className="dashboard-controls">
        <div className="tab-buttons">
          <button
            className={`tab-btn ${activeTab === 'stats' ? 'active' : ''}`}
            onClick={() => setActiveTab('stats')}
          >
            📊 Sales Stats
          </button>
          <button
            className={`tab-btn ${activeTab === 'logs' ? 'active' : ''}`}
            onClick={() => setActiveTab('logs')}
          >
            📋 Activity Logs
          </button>
        </div>

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

      {activeTab === 'stats' && (
        <div className="stats-section">
          <h2>Admin Sales Statistics</h2>
          {adminStats.length === 0 ? (
            <p className="no-data">No sales data available</p>
          ) : (
            <div className="stats-grid">
              {adminStats.map(stat => (
                <div key={stat.adminId} className="stat-card">
                  <h3>{stat.adminName}</h3>
                  <div className="stat-content">
                    <div className="stat-row">
                      <span className="stat-label">Total Orders:</span>
                      <span className="stat-value">{stat.totalOrders}</span>
                    </div>
                    <div className="stat-row">
                      <span className="stat-label">Completed:</span>
                      <span className="stat-value" style={{ color: '#10b981' }}>{stat.completedOrders}</span>
                    </div>
                    <div className="stat-row">
                      <span className="stat-label">Cancelled:</span>
                      <span className="stat-value" style={{ color: '#f97316' }}>{stat.cancelledOrders}</span>
                    </div>
                    <div className="stat-row">
                      <span className="stat-label">Refunded:</span>
                      <span className="stat-value" style={{ color: '#ef4444' }}>{stat.refundedOrders}</span>
                    </div>
                    <hr style={{ margin: '12px 0', opacity: 0.2 }} />
                    <div className="stat-row">
                      <span className="stat-label">Services Sold:</span>
                      <span className="stat-value">{stat.servicesCount}</span>
                    </div>
                    <div className="stat-row">
                      <span className="stat-label">Products Sold:</span>
                      <span className="stat-value">{stat.productsCount}</span>
                    </div>
                    <hr style={{ margin: '12px 0', opacity: 0.2 }} />
                    <div className="stat-row revenue">
                      <span className="stat-label">Total Revenue:</span>
                      <div className="currency-breakdown">
                        {Object.entries(stat.currencies).map(([currency, amount]) => (
                          <div key={currency} className="currency-item">
                            <span className="amount">{amount.toFixed(2)}</span>
                            <span className="currency">{currency}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'logs' && (
        <div className="logs-section">
          <h2>Admin Activity Logs</h2>
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
                          {adminNames[log.admin_user_id] || 'Unknown'}
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
      )}
    </div>
  )
}
