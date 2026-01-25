import { useState, useMemo, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import '../App.css'

export default function ServiceDetail({ services, cartItems, addToCart, removeFromCart, updateQuantity, currency, formatPrice }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const [platform, setPlatform] = useState('')
  const [version, setVersion] = useState('')
  const { user, emailVerified, resendVerificationEmail } = useAuth()
  const [verificationMessage, setVerificationMessage] = useState('')

  // Get service from props or location state
  const service = services.find(s => s.id === parseInt(id)) || location.state?.service

  // Auto-add pending cart item after login
  useEffect(() => {
    if (user && service) {
      const pendingItem = localStorage.getItem('pendingCartItem')
      console.log('Checking for pending item:', pendingItem, 'service id:', service.id)
      if (pendingItem) {
        try {
          const { serviceId, platform: savedPlatform } = JSON.parse(pendingItem)
          console.log('Parsed pending - serviceId:', serviceId, 'savedPlatform:', savedPlatform, 'match:', serviceId === service.id)
          if (serviceId === service.id) {
            localStorage.removeItem('pendingCartItem')
            // Set platform and version so they're visible when added
            // Split by last space: "Epic Games Legacy" -> ["Epic Games", "Legacy"]
            const lastSpaceIndex = savedPlatform.lastIndexOf(' ')
            const plat = savedPlatform.substring(0, lastSpaceIndex)
            const vers = savedPlatform.substring(lastSpaceIndex + 1)
            console.log('Auto-adding to cart - platform:', plat, 'version:', vers)
            setPlatform(plat)
            setVersion(vers)
            // Auto-add to cart
            addToCart(service, savedPlatform)
            setVerificationMessage('✓ Added to cart!')
            setTimeout(() => setVerificationMessage(''), 3000)
          }
        } catch (err) {
          console.error('Error processing pending cart item:', err)
          localStorage.removeItem('pendingCartItem')
        }
      }
    }
  }, [user, service, addToCart])

  if (!service) {
    return (
      <section className="section services">
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <h2>Service not found</h2>
          <button className="primary-btn" onClick={() => navigate('/services')}>Back to Services</button>
        </div>
      </section>
    )
  }

  const cartItem = useMemo(() => {
    if (!platform || !version) return null
    const fullPlatform = `${platform} ${version}`
    return cartItems.find(item => 
      item.id === service.id && item.platform === fullPlatform
    )
  }, [cartItems, service.id, platform, version])

  const handleAddToCart = () => {
    console.log('handleAddToCart called - user:', user, 'platform:', platform, 'version:', version)
    if (!user) {
      // Save pending cart item before redirecting to login
      if (!platform || !version) {
        console.log('Missing platform or version - platform:', platform, 'version:', version)
        alert('Please select a platform and version first')
        return
      }
      const fullPlatform = `${platform} ${version}`
      console.log('Saving pending item - serviceId:', service.id, 'platform:', fullPlatform)
      localStorage.setItem('pendingCartItem', JSON.stringify({
        serviceId: service.id,
        platform: fullPlatform
      }))
      console.log('Pending item saved, checking localStorage:', localStorage.getItem('pendingCartItem'))
      navigate('/login')
      return
    }
    if (!emailVerified) {
      setVerificationMessage('⚠️ Please verify your email before adding items to cart')
      setTimeout(() => setVerificationMessage(''), 5000)
      return
    }
    if (!platform || !version) return
    const fullPlatform = `${platform} ${version}`
    addToCart(service, fullPlatform)
    setVerificationMessage('✓ Added to cart!')
    setTimeout(() => setVerificationMessage(''), 3000)
  }

  const handleIncrement = () => {
    if (cartItem) {
      updateQuantity(cartItem.cartId, cartItem.quantity + 1)
    }
  }

  const handleDecrement = () => {
    if (cartItem) {
      if (cartItem.quantity === 1) {
        removeFromCart(cartItem.cartId)
        setPlatform('')
        setVersion('')
      } else {
        updateQuantity(cartItem.cartId, cartItem.quantity - 1)
      }
    }
  }

  const handleResendEmail = async () => {
    const result = await resendVerificationEmail()
    if (result.success) {
      setVerificationMessage('✓ Verification email sent! Check your inbox.')
    } else {
      setVerificationMessage('✗ ' + result.error)
    }
    setTimeout(() => setVerificationMessage(''), 5000)
  }

  return (
    <section className="section services" id="service-detail">
      <button className="ghost-btn" onClick={() => navigate('/services')} style={{ marginBottom: '2rem' }}>
        ← Back to Services
      </button>

      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>{service.name}</h1>

        <div className="service-detail-grid">
          {/* Left side - Image */}
          <div className="service-detail-image-wrap">
            <img
              src="/zeusservicesPackage.png"
              alt={service.name}
              className="service-detail-image"
            />
          </div>

          {/* Right side - Details & Add to Cart */}
          <div>
            <p style={{ fontSize: '1.1rem', color: '#94a3b8', marginBottom: '1.5rem', lineHeight: '1.6' }}>
              {service.description}
            </p>

            <div style={{ 
              background: 'linear-gradient(135deg, #1a1f35 0%, #0a0e1a 100%)',
              border: '2px solid rgba(251, 191, 36, 0.25)',
              padding: '2rem',
              borderRadius: '15px',
              marginBottom: '2rem',
              boxShadow: '0 8px 32px rgba(59, 130, 246, 0.15)'
            }}>
              <h3 style={{ color: '#f1f5f9', marginBottom: '1rem', fontSize: '1.3rem', fontWeight: '700' }}>Service Details</h3>
              {service.details?.map((detail, index) => (
                <p key={index} style={{
                  color: '#94a3b8',
                  marginBottom: '0.7rem',
                  lineHeight: '1.6'
                }}>
                  {detail}
                </p>
              ))}
            </div>

            {user && !emailVerified && (
              <div className="verification-banner" style={{ marginBottom: '1.5rem' }}>
                <div className="verification-content">
                  <span className="verification-icon"></span>
                  <div className="verification-text">
                    <strong>Please verify your email</strong>
                    <p>Check your inbox for a verification link to add items to cart.</p>
                  </div>
                  <button className="resend-btn" onClick={handleResendEmail}>
                    Resend Email
                  </button>
                </div>
              </div>
            )}

            {verificationMessage && (
              <p style={{
                padding: '1rem',
                marginBottom: '1rem',
                borderRadius: '8px',
                background: verificationMessage.includes('✓') ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                color: verificationMessage.includes('✓') ? '#22c55e' : '#ef4444'
              }}>
                {verificationMessage}
              </p>
            )}

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ color: '#cbd5e1', fontWeight: '600', fontSize: '0.95rem', display: 'block', marginBottom: '0.5rem' }}>
                Choose platform
              </label>
              <select
                className="platform-select"
                value={platform}
                onChange={(e) => {
                  setPlatform(e.target.value)
                  setVersion('') // Reset version when platform changes
                }}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '10px',
                  border: '1px solid rgba(251, 191, 36, 0.3)',
                  background: 'rgba(10, 14, 26, 0.9)',
                  color: '#f8fafc',
                  fontWeight: '600',
                  marginBottom: '1.5rem'
                }}
              >
                <option value="">Select a platform</option>
                {service.platforms?.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>

              {platform && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ color: '#cbd5e1', fontWeight: '600', fontSize: '0.95rem', display: 'block', marginBottom: '0.5rem' }}>
                    Choose a version
                  </label>
                  <select
                    className="version-select"
                    value={version}
                    onChange={(e) => setVersion(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      borderRadius: '10px',
                      border: '1px solid rgba(251, 191, 36, 0.3)',
                      background: 'rgba(10, 14, 26, 0.9)',
                      color: '#f8fafc',
                      fontWeight: '600'
                    }}
                  >
                    <option value="">Select a version</option>
                    <option value="Legacy">Legacy</option>
                    <option value="Enhanced">Enhanced</option>
                  </select>
                </div>
              )}
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '1rem',
              padding: '1.5rem',
              border: '1px solid rgba(251, 191, 36, 0.2)',
              borderRadius: '12px'
            }}>
              <span style={{ fontSize: '2rem', fontWeight: '700', color: '#fbbf24' }}>
                {formatPrice(service.price)}
              </span>
              {cartItem ? (
                <div className="quantity-controls">
                  <button className="qty-btn" onClick={handleDecrement}>−</button>
                  <span className="qty-display">{cartItem.quantity}</span>
                  <button className="qty-btn" onClick={handleIncrement}>+</button>
                </div>
              ) : (
                <button
                  className="add-to-cart-btn"
                  onClick={handleAddToCart}
                  disabled={!platform || !version}
                  style={{
                    opacity: !platform || !version ? 0.5 : 1,
                    cursor: !platform || !version ? 'not-allowed' : 'pointer'
                  }}
                >
                  Add to Cart
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
