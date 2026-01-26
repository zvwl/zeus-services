import { useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import HCaptcha from '@hcaptcha/react-hcaptcha'
import { useAuth } from '../contexts/AuthContext'
import googleLogo from '../assets/google-logo.svg'
import './AuthPages.css'

export default function LoginPage() {
  const [searchParams] = useSearchParams()
  const redirectTo = searchParams.get('redirect') || '/services'
  const siteKey = import.meta.env.VITE_HCAPTCHA_SITEKEY
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [mfaError, setMfaError] = useState('')
  const [mfaCode, setMfaCode] = useState('')
  const [mfaRequired, setMfaRequired] = useState(false)
  const [mfaFactorId, setMfaFactorId] = useState(null)
  const [mfaChallengeId, setMfaChallengeId] = useState(null)
  const [isVerifyingMfa, setIsVerifyingMfa] = useState(false)
  const [captchaToken, setCaptchaToken] = useState(null)
  const captchaRef = useRef(null)
  const { login, loginWithGoogle, verifyMfaChallenge } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setMfaError('')
    setMfaRequired(false)
    setMfaFactorId(null)
    setMfaChallengeId(null)
    setMfaCode('')

    if (!email || !password) {
      setError('Please fill in all fields')
      return
    }

    if (!siteKey) {
      setError('Captcha is unavailable. Please contact support.')
      return
    }

    if (!captchaToken) {
      setError('Please complete the CAPTCHA')
      return
    }

    const result = await login(email, password, captchaToken)
    if (result.success) {
      captchaRef.current?.resetCaptcha()
      setCaptchaToken(null)
      
      // If user came from checkout, go to checkout. Otherwise check for pending cart item.
      if (redirectTo === '/checkout') {
        navigate('/checkout')
        return
      }
      
      // Check if there's a pending cart item to add
      const pendingItem = localStorage.getItem('pendingCartItem')
      if (pendingItem) {
        // Don't remove it here - let ServiceDetail handle it after auto-adding
        try {
          const { serviceId } = JSON.parse(pendingItem)
          // Navigate to the service detail page with the ID
          navigate(`/service/${serviceId}`)
        } catch (err) {
          console.error('Error processing pending cart item:', err)
          localStorage.removeItem('pendingCartItem')
          navigate(redirectTo)
        }
      } else {
        navigate(redirectTo)
      }
      return
    }

    if (result.mfaRequired) {
      setMfaRequired(true)
      setMfaFactorId(result.factorId)
      setMfaChallengeId(result.challengeId)
      setError('Enter your 6-digit authentication code to finish signing in.')
      return
    }

    setError(result.error)
    captchaRef.current?.resetCaptcha()
    setCaptchaToken(null)
  }

  const handleGoogleSignIn = async () => {
    setError('')
    try {
      const result = await loginWithGoogle()
      if (!result.success && result.error) {
        setError(result.error)
      }
    } catch (err) {
      setError('Could not start Google sign-in')
    }
  }

  const handleVerifyMfa = async (e) => {
    e.preventDefault()
    setMfaError('')

    if (!mfaCode || mfaCode.length !== 6) {
      setMfaError('Please enter the 6-digit code from your authenticator app')
      return
    }

    setIsVerifyingMfa(true)
    
    try {
      // Add 10-second timeout to prevent infinite hang
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Verification timeout - please try again')), 10000)
      )
      
      const result = await Promise.race([
        verifyMfaChallenge({
          factorId: mfaFactorId,
          challengeId: mfaChallengeId,
          code: mfaCode
        }),
        timeoutPromise
      ])

      if (result.success) {
        setMfaRequired(false)
        setMfaCode('')
        captchaRef.current?.resetCaptcha()
        setCaptchaToken(null)
        
        // Check if there's a pending cart item to add
        const pendingItem = localStorage.getItem('pendingCartItem')
        if (pendingItem) {
          // Don't remove it here - let ServiceDetail handle it after auto-adding
          try {
            const { serviceId } = JSON.parse(pendingItem)
            navigate(`/service/${serviceId}`)
          } catch (err) {
            console.error('Error processing pending cart item:', err)
            localStorage.removeItem('pendingCartItem')
            navigate('/services')
          }
        } else {
          navigate('/services')
        }
      } else {
        setMfaError(result.error || 'Verification failed')
      }
    } catch (err) {
      console.error('MFA verification error:', err)
      setMfaError(err.message || 'Failed to verify code. Please try again.')
    } finally {
      setIsVerifyingMfa(false)
    }
  }

  return (
    <section className="section auth-section">
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <h2>Welcome back</h2>
            <p>Sign in to your Zeus account</p>
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="oauth-block">
            <button type="button" className="oauth-btn" onClick={handleGoogleSignIn}>
              <img className="oauth-icon" src={googleLogo} alt="Google logo" />
              Continue with Google
            </button>
            <div className="oauth-divider"><span>or</span></div>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
              <div className="password-footer">
                <a href="/forgot-password" className="forgot-link">Forgot password?</a>
              </div>
            </div>

            <div className="form-group">
              <label>Security check</label>
              {siteKey ? (
                <HCaptcha
                  sitekey={siteKey}
                  onVerify={(token) => {
                    setCaptchaToken(token)
                    setError('')
                  }}
                  onExpire={() => setCaptchaToken(null)}
                  onError={() => setCaptchaToken(null)}
                  ref={captchaRef}
                />
              ) : (
                <div className="error-message">Captcha key missing. Please contact support.</div>
              )}
            </div>

            {mfaRequired && (
              <div className="form-group">
                <label>Two-Factor Code</label>
                <input
                  type="text"
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="123456"
                  maxLength="6"
                  style={{ textAlign: 'center', letterSpacing: '0.3rem' }}
                />
                <small>Enter the code from your authenticator app.</small>
                {mfaError && <div className="error-message">{mfaError}</div>}
                <button 
                  type="button" 
                  className="auth-btn" 
                  onClick={handleVerifyMfa}
                  disabled={isVerifyingMfa || mfaCode.length !== 6}
                  style={{ marginTop: '0.75rem' }}
                >
                  {isVerifyingMfa ? 'Verifying...' : 'Verify and continue'}
                </button>
              </div>
            )}

            {!mfaRequired && (
              <button type="submit" className="auth-btn">
                Sign in
              </button>
            )}
          </form>

          <div className="auth-footer">
            <p>Don't have an account? <a href="/signup">Sign up</a></p>
          </div>
        </div>
      </div>
    </section>
  )
}
