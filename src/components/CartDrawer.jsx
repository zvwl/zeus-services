'use client'

import { useEffect, useRef } from 'react'
import { X, ShoppingCart, Plus, Minus, Trash2, ArrowRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { useCart } from '@/contexts/CartContext'
import './CartDrawer.css'
import AnimatedLucideIcon from './AnimatedLucideIcon'

export default function CartDrawer() {
  const router = useRouter()
  const { cartItems, isCartOpen: isOpen, closeCart: onClose, removeFromCart: onRemove, updateQuantity: onUpdateQuantity, formatPrice } = useCart()
  const itemPathCacheRef = useRef({})

  useEffect(() => {
    document.body.classList.toggle('overlay-cart-open', isOpen)
    return () => document.body.classList.remove('overlay-cart-open')
  }, [isOpen])

  const totalUsd = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)

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
    onClose()
    router.push(`${itemPath}?cartId=${encodeURIComponent(item.cartId)}`)
  }

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])


  const handleCheckout = () => {
    onClose()
    router.push('/checkout')
  }

  const handleViewCart = () => {
    onClose()
    router.push('/cart')
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div 
        className="cart-drawer-backdrop"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="cart-drawer">
        {/* Header */}
        <div className="cart-drawer-header">
          <div className="cart-drawer-header-copy">
            <span className="cart-drawer-kicker">Cart</span>
            <h2 className="cart-drawer-title">
              <ShoppingCart size={22} />
              Your cart
            </h2>
            <p className="cart-drawer-subtitle">
              {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'} ready for checkout
            </p>
          </div>
          <button 
            className="cart-drawer-close" 
            onClick={onClose}
            aria-label="Close cart"
          >
            <X size={24} />
          </button>
        </div>

        {/* Items */}
        <div className="cart-drawer-items">
          {cartItems.length === 0 ? (
            <div className="cart-drawer-empty">
              <AnimatedLucideIcon 
                icon={ShoppingCart} 
                size={64} 
                animation="swing"
                animateOnHover={false}
              />
              <h3>Your cart is empty</h3>
              <p>Add items to get started</p>
            </div>
          ) : (
            <>
              {cartItems.map((item) => (
                <div
                  key={item.cartId}
                  className={`cart-drawer-item${canNavigateToItem(item) ? ' clickable' : ''}`}
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
                  <div className="cart-drawer-item-image">
                    <img 
                      src={item.icon || '/zeusservicesPackage.webp'} 
                      alt={item.name}
                      onError={(e) => {
                        e.target.src = '/zeusservicesPackage.webp'
                      }}
                    />
                  </div>
                  
                  <div className="cart-drawer-item-details">
                    <div className="cart-drawer-item-heading-row">
                      <h4>{item.name}</h4>
                      <div className="cart-drawer-item-price">
                        {formatPrice ? formatPrice(item.price) : `£${item.price}`}
                      </div>
                    </div>
                    <p className="cart-drawer-item-platform">{item.platform}</p>
                    
                    <div className="cart-drawer-item-footer">
                      <div className="cart-drawer-item-quantity">
                        <button
                          onClick={(event) => {
                            event.stopPropagation()
                            onUpdateQuantity(item.cartId, Math.max(1, item.quantity - 1), false)
                          }}
                          className="quantity-btn"
                          aria-label="Decrease quantity"
                        >
                          <Minus size={14} />
                        </button>
                        <span>{item.quantity}</span>
                        <button
                          onClick={(event) => {
                            event.stopPropagation()
                            onUpdateQuantity(item.cartId, item.quantity + 1, false)
                          }}
                          className="quantity-btn"
                          aria-label="Increase quantity"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={(event) => {
                      event.stopPropagation()
                      onRemove(item.cartId, false)
                    }}
                    className="cart-drawer-item-remove"
                    aria-label="Remove item"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}

              <div className="cart-drawer-summary">
                <div className="cart-drawer-total">
                  <div className="cart-drawer-total-row">
                    <span className="cart-drawer-total-label">Subtotal</span>
                    <span className="cart-drawer-total-value">
                      {formatPrice ? formatPrice(totalUsd) : `£${totalUsd.toFixed(2)}`}
                    </span>
                  </div>
                  <div className="cart-drawer-total-row cart-drawer-total-final">
                    <span className="cart-drawer-total-label">Total</span>
                    <span className="cart-drawer-total-value">
                      {formatPrice ? formatPrice(totalUsd) : `£${totalUsd.toFixed(2)}`}
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {cartItems.length > 0 && (
          <div className="cart-drawer-footer">
            <div className="cart-drawer-note">
              <span>Secure checkout</span>
              <span>Orders are processed instantly after payment.</span>
            </div>
            <div className="cart-drawer-actions">
              <button className="cart-drawer-btn cart-drawer-btn-primary" onClick={handleCheckout}>
                Proceed to Checkout
                <ArrowRight size={18} />
              </button>
              <button className="cart-drawer-btn cart-drawer-btn-secondary" onClick={handleViewCart}>
                View Full Cart
              </button>
              <button className="cart-drawer-btn cart-drawer-btn-ghost" onClick={onClose}>
                Continue Shopping
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
