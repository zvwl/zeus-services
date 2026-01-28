import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import HCaptcha from '@hcaptcha/react-hcaptcha'
import { useAuth } from '../contexts/AuthContext'
import './AuthPages.css'

export default function SignupPage() {
  const siteKey = import.meta.env.VITE_HCAPTCHA_SITEKEY
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState('')
  const [captchaToken, setCaptchaToken] = useState(null)
  const captchaRef = useRef(null)
  const { signup } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!email || !password || !confirmPassword) {
      setError('Please fill in all fields')
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

    const result = await signup('', email, password, captchaToken)
    if (result.success) {
      captchaRef.current?.resetCaptcha()
      setCaptchaToken(null)
      console.log('Signup success, navigating to pending-verification')
      // Redirect to pending verification page
      navigate('/pending-verification', { state: { email } })
    } else {
      console.log('Signup failed:', result.error)
      setError(result.error)
      captchaRef.current?.resetCaptcha()
      setCaptchaToken(null)
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
              <div className="password-input-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
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

            <button type="submit" className="auth-btn">
              Create account
            </button>
          </form>

          <div className="auth-footer">
            <p>Already have an account? <a href="/login">Sign in</a></p>
            <p style={{fontSize: '0.85rem', color: '#94a3b8', marginTop: '1rem'}}>💡 Set your display name in Settings after signing in. Once changed, you can only change it again after 60 days.</p>
          </div>
        </div>
      </div>
    </section>
  )
}
