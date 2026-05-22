'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { RefreshCw, Plus, Trash2, Eye, EyeOff, Package, Tag, Bell, Users } from 'lucide-react'
import LoadingSpinner from '@/components/LoadingSpinner'
import './AdminEldoradoPage.css'

const EDGE_FN = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/eldorado-api`

export default function AdminEldoradoPage() {
  const { user, isAdmin, loading: authLoading } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('sellers')
  const [sellers, setSellers] = useState([])
  const [loadingSellers, setLoadingSellers] = useState(true)
  const [globalError, setGlobalError] = useState('')
  const [globalSuccess, setGlobalSuccess] = useState('')

  const callApi = useCallback(async (payload) => {
    const { data: { session } } = await supabase.auth.getSession()
    const res = await fetch(EDGE_FN, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session?.access_token}`,
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      },
      body: JSON.stringify(payload),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data?.error || `Request failed (${res.status})`)
    return data
  }, [])

  const fetchSellers = useCallback(async () => {
    setLoadingSellers(true)
    try {
      const data = await callApi({ action: 'get_sellers' })
      setSellers(data.sellers || [])
    } catch (err) {
      setGlobalError(err.message)
    } finally {
      setLoadingSellers(false)
    }
  }, [callApi])

  useEffect(() => {
    if (user && isAdmin) fetchSellers()
  }, [user, isAdmin, fetchSellers])

  if (authLoading) {
    return (
      <div className="eldorado-container">
        <LoadingSpinner message="Verifying admin access..." />
      </div>
    )
  }

  if (!user || !isAdmin) {
    return (
      <div className="eldorado-container">
        <div className="eldorado-error">{!user ? 'Unauthorized – please log in.' : 'Admin access required.'}</div>
      </div>
    )
  }

  const tabs = [
    { id: 'sellers', label: 'Sellers', Icon: Users },
    { id: 'orders', label: 'Orders', Icon: Package },
    { id: 'offers', label: 'Offers', Icon: Tag },
    { id: 'notifications', label: 'Notifications', Icon: Bell },
  ]

  return (
    <div className="eldorado-container">
      <div className="eldorado-header">
        <div>
          <h1 className="eldorado-title">Eldorado Management</h1>
          <p className="eldorado-subtitle">Manage seller accounts and monitor orders on Eldorado.gg</p>
        </div>
        <button className="btn btn-secondary" onClick={() => router.push('/admin/dashboard')}>
          ← Dashboard
        </button>
      </div>

      {globalError && <div className="eldorado-error">{globalError}<button style={{ marginLeft: '0.75rem', background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontWeight: 700 }} onClick={() => setGlobalError('')}>✕</button></div>}
      {globalSuccess && <div className="eldorado-success">{globalSuccess}<button style={{ marginLeft: '0.75rem', background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontWeight: 700 }} onClick={() => setGlobalSuccess('')}>✕</button></div>}

      <div className="eldorado-tabs">
        {tabs.map(({ id, label, Icon }) => (
          <button
            key={id}
            className={`eldorado-tab${activeTab === id ? ' active' : ''}`}
            onClick={() => setActiveTab(id)}
          >
            <Icon size={15} style={{ marginRight: '0.35rem', verticalAlign: 'text-bottom' }} />
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'sellers' && (
        <SellersTab
          sellers={sellers}
          loadingSellers={loadingSellers}
          callApi={callApi}
          onRefresh={fetchSellers}
          setGlobalError={setGlobalError}
          setGlobalSuccess={setGlobalSuccess}
        />
      )}
      {activeTab === 'orders' && (
        <OrdersTab sellers={sellers} callApi={callApi} setGlobalError={setGlobalError} />
      )}
      {activeTab === 'offers' && (
        <OffersTab sellers={sellers} callApi={callApi} setGlobalError={setGlobalError} setGlobalSuccess={setGlobalSuccess} />
      )}
      {activeTab === 'notifications' && (
        <NotificationsTab sellers={sellers} callApi={callApi} setGlobalError={setGlobalError} />
      )}
    </div>
  )
}

// ── Sellers Tab ───────────────────────────────────────────────────────────────

function SellersTab({ sellers, loadingSellers, callApi, onRefresh, setGlobalError, setGlobalSuccess }) {
  const [showAddForm, setShowAddForm] = useState(false)
  const [addForm, setAddForm] = useState({ display_name: '', eldorado_email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [addingLoading, setAddingLoading] = useState(false)
  const [refreshingId, setRefreshingId] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const [updatePwdId, setUpdatePwdId] = useState(null)
  const [newPassword, setNewPassword] = useState('')
  const [updatingPwd, setUpdatingPwd] = useState(false)

  const handleAdd = async () => {
    if (!addForm.display_name || !addForm.eldorado_email || !addForm.password) {
      setGlobalError('All fields are required')
      return
    }
    setAddingLoading(true)
    setGlobalError('')
    try {
      await callApi({ action: 'add_seller', body: addForm })
      setGlobalSuccess('Seller added and credentials verified successfully')
      setAddForm({ display_name: '', eldorado_email: '', password: '' })
      setShowAddForm(false)
      onRefresh()
    } catch (err) {
      setGlobalError(err.message)
    } finally {
      setAddingLoading(false)
    }
  }

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete seller "${name}"? This cannot be undone.`)) return
    setDeletingId(id)
    try {
      await callApi({ action: 'delete_seller', sellerId: id })
      setGlobalSuccess(`Seller "${name}" deleted`)
      onRefresh()
    } catch (err) {
      setGlobalError(err.message)
    } finally {
      setDeletingId(null)
    }
  }

  const handleRefreshToken = async (id) => {
    setRefreshingId(id)
    try {
      await callApi({ action: 'refresh_token', sellerId: id })
      setGlobalSuccess('Token refreshed successfully')
      onRefresh()
    } catch (err) {
      setGlobalError(err.message)
    } finally {
      setRefreshingId(null)
    }
  }

  const handleUpdatePassword = async (id) => {
    if (!newPassword) { setGlobalError('Enter the new password'); return }
    setUpdatingPwd(true)
    try {
      await callApi({ action: 'update_password', sellerId: id, body: { password: newPassword } })
      setGlobalSuccess('Password updated and re-authenticated successfully')
      setUpdatePwdId(null)
      setNewPassword('')
      onRefresh()
    } catch (err) {
      setGlobalError(err.message)
    } finally {
      setUpdatingPwd(false)
    }
  }

  const fmtExpiry = (ts) => {
    if (!ts) return '—'
    const d = new Date(ts)
    const diff = d.getTime() - Date.now()
    if (diff < 0) return 'Expired'
    if (diff < 60_000) return 'Expires in <1 min'
    if (diff < 3600_000) return `Expires in ${Math.floor(diff / 60_000)}m`
    return `Expires ${d.toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}`
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
        <h2 className="eldorado-section-title" style={{ margin: 0 }}>Seller Accounts</h2>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-secondary btn-sm" onClick={onRefresh} disabled={loadingSellers}>
            <RefreshCw size={13} />
            Refresh
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => setShowAddForm(v => !v)}>
            <Plus size={13} />
            Add Seller
          </button>
        </div>
      </div>

      {showAddForm && (
        <div className="add-seller-card">
          <p className="add-seller-title">Add New Seller</p>
          <div className="add-seller-form">
            <div className="form-field">
              <label>Display Name</label>
              <input
                placeholder="e.g. John's Account"
                value={addForm.display_name}
                onChange={e => setAddForm(f => ({ ...f, display_name: e.target.value }))}
              />
            </div>
            <div className="form-field">
              <label>Eldorado Email</label>
              <input
                type="email"
                placeholder="seller@example.com"
                value={addForm.eldorado_email}
                onChange={e => setAddForm(f => ({ ...f, eldorado_email: e.target.value }))}
              />
            </div>
            <div className="form-field" style={{ gridColumn: '1 / -1' }}>
              <label>Eldorado Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Eldorado account password"
                  value={addForm.password}
                  onChange={e => setAddForm(f => ({ ...f, password: e.target.value }))}
                  style={{ paddingRight: '2.5rem' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: 0 }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div className="add-seller-actions">
              <button className="btn btn-primary" onClick={handleAdd} disabled={addingLoading}>
                {addingLoading ? 'Verifying & Adding...' : 'Add Seller'}
              </button>
              <button className="btn btn-secondary" onClick={() => { setShowAddForm(false); setAddForm({ display_name: '', eldorado_email: '', password: '' }) }}>
                Cancel
              </button>
              <span style={{ color: '#475569', fontSize: '0.8rem' }}>Credentials will be verified immediately</span>
            </div>
          </div>
        </div>
      )}

      {loadingSellers ? (
        <div className="eldorado-spinner">Loading sellers...</div>
      ) : sellers.length === 0 ? (
        <div className="eldorado-empty">No sellers added yet. Click "Add Seller" to get started.</div>
      ) : (
        <div className="seller-grid">
          {sellers.map(seller => (
            <div key={seller.id} className="seller-card">
              <div className="seller-card-header">
                <span className="seller-name">{seller.display_name}</span>
              </div>
              <div className="seller-email">{seller.eldorado_email}</div>
              <div className="seller-badges">
                <span className={`seller-badge ${seller.is_active ? 'badge-active' : 'badge-inactive'}`}>
                  {seller.is_active ? 'Active' : 'Inactive'}
                </span>
                <span className={`seller-badge ${seller.token_valid ? 'badge-token-ok' : 'badge-token-expired'}`}>
                  {seller.token_valid ? 'Token OK' : seller.has_token ? 'Token Expired' : 'No Token'}
                </span>
              </div>
              <div className="token-expires">{fmtExpiry(seller.token_expires_at)}</div>

              {updatePwdId === seller.id ? (
                <div style={{ marginTop: '0.75rem' }}>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <input
                      type="password"
                      placeholder="New password"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      style={{ flex: 1, background: '#0a0e1a', border: '1px solid #334155', borderRadius: '6px', padding: '0.45rem 0.65rem', color: '#f8fafc', fontSize: '0.85rem' }}
                    />
                    <button className="btn btn-primary btn-sm" onClick={() => handleUpdatePassword(seller.id)} disabled={updatingPwd}>
                      {updatingPwd ? '...' : 'Save'}
                    </button>
                    <button className="btn btn-secondary btn-sm" onClick={() => { setUpdatePwdId(null); setNewPassword('') }}>
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="seller-card-actions" style={{ marginTop: '0.75rem' }}>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleRefreshToken(seller.id)}
                    disabled={refreshingId === seller.id}
                  >
                    <RefreshCw size={12} />
                    {refreshingId === seller.id ? 'Refreshing...' : 'Refresh Token'}
                  </button>
                  <button className="btn btn-secondary btn-sm" onClick={() => setUpdatePwdId(seller.id)}>
                    Update Password
                  </button>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handleDelete(seller.id, seller.display_name)}
                    disabled={deletingId === seller.id}
                  >
                    <Trash2 size={12} />
                    {deletingId === seller.id ? '...' : 'Delete'}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Orders Tab ────────────────────────────────────────────────────────────────

function OrdersTab({ sellers, callApi, setGlobalError }) {
  const [sellerId, setSellerId] = useState('')
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(false)
  const [statusFilter, setStatusFilter] = useState('all')
  const [actionLoading, setActionLoading] = useState(null)
  const [localError, setLocalError] = useState('')

  const fetchOrders = async (sid) => {
    if (!sid) return
    setLoading(true)
    setLocalError('')
    setOrders([])
    try {
      const data = await callApi({
        action: 'call_api',
        sellerId: sid,
        method: 'GET',
        endpoint: '/api/v1/orders/me/seller/orders',
        params: statusFilter !== 'all' ? { status: statusFilter } : {},
      })
      setOrders(data?.data || data?.orders || data || [])
    } catch (err) {
      setLocalError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDeliver = async (orderId) => {
    setActionLoading(orderId)
    setLocalError('')
    try {
      await callApi({
        action: 'call_api',
        sellerId,
        method: 'PUT',
        endpoint: `/api/v1/orders/me/${orderId}/deliver`,
      })
      fetchOrders(sellerId)
    } catch (err) {
      setLocalError(err.message)
    } finally {
      setActionLoading(null)
    }
  }

  const orderList = Array.isArray(orders) ? orders : []

  return (
    <div>
      <h2 className="eldorado-section-title">Seller Orders</h2>

      <div className="seller-selector-bar">
        <label>Seller:</label>
        <select value={sellerId} onChange={e => setSellerId(e.target.value)}>
          <option value="">— Select seller —</option>
          {sellers.map(s => <option key={s.id} value={s.id}>{s.display_name}</option>)}
        </select>
        <label>Status:</label>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="all">All</option>
          <option value="pending">Pending</option>
          <option value="processing">Processing</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <button className="btn btn-primary btn-sm" onClick={() => fetchOrders(sellerId)} disabled={!sellerId || loading}>
          <RefreshCw size={13} />
          {loading ? 'Loading...' : 'Load Orders'}
        </button>
      </div>

      {localError && <div className="eldorado-error">{localError}</div>}

      {loading ? (
        <div className="eldorado-spinner">Fetching orders...</div>
      ) : orderList.length === 0 && sellerId ? (
        <div className="eldorado-empty">No orders found for this seller.</div>
      ) : orderList.length === 0 ? (
        <div className="eldorado-empty">Select a seller and click Load Orders.</div>
      ) : (
        <div className="eldorado-table-wrapper">
          <table className="eldorado-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Item</th>
                <th>Buyer</th>
                <th>Price</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orderList.map(order => {
                const oid = order.id || order.orderId || order.order_id
                const status = (order.status || order.orderStatus || '').toLowerCase()
                return (
                  <tr key={oid}>
                    <td className="order-id-cell">{String(oid).substring(0, 12)}…</td>
                    <td>{order.offer?.name || order.itemName || order.title || '—'}</td>
                    <td>{order.buyer?.username || order.buyerName || '—'}</td>
                    <td className="price-tag">
                      {order.price != null ? `$${Number(order.price).toFixed(2)}` : '—'}
                    </td>
                    <td>
                      <span className={`status-badge status-${status}`}>{status || '—'}</span>
                    </td>
                    <td>
                      {order.createdAt || order.created_at
                        ? new Date(order.createdAt || order.created_at).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
                        : '—'}
                    </td>
                    <td>
                      {(status === 'pending' || status === 'processing') && (
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => handleDeliver(oid)}
                          disabled={actionLoading === oid}
                        >
                          {actionLoading === oid ? 'Delivering...' : 'Mark Delivered'}
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ── Offers Tab ────────────────────────────────────────────────────────────────

function OffersTab({ sellers, callApi, setGlobalError, setGlobalSuccess }) {
  const [sellerId, setSellerId] = useState('')
  const [offers, setOffers] = useState([])
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(null)
  const [localError, setLocalError] = useState('')

  const fetchOffers = async (sid) => {
    if (!sid) return
    setLoading(true)
    setLocalError('')
    setOffers([])
    try {
      const data = await callApi({
        action: 'call_api',
        sellerId: sid,
        method: 'GET',
        endpoint: '/api/flexibleOffers/me/search',
      })
      const list = data?.data || data?.offers || data?.items || data || []
      setOffers(Array.isArray(list) ? list : [])
    } catch (err) {
      setLocalError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleOfferAction = async (offerId, action) => {
    const endpointMap = {
      pause: `/api/flexibleOffers/me/${offerId}/pause`,
      activate: `/api/flexibleOffers/me/${offerId}/activate`,
      delete: `/api/flexibleOffers/me/${offerId}`,
    }
    setActionLoading(`${offerId}-${action}`)
    setLocalError('')
    try {
      await callApi({
        action: 'call_api',
        sellerId,
        method: action === 'delete' ? 'DELETE' : 'PUT',
        endpoint: endpointMap[action],
      })
      setGlobalSuccess(`Offer ${action}d successfully`)
      fetchOffers(sellerId)
    } catch (err) {
      setLocalError(err.message)
    } finally {
      setActionLoading(null)
    }
  }

  const offerList = Array.isArray(offers) ? offers : []

  return (
    <div>
      <h2 className="eldorado-section-title">Active Offers</h2>

      <div className="seller-selector-bar">
        <label>Seller:</label>
        <select value={sellerId} onChange={e => setSellerId(e.target.value)}>
          <option value="">— Select seller —</option>
          {sellers.map(s => <option key={s.id} value={s.id}>{s.display_name}</option>)}
        </select>
        <button className="btn btn-primary btn-sm" onClick={() => fetchOffers(sellerId)} disabled={!sellerId || loading}>
          <RefreshCw size={13} />
          {loading ? 'Loading...' : 'Load Offers'}
        </button>
      </div>

      {localError && <div className="eldorado-error">{localError}</div>}

      {loading ? (
        <div className="eldorado-spinner">Fetching offers...</div>
      ) : offerList.length === 0 && sellerId ? (
        <div className="eldorado-empty">No offers found for this seller.</div>
      ) : offerList.length === 0 ? (
        <div className="eldorado-empty">Select a seller and click Load Offers.</div>
      ) : (
        <div className="eldorado-table-wrapper">
          <table className="eldorado-table">
            <thead>
              <tr>
                <th>Offer Name</th>
                <th>Game</th>
                <th>Price</th>
                <th>Status</th>
                <th>Min / Max</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {offerList.map(offer => {
                const oid = offer.id || offer.offerId
                const status = (offer.status || offer.offerStatus || '').toLowerCase()
                const isPaused = status === 'paused' || status === 'inactive'
                return (
                  <tr key={oid}>
                    <td>{offer.name || offer.title || '—'}</td>
                    <td>{offer.game?.name || offer.gameName || '—'}</td>
                    <td className="price-tag">
                      {offer.price != null ? `$${Number(offer.price).toFixed(2)}` : '—'}
                    </td>
                    <td>
                      <span className={`status-badge status-${isPaused ? 'paused' : 'active'}`}>
                        {status || '—'}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                      {offer.minAmount != null ? `${offer.minAmount}` : '—'}
                      {offer.maxAmount != null ? ` / ${offer.maxAmount}` : ''}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleOfferAction(oid, isPaused ? 'activate' : 'pause')}
                          disabled={actionLoading === `${oid}-${isPaused ? 'activate' : 'pause'}`}
                        >
                          {isPaused ? 'Activate' : 'Pause'}
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleOfferAction(oid, 'delete')}
                          disabled={actionLoading === `${oid}-delete`}
                        >
                          <Trash2 size={11} />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ── Notifications Tab ─────────────────────────────────────────────────────────

function NotificationsTab({ sellers, callApi, setGlobalError }) {
  const [sellerId, setSellerId] = useState('')
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(false)
  const [localError, setLocalError] = useState('')

  const fetchNotifications = async (sid) => {
    if (!sid) return
    setLoading(true)
    setLocalError('')
    setNotifications([])
    try {
      const data = await callApi({
        action: 'call_api',
        sellerId: sid,
        method: 'GET',
        endpoint: '/api/v1/notifications/me',
        params: { unread: 'true' },
      })
      const list = data?.data || data?.notifications || data || []
      setNotifications(Array.isArray(list) ? list : [])
    } catch (err) {
      setLocalError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const notifList = Array.isArray(notifications) ? notifications : []

  const fmtType = (type) =>
    (type || '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())

  return (
    <div>
      <h2 className="eldorado-section-title">Notifications</h2>

      <div className="seller-selector-bar">
        <label>Seller:</label>
        <select value={sellerId} onChange={e => setSellerId(e.target.value)}>
          <option value="">— Select seller —</option>
          {sellers.map(s => <option key={s.id} value={s.id}>{s.display_name}</option>)}
        </select>
        <button className="btn btn-primary btn-sm" onClick={() => fetchNotifications(sellerId)} disabled={!sellerId || loading}>
          <RefreshCw size={13} />
          {loading ? 'Loading...' : 'Load Notifications'}
        </button>
      </div>

      {localError && <div className="eldorado-error">{localError}</div>}

      {loading ? (
        <div className="eldorado-spinner">Fetching notifications...</div>
      ) : notifList.length === 0 && sellerId ? (
        <div className="eldorado-empty">No unread notifications.</div>
      ) : notifList.length === 0 ? (
        <div className="eldorado-empty">Select a seller and click Load Notifications.</div>
      ) : (
        <div className="notif-list">
          {notifList.map((n, i) => {
            const nid = n.id || i
            return (
              <div key={nid} className="notif-card">
                <div className="notif-dot" />
                <div className="notif-content">
                  <div className="notif-type">{fmtType(n.type || n.notificationType)}</div>
                  <div className="notif-message">{n.message || n.body || n.text || JSON.stringify(n)}</div>
                  {(n.createdAt || n.created_at) && (
                    <div className="notif-time">
                      {new Date(n.createdAt || n.created_at).toLocaleString('en-GB', {
                        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                      })}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
