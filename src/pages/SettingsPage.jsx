import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../supabaseClient'
import './AuthPages.css'
import './SettingsPage.css'

export default function SettingsPage() {
  const { user, emailVerified, resendVerificationEmail, updateProfile, changePassword } = useAuth()
  const [activeTab, setActiveTab] = useState('profile')
  
  // Profile state
  const [name, setName] = useState('')
  const [profileMessage, setProfileMessage] = useState('')
  const [profileLoading, setProfileLoading] = useState(false)
  const [lastNameChangeDate, setLastNameChangeDate] = useState(null)
  const [canChangeName, setCanChangeName] = useState(true)
  const [daysUntilCanChange, setDaysUntilCanChange] = useState(0)
  
  // Password state
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordMessage, setPasswordMessage] = useState('')
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [mfaCode, setMfaCode] = useState('')
  
  // Verification state
  const [verificationMessage, setVerificationMessage] = useState('')
  
  // 2FA state (using Supabase native MFA)
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)
  const [twoFactorLoading, setTwoFactorLoading] = useState(false)
  const [twoFactorMessage, setTwoFactorMessage] = useState('')
  const [qrCode, setQrCode] = useState(null)
  const [factorId, setFactorId] = useState(null)
  const [verifyCode, setVerifyCode] = useState('')
  const [disableCode, setDisableCode] = useState('')
  const [showDisablePrompt, setShowDisablePrompt] = useState(false)

  // Check if user has MFA enabled
  useEffect(() => {
    const checkMFAStatus = async () => {
      try {
        const { data, error } = await supabase.auth.mfa.listFactors()
        if (!error && data?.totp?.length > 0) {
          setTwoFactorEnabled(true)
          setFactorId(data.totp[0].id)
        }
      } catch (err) {
        console.error('Error checking MFA status:', err)
      }
    }
    if (user) checkMFAStatus()
  }, [user])

  // Check display name change eligibility and load current display name
  useEffect(() => {
    const checkDisplayNameChange = async () => {
      if (!user?.id) return

      try {
        const { data, error } = await supabase
          .from('customers')
          .select('display_name_changed_at, name')
          .eq('user_id', user.id)
          .maybeSingle()

        if (error) {
          console.error('Error checking name change date:', error)
          return
        }

        // Set current display name from database
        setName(data?.name || '')

        if (data?.display_name_changed_at) {
          setLastNameChangeDate(new Date(data.display_name_changed_at))
          
          const lastChange = new Date(data.display_name_changed_at)
          const now = new Date()
          const daysSinceChange = Math.floor((now - lastChange) / (1000 * 60 * 60 * 24))
          const daysRemaining = Math.max(0, 60 - daysSinceChange)

          if (daysRemaining > 0) {
            setCanChangeName(false)
            setDaysUntilCanChange(daysRemaining)
          } else {
            setCanChangeName(true)
            setDaysUntilCanChange(0)
          }
        } else {
          setCanChangeName(true)
          setDaysUntilCanChange(0)
        }
      } catch (err) {
        console.error('Error in checkDisplayNameChange:', err)
      }
    }

    checkDisplayNameChange()
  }, [user])

  const handleEnableMFA = async () => {
    setTwoFactorLoading(true)
    setTwoFactorMessage('')

    try {
      // First verify the user exists
      const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser()
      if (userError || !currentUser) {
        throw new Error('User session invalid. Please log out and log back in.')
      }
      
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: 'Authenticator App'
      })

      if (error) throw error

      setQrCode(data.totp.qr_code)
      setFactorId(data.id)
      setTwoFactorMessage('📱 Scan the QR code with your authenticator app (Google Authenticator, Authy, etc.)')
    } catch (error) {
      const errorMessage = error.message || 'Failed to enable 2FA'
      if (errorMessage.includes('JWT') || errorMessage.includes('does not exist')) {
        setTwoFactorMessage('❌ Your session is invalid. Please log out and log back in.')
      } else {
        setTwoFactorMessage('❌ ' + errorMessage)
      }
    } finally {
      setTwoFactorLoading(false)
    }
  }

  const handleVerifyMFA = async () => {
    if (!verifyCode || verifyCode.length !== 6) {
      setTwoFactorMessage('❌ Please enter a valid 6-digit code')
      return
    }

    setTwoFactorLoading(true)
    try {
      const challenge = await supabase.auth.mfa.challenge({ factorId })
      if (challenge.error) throw challenge.error

      const verify = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challenge.data.id,
        code: verifyCode
      })

      if (verify.error) throw verify.error

      setTwoFactorEnabled(true)
      setQrCode(null)
      setVerifyCode('')
      setTwoFactorMessage('✅ Two-factor authentication enabled successfully!')
    } catch (error) {
      setTwoFactorMessage('❌ Invalid code: ' + error.message)
    } finally {
      setTwoFactorLoading(false)
    }
  }

  const handleDisableMFA = async () => {
    if (!disableCode || disableCode.length !== 6) {
      setTwoFactorMessage('❌ Please enter your 6-digit authenticator code to disable 2FA')
      return
    }

    setTwoFactorLoading(true)
    try {
      // Challenge and verify the code before disabling
      const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({ factorId })
      if (challengeError) throw challengeError

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challenge.id,
        code: disableCode
      })

      if (verifyError) throw verifyError

      // Only after successful verification, unenroll
      const { error: unenrollError } = await supabase.auth.mfa.unenroll({ factorId })
      if (unenrollError) throw unenrollError

      setTwoFactorEnabled(false)
      setFactorId(null)
      setQrCode(null)
      setDisableCode('')
      setShowDisablePrompt(false)
      setTwoFactorMessage('✅ Two-factor authentication disabled')
    } catch (error) {
      setTwoFactorMessage('❌ ' + error.message)
    } finally {
      setTwoFactorLoading(false)
    }
  }

  const handleProfileUpdate = async (e) => {
    e.preventDefault()
    setProfileLoading(true)
    setProfileMessage('')

    if (!name.trim()) {
      setProfileMessage('❌ Name cannot be empty')
      setProfileLoading(false)
      return
    }

    // Check if display name is being changed
    if (name !== (user?.name || '')) {
      if (!canChangeName) {
        const nextChangeDate = lastNameChangeDate 
          ? new Date(lastNameChangeDate.getTime() + 60 * 24 * 60 * 60 * 1000).toLocaleDateString()
          : ''
        setProfileMessage(`❌ You can only change your display name once every 60 days. Next change available on ${nextChangeDate}`)
        setProfileLoading(false)
        return
      }
    }

    const result = await updateProfile({ name })
    
    if (result.success) {
      // Update the display_name_changed_at timestamp if name was changed
      if (name !== (user?.name || '')) {
        try {
          await supabase
            .from('customers')
            .update({ display_name_changed_at: new Date().toISOString() })
            .eq('user_id', user.id)
          
          setLastNameChangeDate(new Date())
          setCanChangeName(false)
          setDaysUntilCanChange(60)
        } catch (err) {
          console.error('Error updating display name change timestamp:', err)
        }
      }
      setProfileMessage('✅ Profile updated successfully!')
    } else {
      // Check if error is due to duplicate name
      if (result.error?.includes('duplicate') || result.error?.includes('unique') || result.error?.includes('customers_name_key')) {
        setProfileMessage('❌ This display name is already taken. Please choose a different name.')
      } else {
        setProfileMessage('❌ ' + result.error)
      }
    }
    
    setProfileLoading(false)
    setTimeout(() => setProfileMessage(''), 5000)
  }

  const handlePasswordChange = async (e) => {
    e.preventDefault()
    setPasswordLoading(true)
    setPasswordMessage('')

    if (!newPassword || !confirmPassword) {
      setPasswordMessage('❌ Please fill in all password fields')
      setPasswordLoading(false)
      return
    }

    if (newPassword.length < 6) {
      setPasswordMessage('❌ Password must be at least 6 characters')
      setPasswordLoading(false)
      return
    }

    if (newPassword !== confirmPassword) {
      setPasswordMessage('❌ Passwords do not match')
      setPasswordLoading(false)
      return
    }

    // If MFA is enabled, require TOTP code to elevate session to AAL2
    if (twoFactorEnabled) {
      if (!mfaCode || mfaCode.length !== 6) {
        setPasswordMessage('❌ Enter the 6-digit code from your authenticator app')
        setPasswordLoading(false)
        return
      }

      // Challenge + verify to elevate session
      const { data: factors, error: factorError } = await supabase.auth.mfa.listFactors()
      if (factorError) {
        setPasswordMessage('❌ Unable to check MFA factors: ' + factorError.message)
        setPasswordLoading(false)
        return
      }

      const verifiedTotp = factors?.totp?.find(f => f.status === 'verified')
      if (!verifiedTotp) {
        setPasswordMessage('❌ No verified authenticator found. Please re-enroll 2FA.')
        setPasswordLoading(false)
        return
      }

      const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({ factorId: verifiedTotp.id })
      if (challengeError) {
        setPasswordMessage('❌ MFA challenge failed: ' + challengeError.message)
        setPasswordLoading(false)
        return
      }

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId: verifiedTotp.id,
        challengeId: challenge.id,
        code: mfaCode
      })

      if (verifyError) {
        setPasswordMessage('❌ Invalid code: ' + verifyError.message)
        setPasswordLoading(false)
        return
      }
    }

    const result = await changePassword(newPassword)
    
    if (result.success) {
      setPasswordMessage('✅ Password changed! Refreshing your session...')
      setNewPassword('')
      setConfirmPassword('')
      setCurrentPassword('')
      setMfaCode('')
      setPasswordLoading(false)
      
      // Wait 2 seconds then reload to get fresh session
      setTimeout(() => {
        window.location.reload()
      }, 2000)
    } else {
      setPasswordMessage('❌ ' + result.error)
      setPasswordLoading(false)
    }
  }

  const handleResendVerification = async () => {
    const result = await resendVerificationEmail()
    if (result.success) {
      setVerificationMessage('✅ Verification email sent! Check your inbox.')
    } else {
      setVerificationMessage('❌ ' + result.error)
    }
    setTimeout(() => setVerificationMessage(''), 5000)
  }

  if (!user) {
    return (
      <section className="section auth-section">
        <div className="auth-container">
          <div className="auth-card">
            <div className="auth-header">
              <h2>Access Denied</h2>
              <p>Please log in to view your settings</p>
            </div>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="section settings-section">
      <div className="settings-container">
        <h1 className="settings-title">Account Settings</h1>
        
        {/* Email Verification Banner */}
        {!emailVerified && (
          <div className="verification-banner">
            <div className="verification-content">
              <span className="verification-icon">📧</span>
              <div className="verification-text">
                <strong>Email not verified</strong>
                <p>Please verify your email to access all features. Check your inbox for the verification link.</p>
              </div>
              <button className="resend-btn" onClick={handleResendVerification}>
                Resend Email
              </button>
            </div>
            {verificationMessage && <p className="verification-message">{verificationMessage}</p>}
          </div>
        )}

        {/* Tabs */}
        <div className="settings-tabs">
          <button 
            className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            Profile
          </button>
          <button 
            className={`tab-btn ${activeTab === 'security' ? 'active' : ''}`}
            onClick={() => setActiveTab('security')}
          >
            Security
          </button>
          <button 
            className={`tab-btn ${activeTab === 'verification' ? 'active' : ''}`}
            onClick={() => setActiveTab('verification')}
          >
            Email Status
          </button>
          <button 
            className={`tab-btn ${activeTab === 'advanced' ? 'active' : ''}`}
            onClick={() => setActiveTab('advanced')}
          >
            Advanced
          </button>
        </div>

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="settings-card">
            <h2>Profile Information</h2>
            <form onSubmit={handleProfileUpdate} className="settings-form">
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  value={user.email}
                  disabled
                  className="disabled-input"
                />
                <small>Email cannot be changed</small>
              </div>

              <div className="form-group">
                <label htmlFor="name">
                  Display Name
                  {!canChangeName && <span className="cooldown-badge">On Cooldown</span>}
                </label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  disabled={!canChangeName}
                  className={!canChangeName ? 'disabled-input' : ''}
                />
                {!canChangeName && (
                  <small className="cooldown-message">
                    ⏱️ You can change your display name again in {daysUntilCanChange} day{daysUntilCanChange !== 1 ? 's' : ''}
                  </small>
                )}
              </div>

              {profileMessage && (
                <div className="message">{profileMessage}</div>
              )}

              <button 
                type="submit" 
                className="save-btn" 
                disabled={profileLoading || !canChangeName}
              >
                {profileLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          </div>
        )}

        {/* Security Tab */}
        {activeTab === 'security' && (
          <div className="settings-card">
            <h2>Change Password</h2>
            <form onSubmit={handlePasswordChange} className="settings-form">
              <div className="form-group">
                <label htmlFor="newPassword">New Password</label>
                <input
                  type="password"
                  id="newPassword"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                />
                <small>Must be at least 6 characters</small>
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm New Password</label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                />
              </div>

              {twoFactorEnabled && (
                <div className="form-group">
                  <label htmlFor="mfaCode">Authenticator Code</label>
                  <input
                    type="text"
                    id="mfaCode"
                    value={mfaCode}
                    onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="123456"
                    maxLength="6"
                    style={{ textAlign: 'center', letterSpacing: '0.4rem' }}
                  />
                  <small>Enter the 6-digit code from your authenticator app to change your password.</small>
                </div>
              )}

              {passwordMessage && (
                <div className="message">{passwordMessage}</div>
              )}

              <button type="submit" className="save-btn" disabled={passwordLoading}>
                {passwordLoading ? 'Changing...' : 'Change Password'}
              </button>
            </form>

            <hr style={{ margin: '2rem 0', border: '1px solid rgba(251, 191, 36, 0.2)' }} />

            <h2>Two-Factor Authentication (2FA)</h2>
            <div className="twofa-section">
              <p className="twofa-description">
                Add an extra layer of security to your account by enabling two-factor authentication.
                You'll need to enter a code from your authenticator app when logging in.
              </p>
              
              <div className="twofa-status">
                <span className="status-label">2FA Status:</span>
                <span className={`status-badge ${twoFactorEnabled ? 'verified' : 'unverified'}`}>
                  {twoFactorEnabled ? '✓ Enabled' : '⚠ Disabled'}
                </span>
              </div>

              {!twoFactorEnabled && !qrCode && (
                <div className="twofa-setup">
                  <p><strong>How to set up 2FA:</strong></p>
                  <ol>
                    <li>Download an authenticator app (Google Authenticator, Authy, etc.)</li>
                    <li>Click "Enable 2FA" below</li>
                    <li>Scan the QR code with your authenticator app</li>
                    <li>Enter the 6-digit code to verify</li>
                  </ol>
                  <button 
                    className="primary-btn" 
                    disabled={twoFactorLoading}
                    onClick={handleEnableMFA}
                  >
                    {twoFactorLoading ? 'Setting up...' : 'Enable 2FA'}
                  </button>
                </div>
              )}

              {!twoFactorEnabled && qrCode && (
                <div className="twofa-setup">
                  <p><strong>Scan this QR code with your authenticator app:</strong></p>
                  <div style={{ textAlign: 'center', margin: '1.5rem 0' }}>
                    <img 
                      src={qrCode} 
                      alt="2FA QR Code" 
                      style={{ 
                        maxWidth: '250px', 
                        border: '2px solid #fbbf24', 
                        borderRadius: '12px', 
                        padding: '1rem', 
                        background: 'white' 
                      }} 
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="verifyCode">Enter 6-digit code from your app:</label>
                    <input
                      type="text"
                      id="verifyCode"
                      value={verifyCode}
                      onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="123456"
                      maxLength="6"
                      style={{ 
                        textAlign: 'center', 
                        fontSize: '1.5rem', 
                        letterSpacing: '0.5rem' 
                      }}
                    />
                  </div>
                  <button 
                    className="primary-btn" 
                    disabled={twoFactorLoading || verifyCode.length !== 6}
                    onClick={handleVerifyMFA}
                  >
                    {twoFactorLoading ? 'Verifying...' : 'Verify and Enable'}
                  </button>
                  <button 
                    className="save-btn" 
                    onClick={() => {
                      setQrCode(null)
                      setVerifyCode('')
                      setTwoFactorMessage('')
                    }}
                    style={{ marginTop: '0.5rem' }}
                  >
                    Cancel
                  </button>
                </div>
              )}

              {twoFactorEnabled && (
                <div className="twofa-enabled">
                  <p className="success-info">✅ Two-factor authentication is enabled on your account.</p>
                  
                  {!showDisablePrompt ? (
                    <button 
                      className="danger-btn"
                      disabled={twoFactorLoading}
                      onClick={() => setShowDisablePrompt(true)}
                    >
                      Disable 2FA
                    </button>
                  ) : (
                    <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px' }}>
                      <p style={{ color: '#fca5a5', marginBottom: '1rem' }}>
                        <strong>⚠️ Enter your 6-digit authenticator code to confirm disabling 2FA:</strong>
                      </p>
                      <div className="form-group">
                        <input
                          type="text"
                          value={disableCode}
                          onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          placeholder="123456"
                          maxLength="6"
                          style={{ 
                            textAlign: 'center', 
                            fontSize: '1.5rem', 
                            letterSpacing: '0.5rem' 
                          }}
                        />
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button 
                          className="danger-btn"
                          disabled={twoFactorLoading || disableCode.length !== 6}
                          onClick={handleDisableMFA}
                          style={{ flex: 1 }}
                        >
                          {twoFactorLoading ? 'Disabling...' : 'Confirm Disable'}
                        </button>
                        <button 
                          className="save-btn"
                          onClick={() => {
                            setShowDisablePrompt(false)
                            setDisableCode('')
                            setTwoFactorMessage('')
                          }}
                          style={{ flex: 1 }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {twoFactorMessage && (
                <div className="message">{twoFactorMessage}</div>
              )}
            </div>
          </div>
        )}

        {/* Email Verification Tab */}
        {activeTab === 'verification' && (
          <div className="settings-card">
            <h2>Email Verification Status</h2>
            <div className="verification-status">
              <div className="status-item">
                <span className="status-label">Email Address:</span>
                <span className="status-value">{user.email}</span>
              </div>
              <div className="status-item">
                <span className="status-label">Status:</span>
                <span className={`status-badge ${emailVerified ? 'verified' : 'unverified'}`}>
                  {emailVerified ? '✓ Verified' : '⚠ Not Verified'}
                </span>
              </div>
            </div>

            {!emailVerified && (
              <div className="verification-actions">
                <p className="verification-info">
                  Your email is not verified yet. Please check your inbox for the verification link 
                  or click the button below to resend it.
                </p>
                <button className="primary-btn" onClick={handleResendVerification}>
                  Resend Verification Email
                </button>
                {verificationMessage && (
                  <div className="message">{verificationMessage}</div>
                )}
              </div>
            )}

            {emailVerified && (
              <p className="success-info">
                ✅ Your email is verified! You have full access to all features.
              </p>
            )}
          </div>
        )}

        {/* Advanced Tab */}
        {activeTab === 'advanced' && (
          <div className="settings-card">
            <h2>Advanced Settings</h2>
            
            <div className="advanced-section">
              <h3>Account Information</h3>
              <div className="info-item">
                <span className="info-label">Account Created:</span>
                <span className="info-value">{user?.created_at ? new Date(user.created_at).toLocaleDateString() : new Date().toLocaleDateString()}</span>
              </div>
              <div className="info-item">
                <span className="info-label">User ID:</span>
                <span className="info-value monospace">{user?.id || 'N/A'}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
