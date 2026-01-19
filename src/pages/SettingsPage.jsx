import { useState } from 'react'
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
      </div>
    </section>
  )
}
