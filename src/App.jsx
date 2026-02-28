import { useEffect, useState, lazy, Suspense } from 'react'
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import './App.css'
import { supabase } from './supabaseClient'
import { isPrerender } from './utils/isPrerender'
import Header from './components/Header'
import Footer from './components/Footer'
import ScrollToTop from './components/ScrollToTop'
import ProtectedAdminRoute from './components/ProtectedAdminRoute'
import CookieBanner from './components/CookieBanner'
import StatusBanner from './components/StatusBanner'
import LoadingSpinner from './components/LoadingSpinner'
import { ToastContainer } from './components/Toast'
import Home from './pages/Home'
const CategoryPage = lazy(() => import('./pages/CategoryPage'))
const ItemDetailPage = lazy(() => import('./pages/ItemDetailPage'))

// Lazy load secondary routes to reduce initial bundle
const CartPage = lazy(() => import('./pages/CartPage'))
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'))
const PlaceholderPage = lazy(() => import('./pages/PlaceholderPage'))
const LoginPage = lazy(() => import('./pages/LoginPage'))
const SignupPage = lazy(() => import('./pages/SignupPage'))
const VerifyEmailPage = lazy(() => import('./pages/VerifyEmailPage'))
const PendingVerificationPage = lazy(() => import('./pages/PendingVerificationPage'))
const SettingsPage = lazy(() => import('./pages/SettingsPage'))
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'))
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'))
const OrdersPage = lazy(() => import('./pages/OrdersPage'))
const AdminOrdersPage = lazy(() => import('./pages/AdminOrdersPage'))
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'))
const AdminServicesPage = lazy(() => import('./pages/AdminServicesPage'))
const AdminProductsPage = lazy(() => import('./pages/AdminProductsPage'))
const AdminGamesPage = lazy(() => import('./pages/AdminGamesPage'))
const AdminItemsPage = lazy(() => import('./pages/AdminItemsPage'))
const TermsPage = lazy(() => import('./pages/TermsPage'))
const PrivacyPage = lazy(() => import('./pages/PrivacyPage'))
const RefundPage = lazy(() => import('./pages/RefundPage'))
const ReviewsPage = lazy(() => import('./pages/ReviewsPage'))
const ReviewForm = lazy(() => import('./pages/ReviewForm'))
const AdminReviewsPage = lazy(() => import('./pages/AdminReviewsPage'))
const SafetyPage = lazy(() => import('./pages/SafetyPage'))
const TrustPage = lazy(() => import('./pages/TrustPage'))
const ProcessPage = lazy(() => import('./pages/ProcessPage'))
const FAQPage = lazy(() => import('./pages/FAQPage'))
const ComparisonPage = lazy(() => import('./pages/ComparisonPage'))

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
  const [servicesLoading, setServicesLoading] = useState(false)
  const [checkoutStatus, setCheckoutStatus] = useState({ state: 'idle', message: '' })
  const [currency, setCurrency] = useState('GBP')
  const [userCountry, setUserCountry] = useState(null)
  const [orderNote, setOrderNote] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('stripe')
  const [toasts, setToasts] = useState([])
  const { user, isAdmin } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  // Sanitize order note input (remove HTML tags, limit length)
  const handleOrderNoteChange = (value) => {
    // Remove HTML tags
    const sanitized = value.replace(/<[^>]*>/g, '')
    // Limit to 1000 characters
    const trimmed = sanitized.slice(0, 1000)
    setOrderNote(trimmed)
  }


  const isDevUser = user?.email === 'daniel.holecek20@gmail.com'

  // Persist cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('cartItems', JSON.stringify(cartItems))
  }, [cartItems])

  // Handle OAuth redirect - if user just logged in and there's a stored redirect, apply it
  useEffect(() => {
    if (user) {
      const storedRedirect = localStorage.getItem('oauthRedirect')
      if (storedRedirect) {
        localStorage.removeItem('oauthRedirect')
        // Validate redirect is internal path only to prevent open redirect
        const validRedirect = storedRedirect.startsWith('/') && !storedRedirect.startsWith('//') ? storedRedirect : '/boosting'
        navigate(validRedirect)
      }
    }
  }, [user, navigate])

  // Note: No longer needed - AuthContext now properly persists and recovers sessions
  // CartPage handles any session recovery issues during payment redirects

  // Detect user's country and set currency accordingly via backend
  useEffect(() => {
    const detectLocation = async () => {
      if (isPrerender()) return
      try {
        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/detect-location`)
        const data = await response.json()
        setUserCountry(data.country_code)
        setCurrency(data.currency)
      } catch (err) {
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
          const { itemSlug, gameSlug, categorySlug } = JSON.parse(pendingItem)
          if (itemSlug && gameSlug && categorySlug) {
            navigate(`/${categorySlug}/${gameSlug}/${itemSlug}`)
          }
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

  const addToast = (message, type = 'info') => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, type, duration: 3500 }])
  }

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }

  const addToCart = (service, platform) => {
    const cartId = `${service.id}-${platform}`
    const existingItem = cartItems.find(item => item.cartId === cartId)
    if (existingItem) {
      setCartItems(cartItems.map(item =>
        item.cartId === cartId
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ))
      addToast(`Updated ${service.name} quantity in cart`, 'success')
    } else {
      setCartItems([...cartItems, { ...service, cartId, platform, quantity: 1 }])
      addToast(`Added ${service.name} to cart`, 'success')
    }
  }

  const removeFromCart = (cartId) => {
    const removedItem = cartItems.find(item => item.cartId === cartId)
    setCartItems(cartItems.filter(item => item.cartId !== cartId))
    if (removedItem) {
      addToast(`Removed ${removedItem.name} from cart`, 'info')
    }
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
      console.warn('Checkout failed: No user logged in')
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
        console.error('Checkout failed: Session expired or invalid')
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
            items: cartItems.map(({ id, name, platform, version, quantity, price }) => ({
              id,
              name,
              platform,
              version,
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
            items: cartItems.map(({ id, name, platform, version, quantity, price }) => ({
              id,
              name,
              platform,
              version,
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
          const errorMsg = `Stripe error: ${fnData?.error || fnRes.statusText || 'Request failed'}`
          console.error('Stripe checkout failed:', { status: fnRes.status, error: fnData, errorMsg })
          setCheckoutStatus({ state: 'error', message: errorMsg })
          return
        }

        if (fnData?.error) {
          const errorMsg = `Stripe error: ${fnData.error}`
          console.error('Stripe checkout error:', fnData)
          setCheckoutStatus({ state: 'error', message: errorMsg })
          return
        }

        const url = fnData?.url
        if (!url) {
          console.error('Stripe checkout URL missing', fnData)
          setCheckoutStatus({ state: 'error', message: 'Stripe checkout URL missing' })
          return
        }

        setCheckoutStatus({ state: 'loading', message: 'Redirecting to Stripe...' })
        
        // Store payment info in case session is lost during redirect
        localStorage.setItem('lastPaymentAttempt', JSON.stringify({
          timestamp: Date.now(),
          cartItems: cartItems.map(item => ({ id: item.id, name: item.name, price: item.price, quantity: item.quantity })),
          currency: currency
        }))
        
        window.location.assign(url)
        return
      }
    } catch (err) {
      console.error('Checkout exception:', err)
      setCheckoutStatus({ state: 'error', message: err.message || 'Checkout failed' })
    }
  }

  return (
    <div className="app">
      <div className="top-stack">
        <Header
          cartCount={cartItems.length}
          user={user}
          currency={currency}
          onCurrencyChange={setCurrency}
        />
        <StatusBanner />
      </div>
      <div className="top-stack-spacer" />

      <Suspense fallback={<LoadingSpinner message="Loading page..." />}>
        <Routes>
        <Route
          path="/"
          element={(
            <Home
              onGetStarted={() => navigate('/boosting')}
            />
          )}
        />
        <Route
          path="/services"
          element={<Navigate to="/boosting" replace />}
        />
        <Route
          path="/service/:id"
          element={<Navigate to="/boosting" replace />}
        />
        <Route
          path="/product/:id"
          element={<Navigate to="/accounts" replace />}
        />
        <Route
          path="/products"
          element={<Navigate to="/accounts" replace />}
        />
        {/* New multi-game category routes - order: most specific first */}
        <Route
          path="/:categorySlug/:gameSlug/:itemSlug"
          element={(
            <ItemDetailPage
              formatPrice={formatPrice}
              addToCart={addToCart}
              platformOptions={platformOptions}
              cartItems={cartItems}
              updateQuantity={updateQuantity}
              removeFromCart={removeFromCart}
            />
          )}
        />
        <Route
          path="/:categorySlug/:gameSlug"
          element={(
            <CategoryPage
              formatPrice={formatPrice}
              addToCart={addToCart}
              platformOptions={platformOptions}
            />
          )}
        />
        <Route
          path="/:categorySlug"
          element={(
            <CategoryPage
              formatPrice={formatPrice}
              addToCart={addToCart}
              platformOptions={platformOptions}
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
              currency={currency}
              formatPrice={formatPrice}
              clearCart={() => setCartItems([])}
            />
          )}
        />
        <Route
          path="/checkout"
          element={(
            <CheckoutPage
              cartItems={cartItems}
              onCheckout={handleCheckout}
              checkoutStatus={checkoutStatus}
              currency={currency}
              formatPrice={formatPrice}
              paymentMethod={paymentMethod}
              onPaymentMethodChange={setPaymentMethod}
              isDevUser={isDevUser}
              orderNote={orderNote}
              onOrderNoteChange={handleOrderNoteChange}
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
          element={
            <ProtectedAdminRoute>
              <AdminOrdersPage />
            </ProtectedAdminRoute>
          }
        />
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedAdminRoute>
              <AdminDashboard />
            </ProtectedAdminRoute>
          }
        />
        <Route
          path="/admin/services"
          element={
            <ProtectedAdminRoute>
              <AdminServicesPage />
            </ProtectedAdminRoute>
          }
        />
        <Route
          path="/admin/products"
          element={
            <ProtectedAdminRoute>
              <AdminProductsPage />
            </ProtectedAdminRoute>
          }
        />
        <Route
          path="/admin/games"
          element={
            <ProtectedAdminRoute>
              <AdminGamesPage />
            </ProtectedAdminRoute>
          }
        />
        <Route
          path="/admin/items"
          element={
            <ProtectedAdminRoute>
              <AdminItemsPage />
            </ProtectedAdminRoute>
          }
        />
        <Route
          path="/admin/reviews"
          element={
            <ProtectedAdminRoute>
              <AdminReviewsPage />
            </ProtectedAdminRoute>
          }
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
          element={<TermsPage />}
        />
        <Route
          path="/privacy"
          element={<PrivacyPage />}
        />
        <Route
          path="/refund"
          element={<RefundPage />}
        />
        <Route
          path="/reviews"
          element={<ReviewsPage />}
        />
        <Route
          path="/review"
          element={<ReviewForm />}
        />
        <Route
          path="/safety"
          element={<SafetyPage />}
        />
        <Route
          path="/trust"
          element={<TrustPage />}
        />
        <Route
          path="/process"
          element={<ProcessPage />}
        />
        <Route
          path="/faq"
          element={<FAQPage />}
        />
        <Route
          path="/comparison"
          element={<ComparisonPage />}
        />
      </Routes>
      </Suspense>
      <CookieBanner />
      <Footer />
      <ScrollToTop />
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  )
}

export default App
