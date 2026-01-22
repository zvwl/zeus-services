import { useLocation, useNavigate } from 'react-router-dom'
import './AuthPages.css'

export default function PendingVerificationPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const email = location.state?.email || 'your email'

  return (
    <section className="section auth-section">
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <h2>📧 Check Your Email</h2>
            <p>Almost there! We've sent a confirmation link to:</p>
            <p style={{ fontWeight: 'bold', color: '#FFD700', marginTop: '10px' }}>{email}</p>
          </div>

          <div style={{ padding: '30px', textAlign: 'center' }}>
            <p style={{ marginBottom: '20px', lineHeight: '1.6' }}>
              Click the link in your email to verify your account. The link expires in 24 hours.
            </p>

            <p style={{ fontSize: '14px', color: '#999', marginBottom: '30px' }}>
              Didn't receive an email? Check your spam folder or try signing up again.
            </p>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button
                onClick={() => navigate('/login')}
                className="primary-btn"
                style={{ flex: 1, maxWidth: '200px' }}
              >
                Go to Login
              </button>
              <button
                onClick={() => navigate('/signup')}
                className="secondary-btn"
                style={{ flex: 1, maxWidth: '200px' }}
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
