import { useLocation, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import './AuthPages.css'

export default function PendingVerificationPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const email = location.state?.email || 'your email'
  const [resendEmail, setResendEmail] = useState(location.state?.email || '')
  const [resendStatus, setResendStatus] = useState('')
  const [isResending, setIsResending] = useState(false)
  const { resendVerificationEmailForEmail } = useAuth()

  const handleResendVerification = async () => {
    setResendStatus('')
    setIsResending(true)
    try {
      const result = await resendVerificationEmailForEmail(resendEmail.trim())
      if (result.success) {
        setResendStatus(result.message)
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
            <h2>📧 Check Your Email</h2>
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
          </div>
        </div>
      </div>
    </section>
  )
}
