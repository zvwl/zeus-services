'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import './AuthPages.css'

export default function ResetPasswordPage() {
  useEffect(() => {
    document.title = 'Set New Password | zeuservices'

    let robotsMeta = document.querySelector('meta[name="robots"]')
    if (!robotsMeta) {
      robotsMeta = document.createElement('meta')
      robotsMeta.setAttribute('name', 'robots')
      document.head.appendChild(robotsMeta)
    }

    robotsMeta.setAttribute('content', 'noindex, follow')
  }, [])

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [session, setSession] = useState(null)
  const [canReset, setCanReset] = useState(false)
  const [requiresMfa, setRequiresMfa] = useState(false)
  const [mfaCode, setMfaCode] = useState('')
  const router = useRouter()

  useEffect(() => {
    // Check if user came from password reset link
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        setSession(session)
        setCanReset(true)
        setError('')
        await checkFactors()
      } else {
        setError('Invalid or expired reset link. Please request a new one.')
      }
    }
    checkSession()
    // Listen for password recovery event which upgrades the session
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' && session) {
        setSession(session)
        setCanReset(true)
        setError('')
        checkFactors()
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const checkFactors = async () => {
    try {
      const { data, error } = await supabase.auth.mfa.listFactors()
      if (error) return
      const verifiedTotp = data?.totp?.find(f => f.status === 'verified')
      setRequiresMfa(Boolean(verifiedTotp))
    } catch {
      // ignore
    }
  }

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

    // If user has MFA, require TOTP to elevate to AAL2 before updating password
    if (requiresMfa) {
      if (!mfaCode || mfaCode.length !== 6) {
        setError('Enter the 6-digit code from your authenticator app')
        setLoading(false)
        return
      }

      const { data: factors, error: factorError } = await supabase.auth.mfa.listFactors()
      if (factorError) {
        setError(factorError.message)
        setLoading(false)
        return
      }
      const verifiedTotp = factors?.totp?.find(f => f.status === 'verified')
      if (!verifiedTotp) {
        setError('No verified authenticator found. Please re-enroll 2FA or contact support.')
        setLoading(false)
        return
      }

      const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({ factorId: verifiedTotp.id })
      if (challengeError) {
        setError(challengeError.message)
        setLoading(false)
        return
      }

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId: verifiedTotp.id,
        challengeId: challenge.id,
        code: mfaCode
      })

      if (verifyError) {
        setError(verifyError.message)
        setLoading(false)
        return
      }
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
          router.push('/login')
        }, 2000)
      }
    } catch (_err) {
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

            {requiresMfa && (
              <div className="form-group">
                <label htmlFor="mfaCode">Authenticator Code</label>
                <input
                  type="text"
                  id="mfaCode"
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="123456"
                  maxLength="6"
                  style={{ textAlign: 'center', letterSpacing: '0.3rem' }}
                />
                <small>Enter the 6-digit code to confirm this password reset.</small>
              </div>
            )}

            <button type="submit" className="auth-btn" disabled={loading}>
              {loading ? 'Updating...' : 'Reset Password'}
            </button>
          </form>
        </div>
      </div>
    </section>
  )
}
