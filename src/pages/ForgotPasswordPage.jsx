import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import HCaptcha from '@hcaptcha/react-hcaptcha'
import { supabase } from '../supabaseClient'
import './AuthPages.css'

export default function ForgotPasswordPage() {
  const siteKey = import.meta.env.VITE_HCAPTCHA_SITEKEY
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [captchaToken, setCaptchaToken] = useState(null)
  const captchaRef = useRef(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)

    if (!email) {
      setError('Please enter your email address')
      setLoading(false)
      return
    }

    if (!siteKey) {
      setError('Captcha is unavailable. Please contact support.')
      setLoading(false)
      return
    }

    if (!captchaToken) {
      setError('Please complete the CAPTCHA')
      setLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${import.meta.env.VITE_FRONTEND_URL || window.location.origin}/reset-password`,
        captchaToken
      })

      captchaRef.current?.resetCaptcha()
      setCaptchaToken(null)

      if (error) {
        setError(error.message)
      } else {
        setMessage('Password reset link sent! Check your email inbox.')
        setEmailSent(true)
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
      captchaRef.current?.resetCaptcha()
      setCaptchaToken(null)
    }

    setLoading(false)
  }

  return (
    <section className="section auth-section">
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <h2>Reset Password</h2>
            <p>Enter your email to receive a password reset link</p>
          </div>

          {error && <div className="error-message">{error}</div>}
          {message && <div className="success-message">{message}</div>}

          {!emailSent ? (
            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-group">
                <label htmlFor="email">Email Address</label>
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

              <button type="submit" className="auth-btn" disabled={loading}>
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>
          ) : (
            <div className="email-sent-message">
              <div className="checkmark">✓</div>
              <p>Check your email for the password reset link.</p>
            </div>
          )}

          <div className="auth-footer">
            <Link to="/login">Back to Login</Link>
          </div>
        </div>
      </div>
    </section>
  )
}
