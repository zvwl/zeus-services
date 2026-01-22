import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import HCaptcha from '@hcaptcha/react-hcaptcha'
import { useAuth } from '../contexts/AuthContext'
import './AuthPages.css'

export default function LoginPage() {
  const siteKey = import.meta.env.VITE_HCAPTCHA_SITEKEY
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [captchaToken, setCaptchaToken] = useState(null)
  const captchaRef = useRef(null)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

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
      navigate('/services')
    } else {
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
            <h2>Welcome back</h2>
            <p>Sign in to your Zeus account</p>
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

            <button type="submit" className="auth-btn">
              Sign in
            </button>
          </form>

          <div className="auth-footer">
            <p>Don't have an account? <a href="/signup">Sign up</a></p>
          </div>
        </div>
      </div>
    </section>
  )
}
