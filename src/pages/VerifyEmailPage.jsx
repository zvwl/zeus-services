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
      const completeSuccess = async (session) => {
        setStatus('success')
        setMessage('Email verified successfully! Redirecting...')

        if (session?.user?.id) {
          try {
            await supabase.from('sessions').insert({
              user_id: session.user.id,
              last_activity: new Date().toISOString()
            })
          } catch (err) {
            console.warn('Session record creation error:', err)
          }
        }

        setTimeout(() => navigate('/boosting/gta5'), 2000)
      }

      const completeError = (text) => {
        setStatus('error')
        setMessage(text)
      }

      const waitForSession = async () => {
        const { data: sessionData } = await supabase.auth.getSession()
        if (sessionData?.session) {
          return sessionData.session
        }

        return new Promise((resolve) => {
          const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session) {
              subscription.unsubscribe()
              resolve(session)
            }
          })

          setTimeout(() => {
            subscription.unsubscribe()
            resolve(null)
          }, 1500)
        })
      }

      try {
        // Check hash parameters first (Supabase magic link format)
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        const hashAccessToken = hashParams.get('access_token')
        const hashRefreshToken = hashParams.get('refresh_token')
        const hashType = hashParams.get('type')
        
        // Also check query parameters (alternative format)
        const queryParams = new URLSearchParams(window.location.search)
        const token = queryParams.get('token') || hashParams.get('token')
        const tokenHash = queryParams.get('token_hash') || hashParams.get('token_hash')
        const type = queryParams.get('type') || hashType
        
        console.log('Verification params:', {
          hashAccessToken,
          hashRefreshToken,
          hashType,
          token,
          tokenHash,
          type,
          fullHash: window.location.hash,
          fullSearch: window.location.search
        })

        // Handle token_hash format (email confirmation)
        if (tokenHash && type) {
          const { data, error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: type
          })
          
          if (error) {
            console.error('Verification error:', error)
            completeError('Verification failed: ' + error.message)
            return
          }

          const session = data?.session || await waitForSession()
          await completeSuccess(session)
          return
        }

        if (token && type) {
          const { data, error } = await supabase.auth.verifyOtp({
            token,
            type: type
          })

          if (error) {
            console.error('Verification error:', error)
            completeError('Verification failed: ' + error.message)
            return
          }

          const session = data?.session || await waitForSession()
          await completeSuccess(session)
          return
        }

        if (hashAccessToken && hashRefreshToken) {
          const { data, error } = await supabase.auth.setSession({
            access_token: hashAccessToken,
            refresh_token: hashRefreshToken
          })

          if (error) {
            console.error('Verification session error:', error)
            completeError('Verification failed: ' + error.message)
            return
          }

          await completeSuccess(data?.session)
          return
        }

        if (type === 'signup' || type === 'email' || type === 'magiclink') {
          const session = await waitForSession()
          if (session) {
            await completeSuccess(session)
          } else {
            completeError('Verification failed. The link may have expired.')
          }
        } else {
          completeError('Invalid verification link.')
        }
      } catch (err) {
        console.error('Verification error:', err)
        completeError('An error occurred during verification.')
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
              {status === 'verifying' && 'Verifying Email'}
              {status === 'success' && 'Email Verified'}
              {status === 'error' && 'Verification Failed'}
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
