import { useEffect, useState } from 'react'
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import './App.css'
import { supabase } from './supabaseClient'
import Header from './components/Header'
import Footer from './components/Footer'
import Home from './pages/Home'
import ServicesPage from './pages/Services'
import ServiceDetail from './pages/ServiceDetail'
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
  // Load cart from localStorage on mount
  const [cartItems, setCartItems] = useState(() => {
    try {
      const savedCart = localStorage.getItem('cartItems')
      return savedCart ? JSON.parse(savedCart) : []
    } catch {
      return []
    }
  })
  const [checkoutStatus, setCheckoutStatus] = useState({ state: 'idle', message: '' })
  const [currency, setCurrency] = useState('GBP')
  const [userCountry, setUserCountry] = useState(null)
  const [orderNote, setOrderNote] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('stripe')
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const isDevUser = user?.email === 'daniel.holecek20@gmail.com'

  // Persist cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('cartItems', JSON.stringify(cartItems))
  }, [cartItems])

  // Detect user's country and set currency accordingly via backend
  useEffect(() => {
    const detectLocation = async () => {
      try {
        const response = await fetch('https://xdvbhungoadwlmeddelt.supabase.co/functions/v1/detect-location')
        const data = await response.json()
        setUserCountry(data.country_code)
        setCurrency(data.currency)
      } catch (err) {
        console.log('Location detection failed, defaulting to GBP:', err)
        setCurrency('GBP')
      }
    }
    
    detectLocation()
  }, [])

  const currencyRates = {
    GBP: 1,
    USD: 1.27,
    EUR: 1.09
  }

  const currencySymbols = {
    GBP: '£',
    USD: '$',
    EUR: '€'
  }

  const formatPrice = (amountGbp) => {
    const rate = currencyRates[currency] ?? 1
    const symbol = currencySymbols[currency] ?? '£'
    return `${symbol}${(amountGbp * rate).toFixed(2)}`
  }

  const convertAmount = (amountGbp) => {
    const rate = currencyRates[currency] ?? 1
    return Number((amountGbp * rate).toFixed(2))
  }

  useEffect(() => {
    if (!isDevUser && paymentMethod === 'dev_skip') {
      setPaymentMethod('stripe')
    }
  }, [isDevUser, paymentMethod])

  // Handle pending cart item after login (from both email and OAuth logins)
  useEffect(() => {
    // Don't redirect if user is still on login page (might be in MFA flow)
    if (user && location.pathname !== '/login') {
      const pendingItem = localStorage.getItem('pendingCartItem')
      if (pendingItem) {
        try {
          const { serviceId, platform: fullPlatform } = JSON.parse(pendingItem)
          console.log('Found pending item in App - serviceId:', serviceId, 'platform:', fullPlatform)
          // Redirect to the service detail page to trigger auto-add
          navigate(`/service/${serviceId}`)
          // Don't remove from localStorage here - let ServiceDetail handle it
        } catch (err) {
          console.error('Error processing pending cart item in App:', err)
          localStorage.removeItem('pendingCartItem')
        }
      }
    }
  }, [user, location.pathname, navigate])

  // Check for successful payment return from Stripe
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const success = params.get('success')
    const orderId = params.get('orderId')

    if (success === 'true' && orderId) {
      setCheckoutStatus({ state: 'success', message: 'Payment successful! Your order has been confirmed.' })
      setCartItems([])
      setOrderNote('')

      // Clear the URL parameters
      window.history.replaceState({}, '', '/cart')

      // Auto-clear the success message after 15 seconds
      setTimeout(() => {
        setCheckoutStatus({ state: 'idle', message: '' })
      }, 15000)
    }
  }, [location])

  const platformOptions = [
    'Steam',
    'Epic Games',
    'Xbox App',
    'Rockstar Launcher'
  ]

  const services = [
    {
      id: 1,
      name: '🚗 50 Modded Cars',
      price: 3.00,
      description: 'Get 50 fully customized modded vehicles added to your account. Delivered manually within 30 minutes to 12 hours.',
      icon: '🚗',
      platforms: platformOptions,
      details: [
        '📌 You must already own GTA V / GTA Online before purchasing',
        '💥 What\'s Included:',
        '  🚗 50 Modded Cars of your choice',
        '⏱️ Delivery:',
        '  ✅ Completed within 30 minutes to 12 hours',
        '  🔑 Login access required',
        '  💬 We\'ll contact you via Discord with full instructions',
        '⚠️ Important:',
        '  By purchasing this service, you take full responsibility for your account. If your account receives a ban, we\'ll provide a free service once to restore your account, but we cannot purchase a game key for you and refunds are not available. See our Terms & Conditions for more details.'
      ]
    },
    {
      id: 2,
      name: '👕 20 Modded Outfits',
      price: 3.00,
      description: 'Get 20 premium modded outfits to make your character stand out. Delivered manually within 30 minutes to 12 hours.',
      icon: '👕',
      platforms: platformOptions,
      details: [
        '📌 You must already own GTA V / GTA Online before purchasing',
        '💥 What\'s Included:',
        '  👕 20 Premium Modded Outfits',
        '⏱️ Delivery:',
        '  ✅ Completed within 30 minutes to 12 hours',
        '  🔑 Login access required',
        '  💬 We\'ll contact you via Discord with full instructions',
        '⚠️ Important:',
        '  By purchasing this service, you take full responsibility for your account. If your account receives a ban, we\'ll provide a free service once to restore your account, but we cannot purchase a game key for you and refunds are not available. See our Terms & Conditions for more details.'
      ]
    },
    {
      id: 3,
      name: '💸 Custom Cash',
      price: 3.00,
      description: 'Add any amount of custom cash to your account (30m–50m recommended per 24 hours for safety). Delivered manually within 30 minutes to 12 hours.',
      icon: '💸',
      platforms: platformOptions,
      details: [
        '📌 You must already own GTA V / GTA Online before purchasing',
        '💥 What\'s Included:',
        '  💰 Any amount of custom cash (30m–50m recommended per 24 hours, your choice)',
        '⏱️ Delivery:',
        '  ✅ Completed within 30 minutes to 12 hours',
        '  🔑 Login access required',
        '  💬 We\'ll contact you via Discord with full instructions',
        '⚠️ Important:',
        '  By purchasing this service, you take full responsibility for your account. If your account receives a ban, we\'ll provide a free service once to restore your account, but we cannot purchase a game key for you and refunds are not available. See our Terms & Conditions for more details.'
      ]
    },
    {
      id: 4,
      name: '💸 Ultimate GTA Package',
      price: 6.00,
      description: 'The complete GTA Online transformation! Custom cash, max level, all unlocks, fast run, premium outfits, modded cars, and all properties. Delivered manually within 1–24 hours.',
      icon: '⚡',
      platforms: platformOptions,
      details: [
        '📌 You must already own GTA V / GTA Online before purchasing',
        '💥 What\'s Included:',
        '  💰 Custom cash amount (50m recommended per 24 hours, your choice)',
        '  📈 Level 1–8000 of your choice',
        '  🔥 All stats maxed out',
        '  🔓 All content unlocked + all achievements',
        '  🏃 Fast run enabled',
        '  🎯 Customizable K/D ratio, account creation date & playtime',
        '  👕 Premium modded outfits',
        '  🚗 Any vehicles of your choice',
        '  🏡 All businesses & properties purchased',
        '⏱️ Delivery:',
        '  ✅ Completed within 1–24 hours',
        '  🔑 Login access required',
        '  💬 We\'ll contact you via Discord with full instructions',
        '⚠️ Important:',
        '  By purchasing this service, you take full responsibility for your account. If your account receives a ban, we\'ll provide a free service once to restore your account, but we cannot purchase a game key for you and refunds are not available. See our Terms & Conditions for more details.'
      ]
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
      const accessToken = sessionData?.session?.access_token
      if (!sessionUser?.id) {
        setCheckoutStatus({ state: 'error', message: 'Your session expired. Please log in again.' })
        navigate('/login')
        return
      }

      const totalUsd = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
      const totalConverted = convertAmount(totalUsd)

      if (paymentMethod === 'dev_skip') {
        // For dev_skip, create order directly via create-order function
        const createOrderRes = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-order`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
            Authorization: `Bearer ${accessToken}`
          },
          body: JSON.stringify({
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
            status: 'processing',
            payment_status: 'skipped',
            payment_method: 'dev_skip',
            notes: orderNote
          })
        })

        const createOrderData = await createOrderRes.json()
        if (!createOrderRes.ok || createOrderData?.error) {
          setCheckoutStatus({ state: 'error', message: createOrderData?.error || 'Order creation failed' })
          return
        }

        // Clear cart and show success
        setCartItems([])
        setCheckoutStatus({ state: 'success', message: 'Dev order created!' })
        navigate('/orders')
        return
      }

      // For Stripe payments, go directly to checkout without creating order
      if (paymentMethod === 'stripe') {
        const fnRes = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout-session`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
            Authorization: `Bearer ${accessToken}`
          },
          body: JSON.stringify({
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
            customer_email: sessionUser.email,
            customer_name: sessionUser.user_metadata?.name || sessionUser.email?.split('@')[0],
            notes: orderNote
          })
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
              formatPrice={formatPrice}
            />
          )}
        />
        <Route
          path="/service/:id"
          element={(
            <ServiceDetail
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
              orderNote={orderNote}
              onOrderNoteChange={setOrderNote}
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
        <Route
          path="/terms"
          element={(
            <PlaceholderPage
              title="Terms & Conditions"
              description="Our terms of service and user agreement."
            />
          )}
        />
        <Route
          path="/privacy"
          element={(
            <PlaceholderPage
              title="Privacy Policy"
              description="How we collect, use, and protect your personal information."
            />
          )}
        />
        <Route
          path="/refund"
          element={(
            <PlaceholderPage
              title="Refund Policy"
              description="Information about refunds, cancellations, and our guarantee."
            />
          )}
        />
      </Routes>
      <Footer />
    </div>
  )
}

export default App
