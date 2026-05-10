'use client'

import './Cart.css'
import { ShoppingCart, Gamepad2, Sparkles } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import AnimatedLucideIcon from './AnimatedLucideIcon'
import { XIcon } from './XIcon'
import { useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'

export default function Cart({ items, onRemove, onUpdateQuantity, onCheckout, checkoutStatus, formatPrice, paymentMethod, onPaymentMethodChange, isDevUser, orderNote, onOrderNoteChange }) {
  const router = useRouter()
  const { emailVerified } = useAuth()
  const totalUsd = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const isLoading = checkoutStatus?.state === 'loading'
  const hasMessage = checkoutStatus?.message
  const removeButtonRefs = useRef({})
  const itemPathCacheRef = useRef({})

  const buttonLabel = (() => {
    if (paymentMethod === 'dev_skip') return isLoading ? 'Placing order...' : 'Buy now (dev skip payment)'
    return isLoading ? 'Redirecting to Stripe...' : 'Pay with Stripe'
  })()

  const toSlug = (value) => {
    if (!value) return ''
    return String(value)
      .toLowerCase()
      .trim()
      .replace(/["']/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }

  const getItemPath = (item) => {
    const categorySlug = item.category_slug || item.categorySlug || toSlug(item.category_name)
    const gameSlug = item.game_slug || item.gameSlug || toSlug(item.game_name)
    const itemSlug = item.item_slug || item.itemSlug || item.slug

    if (!categorySlug || !gameSlug || !itemSlug) return null
    return `/${categorySlug}/${gameSlug}/${itemSlug}`
  }

  const getRelatedRecord = (value) => (Array.isArray(value) ? value[0] : value)

  const resolveItemPath = async (item) => {
    const directPath = getItemPath(item)
    if (directPath) return directPath

    if (!item?.id) return null

    if (itemPathCacheRef.current[item.id]) {
      return itemPathCacheRef.current[item.id]
    }

    try {
      const { data, error } = await supabase
        .from('items')
        .select('slug, categories(slug), games(slug)')
        .eq('id', item.id)
        .single()

      if (error) throw error

      const categorySlug = getRelatedRecord(data?.categories)?.slug || ''
      const gameSlug = getRelatedRecord(data?.games)?.slug || ''
      const itemSlug = data?.slug || ''

      if (!categorySlug || !gameSlug || !itemSlug) return null

      const resolvedPath = `/${categorySlug}/${gameSlug}/${itemSlug}`
      itemPathCacheRef.current[item.id] = resolvedPath
      return resolvedPath
    } catch (_err) {
      return null
    }
  }

  const canNavigateToItem = (item) => Boolean(getItemPath(item) || item?.id)

  const handleItemClick = async (item) => {
    const itemPath = await resolveItemPath(item)
    if (!itemPath) return
    router.push(`${itemPath}?cartId=${encodeURIComponent(item.cartId)}`)
  }

  const handleCheckout = () => {
    if (!emailVerified) {
      alert('Please verify your email before checking out')
      return
    }
    onCheckout()
  }

  if (items.length === 0) {
    return (
      <div className="cart-container">
        {hasMessage && checkoutStatus.state === 'success' && (
          <div className="success-banner">
            <p className={`checkout-message ${checkoutStatus.state}`}>
              {checkoutStatus.message}
            </p>
          </div>
        )}
        <div className="empty-cart">
          <p>Your cart is empty</p>
          <span className="empty-icon"><AnimatedLucideIcon icon={ShoppingCart} size={28} /></span>
        </div>
      </div>
    )
  }

  return (
    <div className="cart-container">
      <h2 className="cart-title">Shopping Cart</h2>
      <div className="cart-items">
        {items.map(item => (
          <div
            key={item.cartId}
            className={`cart-item${canNavigateToItem(item) ? ' clickable' : ''}`}
            onClick={() => handleItemClick(item)}
            role={canNavigateToItem(item) ? 'button' : undefined}
            tabIndex={canNavigateToItem(item) ? 0 : undefined}
            onKeyDown={(event) => {
              if (!canNavigateToItem(item)) return
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                handleItemClick(item)
              }
            }}
            title={canNavigateToItem(item) ? 'View item details' : undefined}
          >
            <div className="item-header">
              <div className="item-icon">
                {item.icon && typeof item.icon === 'string' && (item.icon.startsWith('/') || item.icon.startsWith('http')) ? (
                  <img
                    src={item.icon}
                    alt={item.name}
                    onError={(e) => {
                      e.target.style.display = 'none'
                      e.target.parentElement.textContent = ' '
                    }}
                  />
                ) : (
                  <span><AnimatedLucideIcon icon={Gamepad2} size={20} /></span>
                )}
              </div>
              <div className="item-info">
                <h4>{item.name}</h4>
                {item.customSelections && Object.keys(item.customSelections).length > 0 ? (
                  Object.entries(item.customSelections)
                    .filter(([, value]) => Boolean(value))
                    .map(([field, value]) => (
                      <p key={`${item.cartId}-${field}`} className={field.toLowerCase() === 'version' ? 'item-version' : 'platform'}>
                        {field}: {value}
                      </p>
                    ))
                ) : (
                  <>
                    {item.platform && (
                      <p className="platform">
                        {item.platform.includes(':') ? item.platform : `Platform: ${item.platform}`}
                      </p>
                    )}
                    {item.version && item.version !== 'Standard' && (
                      <p className="item-version">Version: {item.version}</p>
                    )}
                  </>
                )}
              </div>
            </div>
            <div className="item-price">
              <p className="price-label">Price:</p>
              <p className="price-value">{formatPrice ? formatPrice(item.price * item.quantity) : `$${item.price * item.quantity}`}</p>
            </div>
            <div className="item-controls">
              <div className="item-quantity">
                <button onClick={(event) => {
                  event.stopPropagation()
                  onUpdateQuantity(item.cartId, item.quantity - 1)
                }}>−</button>
                <span>{item.quantity}</span>
                <button onClick={(event) => {
                  event.stopPropagation()
                  onUpdateQuantity(item.cartId, item.quantity + 1)
                }}>+</button>
              </div>
              <button
                className="remove-btn"
                onClick={(event) => {
                  event.stopPropagation()
                  onRemove(item.cartId)
                }}
                onMouseEnter={() => removeButtonRefs.current[item.cartId]?.startAnimation()}
                onMouseLeave={() => removeButtonRefs.current[item.cartId]?.stopAnimation()}
                aria-label="Remove item"
                title="Remove item"
              >
                <XIcon ref={el => removeButtonRefs.current[item.cartId] = el} size={20} />
              </button>
            </div>
          </div>
        ))}
      </div>
      <div className="payment-section">
        <h3>Payment</h3>
        <div className="payment-options">
          <label className="payment-option">
            <input
              type="radio"
              name="payment-method"
              value="stripe"
              checked={paymentMethod === 'stripe'}
              onChange={() => onPaymentMethodChange('stripe')}
            />
            <div className="option-copy">
              <span className="option-title">Card (Stripe)</span>
              <span className="option-desc">Pay securely via Stripe Checkout.</span>
            </div>
          </label>

        <div className="order-note">
          <div className="order-note-header">
            <h3>Order notes</h3>
            <p>Share account email, login details, or specific instructions for this order. Login details are encrypted and handled securely.</p>
          </div>
          <textarea
            name="order_note"
            value={orderNote}
            onChange={(e) => onOrderNoteChange?.(e.target.value)}
            placeholder="Example: Account email is user@example.com, password is ********, please add cars to Slot 1 and keep outfits #3 and #4."
            maxLength={1000}
          />
          <div className="order-note-hint">Up to 1000 characters. Login details are encrypted and sent securely with your order.</div>
        </div>

          {isDevUser && (
            <label className="payment-option dev-option">
              <input
                type="radio"
                name="payment-method"
                value="dev_skip"
                checked={paymentMethod === 'dev_skip'}
                onChange={() => onPaymentMethodChange('dev_skip')}
              />
              <div className="option-copy">
                <span className="option-title">Dev: skip payment</span>
                <span className="option-desc">Insert order with payment skipped (dev only).</span>
              </div>
            </label>
          )}
        </div>
      </div>

      <div className="cart-total">
        <div className="cart-total-text">
          <h3>Total: {formatPrice ? formatPrice(totalUsd) : `$${totalUsd}`}</h3>
          {hasMessage && (
            <p className={`checkout-message ${checkoutStatus.state}`}>
              {checkoutStatus.message}
            </p>
          )}
        </div>
        <button
          className={`checkout-btn${paymentMethod === 'stripe' ? ' stripe-checkout-btn' : ''}`}
          onClick={handleCheckout}
          disabled={!items.length || isLoading || !emailVerified}
          title={!emailVerified ? 'Please verify your email to checkout' : ''}
        >
          {!emailVerified ? 'Verify email to checkout' : paymentMethod === 'stripe' ? (
            <span className="stripe-btn-content">
              <Sparkles size={18} className="stripe-btn-icon" aria-hidden="true" />
              <span>{buttonLabel}</span>
            </span>
          ) : buttonLabel}
        </button>
      </div>
    </div>
  )
}
