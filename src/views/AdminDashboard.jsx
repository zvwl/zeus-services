'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { Package, Clock, Star, TrendingUp, Gamepad2, Joystick, ShoppingCart, DollarSign } from 'lucide-react'
import LoadingSpinner from '@/components/LoadingSpinner'
import './AdminOrdersPage.css'

export default function AdminDashboard() {
  const { user, isAdmin, loading: authLoading } = useAuth()
  const router = useRouter()
  const [adminLogs, setAdminLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [dateRange, setDateRange] = useState('30days')
  const [actionTypeFilter, setActionTypeFilter] = useState('all')
  const [stats, setStats] = useState({
    pendingReviews: null,
    pendingOrders: null,
    todayOrders: null,
    monthRevenue: null,
  })

  useEffect(() => {
    fetchDashboardData()
  }, [dateRange])

  const getDayOffset = () => {
    switch (dateRange) {
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

      let logsQuery = supabase
        .from('admin_actions_with_names')
        .select('id, admin_user_id, admin_name, action_type, order_id, review_id, old_status, new_status, notes, created_at')
        .order('created_at', { ascending: false })
        .limit(200)

      if (dayOffset) {
        const dateLimit = new Date()
        dateLimit.setDate(dateLimit.getDate() - dayOffset)
        logsQuery = logsQuery.gte('created_at', dateLimit.toISOString())
      }

      const now = new Date()
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

      const [
        { data: actions, error: actionsError },
        { count: pendingReviews },
        pendingOrdersResult,
        todayOrdersResult,
        monthOrdersResult,
      ] = await Promise.all([
        logsQuery,
        supabase.from('reviews').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('orders').select('id', { count: 'exact', head: true }).in('status', ['pending', 'processing', 'paid']),
        supabase.from('orders').select('id', { count: 'exact', head: true }).gte('created_at', startOfToday),
        supabase.from('orders').select('total_amount, currency').gte('created_at', startOfMonth).neq('payment_status', 'refunded'),
      ])

      if (actionsError) throw actionsError

      setAdminLogs(actions || [])

      let monthRevenue = null
      if (monthOrdersResult.data) {
        monthRevenue = monthOrdersResult.data
          .filter(o => o.currency === 'GBP' || !o.currency)
          .reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0)
      }

      setStats({
        pendingReviews: pendingReviews ?? null,
        pendingOrders: pendingOrdersResult.count ?? null,
        todayOrders: todayOrdersResult.count ?? null,
        monthRevenue,
      })
    } catch (err) {
      console.error('Dashboard fetch error:', err)
      setError(err.message || 'Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const getActionColor = (actionType) => {
    switch (actionType) {
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
    switch (actionType) {
      case 'complete': return 'Completed'
      case 'refund': return 'Refunded'
      case 'cancel': return 'Cancelled'
      case 'status_change': return 'Status Change'
      case 'review_approve': return 'Review Approved'
      case 'review_reject': return 'Review Rejected'
      case 'review_delete': return 'Review Deleted'
      case 'review_pending': return 'Review Pending'
      default: return actionType.replace(/_/g, ' ')
    }
  }

  const isReviewAction = (actionType) => actionType.startsWith('review_')

  const filteredLogs = actionTypeFilter === 'all'
    ? adminLogs
    : adminLogs.filter(log => log.action_type === actionTypeFilter)

  if (authLoading || loading) {
    return (
      <div className="admin-orders-container">
        <LoadingSpinner message={authLoading ? 'Verifying admin access...' : 'Loading dashboard...'} />
      </div>
    )
  }

  if (!user || !isAdmin) {
    return (
      <div className="admin-orders-container">
        <div className="error-message">{!user ? 'Unauthorized – please log in.' : 'Admin access required.'}</div>
      </div>
    )
  }

  const navItems = [
    {
      path: '/admin/orders',
      title: 'Orders',
      desc: 'Manage customer orders',
      Icon: ShoppingCart,
      stat: stats.pendingOrders !== null ? `${stats.pendingOrders} awaiting action` : null,
      statColor: stats.pendingOrders > 0 ? '#fbbf24' : '#10b981',
    },
    {
      path: '/admin/items',
      title: 'Items',
      desc: 'Add, edit and manage items',
      Icon: Gamepad2,
      stat: null,
    },
    {
      path: '/admin/games',
      title: 'Games',
      desc: 'Manage games & display order',
      Icon: Joystick,
      stat: null,
    },
    {
      path: '/admin/reviews',
      title: 'Reviews',
      desc: 'Moderate customer reviews',
      Icon: Star,
      stat: stats.pendingReviews !== null ? `${stats.pendingReviews} pending` : null,
      statColor: stats.pendingReviews > 0 ? '#f97316' : '#10b981',
    },
    {
      path: '/admin/eldorado',
      title: 'Eldorado',
      desc: 'Manage sellers, orders & offers',
      Icon: DollarSign,
      stat: null,
    },
  ]

  return (
    <div className="admin-orders-container">
      <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#fbbf24', marginBottom: '0.25rem' }}>
        Admin Dashboard
      </h1>
      <p style={{ color: '#64748b', marginBottom: '2rem', fontSize: '0.95rem' }}>
        Welcome back. Here's what's happening.
      </p>

      {/* Stats Cards */}
      <div className="dashboard-stats-grid">
        <div className="dashboard-stat-card">
          <div className="dsc-icon"><Package size={28} strokeWidth={1.8} color="#fbbf24" /></div>
          <div className="dsc-content">
            <div className="dsc-label">Orders Today</div>
            <div className="dsc-value">{stats.todayOrders !== null ? stats.todayOrders : '—'}</div>
          </div>
        </div>
        <div
          className="dashboard-stat-card clickable"
          onClick={() => router.push('/admin/orders?status=pending')}
          title="View pending orders"
        >
          <div className="dsc-icon"><Clock size={28} strokeWidth={1.8} color="#fbbf24" /></div>
          <div className="dsc-content">
            <div className="dsc-label">Pending Orders</div>
            <div className="dsc-value" style={{ color: stats.pendingOrders > 0 ? '#fbbf24' : '#10b981' }}>
              {stats.pendingOrders !== null ? stats.pendingOrders : '—'}
            </div>
          </div>
        </div>
        <div
          className="dashboard-stat-card clickable"
          onClick={() => router.push('/admin/reviews')}
          title="View pending reviews"
        >
          <div className="dsc-icon"><Star size={28} strokeWidth={1.8} color="#f97316" /></div>
          <div className="dsc-content">
            <div className="dsc-label">Pending Reviews</div>
            <div className="dsc-value" style={{ color: stats.pendingReviews > 0 ? '#f97316' : '#10b981' }}>
              {stats.pendingReviews !== null ? stats.pendingReviews : '—'}
            </div>
          </div>
        </div>
        <div className="dashboard-stat-card">
          <div className="dsc-icon"><TrendingUp size={28} strokeWidth={1.8} color="#10b981" /></div>
          <div className="dsc-content">
            <div className="dsc-label">Revenue This Month (GBP)</div>
            <div className="dsc-value" style={{ color: '#10b981' }}>
              {stats.monthRevenue !== null ? `£${stats.monthRevenue.toFixed(2)}` : '—'}
            </div>
          </div>
        </div>
      </div>

      {/* Nav Cards */}
      <div className="admin-nav-cards">
        {navItems.map(item => (
          <button key={item.path} className="admin-nav-card" onClick={() => router.push(item.path)}>
            <div className="nav-card-icon"><item.Icon size={32} strokeWidth={1.5} /></div>
            <div className="nav-card-title">{item.title}</div>
            <div className="nav-card-desc">{item.desc}</div>
            {item.stat && (
              <div className="nav-card-stat" style={{ color: item.statColor || '#94a3b8' }}>
                {item.stat}
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Activity Logs */}
      <h2 style={{ marginTop: '3rem', marginBottom: '1rem', fontSize: '1.4rem', color: '#f8fafc' }}>
        Activity Logs
      </h2>

      <div className="dashboard-controls">
        <div className="date-filter">
          <label>Date Range:</label>
          <select name="date_range" value={dateRange} onChange={(e) => setDateRange(e.target.value)}>
            <option value="all">All Time</option>
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
            <option value="90days">Last 90 Days</option>
          </select>
        </div>
        <div className="date-filter">
          <label>Action Type:</label>
          <select name="action_type_filter" value={actionTypeFilter} onChange={(e) => setActionTypeFilter(e.target.value)}>
            <option value="all">All Actions</option>
            <option value="complete">Completed</option>
            <option value="refund">Refunded</option>
            <option value="cancel">Cancelled</option>
            <option value="status_change">Status Change</option>
            <option value="review_approve">Review Approved</option>
            <option value="review_reject">Review Rejected</option>
            <option value="review_delete">Review Deleted</option>
            <option value="review_pending">Review Pending</option>
          </select>
        </div>
        <span style={{ marginLeft: 'auto', color: '#94a3b8', fontWeight: 600, fontSize: '0.9rem' }}>
          {filteredLogs.length} {filteredLogs.length === 1 ? 'entry' : 'entries'}
        </span>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="logs-section">
        {filteredLogs.length === 0 ? (
          <p className="no-data">No admin activities recorded for this period</p>
        ) : (
          <div className="logs-table-wrapper">
            <table className="logs-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Admin</th>
                  <th>Action</th>
                  <th>Order / Review ID</th>
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
                    <td>
                      <span className="admin-name">{log.admin_name || 'Unknown'}</span>
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
      </div>
    </div>
  )
}
