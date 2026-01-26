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
      // Create a promise that rejects after 5 seconds
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Admin check timeout')), 5000)
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
      
      if (adminData) {
        console.log('✅ Admin status confirmed for user:', userId)
        setIsAdmin(true)
        try { localStorage.setItem('isAdmin', 'true') } catch {}
      } else {
        console.log('❌ User is not an admin:', userId)
        setIsAdmin(false)
        try { localStorage.removeItem('isAdmin') } catch {}
      }
    } catch (err) {
      console.error('Admin check exception:', err)
      setIsAdmin(false)
    }
  }

  useEffect(() => {
    // Check for existing Supabase session with timeout
    const checkSession = async () => {
      try {
        // Create timeout promise - if session check takes >5 seconds, give up
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Session check timeout')), 5000)
        )

        const sessionPromise = supabase.auth.getSession()

        const { data: { session } } = await Promise.race([
          sessionPromise,
          timeoutPromise
        ])

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
          
          setUser({
            id: session.user.id,
            email: session.user.email,
            name: session.user.user_metadata?.name || session.user.email.split('@')[0],
            created_at: session.user.created_at
          })
          setEmailVerified(session.user.email_confirmed_at !== null)
          
          // Check admin status immediately
          checkAdminStatus(session.user.id)
        }
      } catch (err) {
        console.error('Session check error:', err)
        // If session check fails or times out, clear everything
        setUser(null)
        setEmailVerified(false)
        setIsAdmin(false)
      } finally {
        setLoading(false)
      }
    }

    checkSession()

    // Listen for auth changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email,
          name: session.user.user_metadata?.name || session.user.email.split('@')[0],
          created_at: session.user.created_at
        })
        setEmailVerified(session.user.email_confirmed_at !== null)
        // Check admin status on every auth change
        await checkAdminStatus(session.user.id)
        setLoading(false)
      } else {
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

      setUser({
        id: data.user.id,
        email: data.user.email,
        name: data.user.user_metadata?.name || data.user.email.split('@')[0],
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
        setUser({
          id: authedUser.id,
          email: authedUser.email,
          name: authedUser.user_metadata?.name || authedUser.email.split('@')[0],
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
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name
          },
          emailRedirectTo: `${import.meta.env.VITE_FRONTEND_URL || 'https://zeuservices.com'}/verify-email`,
          captchaToken
        }
      })
      
      if (error) {
        return { success: false, error: error.message }
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
