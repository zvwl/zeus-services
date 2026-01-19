import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import './AuthPages.css'

export default function VerifyEmailPage() {
  const [status, setStatus] = useState('verifying')
  const [message, setMessage] = useState('Verifying your email...')
  const navigate = useNavigate()

  useEffect(() => {
    // Handle the email verification callback
    const handleEmailVerification = async () => {
      try {
        // Check if there's a hash in the URL (Supabase auth token)
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        const accessToken = hashParams.get('access_token')
        const type = hashParams.get('type')

        if (type === 'signup' || type === 'email' || type === 'magiclink') {
          // Get the current session to verify
          const { data: { session }, error } = await supabase.auth.getSession()
          
          if (error) {
            setStatus('error')
            setMessage('Verification failed. Please try again.')
            return
          }

          if (session) {
            setStatus('success')
            setMessage('Email verified successfully! Redirecting...')
            
            // Redirect to services page after 2 seconds
            setTimeout(() => {
              navigate('/services')
            }, 2000)
          } else {
            setStatus('error')
            setMessage('Verification failed. The link may have expired.')
          }
        } else {
          setStatus('error')
          setMessage('Invalid verification link.')
        }
      } catch (err) {
        console.error('Verification error:', err)
        setStatus('error')
        setMessage('An error occurred during verification.')
      }
    }

    handleEmailVerification()
  }, [navigate])

  return (
    <section className="section auth-section">
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <h2>
              {status === 'verifying' && '⏳ Verifying Email'}
              {status === 'success' && '✅ Email Verified'}
              {status === 'error' && '❌ Verification Failed'}
            </h2>
            <p>{message}</p>
          </div>

          {status === 'success' && (
            <div className="success-animation">
              <div className="checkmark">✓</div>
            </div>
          )}

          {status === 'error' && (
            <div className="auth-actions">
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
                Sign Up Again
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
