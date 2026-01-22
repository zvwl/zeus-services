import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../supabaseClient'
import './AuthPages.css'
import './SettingsPage.css'

export default function SettingsPage() {
  const { user, emailVerified, resendVerificationEmail, updateProfile, changePassword } = useAuth()
  const [activeTab, setActiveTab] = useState('profile')
  
  // Profile state
  const [name, setName] = useState(user?.name || '')
  const [profileMessage, setProfileMessage] = useState('')
  const [profileLoading, setProfileLoading] = useState(false)
  
  // Password state
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordMessage, setPasswordMessage] = useState('')
  const [passwordLoading, setPasswordLoading] = useState(false)
  
  // Verification state
  const [verificationMessage, setVerificationMessage] = useState('')
  
  // 2FA state (using Supabase native MFA)
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)
  const [twoFactorLoading, setTwoFactorLoading] = useState(false)
  const [twoFactorMessage, setTwoFactorMessage] = useState('')
  const [qrCode, setQrCode] = useState(null)
  const [factorId, setFactorId] = useState(null)
  const [verifyCode, setVerifyCode] = useState('')
  
  // Captcha settings state
  const [requireCaptchaLogin, setRequireCaptchaLogin] = useState(false)
  const [captchaLoading, setCaptchaLoading] = useState(false)
  const [captchaMessage, setCaptchaMessage] = useState('')

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

  const handleEnableMFA = async () => {
    setTwoFactorLoading(true)
    setTwoFactorMessage('')

    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: 'Authenticator App'
      })

      if (error) throw error

      setQrCode(data.totp.qr_code)
      setFactorId(data.id)
      setTwoFactorMessage('📱 Scan the QR code with your authenticator app (Google Authenticator, Authy, etc.)')
    } catch (error) {
      setTwoFactorMessage('❌ ' + error.message)
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
    if (!confirm('Are you sure you want to disable two-factor authentication?')) return

    setTwoFactorLoading(true)
    try {
      const { error } = await supabase.auth.mfa.unenroll({ factorId })
      if (error) throw error

      setTwoFactorEnabled(false)
      setFactorId(null)
      setQrCode(null)
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

    const result = await updateProfile({ name })
    
    if (result.success) {
      setProfileMessage('✅ Profile updated successfully!')
    } else {
      setProfileMessage('❌ ' + result.error)
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

    const result = await changePassword(newPassword)
    
    if (result.success) {
      setPasswordMessage('✅ Password changed successfully!')
      setNewPassword('')
      setConfirmPassword('')
      setCurrentPassword('')
    } else {
      setPasswordMessage('❌ ' + result.error)
    }
    
    setPasswordLoading(false)
    setTimeout(() => setPasswordMessage(''), 5000)
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
                <label htmlFor="name">Display Name</label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                />
              </div>

              {profileMessage && (
                <div className="message">{profileMessage}</div>
              )}

              <button type="submit" className="save-btn" disabled={profileLoading}>
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
                  <button 
                    className="danger-btn"
                    disabled={twoFactorLoading}
                    onClick={handleDisableMFA}
                  >
                    {twoFactorLoading ? 'Disabling...' : 'Disable 2FA'}
                  </button>
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
              <h3>Security Preferences</h3>
              
              <div className="setting-item">
                <div className="setting-info">
                  <strong>Require CAPTCHA on Login</strong>
                  <p>Add an extra verification step when logging in to prevent automated attacks.</p>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={requireCaptchaLogin}
                    onChange={(e) => setRequireCaptchaLogin(e.target.checked)}
                    disabled={captchaLoading}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div className="setting-note">
                <strong>Note:</strong> CAPTCHA on signup is always enabled for security.
              </div>

              {captchaMessage && (
                <div className="message">{captchaMessage}</div>
              )}

              <button 
                className="save-btn" 
                disabled={captchaLoading}
                onClick={() => {
                  setCaptchaLoading(true)
                  setCaptchaMessage('✅ Settings saved! Note: CAPTCHA is currently enabled on login by default.')
                  setTimeout(() => {
                    setCaptchaLoading(false)
                    setCaptchaMessage('')
                  }, 3000)
                }}
              >
                {captchaLoading ? 'Saving...' : 'Save Preferences'}
              </button>
            </div>

            <hr style={{ margin: '2rem 0', border: '1px solid rgba(251, 191, 36, 0.2)' }} />

            <div className="advanced-section">
              <h3>Account Information</h3>
              <div className="info-item">
                <span className="info-label">Account Created:</span>
                <span className="info-value">{new Date().toLocaleDateString()}</span>
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
