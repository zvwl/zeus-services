import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import ServiceCard from '../components/ServiceCard'
import Cart from '../components/Cart'
import '../App.css'

export default function ServicesPage({ services, cartItems, addToCart, removeFromCart, updateQuantity }) {
  const [showCart, setShowCart] = useState(false)
  const [showAuthPrompt, setShowAuthPrompt] = useState(false)
  const [verificationMessage, setVerificationMessage] = useState('')
  const { user, emailVerified, resendVerificationEmail } = useAuth()
  const navigate = useNavigate()

  const handleAddToCart = (service, platform) => {
    if (!user) {
      setShowAuthPrompt(true)
      return
    }
    addToCart(service, platform)
  }

  const handleResendEmail = async () => {
    const result = await resendVerificationEmail()
    if (result.success) {
      setVerificationMessage(' Verification email sent! Check your inbox.')
    } else {
      setVerificationMessage(' ' + result.error)
    }
    setTimeout(() => setVerificationMessage(''), 5000)
  }

  return (
    <section className="section services" id="services">
      <p className="eyebrow">Services</p>
      <h2 className="section-title">Choose your plan</h2>
      <p className="section-subtitle">Pick a package or mix-and-matchevery card is a tappable add to cart.</p>

      {user && !emailVerified && (
        <div className="verification-banner">
          <div className="verification-content">
            <span className="verification-icon"></span>
            <div className="verification-text">
              <strong>Please verify your email</strong>
              <p>Check your inbox for a verification link to access all features.</p>
            </div>
            <button className="resend-btn" onClick={handleResendEmail}>
              Resend Email
            </button>
          </div>
          {verificationMessage && <p className="verification-message">{verificationMessage}</p>}
        </div>
      )}

      {showAuthPrompt && (
        <div className="auth-prompt-overlay" onClick={() => setShowAuthPrompt(false)}>
          <div className="auth-prompt" onClick={(e) => e.stopPropagation()}>
            <h3>Sign in required</h3>
            <p>Please log in or create an account to add items to your cart</p>
            <div className="auth-prompt-actions">
              <button className="primary-btn" onClick={() => navigate('/login')}>Login</button>
              <button className="ghost-btn" onClick={() => navigate('/signup')}>Sign up</button>
            </div>
            <button className="close-btn" onClick={() => setShowAuthPrompt(false)}>X</button>
          </div>
        </div>
      )}

      <main className="services-grid">
        {services.map(service => (
          <ServiceCard
            key={service.id}
            service={service}
            onAddToCart={handleAddToCart}
            cartItems={cartItems}
            onUpdateQuantity={updateQuantity}
            onRemoveFromCart={removeFromCart}
          />
        ))}
      </main>
    </section>
  )
}
