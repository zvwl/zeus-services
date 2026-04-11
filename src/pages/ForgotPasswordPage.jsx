import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Turnstile } from '@marsidev/react-turnstile'
import { supabase } from '../supabaseClient'
import { isTurnstileBypassed } from '../utils/turnstile'
import './AuthPages.css'

export default function ForgotPasswordPage() {
  useEffect(() => {
    document.title = 'Reset Password | zeuservices'

    let robotsMeta = document.querySelector('meta[name="robots"]')
    if (!robotsMeta) {
      robotsMeta = document.createElement('meta')
      robotsMeta.setAttribute('name', 'robots')
      document.head.appendChild(robotsMeta)
    }

    robotsMeta.setAttribute('content', 'noindex, follow')
  }, [])

  const siteKey = import.meta.env.VITE_TURNSTILE_SITEKEY
  const bypassTurnstile = isTurnstileBypassed()
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [captchaToken, setCaptchaToken] = useState(null)
  const [captchaKey, setCaptchaKey] = useState(0)

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

    if (!siteKey && !bypassTurnstile) {
      setError('Captcha is unavailable. Please contact support.')
      setLoading(false)
      return
    }

    if (!captchaToken && !bypassTurnstile) {
      setError('Please complete the CAPTCHA')
      setLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${import.meta.env.VITE_FRONTEND_URL || window.location.origin}/reset-password`,
        captchaToken: bypassTurnstile ? undefined : captchaToken
      })

      setCaptchaToken(null)
      setCaptchaKey((prev) => prev + 1)

      if (error) {
        setError(error.message)
      } else {
        setMessage('Password reset link sent! Check your email inbox.')
        setEmailSent(true)
      }
    } catch (_err) {
      setError('An error occurred. Please try again.')
      setCaptchaToken(null)
      setCaptchaKey((prev) => prev + 1)
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
                {siteKey && !bypassTurnstile ? (
                  <Turnstile
                    key={captchaKey}
                    siteKey={siteKey}
                    onSuccess={(token) => {
                      setCaptchaToken(token)
                      setError('')
                    }}
                    onExpire={() => setCaptchaToken(null)}
                    onError={() => setCaptchaToken(null)}
                    options={{ theme: 'dark' }}
                  />
                ) : bypassTurnstile ? (
                  <div className="success-message">Captcha disabled for localhost.</div>
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
