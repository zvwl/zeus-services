import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import './AuthPages.css'

export default function ResetPasswordPage() {
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [session, setSession] = useState(null)
  const [canReset, setCanReset] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    // Check if user came from password reset link
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        setSession(session)
        setCanReset(true)
        setError('')
      } else {
        setError('Invalid or expired reset link. Please request a new one.')
      } else {
        // If user has MFA enabled, we need to handle AAL2 requirement
        // Password reset links bypass MFA requirement as they are already verified via email

    // Listen for password recovery event which upgrades the session
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || session) {
        setSession(session)
        setCanReset(true)
        setError('')
      }
    })

    return () => subscription.unsubscribe()
        const currentAAL = session.aal
        if (currentAAL !== 'aal2') {
          console.log('AAL1 session detected, password reset will proceed without MFA')
        }
      }
    }
    checkSession()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)

    if (!canReset || !session) {
      setError('Your reset link is invalid or expired. Please request a new reset email.')
      setLoading(false)
      return
    }

    if (!newPassword || !confirmPassword) {
      setError('Please fill in all fields')
      setLoading(false)
      return
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters')
      setLoading(false)
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (error) {
        // If AAL2 is required, provide helpful message
        if (error.message.includes('AAL2')) {
          setError('For security, please log in with your current password, complete MFA, and change it from Settings.')
        } else {
          setError(error.message)
        }
      } else {
        setMessage('Password updated successfully! Redirecting to login...')
        // Sign out to ensure fresh login with new password
        await supabase.auth.signOut()
        setTimeout(() => {
          navigate('/login')
        }, 2000)
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
    }

    setLoading(false)
  }

  return (
    <section className="section auth-section">
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <h2>Set New Password</h2>
            <p>Enter your new password below</p>
          </div>

          {error && <div className="error-message">{error}</div>}
          {message && <div className="success-message">{message}</div>}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="newPassword">New Password</label>
              <input
                type="password"
                id="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                autoComplete="new-password"
              />
              <small>Must be at least 6 characters</small>
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                autoComplete="new-password"
              />
            </div>

            <button type="submit" className="auth-btn" disabled={loading}>
              {loading ? 'Updating...' : 'Reset Password'}
            </button>
          </form>
        </div>
      </div>
    </section>
  )
}
