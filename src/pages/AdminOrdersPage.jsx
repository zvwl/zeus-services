import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../supabaseClient'
import './AdminOrdersPage.css'

export default function AdminOrdersPage() {
  const { user } = useAuth()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
                {(() => {
                  const { currency: orderCurrency, subtotal, recordedTotal } = getOrderTotals(order)
                  return (
                    <>
  const [isAdmin, setIsAdmin] = useState(false)
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchDebounced, setSearchDebounced] = useState('')
  const [updatingOrderId, setUpdatingOrderId] = useState(null)
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
      // Get the current session access token
      const session = await supabase.auth.getSession();
      const accessToken = session?.data?.session?.access_token;
      const response = await fetch('https://xdvbhungoadwlmeddelt.supabase.co/functions/v1/refund-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({ orderId }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Refund failed');
      // Update local state
      setOrders(orders.map(order =>
        order.id === orderId
          ? { ...order, status: 'cancelled', payment_status: 'refunded' }
          : order
      ));
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
    await updateOrderStatus(orderId, 'cancelled');
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
    } catch (err) {
      setError('Error checking admin status')
      setLoading(false)
    }
  }

  const fetchOrders = async () => {
    try {
      let query = supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter)
      }

      // Apply search by email, user ID, or order ID
      const q = searchDebounced.trim()
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      if (q) {
        if (uuidRegex.test(q)) {
          // Full UUID: narrow on server by id/user_id and allow email match too
          query = query.or(`user_id.eq.${q},id.eq.${q},customer_email.ilike.%${q}%`)
        } else {
          // Non-UUID: only apply server-side email ilike if the query looks like email
          const isEmailLike = q.includes('@')
          if (isEmailLike) {
            query = query.or(`customer_email.ilike.%${q}%`)
          }
          // Otherwise, skip server-side search filters to allow client-side partial ID matching
        }
      }

      const { data, error } = await query

      if (error) throw error

      // Client-side matching for non-UUID: partial order ID or email
      let results = data || []
      if (q && !uuidRegex.test(q)) {
        const qLower = q.toLowerCase()
        results = results.filter(o => (
          String(o.id || '').toLowerCase().includes(qLower) ||
          String(o.customer_email || '').toLowerCase().includes(qLower)
        ))
      }

      setOrders(results)
      setError('')
    } catch (err) {
      setError('Error loading orders: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isAdmin) {
      fetchOrders()
    }
  }, [statusFilter, isAdmin, searchDebounced])

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
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId)

      if (error) throw error

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

  const formatCurrency = (amount, currency) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: currency || 'GBP'
    }).format(amount)
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

  const getItemUnitPrice = (item, currency) => {
    if (typeof item?.price_converted === 'number') return item.price_converted
    if (typeof item?.price_usd === 'number') return item.price_usd
    return Number(item?.price_converted ?? item?.price_usd ?? 0)
  }

  const getOrderTotals = (order) => {
    const currency = order?.currency || 'GBP'
    const subtotal = (order?.items || []).reduce((sum, item) => {
      const quantity = item?.quantity ?? 1
      const unitPrice = getItemUnitPrice(item, currency)
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
          <input
            type="text"
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
            {orders.map(order => (
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
                        {item.platform && <div className="item-platform">Platform: {item.platform}</div>}
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

                {order.notes && (
                  <div className="order-notes">
                    <strong>Notes:</strong>
                    <p>{order.notes}</p>
                  </div>
                )}
                    </>
                  )
                })()}
              </div>
            ))}
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
                <p><strong>Total Amount:</strong> {formatCurrency(confirmDialog.orderInfo?.total_amount, confirmDialog.orderInfo?.currency)}</p>
              </div>
              {confirmDialog.action === 'refund' && (
                <p className="refund-warning">⚠️ This will issue a refund to the customer's original payment method.</p>
              )}
              {confirmDialog.action === 'cancel' && (
                <p className="cancel-warning">⚠️ This will cancel the order WITHOUT refunding the customer.</p>
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
