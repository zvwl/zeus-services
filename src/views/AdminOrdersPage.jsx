'use client'

import { useState, useEffect, useCallback, Fragment } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase, isDevBypassActive, getAuthToken } from '@/lib/supabase/client'
import LoadingSpinner from '@/components/LoadingSpinner'
import './AdminOrdersPage.css'

export default function AdminOrdersPage() {
  useEffect(() => {
    document.title = 'Admin Orders | zeuservices'
    let robotsMeta = document.querySelector('meta[name="robots"]')
    if (!robotsMeta) {
      robotsMeta = document.createElement('meta')
      robotsMeta.setAttribute('name', 'robots')
      document.head.appendChild(robotsMeta)
    }
    robotsMeta.setAttribute('content', 'noindex, nofollow')
  }, [])

  const { user } = useAuth()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchDebounced, setSearchDebounced] = useState('')
  const [sortOrder, setSortOrder] = useState('newest')
  const [updatingOrderId, setUpdatingOrderId] = useState(null)
  const [adminNotes, setAdminNotes] = useState({})
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, orderId: null, action: null, orderInfo: null })
  const [copiedId, setCopiedId] = useState(null)
  const [expandedRows, setExpandedRows] = useState(new Set())
  const [magicLinkSending, setMagicLinkSending] = useState(null)
  const [magicLinkResult, setMagicLinkResult] = useState({})

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 1500)
    })
  }

  const toggleRow = (id) => {
    setExpandedRows(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const sendMagicLink = async (order) => {
    setMagicLinkSending(order.id)
    setMagicLinkResult(prev => ({ ...prev, [order.id]: null }))
    try {
      if (isDevBypassActive) {
        const devKey = process.env.NEXT_PUBLIC_DEV_SUPABASE_SERVICE_ROLE_KEY
        const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/admin/generate_link`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: devKey,
            Authorization: `Bearer ${devKey}`
          },
          body: JSON.stringify({ type: 'magiclink', email: order.customer_email })
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.msg || data.error || 'Failed to generate link')
        const link = data.properties?.action_link
        setMagicLinkResult(prev => ({
          ...prev,
          [order.id]: { success: true, link, message: 'Dev mode: copy and open this link manually (no email sent)' }
        }))
        return
      }
      const accessToken = await getAuthToken()
      const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send-magic-link`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {})
        },
        body: JSON.stringify({ email: order.customer_email })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to send magic link')
      setMagicLinkResult(prev => ({
        ...prev,
        [order.id]: { success: true, message: `Magic link sent to ${order.customer_email}` }
      }))
    } catch (err) {
      setMagicLinkResult(prev => ({ ...prev, [order.id]: { success: false, message: err.message } }))
    } finally {
      setMagicLinkSending(null)
    }
  }

  const openRefundConfirmation = (order) => {
    setConfirmDialog({ isOpen: true, orderId: order.id, action: 'refund', orderInfo: order })
  }

  const handleRefundOrder = async (orderId) => {
    setUpdatingOrderId(orderId)
    setError('')
    setConfirmDialog({ isOpen: false, orderId: null, action: null, orderInfo: null })
    try {
      const currentOrder = orders.find(o => o.id === orderId)
      const oldStatus = currentOrder?.status
      const oldPaymentStatus = currentOrder?.payment_status
      const accessToken = await getAuthToken()
      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/refund-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {})
        },
        body: JSON.stringify({ orderId })
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Refund failed')
      await logAdminAction(orderId, 'refund', oldStatus, 'cancelled', adminNotes[orderId] || `Refunded from ${oldPaymentStatus}`)
      setAdminNotes(prev => ({ ...prev, [orderId]: '' }))
      setOrders(orders.map(order =>
        order.id === orderId ? { ...order, status: 'cancelled', payment_status: 'refunded' } : order
      ))
      try {
        const emailResponse = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send-order-refunded`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {})
          },
          body: JSON.stringify({ orderId })
        })
        if (!emailResponse.ok) console.error('Failed to send refund email')
      } catch (emailErr) {
        console.error('Email send error:', emailErr)
      }
    } catch (err) {
      setError('Refund error: ' + err.message)
    } finally {
      setUpdatingOrderId(null)
    }
  }

  const openCancelConfirmation = (order) => {
    setConfirmDialog({ isOpen: true, orderId: order.id, action: 'cancel', orderInfo: order })
  }

  const handleCancelOrder = async (orderId) => {
    setConfirmDialog({ isOpen: false, orderId: null, action: null, orderInfo: null })
    const currentOrder = orders.find(o => o.id === orderId)
    const oldStatus = currentOrder?.status
    await logAdminAction(orderId, 'cancel', oldStatus, 'cancelled', adminNotes[orderId] || 'Cancelled without refund')
    setAdminNotes(prev => ({ ...prev, [orderId]: '' }))
    await updateOrderStatus(orderId, 'cancelled')
    try {
      const accessToken = await getAuthToken()
      const emailResponse = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send-order-cancelled`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {})
        },
        body: JSON.stringify({ orderId })
      })
      if (!emailResponse.ok) console.error('Failed to send cancellation email')
    } catch (emailErr) {
      console.error('Email send error:', emailErr)
    }
  }

  useEffect(() => { checkAdminStatus() }, [user])

  const checkAdminStatus = async () => {
    if (isDevBypassActive) {
      setIsAdmin(true)
      fetchOrders()
      return
    }
    if (!user?.id) {
      setError('Please log in')
      setLoading(false)
      return
    }
    try {
      const { data, error } = await supabase
        .from('admin_users').select('*').eq('user_id', user.id).single()
      if (error || !data) {
        setError('Access denied. Admin privileges required.')
        setIsAdmin(false)
        setLoading(false)
        return
      }
      setIsAdmin(true)
      fetchOrders()
    } catch (_err) {
      setError('Error checking admin status')
      setLoading(false)
    }
  }

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    try {
      if (isDevBypassActive) {
        let query = supabase.from('orders').select('*').order('created_at', { ascending: false })
        if (statusFilter !== 'all') {
          if (statusFilter === 'paid') query = query.eq('payment_status', 'paid')
          else query = query.eq('status', statusFilter)
        }
        if (searchDebounced.trim()) {
          const q = searchDebounced.trim()
          query = query.or(`id.ilike.%${q}%,customer_email.ilike.%${q}%`)
        }
        const { data, error } = await query
        if (error) throw error
        setOrders(data || [])
        setError('')
        return
      }

      const accessToken = await getAuthToken()
      if (!accessToken) { setError('Please log in'); setLoading(false); return }

      const params = new URLSearchParams()
      params.set('status', statusFilter)
      if (searchDebounced.trim()) params.set('q', searchDebounced.trim())

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/get-admin-orders?${params.toString()}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
            Authorization: `Bearer ${accessToken}`
          }
        }
      )
      const body = await res.json()
      if (res.status === 403) { setIsAdmin(false); setError('Access denied.'); setLoading(false); return }
      if (!res.ok || body?.error) throw new Error(body?.error || 'Failed to load orders')
      setOrders(body.orders || [])
      setError('')
    } catch (err) {
      setError('Error loading orders: ' + err.message)
    } finally {
      setLoading(false)
    }
  }, [statusFilter, searchDebounced])

  useEffect(() => { if (isAdmin) fetchOrders() }, [isAdmin, fetchOrders])

  useEffect(() => {
    if (!isAdmin) return
    const channel = supabase
      .channel('admin_orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => { fetchOrders() })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [isAdmin, fetchOrders])

  useEffect(() => {
    const t = setTimeout(() => setSearchDebounced(searchQuery), 350)
    return () => clearTimeout(t)
  }, [searchQuery])

  const updateOrderStatus = async (orderId, newStatus) => {
    setUpdatingOrderId(orderId)
    try {
      const currentOrder = orders.find(o => o.id === orderId)
      const oldStatus = currentOrder?.status
      const { error } = await supabase.from('orders').update({ status: newStatus }).eq('id', orderId)
      if (error) throw error
      await logAdminAction(orderId, 'status_change', oldStatus, newStatus, adminNotes[orderId] || null)
      setAdminNotes(prev => ({ ...prev, [orderId]: '' }))
      if (newStatus === 'completed' && oldStatus !== 'completed') {
        sendOrderCompleteEmail(orderId).catch(err => console.error('Failed to send completion email:', err))
      }
      setOrders(orders.map(order => order.id === orderId ? { ...order, status: newStatus } : order))
    } catch (err) {
      setError('Error updating order: ' + err.message)
    } finally {
      setUpdatingOrderId(null)
    }
  }

  const sendOrderCompleteEmail = async (orderId) => {
    const accessToken = await getAuthToken()
    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send-order-complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {})
      },
      body: JSON.stringify({ orderId })
    })
    if (!response.ok) {
      const body = await response.json().catch(() => ({}))
      throw new Error(body?.error || 'Failed to send order completion email')
    }
  }

  const logAdminAction = async (orderId, actionType, oldStatus, newStatus, notes = null) => {
    try {
      const { error } = await supabase.from('admin_actions').insert([{
        admin_user_id: user?.id || 'dev-admin-bypass',
        action_type: actionType,
        order_id: orderId,
        old_status: oldStatus || null,
        new_status: newStatus || null,
        notes: notes || null
      }])
      if (error) console.error('Failed to log admin action:', error)
    } catch (err) {
      console.error('Error logging admin action:', err)
    }
  }

  const formatCurrency = (amount, currency) => {
    return new Intl.NumberFormat('en-GB', { style: 'currency', currency: currency || 'GBP' }).format(amount)
  }

  const getItemUnitPrice = (item) => {
    if (typeof item?.price_converted === 'number') return item.price_converted
    if (typeof item?.price_usd === 'number') return item.price_usd
    return Number(item?.price_converted ?? item?.price_usd ?? 0)
  }

  const getOrderTotals = (order) => {
    const currency = order?.currency || 'GBP'
    const subtotal = (order?.items || []).reduce((sum, item) => {
      return sum + (item?.quantity ?? 1) * getItemUnitPrice(item)
    }, 0)
    const recordedTotal = typeof order?.total_amount === 'number' ? order.total_amount : subtotal
    return { currency, subtotal, recordedTotal }
  }

  const getItemSummary = (order) => {
    const items = order.items || []
    if (items.length === 0) return '—'
    if (items.length === 1) {
      const item = items[0]
      const qty = item.quantity || 1
      return qty > 1 ? `${qty}× ${item.name}` : item.name
    }
    const first = items[0]?.name || ''
    return `${items.length} items${first ? ` — ${first}…` : ''}`
  }

  const formatShortDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-GB', {
      day: '2-digit', month: 'short', year: '2-digit',
      hour: '2-digit', minute: '2-digit', hour12: false
    })
  }

  if (loading) {
    return (
      <section className="section admin-section">
        <div className="admin-container">
          <LoadingSpinner message="Loading orders..." />
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

  const sortedOrders = [...orders].sort((a, b) => {
    const dateA = new Date(a.created_at).getTime()
    const dateB = new Date(b.created_at).getTime()
    return sortOrder === 'newest' ? dateB - dateA : dateA - dateB
  })

  return (
    <section className="section admin-section">
      <div className="admin-container">
        <div className="admin-header">
          <h1>Order Management</h1>
          <p>View and manage customer orders</p>
        </div>

        <div className="filter-bar">
          <label htmlFor="statusFilter">Status:</label>
          <select id="statusFilter" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="filter-select">
            <option value="all">All Orders</option>
            <option value="created">Created</option>
            <option value="pending">Pending Payment</option>
            <option value="paid">Paid</option>
            <option value="processing">Processing</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <label htmlFor="sortOrder">Sort:</label>
          <select id="sortOrder" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} className="filter-select">
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
          </select>
          <input
            type="text"
            name="orders_search"
            className="search-input"
            placeholder="Search by email or order ID…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') setSearchDebounced(searchQuery) }}
          />
          {searchQuery && (
            <button type="button" className="clear-search-btn" onClick={() => { setSearchQuery(''); setSearchDebounced('') }}>
              Clear
            </button>
          )}
          <span className="order-count">{orders.length} orders</span>
        </div>

        {error && <div className="error-message">{error}</div>}

        {orders.length > 0 && (() => {
          const gbpOrders = orders.filter(o => (o.currency || 'GBP') === 'GBP' && o.payment_status !== 'refunded')
          const totalRevenue = gbpOrders.reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0)
          const completedCount = orders.filter(o => o.status === 'completed').length
          const pendingCount = orders.filter(o => ['pending', 'processing', 'paid'].includes(o.status)).length
          return (
            <div className="orders-summary-bar">
              <div className="osb-item">
                <span className="osb-label">Showing</span>
                <span className="osb-value">{orders.length}</span>
              </div>
              <div className="osb-divider" />
              <div className="osb-item">
                <span className="osb-label">Completed</span>
                <span className="osb-value" style={{ color: '#10b981' }}>{completedCount}</span>
              </div>
              <div className="osb-divider" />
              <div className="osb-item">
                <span className="osb-label">Needs Action</span>
                <span className="osb-value" style={{ color: pendingCount > 0 ? '#fbbf24' : '#10b981' }}>{pendingCount}</span>
              </div>
              <div className="osb-divider" />
              <div className="osb-item">
                <span className="osb-label">GBP Revenue</span>
                <span className="osb-value" style={{ color: '#10b981' }}>£{totalRevenue.toFixed(2)}</span>
              </div>
            </div>
          )
        })()}

        {orders.length === 0 ? (
          <div className="no-orders"><p>No orders found</p></div>
        ) : (
          <div className="orders-table-wrapper">
            <table className="orders-table">
              <thead>
                <tr>
                  <th className="col-id">Order ID</th>
                  <th className="col-customer">Customer</th>
                  <th className="col-items">Items</th>
                  <th className="col-total">Total</th>
                  <th className="col-status">Status</th>
                  <th className="col-payment">Payment</th>
                  <th className="col-date">Date</th>
                  <th className="col-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedOrders.map(order => {
                  const isExpanded = expandedRows.has(order.id)
                  const { currency, subtotal, recordedTotal } = getOrderTotals(order)
                  const mlResult = magicLinkResult[order.id]

                  return (
                    <Fragment key={order.id}>
                      <tr
                        className={`order-row${isExpanded ? ' row-expanded' : ''}`}
                        onClick={() => toggleRow(order.id)}
                      >
                        <td className="col-id">
                          <button
                            className="copy-id-btn"
                            title="Copy full order ID"
                            onClick={(e) => { e.stopPropagation(); copyToClipboard(order.id, order.id) }}
                          >
                            <span className="order-id-text">{order.id.slice(0, 8)}…</span>
                            <span className="copy-icon">{copiedId === order.id ? '✓' : '⎘'}</span>
                          </button>
                        </td>
                        <td className="col-customer">
                          <div className="customer-cell">
                            {order.customer_name && <span className="customer-name">{order.customer_name}</span>}
                            <span className="customer-email">{order.customer_email || '—'}</span>
                          </div>
                        </td>
                        <td className="col-items">
                          <span className="items-summary">{getItemSummary(order)}</span>
                        </td>
                        <td className="col-total">
                          <span className="order-total-amount">{formatCurrency(recordedTotal, currency)}</span>
                        </td>
                        <td className="col-status">
                          <span className={`status-badge status-${order.status}`}>{order.status}</span>
                        </td>
                        <td className="col-payment">
                          <span className={`payment-badge payment-${order.payment_status || 'default'}`}>
                            {order.payment_status || '—'}
                          </span>
                        </td>
                        <td className="col-date">
                          <span className="order-date-text">{formatShortDate(order.created_at)}</span>
                        </td>
                        <td className="col-actions" onClick={(e) => e.stopPropagation()}>
                          <div className="row-actions">
                            {order.status !== 'completed' && order.status !== 'cancelled' && order.payment_status !== 'refunded' && (
                              <button
                                className="btn-complete-inline"
                                onClick={() => updateOrderStatus(order.id, 'completed')}
                                disabled={updatingOrderId === order.id}
                                title="Mark complete & notify customer"
                              >
                                {updatingOrderId === order.id ? '…' : '✓'}
                              </button>
                            )}
                            <button
                              className="btn-expand-row"
                              onClick={() => toggleRow(order.id)}
                              title={isExpanded ? 'Collapse' : 'Expand details'}
                            >
                              {isExpanded ? '▲' : '▼'}
                            </button>
                          </div>
                        </td>
                      </tr>

                      {isExpanded && (
                        <tr className="expanded-row">
                          <td colSpan={8}>
                            <div className="order-detail-panel">
                              <div className="detail-panel-section">
                                <h4>Items</h4>
                                <ul className="items-list">
                                  {(order.items || []).map((item, idx) => (
                                    <li key={idx}>
                                      <div className="item-row-detail">
                                        <span className="item-name-detail">{item.name}</span>
                                        <span className="item-qty-detail">×{item.quantity ?? 1}</span>
                                        <span className="item-price-detail">
                                          {formatCurrency(getItemUnitPrice(item) * (item.quantity ?? 1), currency)}
                                        </span>
                                      </div>
                                      {item.customSelections && Object.keys(item.customSelections).length > 0 ? (
                                        <div className="item-selections">
                                          {Object.entries(item.customSelections)
                                            .filter(([, v]) => Boolean(v))
                                            .map(([k, v]) => `${k}: ${v}`)
                                            .join(' • ')}
                                        </div>
                                      ) : (item.platform || item.version) ? (
                                        <div className="item-selections">
                                          {[
                                            item.platform && `Platform: ${item.platform}`,
                                            item.version && `Version: ${item.version}`
                                          ].filter(Boolean).join(' • ')}
                                        </div>
                                      ) : null}
                                    </li>
                                  ))}
                                </ul>
                                <div className="order-total-row">
                                  <span>Order Total</span>
                                  <strong>{formatCurrency(recordedTotal, currency)}</strong>
                                </div>
                                {Math.abs(recordedTotal - subtotal) > 0.01 && (
                                  <div className="order-total-row" style={{ opacity: 0.6, fontSize: '0.8rem' }}>
                                    <span>Items subtotal</span>
                                    <span>{formatCurrency(subtotal, currency)}</span>
                                  </div>
                                )}
                                {(order.note_plaintext || order.notes) && (
                                  <div className="customer-notes-section">
                                    <h4>Customer Notes</h4>
                                    <p>{order.note_plaintext || order.notes}</p>
                                  </div>
                                )}
                              </div>

                              <div className="detail-panel-section">
                                <h4>Manage Order</h4>
                                <div className="admin-notes-area">
                                  <label htmlFor={`notes-${order.id}`}>Admin Notes (logged with action)</label>
                                  <textarea
                                    id={`notes-${order.id}`}
                                    value={adminNotes[order.id] || ''}
                                    onChange={(e) => setAdminNotes(prev => ({ ...prev, [order.id]: e.target.value }))}
                                    placeholder="Optional notes — saved with the action to Activity Logs"
                                    className="admin-notes-input"
                                  />
                                </div>
                                <div className="detail-action-btns">
                                  <label>Update Status</label>
                                  <select
                                    className="status-select"
                                    value={order.status === 'cancelled' ? 'cancelled' : order.status}
                                    onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                                    disabled={updatingOrderId === order.id || order.payment_status === 'refunded' || order.status === 'cancelled'}
                                  >
                                    <option value="created">Created</option>
                                    <option value="pending">Pending Payment</option>
                                    <option value="processing">Processing</option>
                                    <option value="completed">Completed</option>
                                    {order.status === 'cancelled' && <option value="cancelled">Cancelled</option>}
                                  </select>
                                  <button
                                    className="btn-refund"
                                    onClick={() => openRefundConfirmation(order)}
                                    disabled={order.status === 'cancelled' || order.payment_status === 'refunded' || updatingOrderId === order.id}
                                    title={order.payment_status === 'refunded' ? 'Already refunded' : 'Cancel and issue Stripe refund'}
                                  >
                                    {order.payment_status === 'refunded' ? 'Already Refunded' : 'Cancel & Refund'}
                                  </button>
                                  {order.status !== 'cancelled' && order.payment_status !== 'refunded' && (
                                    <button
                                      className="btn-cancel-only-detail"
                                      onClick={() => openCancelConfirmation(order)}
                                      disabled={updatingOrderId === order.id}
                                    >
                                      Cancel Only (no refund)
                                    </button>
                                  )}
                                  <button
                                    className="btn-magic-link"
                                    onClick={() => sendMagicLink(order)}
                                    disabled={magicLinkSending === order.id || !order.customer_email}
                                    title={!order.customer_email ? 'No email on record' : `Send one-click login to ${order.customer_email}`}
                                  >
                                    {magicLinkSending === order.id ? 'Sending…' : '✉ Send Magic Link'}
                                  </button>
                                  {mlResult && (
                                    <div className={`magic-link-result ${mlResult.success ? 'success' : 'error'}`}>
                                      <div>{mlResult.message}</div>
                                      {mlResult.link && (
                                        <>
                                          <div className="magic-link-url">{mlResult.link}</div>
                                          <button
                                            className="magic-link-copy-btn"
                                            onClick={() => copyToClipboard(mlResult.link, 'ml-' + order.id)}
                                          >
                                            {copiedId === 'ml-' + order.id ? '✓ Copied' : 'Copy Link'}
                                          </button>
                                        </>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {confirmDialog.isOpen && (
        <div className="modal-overlay" onClick={() => setConfirmDialog({ isOpen: false, orderId: null, action: null, orderInfo: null })}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Confirm Action</h2>
            <div className="modal-body">
              <p>Are you sure you want to {confirmDialog.action === 'refund' ? 'cancel and refund' : 'cancel'} this order?</p>
              <div className="order-summary">
                <p><strong>Order ID:</strong> {confirmDialog.orderInfo?.id.slice(0, 12)}…</p>
                <p><strong>Customer:</strong> {confirmDialog.orderInfo?.customer_email || 'Unknown'}</p>
                <p><strong>Name:</strong> {confirmDialog.orderInfo?.customer_name || 'Not provided'}</p>
                <p><strong>Total:</strong> {formatCurrency(confirmDialog.orderInfo?.total_amount, confirmDialog.orderInfo?.currency)}</p>
              </div>
              {confirmDialog.action === 'refund' && (
                <p className="refund-warning">This will issue a refund to the customer's original payment method.</p>
              )}
              {confirmDialog.action === 'cancel' && (
                <p className="cancel-warning">This will cancel the order WITHOUT refunding the customer.</p>
              )}
            </div>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setConfirmDialog({ isOpen: false, orderId: null, action: null, orderInfo: null })}>
                No, Keep Order
              </button>
              <button
                className={`btn-confirm ${confirmDialog.action}`}
                onClick={() => {
                  if (confirmDialog.action === 'refund') handleRefundOrder(confirmDialog.orderId)
                  else if (confirmDialog.action === 'cancel') handleCancelOrder(confirmDialog.orderId)
                }}
              >
                Yes, {confirmDialog.action === 'refund' ? 'Cancel & Refund' : 'Cancel Only'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
