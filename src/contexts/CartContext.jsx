'use client'

import { createContext, useContext, useState, useEffect, useReducer } from 'react'
import { supabase } from '@/lib/supabase/client'

const CartContext = createContext(null)

export const useCart = () => {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}

const currencyRates = { GBP: 1, USD: 1.27, EUR: 1.09 }
const currencySymbols = { GBP: '£', USD: '$', EUR: '€' }

const toastReducer = (state, action) => {
  const maxVisible = action.maxVisible ?? 4
  switch (action.type) {
    case 'ADD':
      if (state.visible.length < maxVisible)
        return { ...state, visible: [...state.visible, action.toast] }
      return { ...state, queue: [...state.queue, action.toast] }
    case 'REMOVE': {
      const newVisible = state.visible.filter(t => t.id !== action.id)
      if (newVisible.length < maxVisible && state.queue.length > 0)
        return { visible: [state.queue[0], ...newVisible], queue: state.queue.slice(1) }
      return { ...state, visible: newVisible }
    }
    case 'REBALANCE': {
      if (state.visible.length > maxVisible) {
        const overflow = state.visible.slice(0, state.visible.length - maxVisible)
        const kept = state.visible.slice(state.visible.length - maxVisible)
        return { visible: kept, queue: [...overflow, ...state.queue] }
      }
      if (state.visible.length < maxVisible && state.queue.length > 0) {
        const slots = maxVisible - state.visible.length
        return { visible: [...state.queue.slice(0, slots), ...state.visible], queue: state.queue.slice(slots) }
      }
      return state
    }
    case 'CLEAR_ALL':
      return { visible: [], queue: [] }
    default:
      return state
  }
}

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([])
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [currency, setCurrency] = useState('GBP')
  const [orderNote, setOrderNote] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('stripe')
  const [checkoutStatus, setCheckoutStatus] = useState({ state: 'idle', message: '' })
  const [maxVisibleToasts, setMaxVisibleToasts] = useState(4)
  const [toastState, dispatchToast] = useReducer(toastReducer, { visible: [], queue: [] })

  // Load cart from localStorage after mount (avoids SSR/client hydration mismatch)
  useEffect(() => {
    try {
      const saved = localStorage.getItem('cartItems')
      if (saved) setCartItems(JSON.parse(saved))
    } catch {}
  }, [])

  // Persist cart
  useEffect(() => {
    localStorage.setItem('cartItems', JSON.stringify(cartItems))
  }, [cartItems])

  // Responsive toast limit
  useEffect(() => {
    const update = () => setMaxVisibleToasts(window.innerWidth <= 640 ? 2 : 4)
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  useEffect(() => {
    dispatchToast({ type: 'REBALANCE', maxVisible: maxVisibleToasts })
  }, [maxVisibleToasts])

  // Detect user currency via edge function
  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/detect-location`)
      .then(r => r.json())
      .then(d => { if (d.currency) setCurrency(d.currency) })
      .catch(() => {})
  }, [])

  const formatPrice = (amountGbp) => {
    const rate = currencyRates[currency] ?? 1
    const symbol = currencySymbols[currency] ?? '£'
    return `${symbol}${(amountGbp * rate).toFixed(2)}`
  }

  const convertAmount = (amountGbp) => {
    const rate = currencyRates[currency] ?? 1
    return Number((amountGbp * rate).toFixed(2))
  }

  const addToast = (message, type = 'info') => {
    dispatchToast({
      type: 'ADD',
      maxVisible: maxVisibleToasts,
      toast: { id: Date.now(), message, type, duration: 3500 }
    })
  }

  const removeToast = (id) => {
    dispatchToast({ type: 'REMOVE', id, maxVisible: maxVisibleToasts })
  }

  const addToCart = (service, platform) => {
    const versionKey = service?.version || ''
    const cartId = `${service.id}-${platform || ''}-${versionKey}`
    const existing = cartItems.find(i => i.cartId === cartId)
    if (existing) {
      setCartItems(cartItems.map(i => i.cartId === cartId ? { ...i, quantity: i.quantity + 1 } : i))
      addToast(`Updated ${service.name} quantity in cart`, 'success')
    } else {
      setCartItems([...cartItems, { ...service, cartId, platform, version: versionKey, quantity: 1 }])
      addToast(`Added ${service.name} to cart`, 'success')
    }
  }

  const removeFromCart = (cartId, showNotification = true) => {
    const removed = cartItems.find(i => i.cartId === cartId)
    setCartItems(cartItems.filter(i => i.cartId !== cartId))
    if (removed && showNotification) addToast(`Removed ${removed.name} from cart`, 'info')
  }

  const updateQuantity = (cartId, quantity, showNotification = true) => {
    if (quantity <= 0) {
      removeFromCart(cartId, showNotification)
    } else {
      setCartItems(cartItems.map(i => i.cartId === cartId ? { ...i, quantity } : i))
    }
  }

  const clearCart = () => setCartItems([])

  const handleCheckout = async () => {
    if (!cartItems.length) return

    setCheckoutStatus({ state: 'loading', message: 'Placing order...' })

    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const sessionUser = sessionData?.session?.user
      const accessToken = sessionData?.session?.access_token

      if (!sessionUser?.id) {
        setCheckoutStatus({ state: 'error', message: 'Session expired. Please log in again.' })
        window.location.href = '/login?redirect=/checkout'
        return
      }

      const totalConverted = cartItems.reduce((sum, item) => sum + convertAmount(item.price) * item.quantity, 0)
      const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

      if (paymentMethod === 'dev_skip') {
        const res = await fetch(`${baseUrl}/functions/v1/create-order`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            items: cartItems.map(({ id, name, platform, version, customSelections, quantity, price }) => ({
              id, name, platform, version,
              customSelections: customSelections && typeof customSelections === 'object' ? customSelections : undefined,
              quantity, price_usd: price, price_converted: convertAmount(price), currency,
            })),
            total_amount: totalConverted, currency,
            status: 'processing', payment_status: 'skipped', payment_method: 'dev_skip', notes: orderNote,
          }),
        })
        const data = await res.json()
        if (!res.ok || data?.error) {
          setCheckoutStatus({ state: 'error', message: data?.error || 'Order creation failed' })
          return
        }
        clearCart()
        setCheckoutStatus({ state: 'success', message: 'Dev order created!' })
        window.location.href = '/orders'
        return
      }

      // Stripe hosted checkout — redirect to Stripe's checkout page
      const res = await fetch(`${baseUrl}/functions/v1/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          items: cartItems.map(({ id, name, platform, version, customSelections, quantity, price }) => ({
            id, name, platform, version,
            customSelections: customSelections && typeof customSelections === 'object' ? customSelections : undefined,
            quantity, price_usd: price, price_converted: convertAmount(price), currency,
          })),
          total_amount: totalConverted, currency,
          customer_email: sessionUser.email,
          customer_name: sessionUser.user_metadata?.name || sessionUser.email?.split('@')[0],
          notes: orderNote,
        }),
      })

      let data = null
      try { data = await res.json() } catch (_) {}

      if (!res.ok || data?.error) {
        setCheckoutStatus({ state: 'error', message: `Stripe error: ${data?.error || res.statusText}` })
        return
      }

      const url = data?.url
      if (!url) {
        setCheckoutStatus({ state: 'error', message: 'Stripe checkout URL missing' })
        return
      }

      setCheckoutStatus({ state: 'loading', message: 'Redirecting to Stripe...' })
      localStorage.setItem('lastPaymentAttempt', JSON.stringify({
        timestamp: Date.now(),
        cartItems: cartItems.map(i => ({ id: i.id, name: i.name, price: i.price, quantity: i.quantity })),
        currency,
      }))
      window.location.assign(url)
    } catch (err) {
      setCheckoutStatus({ state: 'error', message: err.message || 'Checkout failed' })
    }
  }

  const handleOrderNoteChange = (value) => {
    setOrderNote(value.replace(/<[^>]*>/g, '').slice(0, 1000))
  }

  const value = {
    cartItems, cartCount: cartItems.length,
    addToCart, removeFromCart, updateQuantity, clearCart,
    isCartOpen, openCart: () => setIsCartOpen(true), closeCart: () => setIsCartOpen(false),
    currency, setCurrency, formatPrice, convertAmount,
    toasts: toastState.visible, addToast, removeToast,
    orderNote, handleOrderNoteChange,
    paymentMethod, setPaymentMethod,
    checkoutStatus, setCheckoutStatus, handleCheckout,
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}
