import { useRef, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import DOMPurify from 'dompurify'
import { Turnstile } from '@marsidev/react-turnstile'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../supabaseClient'
import './AuthPages.css'

export default function SignupPage() {
  const siteKey = import.meta.env.VITE_TURNSTILE_SITEKEY
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState('')
  const [captchaToken, setCaptchaToken] = useState(null)
  const [captchaKey, setCaptchaKey] = useState(0)
  const [isCheckingName, setIsCheckingName] = useState(false)
  const [nameAvailable, setNameAvailable] = useState(null) // null = not checked, true = available, false = taken
  const [nameError, setNameError] = useState('')
  const checkNameTimeoutRef = useRef(null)
  const { signup } = useAuth()
  const navigate = useNavigate()

  // Check display name availability with debouncing
  useEffect(() => {
    // Clear any existing timeout
    if (checkNameTimeoutRef.current) {
      clearTimeout(checkNameTimeoutRef.current)
    }

    // Reset states if display name is empty
    if (!displayName || displayName.trim().length === 0) {
      setNameAvailable(null)
      setNameError('')
      setIsCheckingName(false)
      return
    }

    // Validate display name format
    const trimmedName = displayName.trim()
    if (trimmedName.length < 3) {
      setNameError('Display name must be at least 3 characters')
      setNameAvailable(false)
      setIsCheckingName(false)
      return
    }

    if (trimmedName.length > 30) {
      setNameError('Display name must be 30 characters or less')
      setNameAvailable(false)
      setIsCheckingName(false)
      return
    }

    // Check for invalid characters
    if (!/^[a-zA-Z0-9_-]+$/.test(trimmedName)) {
      setNameError('Display name can only contain letters, numbers, underscores, and hyphens')
      setNameAvailable(false)
      setIsCheckingName(false)
      return
    }

    // Debounce the API call
    setIsCheckingName(true)
    setNameError('')
    
    checkNameTimeoutRef.current = setTimeout(async () => {
      try {
        console.log('Checking display name availability for:', trimmedName)
        // Call the database function to check availability
        const { data, error } = await supabase.rpc('is_display_name_available', {
          check_name: trimmedName
        })

        console.log('RPC result:', { data, error })

        if (error) {
          console.error('Error checking display name:', error)
          setNameError('Unable to verify display name. Please try again.')
          setNameAvailable(null)
        } else {
          setNameAvailable(data)
          if (!data) {
            setNameError('This display name is already taken')
          } else {
            setNameError('')
          }
        }
      } catch (err) {
        console.error('Error checking display name:', err)
        setNameError('Unable to verify display name. Please try again.')
        setNameAvailable(null)
      } finally {
        setIsCheckingName(false)
      }
    }, 500) // 500ms debounce

    // Cleanup timeout on unmount
    return () => {
      if (checkNameTimeoutRef.current) {
        clearTimeout(checkNameTimeoutRef.current)
      }
    }
  }, [displayName])

  const resetCaptcha = () => {
    setCaptchaToken(null)
    setCaptchaKey((prev) => prev + 1)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!displayName || !email || !password || !confirmPassword) {
      setError('Please fill in all fields')
      return
    }

    // Validate display name availability
    if (nameAvailable === false || nameError) {
      setError(nameError || 'Please choose an available display name')
      return
    }

    if (nameAvailable === null || isCheckingName) {
      setError('Please wait while we verify your display name')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
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

    const result = await signup(displayName.trim(), email, password, captchaToken)
    if (result.success) {
      resetCaptcha()
      console.log('Signup success, navigating to pending-verification')
      // Redirect to pending verification page
      navigate('/pending-verification', { state: { email } })
    } else {
      console.log('Signup failed:', result.error)
      setError(result.error)
      resetCaptcha()
    }
  }

  return (
    <section className="section auth-section">
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <h2>Create account</h2>
            <p>Join Zeus Services today</p>
          </div>

          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="displayName">Display Name</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  id="displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Choose your display name"
                  autoComplete="username"
                  style={{
                    paddingRight: '2.5rem',
                    borderColor: nameError ? '#ef4444' : nameAvailable === true ? '#10b981' : undefined
                  }}
                />
                {isCheckingName && (
                  <span style={{
                    position: 'absolute',
                    right: '0.75rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontSize: '0.9rem'
                  }}>
                    ⏳
                  </span>
                )}
                {!isCheckingName && nameAvailable === true && (
                  <span style={{
                    position: 'absolute',
                    right: '0.75rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#10b981',
                    fontSize: '1.1rem'
                  }}>
                    ✓
                  </span>
                )}
                {!isCheckingName && nameAvailable === false && (
                  <span style={{
                    position: 'absolute',
                    right: '0.75rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#ef4444',
                    fontSize: '1.1rem'
                  }}>
                    ✗
                  </span>
                )}
              </div>
              {nameError && (
                <p style={{ color: '#ef4444', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                  {nameError}
                </p>
              )}
              {nameAvailable === true && !isCheckingName && (
                <p style={{ color: '#10b981', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                  Display name is available
                </p>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <div className="password-input-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <div className="password-input-wrapper">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label>Security check</label>
              {siteKey ? (
                <Turnstile
                  key={captchaKey}
                  siteKey={siteKey}
                  onSuccess={(token) => {
                    setCaptchaToken(token)
                    setError('')
                  }}
                  onExpire={resetCaptcha}
                  onError={resetCaptcha}
                  options={{
                    theme: 'dark',
                    retry: 'auto',
                    retryInterval: 2000,
                    refreshExpired: 'auto'
                  }}
                />
              ) : (
                <div className="error-message">Captcha key missing. Please contact support.</div>
              )}
            </div>

            <button type="submit" className="auth-btn">
              Create account
            </button>
          </form>

          <div className="auth-footer">
            <p>Already have an account? <a href="/login">Sign in</a></p>
            <p style={{fontSize: '0.85rem', color: '#94a3b8', marginTop: '1rem'}}>
              💡 Choose carefully - display names are unique and can only be changed once every 60 days.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
