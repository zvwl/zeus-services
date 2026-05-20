'use client'

import { useRouter } from 'next/navigation'
import { ShoppingCart, Gamepad2, X, ShieldCheck, Lock, Minus, Plus, Tag } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import AnimatedLucideIcon from './AnimatedLucideIcon'
import { useRef } from 'react'
import { supabase } from '@/lib/supabase/client'
import './Cart.css'

export default function CartSummary({ items = [], onRemove, onUpdateQuantity, formatPrice }) {
  const router = useRouter()
  const { user } = useAuth()
  const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)
  const itemPathCacheRef = useRef({})

  const toSlug = (value) => {
    if (!value) return ''
    return String(value).toLowerCase().trim()
      .replace(/["']/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
  }

  const getItemPath = (item) => {
    const cat = item.category_slug || item.categorySlug || toSlug(item.category_name)
    const game = item.game_slug || item.gameSlug || toSlug(item.game_name)
    const slug = item.item_slug || item.itemSlug || item.slug
    if (!cat || !game || !slug) return null
    return `/${cat}/${game}/${slug}`
  }

  const resolveItemPath = async (item) => {
    const direct = getItemPath(item)
    if (direct) return direct
    if (!item?.id) return null
    if (itemPathCacheRef.current[item.id]) return itemPathCacheRef.current[item.id]
    try {
      const { data } = await supabase.from('items').select('slug, categories(slug), games(slug)').eq('id', item.id).single()
      const cat = (Array.isArray(data?.categories) ? data.categories[0] : data?.categories)?.slug || ''
      const game = (Array.isArray(data?.games) ? data.games[0] : data?.games)?.slug || ''
      const slug = data?.slug || ''
      if (!cat || !game || !slug) return null
      const path = `/${cat}/${game}/${slug}`
      itemPathCacheRef.current[item.id] = path
      return path
    } catch { return null }
  }

  const handleItemClick = async (item) => {
    const path = await resolveItemPath(item)
    if (!path) return
    router.push(`${path}?cartId=${encodeURIComponent(item.cartId)}`)
  }

  const handleCheckout = () => {
    router.push(user ? '/checkout' : '/login?redirect=/checkout')
  }

  if (items.length === 0) {
    return (
      <div className="cs-empty">
        <div className="cs-empty-icon">
          <AnimatedLucideIcon icon={ShoppingCart} size={40} animation="swing" animateOnHover={false} />
        </div>
        <h2>Your cart is empty</h2>
        <p>Add some items to get started.</p>
        <button onClick={() => router.push('/boosting')} className="cs-empty-btn">
          Browse Services
        </button>
      </div>
    )
  }

  return (
    <div className="cs-layout">
      {/* ── Left: item list ── */}
      <div className="cs-items-col">
        <div className="cs-items-header">
          <span className="cs-items-label">Item</span>
          <span className="cs-items-label cs-qty-label">Qty</span>
          <span className="cs-items-label cs-price-label">Price</span>
        </div>

        <div className="cs-item-list">
          {items.map(item => {
            const lineTotal = formatPrice ? formatPrice(item.price * item.quantity) : `£${(item.price * item.quantity).toFixed(2)}`
            const unitPrice = formatPrice ? formatPrice(item.price) : `£${item.price.toFixed(2)}`
            const canNav = Boolean(getItemPath(item) || item?.id)

            return (
              <div key={item.cartId} className="cs-item">
                {/* Image */}
                <div
                  className={`cs-item-img${canNav ? ' clickable' : ''}`}
                  onClick={() => canNav && handleItemClick(item)}
                  role={canNav ? 'button' : undefined}
                  tabIndex={canNav ? 0 : undefined}
                  onKeyDown={e => { if (canNav && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); handleItemClick(item) } }}
                >
                  {item.icon && (item.icon.startsWith('/') || item.icon.startsWith('http')) ? (
                    <img src={item.icon} alt={item.name} onError={e => { e.target.style.display = 'none' }} />
                  ) : (
                    <AnimatedLucideIcon icon={Gamepad2} size={22} animation="bounce" animateOnHover={false} />
                  )}
                </div>

                {/* Info */}
                <div className="cs-item-info">
                  <p
                    className={`cs-item-name${canNav ? ' clickable' : ''}`}
                    onClick={() => canNav && handleItemClick(item)}
                    role={canNav ? 'button' : undefined}
                    tabIndex={canNav ? 0 : undefined}
                    onKeyDown={e => { if (canNav && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); handleItemClick(item) } }}
                  >
                    {item.name}
                  </p>
                  <div className="cs-item-meta">
                    {item.customSelections && Object.keys(item.customSelections).length > 0
                      ? Object.entries(item.customSelections).filter(([, v]) => Boolean(v)).map(([k, v]) => (
                          <span key={k} className="cs-meta-pill">{k}: {v}</span>
                        ))
                      : <>
                          {item.platform && <span className="cs-meta-pill">{item.platform.includes(':') ? item.platform : `Platform: ${item.platform}`}</span>}
                          {item.version && item.version !== 'Standard' && <span className="cs-meta-pill">Version: {item.version}</span>}
                        </>
                    }
                  </div>
                  <span className="cs-unit-price">{unitPrice} each</span>
                </div>

                {/* Qty stepper */}
                <div className="cs-qty" onClick={e => e.stopPropagation()}>
                  <button
                    className="cs-qty-btn"
                    onClick={() => onUpdateQuantity(item.cartId, item.quantity - 1)}
                    aria-label="Decrease quantity"
                  ><Minus size={13} strokeWidth={2.5} /></button>
                  <span className="cs-qty-val">{item.quantity}</span>
                  <button
                    className="cs-qty-btn"
                    onClick={() => onUpdateQuantity(item.cartId, item.quantity + 1)}
                    aria-label="Increase quantity"
                  ><Plus size={13} strokeWidth={2.5} /></button>
                </div>

                {/* Line total */}
                <div className="cs-line-total">
                  <span>{lineTotal}</span>
                </div>

                {/* Remove */}
                <button
                  className="cs-remove-btn"
                  onClick={e => { e.stopPropagation(); onRemove(item.cartId) }}
                  aria-label="Remove item"
                >
                  <X size={14} strokeWidth={2.5} />
                </button>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Right: order summary ── */}
      <div className="cs-summary">
        <h2 className="cs-summary-title">Order Summary</h2>

        <div className="cs-summary-rows">
          <div className="cs-summary-row">
            <span>Subtotal ({itemCount} item{itemCount !== 1 ? 's' : ''})</span>
            <span>{formatPrice ? formatPrice(total) : `£${total.toFixed(2)}`}</span>
          </div>
          <div className="cs-summary-row">
            <span>Delivery</span>
            <span className="cs-free">Discord</span>
          </div>
        </div>

        <div className="cs-summary-divider" />

        <div className="cs-summary-total">
          <span>Total</span>
          <span className="cs-total-amount">{formatPrice ? formatPrice(total) : `£${total.toFixed(2)}`}</span>
        </div>

        <button className="cs-checkout-btn" onClick={handleCheckout}>
          {user ? 'Proceed to Checkout' : 'Sign in to Checkout'}
        </button>

        <div className="cs-trust">
          <div className="cs-trust-item">
            <ShieldCheck size={14} />
            <span>Secure checkout via Stripe</span>
          </div>
          <div className="cs-trust-item">
            <Lock size={14} />
            <span>Your data is protected</span>
          </div>
          <div className="cs-trust-item">
            <Tag size={14} />
            <span>No hidden fees</span>
          </div>
        </div>
      </div>
    </div>
  )
}
