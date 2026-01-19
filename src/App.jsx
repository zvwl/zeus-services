import { useState } from 'react'
import { Routes, Route, useNavigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import './App.css'
import Header from './components/Header'
import Home from './pages/Home'
import ServicesPage from './pages/Services'
import CartPage from './pages/CartPage'
import PlaceholderPage from './pages/PlaceholderPage'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import VerifyEmailPage from './pages/VerifyEmailPage'
import SettingsPage from './pages/SettingsPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage from './pages/ResetPasswordPage'

function App() {
  const [cartItems, setCartItems] = useState([])
  const { user } = useAuth()
  const navigate = useNavigate()

  const services = [
    {
      id: 1,
      name: 'Web Development',
      price: 499,
      description: 'Build your professional website',
      icon: '⚡',
      platforms: ['Web', 'Mobile Web', 'Landing Page', 'E-commerce']
    },
    {
      id: 2,
      name: 'SEO Optimization',
      price: 299,
      description: 'Boost your search rankings',
      icon: '🔍',
      platforms: ['Google', 'Bing', 'Local SEO', 'App Store']
    },
    {
      id: 3,
      name: 'Mobile App',
      price: 699,
      description: 'Custom iOS & Android apps',
      icon: '📱',
      platforms: ['iOS', 'Android', 'Cross-platform']
    },
    {
      id: 4,
      name: 'Branding',
      price: 399,
      description: 'Create your brand identity',
      icon: '🎨',
      platforms: ['Logo', 'Guidelines', 'Pitch Deck', 'Social Kit']
    },
    {
      id: 5,
      name: 'Cloud Migration',
      price: 599,
      description: 'Secure cloud solutions',
      icon: '☁️',
      platforms: ['AWS', 'Azure', 'GCP', 'Hybrid']
    },
    {
      id: 6,
      name: 'Support Package',
      price: 199,
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

  return (
    <div className="app">
      <Header cartCount={cartItems.length} user={user} />

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
          path="/settings"
          element={<SettingsPage />}
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
