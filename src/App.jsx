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
  const [cartItems, setCartItems] = useState([])
  const [checkoutStatus, setCheckoutStatus] = useState({ state: 'idle', message: '' })
  const [currency, setCurrency] = useState('GBP')
  const [userCountry, setUserCountry] = useState(null)
  const [orderNote, setOrderNote] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('stripe')
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const isDevUser = user?.email === 'daniel.holecek20@gmail.com'

  // Detect user's country and set currency accordingly
  useEffect(() => {
    const detectLocation = async () => {
      try {
        const response = await fetch('https://ipapi.co/json/')
        const data = await response.json()
        setUserCountry(data.country_code)
        
        // Set currency based on country
        const countryToCurrency = {
          'US': 'USD',
          'GB': 'GBP',
          'IE': 'EUR',
          'DE': 'EUR',
          'FR': 'EUR',
          'ES': 'EUR',
          'IT': 'EUR',
          'NL': 'EUR',
          'BE': 'EUR',
          'AT': 'EUR',
          'GR': 'EUR',
          'PT': 'EUR',
          'CY': 'EUR',
          'LU': 'EUR',
          'MT': 'EUR',
          'SK': 'EUR',
          'SI': 'EUR',
          'LT': 'EUR',
          'LV': 'EUR',
          'EE': 'EUR',
          'FI': 'EUR'
        }
        
        const detectedCurrency = countryToCurrency[data.country_code] || 'GBP'
        setCurrency(detectedCurrency)
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
    'Steam Enhanced',
    'Epic Games Enhanced',
    'Xbox App Enhanced',
    'Rockstar Launcher Enhanced',
    'Steam Legacy',
    'Epic Games Legacy',
    'Xbox App Legacy',
    'Rockstar Launcher Legacy'
  ]

  const services = [
    {
      id: 1,
      name: '🚗 50 Modded Cars',
      price: 3.00,
      description: '🚗 Fully customized vehicles delivered in minutes. Includes a variety of sports cars, supercars, and unique vehicles ready to dominate the streets of Los Santos.',
      icon: '🚗',
      platforms: platformOptions,
      details: [
        '📌 You must already own GTA V / GTA Online before purchasing',
        '💥 50 Modded Cars included',
        '✅ Completed within 20-5 hours',
        '🔑 Login access required',
        '🚫 Game not included – progression account only. You take full responsibility for your account. Free service if you receive a ban, but no game key provided.'
      ]
    },
    {
      id: 2,
      name: '👕 20 Modded Outfits',
      price: 3.00,
      description: '🎨 Stylish modded outfits to make your character stand out.',
      icon: '👕',
      platforms: platformOptions,
      details: [
        '📌 You must already own GTA V / GTA Online before purchasing',
        '💥 20 Premium Modded Outfits included',
        '✅ Completed within 20-5 hours',
        '🔑 Login access required',
        '🚫 Game not included – progression account only. You take full responsibility for your account. Free service if you receive a ban, but no game key provided.'
      ]
    },
    {
      id: 3,
      name: '💸 Custom Cash',
      price: 3.00,
      description: '💰 Add any amount of custom cash to your account. 30m-50m recommended per 24h for safety, but you choose the amount that works for you.',
      icon: '💸',
      platforms: platformOptions,
      details: [
        '📌 You must already own GTA V / GTA Online before purchasing',
        '💥 Custom cash amount of your choice (30m-50m recommended per 24h)',
        '✅ Completed within 20-5 hours',
        '🔑 Login access required',
        '🚫 Game not included – progression account only. You take full responsibility for your account. Free service if you receive a ban, but no game key provided.'
      ]
    },
    {
      id: 4,
      name: '💸 Ultimate GTA Package',
      price: 6.00,
      description: '⚡ The complete GTA Online transformation! Custom cash, max level, all unlocks, fast run, premium outfits, modded cars, and all properties. Everything you need for the ultimate account.',
      icon: '⚡',
      platforms: platformOptions,
      details: [
        '📌 You must already own GTA V / GTA Online before purchasing',
        '💥 What\'s Included:',
        '  💰 Custom cash amount (50m recommended per 24h)',
        '  📈 Level 1–8000 of your choice',
        '  🔥 All stats maxed out',
        '  🔓 All content unlocked + achievements',
        '  🏃 Fast run enabled',
        '  🎯 Customizable K/D ratio, account creation date & playtime',
        '  👕 Premium modded outfits',
        '  🚗 Any vehicles of your choice',
        '  🏡 All businesses & properties purchased',
        '✅ Completed within 20-5 hours',
        '🔑 Login access required',
        '🚫 Game not included – progression account only. You take full responsibility for your account. Free service if you receive a ban, but no game key provided.'
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

      // Create order via Edge Function (encrypts note server-side)
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
          status: 'created',
          payment_status: paymentMethod === 'dev_skip' ? 'skipped' : 'pending',
          payment_method: paymentMethod === 'dev_skip' ? 'dev_skip' : 'stripe_checkout',
          notes: orderNote
        })
      })

      const createOrderData = await createOrderRes.json()
      if (!createOrderRes.ok || createOrderData?.error) {
        setCheckoutStatus({ state: 'error', message: createOrderData?.error || 'Order creation failed' })
        return
      }

      const orderRow = createOrderData.order

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

      // Non-Stripe path is dev-skip only
      setCheckoutStatus({ state: 'success', message: 'Order placed. Payment was skipped (dev).' })
      setCartItems([])
      setOrderNote('')
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
