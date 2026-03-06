import { useLocation, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { Turnstile } from '@marsidev/react-turnstile'
import { useAuth } from '../contexts/AuthContext'
import { isTurnstileBypassed } from '../utils/turnstile'
import './AuthPages.css'

export default function PendingVerificationPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const email = location.state?.email || 'your email'
  const siteKey = import.meta.env.VITE_TURNSTILE_SITEKEY
  const bypassTurnstile = isTurnstileBypassed()
  const [resendEmail, setResendEmail] = useState(location.state?.email || '')
  const [resendStatus, setResendStatus] = useState('')
  const [isResending, setIsResending] = useState(false)
  const [captchaToken, setCaptchaToken] = useState(null)
  const [captchaKey, setCaptchaKey] = useState(0)
  const { resendVerificationEmailForEmail } = useAuth()

  const handleResendVerification = async () => {
    setResendStatus('')
    setIsResending(true)
    try {
      if (!siteKey && !bypassTurnstile) {
        setResendStatus('Captcha is unavailable. Please contact support.')
        return
      }

      if (!captchaToken && !bypassTurnstile) {
        setResendStatus('Please complete the CAPTCHA')
        return
      }

      const result = await resendVerificationEmailForEmail(resendEmail.trim(), bypassTurnstile ? 'bypass' : captchaToken)
      if (result.success) {
        setResendStatus(result.message)
        setCaptchaToken(null)
        setCaptchaKey((prev) => prev + 1)
      } else {
        setResendStatus(result.error)
      }
    } finally {
      setIsResending(false)
    }
  }

  return (
    <section className="section auth-section">
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <h2>Check Your Email</h2>
            <p>Almost there! We've sent a confirmation link to:</p>
            <p className="pending-email">{email}</p>
          </div>

          <div className="pending-body">
            <p className="pending-copy">
              Click the link in your email to verify your account. The link expires in 24 hours.
            </p>

            <p className="pending-hint">
              Didn't receive an email? Check your spam folder or try signing up again.
            </p>

            <div className="auth-actions pending-actions">
              <button
                onClick={() => navigate('/login')}
                className="primary-btn"
              >
                Go to Login
              </button>
              <button
                onClick={() => navigate('/signup')}
                className="secondary-btn"
              >
                Try Again
              </button>
            </div>

            {resendStatus && <div className="resend-message">{resendStatus}</div>}
            <div className="resend-block">
              <p>Resend verification email</p>
              <div className="resend-field">
                <input
                  type="email"
                  name="resend_email"
                  value={resendEmail}
                  onChange={(e) => setResendEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  className="resend-input"
                />
                <button
                  type="button"
                  className="resend-btn"
                  onClick={handleResendVerification}
                  disabled={isResending}
                >
                  {isResending ? 'Sending...' : 'Resend'}
                </button>
              </div>
            </div>
            <div className="resend-captcha">
              {siteKey && !bypassTurnstile ? (
                <Turnstile
                  key={captchaKey}
                  siteKey={siteKey}
                  onSuccess={setCaptchaToken}
                  onExpire={() => setCaptchaToken(null)}
                />
              ) : bypassTurnstile ? (
                <div className="success-message">Captcha disabled for localhost.</div>
              ) : (
                <div className="error-message">Captcha key missing. Please contact support.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
