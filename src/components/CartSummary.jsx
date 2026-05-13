'use client'

import { useRouter } from 'next/navigation'
import { ShoppingCart, Gamepad2, X } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import AnimatedLucideIcon from './AnimatedLucideIcon'
import { useRef } from 'react'
import { supabase } from '@/lib/supabase/client'
import './Cart.css'

export default function CartSummary({ items = [], onRemove, onUpdateQuantity, formatPrice }) {
  const router = useRouter()
  const { user } = useAuth()
  const totalUsd = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const itemPathCacheRef = useRef({})

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
    if (!user) {
      router.push('/login?redirect=/checkout')
      return
    }
    router.push('/checkout')
  }

  if (items.length === 0) {
    return (
      <div className="cart-container">
        <div className="empty-cart">
          <p>Your cart is empty</p>
          <span className="empty-icon"><AnimatedLucideIcon icon={ShoppingCart} size={80} animation="swing" animateOnHover={false} /></span>
          <button onClick={() => router.push('/boosting')} className="primary-btn">
            Start Shopping
          </button>
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
                  <span><AnimatedLucideIcon icon={Gamepad2} size={20} animation="bounce" animateOnHover={false} /></span>
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
                <p>{formatPrice ? `${formatPrice(item.price)} each` : `$${item.price} each`}</p>
              </div>
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
                aria-label="Remove item"
                title="Remove item"
              >
                <X size={14} strokeWidth={2.5} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="cart-total">
        <div className="cart-total-text">
          <h3>Total: {formatPrice ? formatPrice(totalUsd) : `$${totalUsd}`}</h3>
        </div>
        <button
          className="checkout-btn"
          onClick={handleCheckout}
        >
          {user ? 'Proceed to Checkout' : 'Login to Checkout'}
        </button>
      </div>
    </div>
  )
}
