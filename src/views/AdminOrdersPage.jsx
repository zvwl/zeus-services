'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase/client'
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
  const [sortOrder, setSortOrder] = useState('newest') // newest, oldest
  const [updatingOrderId, setUpdatingOrderId] = useState(null)
  const [adminNotes, setAdminNotes] = useState({}) // State for admin notes per order
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    orderId: null,
    action: null, // 'refund' or 'cancel'
    orderInfo: null
  })

  // Show confirmation dialog for refund
  const openRefundConfirmation = (order) => {
    setConfirmDialog({
      isOpen: true,
      orderId: order.id,
      action: 'refund',
      orderInfo: order
    });
  };

  // Refund handler (after confirmation)
  const handleRefundOrder = async (orderId) => {
    setUpdatingOrderId(orderId);
    setError('');
    setConfirmDialog({ isOpen: false, orderId: null, action: null, orderInfo: null });
    try {
      // Get the current order for logging
      const currentOrder = orders.find(o => o.id === orderId)
      const oldStatus = currentOrder?.status
      const oldPaymentStatus = currentOrder?.payment_status
      
      // Get the current session access token
      const session = await supabase.auth.getSession();
      const accessToken = session?.data?.session?.access_token;
      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/refund-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({ orderId }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Refund failed');
      
      // Log admin action for refund
      await logAdminAction(orderId, 'refund', oldStatus, 'cancelled', adminNotes[orderId] || `Refunded from ${oldPaymentStatus}`)
      
      // Clear notes after logging
      setAdminNotes(prev => ({ ...prev, [orderId]: '' }))
      
      // Update local state
      setOrders(orders.map(order =>
        order.id === orderId
          ? { ...order, status: 'cancelled', payment_status: 'refunded' }
          : order
      ))

      // Send refund email to customer
      try {
        const emailResponse = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send-order-refunded`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {}),
          },
          body: JSON.stringify({ orderId }),
        });
        if (!emailResponse.ok) {
          console.error('Failed to send refund email');
        }
      } catch (emailErr) {
        console.error('Email send error:', emailErr);
        // Don't fail the whole operation if email fails
      }
    } catch (err) {
      setError('Refund error: ' + err.message);
    } finally {
      setUpdatingOrderId(null);
    }
  };

  // Show confirmation dialog for cancel without refund
  const openCancelConfirmation = (order) => {
    setConfirmDialog({
      isOpen: true,
      orderId: order.id,
      action: 'cancel',
      orderInfo: order
    });
  };

  // Cancel without refund handler (after confirmation)
  const handleCancelOrder = async (orderId) => {
    setConfirmDialog({ isOpen: false, orderId: null, action: null, orderInfo: null });
    // Get the current order for logging
    const currentOrder = orders.find(o => o.id === orderId)
    const oldStatus = currentOrder?.status
    
    // Log admin action for cancel
    await logAdminAction(orderId, 'cancel', oldStatus, 'cancelled', adminNotes[orderId] || 'Cancelled without refund')
    
    // Clear notes after logging
    setAdminNotes(prev => ({ ...prev, [orderId]: '' }))
    
    await updateOrderStatus(orderId, 'cancelled');

    // Send cancellation email to customer (no refund)
    try {
      const session = await supabase.auth.getSession();
      const accessToken = session?.data?.session?.access_token;
      const emailResponse = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send-order-cancelled`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({ orderId }),
      });
      if (!emailResponse.ok) {
        console.error('Failed to send cancellation email');
      }
    } catch (emailErr) {
      console.error('Email send error:', emailErr);
      // Don't fail the whole operation if email fails
    }
  };

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
      fetchOrders()
    } catch (_err) {
      setError('Error checking admin status')
      setLoading(false)
    }
  }

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const accessToken = sessionData?.session?.access_token

      if (!accessToken) {
        setError('Please log in')
        setLoading(false)
        return
      }

      const params = new URLSearchParams()
      params.set('status', statusFilter)
      if (searchDebounced.trim()) {
        params.set('q', searchDebounced.trim())
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/get-admin-orders?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
          Authorization: `Bearer ${accessToken}`
        }
      })

      const body = await res.json()

      if (res.status === 403) {
        setIsAdmin(false)
        setError('Access denied. Admin privileges required.')
        setLoading(false)
        return
      }

      if (!res.ok || body?.error) {
        throw new Error(body?.error || 'Failed to load orders')
      }

      setOrders(body.orders || [])
      setError('')
    } catch (err) {
      setError('Error loading orders: ' + err.message)
    } finally {
      setLoading(false)
    }
  }, [statusFilter, searchDebounced])

  useEffect(() => {
    if (isAdmin) {
      fetchOrders()
    }
  }, [isAdmin, fetchOrders])

  // Realtime subscription for orders
  useEffect(() => {
    if (!isAdmin) return

    const channel = supabase
      .channel('admin_orders')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        () => {
          fetchOrders()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [isAdmin, fetchOrders])

  // Debounce search input to reduce requests while typing
  useEffect(() => {
    const t = setTimeout(() => {
      setSearchDebounced(searchQuery)
    }, 350)
    return () => clearTimeout(t)
  }, [searchQuery])

  const updateOrderStatus = async (orderId, newStatus) => {
    setUpdatingOrderId(orderId)
    try {
      // Get the current order to find the old status
      const currentOrder = orders.find(o => o.id === orderId)
      const oldStatus = currentOrder?.status
      
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId)

      if (error) throw error

      // Log admin action
      await logAdminAction(orderId, 'status_change', oldStatus, newStatus, adminNotes[orderId] || null)
      
      // Clear notes after logging
      setAdminNotes(prev => ({ ...prev, [orderId]: '' }))

      if (newStatus === 'completed' && oldStatus !== 'completed') {
        sendOrderCompleteEmail(orderId).catch(err => {
          console.error('Failed to send completion email:', err)
        })
      }

      // Update local state
      setOrders(orders.map(order => 
        order.id === orderId ? { ...order, status: newStatus } : order
      ))
    } catch (err) {
      setError('Error updating order: ' + err.message)
    } finally {
      setUpdatingOrderId(null)
    }
  }

  const sendOrderCompleteEmail = async (orderId) => {
    const { data: sessionData } = await supabase.auth.getSession()
    const accessToken = sessionData?.session?.access_token

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
      const { error } = await supabase
        .from('admin_actions')
        .insert([
          {
            admin_user_id: user.id,
            action_type: actionType,
            order_id: orderId,
            old_status: oldStatus || null,
            new_status: newStatus || null,
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

  const formatCurrency = (amount, currency) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: currency || 'GBP'
    }).format(amount)
  }

  const getItemUnitPrice = (item) => {
    if (typeof item?.price_converted === 'number') return item.price_converted
    if (typeof item?.price_usd === 'number') return item.price_usd
    return Number(item?.price_converted ?? item?.price_usd ?? 0)
  }

  const getOrderTotals = (order) => {
    const currency = order?.currency || 'GBP'
    const subtotal = (order?.items || []).reduce((sum, item) => {
      const quantity = item?.quantity ?? 1
      const unitPrice = getItemUnitPrice(item)
      return sum + unitPrice * quantity
    }, 0)

    const recordedTotal = typeof order?.total_amount === 'number'
      ? order.total_amount
      : subtotal

    return { currency, subtotal, recordedTotal }
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

  return (
    <section className="section admin-section">
      <div className="admin-container">
        <div className="admin-header">
          <h1>Order Management</h1>
          <p>View and manage customer orders</p>
        </div>

        <div className="filter-bar">
          <label htmlFor="statusFilter">Filter by status:</label>
          <select
            id="statusFilter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Orders</option>
            <option value="created">Created</option>
            <option value="pending">Pending Payment</option>
            <option value="paid">Paid</option>
            <option value="processing">Processing</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <label htmlFor="sortOrder">Sort by date:</label>
          <select
            id="sortOrder"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="filter-select"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
          </select>
          <input
            type="text"
            name="orders_search"
            className="search-input"
            placeholder="Search by email, user ID, or order ID"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                setSearchDebounced(searchQuery)
              }
            }}
          />
          {searchQuery && (
            <button
              type="button"
              className="clear-search-btn"
              onClick={() => { setSearchQuery(''); setSearchDebounced('') }}
            >
              Clear
            </button>
          )}
          <span className="order-count">{orders.length} orders</span>
        </div>

        {error && <div className="error-message">{error}</div>}

        {orders.length === 0 ? (
          <div className="no-orders">
            <p>No orders found</p>
          </div>
        ) : (
          <div className="orders-grid">
            {[...orders].sort((a, b) => {
              const dateA = new Date(a.created_at).getTime()
              const dateB = new Date(b.created_at).getTime()
              return sortOrder === 'newest' ? dateB - dateA : dateA - dateB
            }).map(order => {
              const { currency: orderCurrency, subtotal, recordedTotal } = getOrderTotals(order)
              return (
                <div key={order.id} className="order-card">
                <div className="order-header">
                  <div className="order-id">
                    <span className="label">Order ID:</span>
                    <span className="value" title={order.id}>{order.id.slice(0, 8)}</span>
                  </div>
                  <span className={`status-badge status-${order.status}`}>
                    {order.status}
                  </span>
                </div>

                <div className="customer-info">
                  <span className="label">Customer Email:</span>
                  <span className="value">{order.customer_email || <em>Unknown</em>}</span>
                </div>

                <div className="customer-info">
                  <span className="label">Purchased:</span>
                  <span className="value">
                    {new Date(order.created_at).toLocaleString('en-GB', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: false
                    })}
                  </span>
                </div>

                <div className="order-actions">
                  <label htmlFor={`status-${order.id}`}>Update Status:</label>
                  <select
                    id={`status-${order.id}`}
                    value={order.status === 'cancelled' ? 'cancelled' : order.status}
                    onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                    className="status-select"
                    disabled={updatingOrderId === order.id || order.payment_status === 'refunded' || order.status === 'cancelled'}
                    title={order.payment_status === 'refunded' ? 'Cannot change status of refunded order' : order.status === 'cancelled' ? 'Use Cancel & Refund or Cancel Without Refund buttons' : ''}
                  >
                    <option value="created">Created</option>
                    <option value="pending">Pending Payment</option>
                    <option value="processing">Processing</option>
                    <option value="completed">Completed</option>
                    {order.status === 'cancelled' && <option value="cancelled">Cancelled</option>}
                  </select>
                  <div className="action-buttons">
                    <button
                      className="cancel-order-btn"
                      disabled={order.status === 'cancelled' || updatingOrderId === order.id || order.payment_status === 'refunded'}
                      onClick={() => openRefundConfirmation(order)}
                      title={order.payment_status === 'refunded' ? 'Order already refunded' : 'Cancel order and issue refund via Stripe'}
                    >
                      {order.payment_status === 'refunded' ? 'Refunded' : 'Cancel & Refund'}
                    </button>
                    {order.status !== 'cancelled' && order.payment_status !== 'refunded' && (
                      <button
                        className="cancel-no-refund-btn"
                        disabled={updatingOrderId === order.id}
                        onClick={() => openCancelConfirmation(order)}
                        title="Cancel order without issuing refund (customer forfeits payment)"
                      >
                        Cancel Only
                      </button>
                    )}
                  </div>
                </div>

                <div className="admin-notes-section">
                  <label htmlFor={`notes-${order.id}`}>Admin Notes:</label>
                  <textarea
                    id={`notes-${order.id}`}
                    value={adminNotes[order.id] || ''}
                    onChange={(e) => setAdminNotes(prev => ({ ...prev, [order.id]: e.target.value }))}
                    placeholder="Add notes for this action (will be logged in Activity Logs)"
                    className="admin-notes-input"
                  />
                </div>

                <div className="detail-row">
                  <span className="label">Payment:</span>
                  <span className={`value payment-${order.payment_status}`}>
                    {order.payment_status}
                  </span>
                </div>

                <div className="order-items">
                  <h4>Items:</h4>
                  <ul>
                    {(order.items || []).map((item, idx) => (
                      <li key={idx}>
                        <div className="item-row">
                          <div className="item-name">{item.name}</div>
                          <div className="item-meta">{item.quantity} x {formatCurrency(getItemUnitPrice(item, orderCurrency), orderCurrency)}</div>
                          <div className="item-total">{formatCurrency((item.quantity || 1) * getItemUnitPrice(item, orderCurrency), orderCurrency)}</div>
                        </div>
                        {(item.customSelections && Object.keys(item.customSelections).length > 0) ? (
                          <div className="item-platform">
                            {Object.entries(item.customSelections)
                              .filter(([, value]) => Boolean(value))
                              .map(([field, value]) => (
                                <span key={field}>{field}: {value}</span>
                              ))
                              .reduce((prev, curr, idx, arr) => idx === 0 ? [curr] : [...prev, ' • ', curr], [])}
                          </div>
                        ) : (
                          (item.platform || item.version) && (
                            <div className="item-platform">
                              {item.platform && !item.platform.includes(':') ? `Platform: ${item.platform}` : item.platform || 'Platform: N/A'}
                              {item.platform && item.version && ' • '}
                              {item.version ? `Version: ${item.version}` : item.platform && item.version ? 'Version: N/A' : ''}
                            </div>
                          )
                        )}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="order-totals">
                  <div className="totals-row">
                    <span>Items total</span>
                    <strong>{formatCurrency(subtotal, orderCurrency)}</strong>
                  </div>
                  <div className="totals-row">
                    <span>Recorded total</span>
                    <strong>{formatCurrency(recordedTotal, orderCurrency)}</strong>
                  </div>
                  {Math.abs((recordedTotal ?? 0) - (subtotal ?? 0)) > 0.01 && (
                    <div className="totals-note">Includes discounts/fees or taxes</div>
                  )}
                </div>

                <div className="order-notes">
                  <strong>Customer Notes:</strong>
                  <p>{order.note_plaintext || order.notes || <em style={{ color: '#64748b' }}>No notes provided</em>}</p>
                </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Confirmation Dialog */}
      {confirmDialog.isOpen && (
        <div className="modal-overlay" onClick={() => setConfirmDialog({ isOpen: false, orderId: null, action: null, orderInfo: null })}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Confirm Action</h2>
            <div className="modal-body">
              <p>
                Are you sure you want to {confirmDialog.action === 'refund' ? 'cancel and refund' : 'cancel'} this order?
              </p>
              <div className="order-summary">
                <p><strong>Order ID:</strong> {confirmDialog.orderInfo?.id.slice(0, 12)}...</p>
                <p><strong>Customer Email:</strong> {confirmDialog.orderInfo?.customer_email || 'Unknown'}</p>
                <p><strong>Customer Name:</strong> {confirmDialog.orderInfo?.customer_name || 'Not provided'}</p>
                <p><strong>Purchased:</strong> {new Date(confirmDialog.orderInfo?.created_at).toLocaleString('en-GB', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: false
                })}</p>
                <p><strong>Total Amount:</strong> {formatCurrency(confirmDialog.orderInfo?.total_amount, confirmDialog.orderInfo?.currency)}</p>
              </div>
              {confirmDialog.action === 'refund' && (
                <p className="refund-warning">This will issue a refund to the customer's original payment method.</p>
              )}
              {confirmDialog.action === 'cancel' && (
                <p className="cancel-warning">This will cancel the order WITHOUT refunding the customer.</p>
              )}
            </div>
            <div className="modal-actions">
              <button
                className="btn-cancel"
                onClick={() => setConfirmDialog({ isOpen: false, orderId: null, action: null, orderInfo: null })}
              >
                No, Keep Order
              </button>
              <button
                className={`btn-confirm ${confirmDialog.action}`}
                onClick={() => {
                  if (confirmDialog.action === 'refund') {
                    handleRefundOrder(confirmDialog.orderId);
                  } else if (confirmDialog.action === 'cancel') {
                    handleCancelOrder(confirmDialog.orderId);
                  }
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
