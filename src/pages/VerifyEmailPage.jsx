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
        // Check hash parameters first (Supabase magic link format)
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        const hashToken = hashParams.get('access_token')
        const hashType = hashParams.get('type')
        
        // Also check query parameters (alternative format)
        const queryParams = new URLSearchParams(window.location.search)
        const token = queryParams.get('token')
        const tokenHash = queryParams.get('token_hash')
        const type = queryParams.get('type') || hashType
        
        console.log('Verification params:', {
          hashToken,
          hashType,
          token,
          tokenHash,
          type,
          fullHash: window.location.hash,
          fullSearch: window.location.search
        })

        // Handle token_hash format (email confirmation)
        if (tokenHash && type) {
          const { error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: type
          })
          
          if (error) {
            console.error('Verification error:', error)
            setStatus('error')
            setMessage('Verification failed: ' + error.message)
            return
          }
          
          setStatus('success')
          setMessage('Email verified successfully! Redirecting...')
          setTimeout(() => navigate('/services'), 2000)
          return
        }

        if (type === 'signup' || type === 'email' || type === 'magiclink' || hashToken) {
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
            
            // Create session record after email verification
            try {
              await supabase.from('sessions').insert({
                user_id: session.user.id,
                last_activity: new Date().toISOString()
              })
            } catch (err) {
              console.warn('Session record creation error:', err)
            }
            
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
