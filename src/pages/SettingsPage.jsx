import { useState, useEffect, useRef } from 'react'
import DOMPurify from 'dompurify'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../supabaseClient'
import './AuthPages.css'
import './SettingsPage.css'

export default function SettingsPage() {
  const navigate = useNavigate()
  const { user, emailVerified, resendVerificationEmail, updateProfile, changePassword } = useAuth()
  const [activeTab, setActiveTab] = useState('profile')
  
  // Profile state
  const [name, setName] = useState('')
  const [originalName, setOriginalName] = useState('') // Track original name
  const [profileMessage, setProfileMessage] = useState('')
  const [profileLoading, setProfileLoading] = useState(false)
  const [lastNameChangeDate, setLastNameChangeDate] = useState(null)
  const [canChangeName, setCanChangeName] = useState(true)
  const [daysUntilCanChange, setDaysUntilCanChange] = useState(0)
  const [isCheckingName, setIsCheckingName] = useState(false)
  const [nameAvailable, setNameAvailable] = useState(null)
  const [nameError, setNameError] = useState('')
  const checkNameTimeoutRef = useRef(null)
  
  // Password state
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

  // Discord connection state
  const [discordConnected, setDiscordConnected] = useState(false)
  const [discordUsername, setDiscordUsername] = useState('')
  const [discordLoading, setDiscordLoading] = useState(false)
  const [discordMessage, setDiscordMessage] = useState('')

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

  // Check if Discord is connected
  useEffect(() => {
    const checkDiscordConnection = async () => {
      if (!user?.id) return
      
      try {
        const { data, error } = await supabase.rpc('get_discord_id', { p_user_id: user.id })
        
        if (error) {
          console.error('Error checking Discord connection:', error)
          return
        }
        
        if (data) {
          setDiscordConnected(true)
          // Discord ID is just a number, we don't have the username directly
          setDiscordUsername(`Discord User (${data})`)
        }
      } catch (err) {
        console.error('Discord connection check error:', err)
      }
    }
    
    if (user) checkDiscordConnection()
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
        setOriginalName(data?.name || '') // Store original name

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

  // Check display name availability when changed
  useEffect(() => {
    // Clear any existing timeout
    if (checkNameTimeoutRef.current) {
      clearTimeout(checkNameTimeoutRef.current)
    }

    // If name hasn't changed from original, don't check
    if (!name || name === originalName) {
      setNameAvailable(null)
      setNameError('')
      setIsCheckingName(false)
      return
    }

    // Validate display name format
    const trimmedName = name.trim()
    if (trimmedName.length < 3) {
      setNameError('Display name must be at least 3 characters')
      setNameAvailable(false)
      setIsCheckingName(false)
      return
    }

    if (trimmedName.length > 30) {
      setNameError('Display name must be 30 characters or less')
      setNameAvailable(false)
      setIsCheckingName(false)
      return
    }

    // Check for invalid characters
    if (!/^[a-zA-Z0-9_-]+$/.test(trimmedName)) {
      setNameError('Display name can only contain letters, numbers, underscores, and hyphens')
      setNameAvailable(false)
      setIsCheckingName(false)
      return
    }

    // Debounce the API call
    setIsCheckingName(true)
    setNameError('')
    
    checkNameTimeoutRef.current = setTimeout(async () => {
      try {
        // Call the database function to check availability
        const { data, error } = await supabase.rpc('is_display_name_available', {
          check_name: trimmedName
        })

        if (error) {
          console.error('Error checking display name:', error)
          setNameError('Unable to verify display name')
          setNameAvailable(null)
        } else {
          setNameAvailable(data)
          if (!data) {
            setNameError('This display name is already taken')
          }
        }
      } catch (err) {
        console.error('Error checking display name:', err)
        setNameError('Unable to verify display name')
        setNameAvailable(null)
      } finally {
        setIsCheckingName(false)
      }
    }, 500)

    return () => {
      if (checkNameTimeoutRef.current) {
        clearTimeout(checkNameTimeoutRef.current)
      }
    }
  }, [name, originalName])

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
      setTwoFactorMessage('Scan the QR code with your authenticator app (Google Authenticator, Authy, etc.)')
    } catch (error) {
      const errorMessage = error.message || 'Failed to enable 2FA'
      if (errorMessage.includes('JWT') || errorMessage.includes('does not exist')) {
        setTwoFactorMessage('Your session is invalid. Please log out and log back in.')
      } else {
        setTwoFactorMessage(errorMessage)
      }
    } finally {
      setTwoFactorLoading(false)
    }
  }

  const handleVerifyMFA = async () => {
    if (!verifyCode || verifyCode.length !== 6) {
      setTwoFactorMessage('Please enter a valid 6-digit code')
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
      setTwoFactorMessage('Two-factor authentication enabled successfully!')
    } catch (error) {
      setTwoFactorMessage('Invalid code: ' + error.message)
    } finally {
      setTwoFactorLoading(false)
    }
  }

  const handleDisableMFA = async () => {
    if (!disableCode || disableCode.length !== 6) {
      setTwoFactorMessage('Please enter your 6-digit authenticator code to disable 2FA')
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
      setTwoFactorMessage('Two-factor authentication disabled')
    } catch (error) {
      setTwoFactorMessage(error.message)
    } finally {
      setTwoFactorLoading(false)
    }
  }

  const handleProfileUpdate = async (e) => {
    e.preventDefault()
    setProfileLoading(true)
    setProfileMessage('')

    if (!name.trim()) {
      setProfileMessage('Name cannot be empty')
      setProfileLoading(false)
      return
    }

    // Get the original name from database to compare
    const { data: currentData } = await supabase
      .from('customers')
      .select('name')
      .eq('user_id', user.id)
      .maybeSingle()

    const dbOriginalName = currentData?.name || ''

    // Check if display name is being changed
    if (name !== dbOriginalName) {
      // Check if user can change name (60 day limit)
      if (!canChangeName && dbOriginalName !== '') {
        const nextChangeDate = lastNameChangeDate 
          ? new Date(lastNameChangeDate.getTime() + 60 * 24 * 60 * 60 * 1000).toLocaleDateString()
          : ''
        setProfileMessage(`You can only change your display name once every 60 days. Next change available on ${nextChangeDate}`)
        setProfileLoading(false)
        return
      }

      // Validate display name availability
      if (nameAvailable === false || nameError) {
        setProfileMessage(nameError || 'Please choose an available display name')
        setProfileLoading(false)
        return
      }

      if (nameAvailable === null || isCheckingName) {
        setProfileMessage('Please wait while we verify your display name')
        setProfileLoading(false)
        return
      }
    }

    const result = await updateProfile({ name: name.trim() })
    
    if (result.success) {
      // Update the display_name_changed_at timestamp if name was changed
      if (name !== dbOriginalName) {
        try {
          await supabase
            .from('customers')
            .update({ 
              name: name,
              display_name_changed_at: new Date().toISOString() 
            })
            .eq('user_id', user.id)
          
          setLastNameChangeDate(new Date())
          setCanChangeName(false)
          setDaysUntilCanChange(60)
          setOriginalName(name.trim()) // Update original name to new name
          setNameAvailable(null) // Reset validation state
          setNameError('')
        } catch (err) {
          console.error('Error updating display name change timestamp:', err)
        }
      }
      setProfileMessage('Profile updated successfully!')
    } else {
      // Check if error is due to duplicate name
      if (result.error?.includes('duplicate') || result.error?.includes('unique') || result.error?.includes('customers_name_key')) {
        setProfileMessage('This display name is already taken. Please choose a different name.')
      } else {
        setProfileMessage(result.error)
      }
    }
    
    setProfileLoading(false)
    setTimeout(() => setProfileMessage(''), 5000)
  }

  const handleConnectDiscord = async () => {
    setDiscordLoading(true)
    setDiscordMessage('')
    
    try {
      const { error } = await supabase.auth.linkIdentity({ 
        provider: 'discord'
      })
      
      if (error) {
        setDiscordMessage(error.message)
        setDiscordLoading(false)
        return
      }
      
      // Supabase will redirect to Discord OAuth, then back
      // The page will reload and Discord will be connected
    } catch (_err) {
      setDiscordMessage('Failed to connect Discord')
      setDiscordLoading(false)
    }
  }

  const handleDisconnectDiscord = async () => {
    if (!confirm('Are you sure you want to disconnect your Discord account? You will lose your Customer role on the Discord server.')) {
      return
    }
    
    setDiscordLoading(true)
    setDiscordMessage('')
    
    try {
      // Get the Discord identity ID
      const { data: identities } = await supabase.auth.getUserIdentities()
      const discordIdentity = identities?.identities?.find(i => i.provider === 'discord')
      
      if (!discordIdentity) {
        setDiscordMessage('Discord account not found')
        setDiscordLoading(false)
        return
      }
      
      const { error } = await supabase.auth.unlinkIdentity(discordIdentity)
      
      if (error) {
        setDiscordMessage(error.message)
        setDiscordLoading(false)
        return
      }
      
      setDiscordConnected(false)
      setDiscordUsername('')
      setDiscordMessage('Discord disconnected successfully')
      setTimeout(() => setDiscordMessage(''), 5000)
    } catch (err) {
      console.error('Discord disconnect error:', err)
      setDiscordMessage('Failed to disconnect Discord')
    }
    
    setDiscordLoading(false)
  }

  const handlePasswordChange = async (e) => {
    e.preventDefault()
    setPasswordLoading(true)
    setPasswordMessage('')

    if (!newPassword || !confirmPassword) {
      setPasswordMessage('Please fill in all password fields')
      setPasswordLoading(false)
      return
    }

    if (newPassword.length < 6) {
      setPasswordMessage('Password must be at least 6 characters')
      setPasswordLoading(false)
      return
    }

    if (newPassword !== confirmPassword) {
      setPasswordMessage('Passwords do not match')
      setPasswordLoading(false)
      return
    }

    // If MFA is enabled, require TOTP code to elevate session to AAL2
    if (twoFactorEnabled) {
      if (!mfaCode || mfaCode.length !== 6) {
        setPasswordMessage('Enter the 6-digit code from your authenticator app')
        setPasswordLoading(false)
        return
      }

      // Challenge + verify to elevate session
      const { data: factors, error: factorError } = await supabase.auth.mfa.listFactors()
      if (factorError) {
        setPasswordMessage('Unable to check MFA factors: ' + factorError.message)
        setPasswordLoading(false)
        return
      }

      const verifiedTotp = factors?.totp?.find(f => f.status === 'verified')
      if (!verifiedTotp) {
        setPasswordMessage('No verified authenticator found. Please re-enroll 2FA.')
        setPasswordLoading(false)
        return
      }

      const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({ factorId: verifiedTotp.id })
      if (challengeError) {
        setPasswordMessage('MFA challenge failed: ' + challengeError.message)
        setPasswordLoading(false)
        return
      }

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId: verifiedTotp.id,
        challengeId: challenge.id,
        code: mfaCode
      })

      if (verifyError) {
        setPasswordMessage('Invalid code: ' + verifyError.message)
        setPasswordLoading(false)
        return
      }
    }

    const result = await changePassword(newPassword)
    
    if (result.success) {
      setPasswordMessage('Password changed! Refreshing your session...')
      setNewPassword('')
      setConfirmPassword('')
      setMfaCode('')
      setPasswordLoading(false)
      
      // Wait 2 seconds then reload to get fresh session
      setTimeout(() => {
        window.location.reload()
      }, 2000)
    } else {
      setPasswordMessage(result.error)
      setPasswordLoading(false)
    }
  }

  const handleResendVerification = async () => {
    const result = await resendVerificationEmail()
    if (result.success) {
      setVerificationMessage('Verification email sent! Check your inbox.')
    } else {
      setVerificationMessage(result.error)
    }
    setTimeout(() => setVerificationMessage(''), 5000)
  }

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!user) {
      navigate('/login', { state: { from: '/settings' } })
    }
  }, [user, navigate])

  if (!user) {
    return null
  }

  return (
    <section className="section settings-section">
      <div className="settings-container">
        <h1 className="settings-title">Account Settings</h1>
        
        {/* Email Verification Banner */}
        {!emailVerified && (
          <div className="verification-banner">
            <div className="verification-content">
              <span className="verification-icon">Email</span>
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
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    disabled={!canChangeName}
                    className={!canChangeName ? 'disabled-input' : ''}
                    style={{
                      paddingRight: canChangeName && name !== originalName ? '2.5rem' : undefined,
                      borderColor: nameError ? '#ef4444' : nameAvailable === true && name !== originalName ? '#10b981' : undefined
                    }}
                  />
                  {canChangeName && name !== originalName && (
                    <>
                      {isCheckingName && (
                        <span style={{
                          position: 'absolute',
                          right: '0.75rem',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          fontSize: '0.9rem'
                        }}>
                          ...
                        </span>
                      )}
                      {!isCheckingName && nameAvailable === true && (
                        <span style={{
                          position: 'absolute',
                          right: '0.75rem',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          color: '#10b981',
                          fontSize: '1.1rem'
                        }}>
                          ✓
                        </span>
                      )}
                      {!isCheckingName && nameAvailable === false && (
                        <span style={{
                          position: 'absolute',
                          right: '0.75rem',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          color: '#ef4444',
                          fontSize: '1.1rem'
                        }}>
                          ✗
                        </span>
                      )}
                    </>
                  )}
                </div>
                {nameError && canChangeName && name !== originalName && (
                  <small style={{ color: '#ef4444' }}>{nameError}</small>
                )}
                {nameAvailable === true && !isCheckingName && canChangeName && name !== originalName && (
                  <small style={{ color: '#10b981' }}>Display name is available</small>
                )}
                {!canChangeName && (
                  <small className="cooldown-message">
                    You can change your display name again in {daysUntilCanChange} day{daysUntilCanChange !== 1 ? 's' : ''}
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

            {/* Discord Connection Section */}
            <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid #2a3f5f' }}>
              <h3 style={{ marginBottom: '1rem' }}>Discord Connection</h3>
              
              {discordConnected ? (
                <div style={{ 
                  backgroundColor: '#1a2332', 
                  padding: '1.5rem', 
                  borderRadius: '8px',
                  border: '1px solid #34d399'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                    <svg style={{ width: '40px', height: '40px' }} viewBox="0 0 127.14 96.36" fill="#5865F2">
                      <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z"/>
                    </svg>
                    <div style={{ flex: 1 }}>
                      <p style={{ color: '#34d399', fontWeight: '600', marginBottom: '0.25rem' }}>✓ Discord Connected</p>
                      <p style={{ color: '#cbd5e1', fontSize: '0.9rem' }}>{discordUsername}</p>
                      <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginTop: '0.5rem' }}>
                        When you purchase, you'll automatically get the "Customer" role on our Discord server.
                      </p>
                    </div>
                  </div>
                  
                  {discordMessage && (
                    <div className="message" style={{ marginBottom: '1rem' }}>{discordMessage}</div>
                  )}
                  
                  <button 
                    type="button"
                    onClick={handleDisconnectDiscord}
                    disabled={discordLoading}
                    style={{
                      padding: '0.75rem 1.5rem',
                      backgroundColor: '#dc2626',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: discordLoading ? 'not-allowed' : 'pointer',
                      opacity: discordLoading ? 0.6 : 1,
                      fontSize: '0.95rem',
                      fontWeight: '500'
                    }}
                  >
                    {discordLoading ? 'Disconnecting...' : 'Disconnect Discord'}
                  </button>
                </div>
              ) : (
                <div style={{ 
                  backgroundColor: '#1a2332', 
                  padding: '1.5rem', 
                  borderRadius: '8px',
                  border: '1px solid #2a3f5f'
                }}>
                  <div style={{ marginBottom: '1rem' }}>
                    <p style={{ color: '#cbd5e1', marginBottom: '0.75rem' }}>
                      Connect your Discord account to automatically receive the "Customer" role when you make a purchase.
                    </p>
                    <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
                      • Get exclusive access to customer-only channels<br/>
                      • Receive order notifications and support directly on Discord<br/>
                      • Role is assigned instantly after payment
                    </p>
                  </div>
                  
                  {discordMessage && (
                    <div className="message" style={{ marginBottom: '1rem' }}>{discordMessage}</div>
                  )}
                  
                  <button 
                    type="button"
                    onClick={handleConnectDiscord}
                    disabled={discordLoading}
                    style={{
                      padding: '0.75rem 1.5rem',
                      backgroundColor: '#5865F2',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: discordLoading ? 'not-allowed' : 'pointer',
                      opacity: discordLoading ? 0.6 : 1,
                      fontSize: '0.95rem',
                      fontWeight: '500',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    <svg style={{ width: '20px', height: '20px' }} viewBox="0 0 127.14 96.36" fill="currentColor">
                      <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z"/>
                    </svg>
                    {discordLoading ? 'Connecting...' : 'Connect Discord'}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Security Tab */}
        {activeTab === 'security' && (
          <div className="settings-card">
            <h2>Change Password</h2>
            <form onSubmit={handlePasswordChange} className="settings-form">
              {/* Hidden username field for password managers */}
              <input 
                type="email" 
                name="username"
                autoComplete="username" 
                value={user?.email || ''} 
                readOnly 
                style={{ display: 'none' }}
                aria-hidden="true"
              />
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
                <label htmlFor="confirmPassword">Confirm New Password</label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  autoComplete="new-password"
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
                      width="250"
                      height="250"
                      loading="lazy"
                      decoding="async"
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
                  <p className="success-info">Two-factor authentication is enabled on your account.</p>
                  
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
                        <strong>Enter your 6-digit authenticator code to confirm disabling 2FA:</strong>
                      </p>
                      <div className="form-group">
                        <input
                          type="text"
                          name="disable_2fa_code"
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
                Your email is verified! You have full access to all features.
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
