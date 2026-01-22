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

  useEffect(() => {
    // Check for existing Supabase session
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          setUser({
            email: session.user.email,
            name: session.user.user_metadata?.name || session.user.email.split('@')[0]
          })
          setEmailVerified(session.user.email_confirmed_at !== null)
        }
      } catch (err) {
        console.error('Session check error:', err)
      } finally {
        setLoading(false)
      }
    }

    checkSession()

    // Listen for auth changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({
          email: session.user.email,
          name: session.user.user_metadata?.name || session.user.email.split('@')[0]
        })
        setEmailVerified(session.user.email_confirmed_at !== null)
        setLoading(false)
      } else {
        setUser(null)
        setEmailVerified(false)
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
        password
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
        email: data.user.email,
        name: data.user.user_metadata?.name || data.user.email.split('@')[0]
      })

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
        return { success: false, error: error.message }
      }

      // Refresh session/user after successful MFA to ensure state is updated to AAL2
      const { data: sessionData } = await supabase.auth.getSession()
      const authedUser = sessionData?.session?.user

      if (authedUser) {
        setUser({
          email: authedUser.email,
          name: authedUser.user_metadata?.name || authedUser.email.split('@')[0]
        })

        await createSessionRecord(authedUser.id)
      }

      return { success: true }
    } catch (err) {
      return { success: false, error: 'Failed to verify MFA code' }
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

      // Auto login after signup
      if (data.user) {
        setUser({
          email: data.user.email,
          name: name
        })

        // Create session record for new user
        await createSessionRecord(data.user.id)

        // Supabase will send confirmation email via SMTP settings
        return { success: true }
      }
      
      return { success: false, error: 'Signup failed' }
    } catch (err) {
      return { success: false, error: 'An error occurred during signup' }
    }
  }

  const logout = async () => {
    try {
      // Get current user to delete their sessions
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        // Delete all sessions for this user (optional - or just delete active one)
        await supabase.from('sessions').delete().eq('user_id', user.id)
      }
    } catch (err) {
      console.warn('Session cleanup error:', err)
    }

    await supabase.auth.signOut()
    setUser(null)
    setEmailVerified(false)
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
      signup, 
      logout, 
      loading, 
      emailVerified, 
      resendVerificationEmail,
      updateProfile,
      changePassword,
      verifyMfaChallenge
    }}>
      {children}
    </AuthContext.Provider>
  )
}
