import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

const AuthContext = createContext(null)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [emailVerified, setEmailVerified] = useState(false)
  const [isRecoveringFromRedirect, setIsRecoveringFromRedirect] = useState(false)
  const [isAdmin, setIsAdmin] = useState(() => {
    try {
      return localStorage.getItem('isAdmin') === 'true'
    } catch {
      return false
    }
  })

  // Function to check admin status with timeout
  const checkAdminStatus = async (userId) => {
    try {
      // Create a promise that rejects after 10 seconds (background check)
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Admin check timeout')), 10000)
      )

      // Race the actual query against the timeout
      const queryPromise = supabase
        .from('admin_users')
        .select('id, active')
        .eq('user_id', userId)
        .eq('active', true)
        .maybeSingle()

      const { data: adminData, error } = await Promise.race([
        queryPromise,
        timeoutPromise
      ])
      
      if (error) {
        console.error('Admin check error:', error)
        setIsAdmin(false)
        return
      }

      const isUserAdmin = adminData?.active === true
      setIsAdmin(isUserAdmin)
      
      // Persist to localStorage
      try {
        localStorage.setItem('isAdmin', String(isUserAdmin))
      } catch (err) {
        console.warn('Failed to store admin status:', err)
      }
    } catch (err) {
      // Timeout or other error - default to not admin
      console.warn('Admin status check failed:', err)
      setIsAdmin(false)
    }
  }

  // Function to fetch display name from customers table
  const fetchDisplayName = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('name')
        .eq('user_id', userId)
        .maybeSingle()

      if (error) {
        console.error('Error fetching display name:', error)
        return null
      }

      return data?.name || null
    } catch (err) {
      console.error('Display name fetch error:', err)
      return null
    }
  }

  useEffect(() => {
    // Check for existing Supabase session
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()

        if (session?.user) {
          // Verify the user actually exists in the database
          const { data: { user: verifiedUser }, error: userError } = await supabase.auth.getUser()
          
          if (userError || !verifiedUser) {
            console.error('User verification failed:', userError)
            // User doesn't exist - force logout
            await supabase.auth.signOut({ scope: 'local' })
            setUser(null)
            setEmailVerified(false)
            setLoading(false)
            return
          }
          
          // Fetch display name from customers table
          const displayName = await fetchDisplayName(session.user.id)
          
          setUser({
            id: session.user.id,
            email: session.user.email,
            name: displayName || session.user.email.split('@')[0],
            created_at: session.user.created_at
          })
          setEmailVerified(session.user.email_confirmed_at !== null)
          
          // Check admin status in the background (don't block page load)
          checkAdminStatus(session.user.id)
        }
      } catch (err) {
        console.error('Session check error:', err)
        // If session check fails, clear everything
        setUser(null)
        setEmailVerified(false)
        setIsAdmin(false)
      } finally {
        // Mark loading as done immediately
        setLoading(false)
      }
    }

    checkSession()

    // Listen for auth changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      console.log('Auth state changed:', _event, !!session?.user)
      
      if (session?.user) {
        // Fetch display name from customers table (same as initial load)
        const displayName = await fetchDisplayName(session.user.id)
        
        setUser({
          id: session.user.id,
          email: session.user.email,
          name: displayName || session.user.email.split('@')[0],
          created_at: session.user.created_at
        })
        setEmailVerified(session.user.email_confirmed_at !== null)
        
        // Store user in localStorage for recovery during redirects
        try {
          localStorage.setItem('authUserBackup', JSON.stringify({
            id: session.user.id,
            email: session.user.email,
            name: displayName || session.user.email.split('@')[0],
            created_at: session.user.created_at
          }))
        } catch (err) {
          console.warn('Could not backup user to localStorage:', err)
        }
        
        // Check admin status in background (don't block)
        checkAdminStatus(session.user.id)
        setLoading(false)
      } else {
        // Don't immediately clear user if we're on a payment success page
        // The session might be temporarily lost during Stripe redirect
        const isPaymentSuccess = typeof window !== 'undefined' && 
                                 window.location.search.includes('success=true')
        
        // If on payment success page, try to restore user from backup
        if (isPaymentSuccess) {
          setIsRecoveringFromRedirect(true)
          console.log('Payment success page detected, attempting auth recovery from localStorage')
          
          try {
            const userBackup = localStorage.getItem('authUserBackup')
            if (userBackup && !user) {
              const restoredUser = JSON.parse(userBackup)
              console.warn('✅ Restored user from localStorage backup:', restoredUser.email)
              setUser(restoredUser)
              setEmailVerified(false)
              setIsRecoveringFromRedirect(false)
              setLoading(false)
              return // Don't clear the user
            }
          } catch (err) {
            console.warn('Could not restore user from localStorage:', err)
          }
          
          if (user) {
            console.warn('✅ Auth state recovered, keeping existing user session')
            // Don't clear the user, just update verified status
            setEmailVerified(false)
            setIsRecoveringFromRedirect(false)
            return
          }
          
          // Couldn't restore - let it clear
          console.error('❌ Could not recover auth state on payment success page')
          setIsRecoveringFromRedirect(false)
        }
        
        // Clear user and localStorage backup when actually logging out
        try {
          localStorage.removeItem('authUserBackup')
        } catch (err) {
          console.warn('Could not clear localStorage backup:', err)
        }
        
        setUser(null)
        setEmailVerified(false)
        setIsAdmin(false)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const login = async (email, password, captchaToken) => {
    try {
      // Note: captchaToken validation would ideally be done server-side
      // For now, we just require it to be present
      if (!captchaToken) {
        return { success: false, error: 'Please complete the CAPTCHA' }
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
        options: {
          captchaToken
        }
      })
      
      if (error) {
        return { success: false, error: error.message }
      }

      // If the user has verified MFA factors, force a challenge before completing login
      const { data: factors, error: factorError } = await supabase.auth.mfa.listFactors()
      if (factorError) {
        return { success: false, error: factorError.message }
      }

      const verifiedTotp = factors?.totp?.filter(f => f.status === 'verified') || []

      if (verifiedTotp.length > 0) {
        const factorId = verifiedTotp[0].id
        const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({ factorId })
        if (challengeError) {
          return { success: false, error: challengeError.message }
        }

        // Return an MFA-required state so the UI can prompt for the 6-digit code
        return {
          success: false,
          mfaRequired: true,
          factorId,
          challengeId: challengeData.id
        }
      }

      // Fetch display name from customers table
      const displayName = await fetchDisplayName(data.user.id)

      setUser({
        id: data.user.id,
        email: data.user.email,
        name: displayName || data.user.email.split('@')[0],
        created_at: data.user.created_at
      })

      // Check admin status after login
      checkAdminStatus(data.user.id)

      // Create session record
      await createSessionRecord(data.user.id)

      return { success: true }
    } catch (err) {
      return { success: false, error: 'An error occurred during login' }
    }
  }

  const verifyMfaChallenge = async ({ factorId, challengeId, code }) => {
    try {
      const { data, error } = await supabase.auth.mfa.verify({
        factorId,
        challengeId,
        code
      })

      if (error) {
        console.error('MFA verification error:', error)
        return { success: false, error: error.message }
      }

      // Refresh session/user after successful MFA to ensure state is updated to AAL2
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
      if (sessionError) {
        console.error('Session refresh error:', sessionError)
      }
      
      const authedUser = sessionData?.session?.user

      if (authedUser) {
        // Fetch display name from customers table
        const displayName = await fetchDisplayName(authedUser.id)
        
        setUser({
          id: authedUser.id,
          email: authedUser.email,
          name: displayName || authedUser.email.split('@')[0],
          created_at: authedUser.created_at
        })

        // Check admin status after MFA
        checkAdminStatus(authedUser.id)

        // Try to create session record but don't block if it fails
        try {
          await createSessionRecord(authedUser.id)
        } catch (sessionRecordErr) {
          console.warn('Session record creation failed (non-blocking):', sessionRecordErr)
        }
      }

      return { success: true }
    } catch (err) {
      console.error('MFA verification exception:', err)
      return { success: false, error: 'Failed to verify MFA code' }
    }
  }

  const loginWithGoogle = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: import.meta.env.VITE_FRONTEND_URL || window.location.origin
        }
      })

      if (error) {
        return { success: false, error: error.message }
      }

      // Supabase will redirect; return URL for completeness in case caller wants to use it
      return { success: true, url: data?.url }
    } catch (err) {
      return { success: false, error: 'Could not start Google sign-in' }
    }
  }

  const createSessionRecord = async (userId) => {
    try {
      // Get device info
      const userAgent = navigator.userAgent
      
      // Try to get IP (note: this is limited on client-side, better done server-side)
      // For now we'll just use null and let the server/webhook populate it
      
      const { error } = await supabase.from('sessions').insert([
        {
          user_id: userId,
          user_agent: userAgent,
          ip_address: null, // Can't reliably get client IP on client-side
          last_activity: new Date().toISOString()
        }
      ])

      if (error) {
        console.warn('Failed to create session record:', error)
      }
    } catch (err) {
      console.warn('Session record creation error:', err)
    }
  }

  const signup = async (name, email, password, captchaToken) => {
    try {
      // Check if email already exists in customers table
      const { data: existingCustomer } = await supabase
        .from('customers')
        .select('email')
        .eq('email', email.toLowerCase())
        .maybeSingle()

      if (existingCustomer) {
        return { success: false, error: 'An account with this email already exists. Please log in instead.' }
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: name
          },
          emailRedirectTo: `${import.meta.env.VITE_FRONTEND_URL || 'https://zeuservices.com'}/verify-email`,
          captchaToken
        }
      })
      
      if (error) {
        return { success: false, error: error.message }
      }

      // Check if user was actually created (not just returned existing unconfirmed user)
      // Supabase returns identities: [] if email exists but unconfirmed
      if (data?.user && !data.user.identities?.length) {
        return { success: false, error: 'An account with this email already exists. Please check your email or log in.' }
      }

      // Explicitly sign out - require email verification before allowing access
      console.log('Signing out user after signup...')
      const { error: signOutError } = await supabase.auth.signOut()
      if (signOutError) {
        console.error('Signout error:', signOutError)
      }
      
      setUser(null)
      setEmailVerified(false)

      console.log('Signup successful, user must verify email')
      // Supabase will send confirmation email via SMTP settings
      return { success: true, requiresVerification: true, message: 'Please check your email to verify your account' }
    } catch (err) {
      console.error('Signup error:', err)
      return { success: false, error: 'An error occurred during signup' }
    }
  }

  const logout = async () => {
    // Clear local state IMMEDIATELY - don't wait for Supabase
    setUser(null)
    setEmailVerified(false)
    setIsAdmin(false)

    // Try to sign out from Supabase but don't block if it fails/times out
    try {
      // Use a short timeout for logout - should be fast
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Logout timeout')), 3000)
      )
      
      const logoutPromise = supabase.auth.signOut({ scope: 'global' })
      
      await Promise.race([logoutPromise, timeoutPromise])
    } catch (err) {
      // Logout call failed or timed out - that's OK, local state is already cleared
      console.error('Supabase logout failed (non-blocking):', err)
    } finally {
      // Clear ALL client storage
      try {
        localStorage.clear()
        sessionStorage.clear()
      } catch (storageErr) {
        console.warn('Storage clear failed:', storageErr)
      }

      // Force redirect to login immediately
      window.location.href = '/login'
    }
  }

  const resendVerificationEmail = async () => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      
      if (!currentUser) {
        return { success: false, error: 'No user logged in' }
      }

      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: currentUser.email
      })

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true, message: 'Verification email sent! Check your inbox.' }
    } catch (err) {
      return { success: false, error: 'Failed to resend verification email' }
    }
  }

  const updateProfile = async ({ name }) => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      
      if (!currentUser) {
        return { success: false, error: 'No user logged in' }
      }

      const { error } = await supabase.auth.updateUser({
        data: { name }
      })

      if (error) {
        return { success: false, error: error.message }
      }

      // Update local user state
      setUser(prev => ({ ...prev, name }))
      
      return { success: true }
    } catch (err) {
      return { success: false, error: 'Failed to update profile' }
    }
  }

  const changePassword = async (newPassword) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (err) {
      return { success: false, error: 'Failed to change password' }
    }
  }

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      loginWithGoogle,
      signup, 
      logout, 
      loading, 
      emailVerified,
      isAdmin,
      isRecoveringFromRedirect,
      resendVerificationEmail,
      updateProfile,
      changePassword,
      verifyMfaChallenge,
      refreshAdminStatus: () => user && checkAdminStatus(user.id)
    }}>
      {children}
    </AuthContext.Provider>
  )
}
