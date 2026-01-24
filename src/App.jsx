import { useEffect, useState } from 'react'
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import './App.css'
import { supabase } from './supabaseClient'
import Header from './components/Header'
import Home from './pages/Home'
import ServicesPage from './pages/Services'
import CartPage from './pages/CartPage'
import PlaceholderPage from './pages/PlaceholderPage'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import VerifyEmailPage from './pages/VerifyEmailPage'
import PendingVerificationPage from './pages/PendingVerificationPage'
import SettingsPage from './pages/SettingsPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import OrdersPage from './pages/OrdersPage'
import AdminOrdersPage from './pages/AdminOrdersPage'

function App() {
  const [cartItems, setCartItems] = useState([])
  const [checkoutStatus, setCheckoutStatus] = useState({ state: 'idle', message: '' })
  const [currency, setCurrency] = useState('GBP')
  const [paymentMethod, setPaymentMethod] = useState('stripe')
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const isDevUser = user?.email === 'daniel.holecek20@gmail.com'

  const currencyRates = {
    USD: 1,
    GBP: 0.79,
    EUR: 0.92
  }

  const currencySymbols = {
    USD: '$',
    GBP: '£',
    EUR: '€'
  }

  const formatPrice = (amountUsd) => {
    const rate = currencyRates[currency] ?? 1
    const symbol = currencySymbols[currency] ?? '$'
    return `${symbol}${(amountUsd * rate).toFixed(2)}`
  }

  const convertAmount = (amountUsd) => {
    const rate = currencyRates[currency] ?? 1
    return Number((amountUsd * rate).toFixed(2))
  }

  useEffect(() => {
    if (!isDevUser && paymentMethod === 'dev_skip') {
      setPaymentMethod('stripe')
    }
  }, [isDevUser, paymentMethod])

  // Check for successful payment return from Stripe
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const success = params.get('success')
    const orderId = params.get('orderId')
    
    if (success === 'true' && orderId) {
      setCheckoutStatus({ state: 'success', message: 'Payment successful! Your order has been confirmed.' })
      setCartItems([])
      
      // Clear the URL parameters
      window.history.replaceState({}, '', '/cart')
      
      // Auto-clear the success message after 15 seconds
      setTimeout(() => {
        setCheckoutStatus({ state: 'idle', message: '' })
      }, 15000)
    }
  }, [location])

  const services = [
    {
      id: 1,
      name: 'Web Development',
      price: 0.20,
      description: 'Build your professional website',
      icon: '⚡',
      platforms: ['Web', 'Mobile Web', 'Landing Page', 'E-commerce']
    },
    {
      id: 2,
      name: 'SEO Optimization',
      price: 0.20,
      description: 'Boost your search rankings',
      icon: '🔍',
      platforms: ['Google', 'Bing', 'Local SEO', 'App Store']
    },
    {
      id: 3,
      name: 'Mobile App',
      price: 0.20,
      description: 'Custom iOS & Android apps',
      icon: '📱',
      platforms: ['iOS', 'Android', 'Cross-platform']
    },
    {
      id: 4,
      name: 'Branding',
      price: 0.20,
      description: 'Create your brand identity',
      icon: '🎨',
      platforms: ['Logo', 'Guidelines', 'Pitch Deck', 'Social Kit']
    },
    {
      id: 5,
      name: 'Cloud Migration',
      price: 0.20,
      description: 'Secure cloud solutions',
      icon: '☁️',
      platforms: ['AWS', 'Azure', 'GCP', 'Hybrid']
    },
    {
      id: 6,
      name: 'Support Package',
      price: 0.20,
      description: '24/7 technical support',
      icon: '🛠️',
      platforms: ['Web', 'Mobile', 'Cloud', 'On-prem']
    }
  ]

  const addToCart = (service, platform) => {
    const cartId = `${service.id}-${platform}`
    const existingItem = cartItems.find(item => item.cartId === cartId)
    if (existingItem) {
      setCartItems(cartItems.map(item =>
        item.cartId === cartId
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ))
    } else {
      setCartItems([...cartItems, { ...service, cartId, platform, quantity: 1 }])
    }
  }

  const removeFromCart = (cartId) => {
    setCartItems(cartItems.filter(item => item.cartId !== cartId))
  }

  const updateQuantity = (cartId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(cartId)
    } else {
      setCartItems(cartItems.map(item =>
        item.cartId === cartId ? { ...item, quantity } : item
      ))
    }
  }

  const handleCheckout = async () => {
    if (!user) {
      navigate('/login')
      return
    }

    if (!cartItems.length) return

    setCheckoutStatus({ state: 'loading', message: 'Placing order...' })

    try {
      // Ensure we have a fresh authenticated session and user
      const { data: sessionData } = await supabase.auth.getSession()
      const sessionUser = sessionData?.session?.user
      if (!sessionUser?.id) {
        setCheckoutStatus({ state: 'error', message: 'Your session expired. Please log in again.' })
        navigate('/login')
        return
      }

      const totalUsd = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
      const totalConverted = convertAmount(totalUsd)

      const orderPayload = {
        // RLS requires user_id to match auth.uid()
        user_id: sessionUser.id,
        customer_email: sessionUser.email ?? user.email,
        customer_name: sessionUser.user_metadata?.name ?? user.name ?? null,
        items: cartItems.map(({ id, name, platform, quantity, price }) => ({
          id,
          name,
          platform,
          quantity,
          price_usd: price,
          price_converted: convertAmount(price),
          currency
        })),
        total_amount: totalConverted,
        currency,
        status: 'created',
        payment_status: paymentMethod === 'dev_skip' ? 'skipped' : 'pending',
        payment_method: paymentMethod === 'stripe' ? 'stripe_checkout' : paymentMethod,
        notes: paymentMethod === 'dev_skip'
          ? 'Dev payment bypassed'
          : paymentMethod === 'stripe'
            ? 'Stripe checkout initiated'
            : 'Payment pending (invoice/manual)'
      }

      const { data: orderRow, error } = await supabase
        .from('orders')
        .insert([orderPayload])
        .select()
        .single()

      if (error) {
        // Provide clearer hint when RLS blocks the insert
        const msg = error.message?.includes('row-level security')
          ? 'Access denied by security policy. Please log out and log back in, then try again.'
          : error.message
        setCheckoutStatus({ state: 'error', message: msg })
        return
      }

      if (paymentMethod === 'stripe') {
        // Call the Edge Function via fetch to avoid sending Authorization header
        const fnRes = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout-session`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify({ orderId: orderRow.id })
        })

        let fnData = null
        try { fnData = await fnRes.json() } catch (e) { /* ignore */ }

        if (!fnRes.ok) {
          setCheckoutStatus({ state: 'error', message: `Stripe error: ${fnData?.error || fnRes.statusText || 'Request failed'}` })
          return
        }
        
        if (fnData?.error) {
          setCheckoutStatus({ state: 'error', message: `Stripe error: ${fnData.error}` })
          return
        }

        const url = fnData?.url
        if (!url) {
          setCheckoutStatus({ state: 'error', message: 'Stripe checkout URL missing' })
          return
        }

        setCheckoutStatus({ state: 'loading', message: 'Redirecting to Stripe...' })
        window.location.assign(url)
        return
      }

      const successMessage = paymentMethod === 'dev_skip'
        ? 'Order placed. Payment was skipped (dev).'
        : 'Order placed. Payment pending (invoice/manual).'

      setCheckoutStatus({ state: 'success', message: successMessage })
      setCartItems([])
      navigate('/cart')
    } catch (err) {
      setCheckoutStatus({ state: 'error', message: err.message || 'Checkout failed' })
    }
  }

  return (
    <div className="app">
      <Header
        cartCount={cartItems.length}
        user={user}
        currency={currency}
        onCurrencyChange={setCurrency}
      />

      <Routes>
        <Route
          path="/"
          element={(
            <Home
              onGetStarted={() => navigate('/services')}
            />
          )}
        />
        <Route
          path="/services"
          element={(
            <ServicesPage
              services={services}
              cartItems={cartItems}
              addToCart={addToCart}
              removeFromCart={removeFromCart}
              updateQuantity={updateQuantity}
              currency={currency}
              formatPrice={formatPrice}
            />
          )}
        />
        <Route
          path="/products"
          element={(
            <PlaceholderPage
              title="Products"
              description="Browse packaged offerings, bundles, and add-ons tailored for Zeus clients."
            />
          )}
        />
        <Route
          path="/cart"
          element={(
            <CartPage
              cartItems={cartItems}
              removeFromCart={removeFromCart}
              updateQuantity={updateQuantity}
              onCheckout={handleCheckout}
              checkoutStatus={checkoutStatus}
              currency={currency}
              formatPrice={formatPrice}
              paymentMethod={paymentMethod}
              onPaymentMethodChange={setPaymentMethod}
              isDevUser={isDevUser}
              clearCart={() => setCartItems([])}
            />
          )}
        />
        <Route
          path="/login"
          element={<LoginPage />}
        />
        <Route
          path="/signup"
          element={<SignupPage />}
        />
        <Route
          path="/verify-email"
          element={<VerifyEmailPage />}
        />
        <Route
          path="/pending-verification"
          element={<PendingVerificationPage />}
        />
        <Route
          path="/settings"
          element={<SettingsPage />}
        />
        <Route
          path="/orders"
          element={<OrdersPage />}
        />
        <Route
          path="/admin/orders"
          element={<AdminOrdersPage />}
        />
        <Route
          path="/forgot-password"
          element={<ForgotPasswordPage />}
        />
        <Route
          path="/reset-password"
          element={<ResetPasswordPage />}
        />
      </Routes>
    </div>
  )
}

export default App
