'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { isTurnstileBypassed } from '../utils/turnstile'

const AuthContext = createContext(null)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

const DEV_BYPASS = process.env.NEXT_PUBLIC_DEV_ADMIN_BYPASS === 'true'

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(DEV_BYPASS
    ? { id: 'dev-admin-bypass', email: 'dev@zeuservices.local', name: 'Dev Admin', created_at: new Date().toISOString() }
    : null)
  const [loading, setLoading] = useState(!DEV_BYPASS)
  const [emailVerified, setEmailVerified] = useState(DEV_BYPASS)
  const [isRecoveringFromRedirect] = useState(false)
  const [isAdmin, setIsAdmin] = useState(DEV_BYPASS)

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
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Display name fetch timeout')), 3000)
      )

      const queryPromise = supabase
        .from('customers')
        .select('name')
        .eq('user_id', userId)
        .maybeSingle()

      const { data, error } = await Promise.race([queryPromise, timeoutPromise])

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

  // Function to check if user has Discord connected and existing orders, assign role if needed
  const checkDiscordRoleAssignment = async (userId) => {
    try {
      
      // Check if user has any paid orders
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('id')
        .eq('user_id', userId)
        .eq('payment_status', 'paid')
        .limit(1)
      
      if (ordersError) {
        console.error('Error checking orders:', ordersError)
        return
      }
      
      const hasPaidOrders = orders && orders.length > 0
      
      if (!hasPaidOrders) {
        return
      }
      
      
      // Call the edge function to assign Discord role (it will check if Discord is connected)
      const { error } = await supabase.functions.invoke('assign-discord-role', {
        body: { 
          userId: userId,
          retroactive: true 
        }
      })
      
      if (error) {
        console.error('Error calling assign-discord-role:', error)
        return
      }
      
    } catch (err) {
      console.error('Discord role check error:', err)
    }
  }

  useEffect(() => {
    // Dev bypass: mock admin session without touching Supabase auth
    if (DEV_BYPASS) return

    // Check for existing Supabase session
    // Supabase with persistSession: true will automatically restore from localStorage
    const checkSession = async () => {
      // Keep a reference so the catch block can use it as fallback
      let savedSession = null

      try {
        await new Promise(resolve => setTimeout(resolve, 200))

        const { data: { session }, error } = await supabase.auth.getSession()
        savedSession = session

        if (error) {
          setUser(null)
          setEmailVerified(false)
          setLoading(false)
          return
        }

        if (session?.user) {
          const { data: { user: verifiedUser }, error: userError } = await supabase.auth.getUser()

          if (userError) {
            const status = userError?.status
            if (status === 401 || status === 403) {
              await supabase.auth.signOut({ scope: 'local' })
              setUser(null)
              setEmailVerified(false)
              setLoading(false)
              return
            }
            // Non-auth error — fall through and use session.user below
          }

          const effectiveUser = verifiedUser || session.user
          if (!effectiveUser) {
            setUser(null)
            setEmailVerified(false)
            setLoading(false)
            return
          }

          if (!effectiveUser.email_confirmed_at) {
            await supabase.auth.signOut({ scope: 'local' })
            setUser(null)
            setEmailVerified(false)
            setIsAdmin(false)
            setLoading(false)
            return
          }

          const displayName = await fetchDisplayName(effectiveUser.id)

          setUser({
            id: effectiveUser.id,
            email: effectiveUser.email,
            name: displayName || effectiveUser.email.split('@')[0],
            created_at: effectiveUser.created_at,
          })
          setEmailVerified(true)
          checkAdminStatus(effectiveUser.id)
          setLoading(false)
        } else {
          setLoading(false)
        }
      } catch (err) {
        console.error('Session check error:', err)
        // If we have a valid cached session, keep the user logged in rather than
        // kicking them out due to a transient network/API error.
        if (savedSession?.user?.email_confirmed_at) {
          const u = savedSession.user
          setUser({
            id: u.id,
            email: u.email,
            name: u.email.split('@')[0],
            created_at: u.created_at,
          })
          setEmailVerified(true)
          setLoading(false)
        } else {
          setUser(null)
          setEmailVerified(false)
          setIsAdmin(false)
          setLoading(false)
        }
      }
    }

    checkSession()

    // Listen for auth changes (login, logout, token refresh)
    // This fires when:
    // - User logs in (event: SIGNED_IN)
    // - User logs out (event: SIGNED_OUT, session: null)
    // - Token refreshes (event: TOKEN_REFRESHED)
    // - Session restored from localStorage (event: INITIAL_SESSION)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      
      // Skip INITIAL_SESSION - checkSession() handles the initial restore
      // We only want to respond to explicit user actions (SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED)
      if (_event === 'INITIAL_SESSION') {
        return
      }
      
      if (session?.user) {
        // User is logged in (SIGNED_IN, TOKEN_REFRESHED, etc)
        try {
          if (!session.user.email_confirmed_at) {
            await supabase.auth.signOut({ scope: 'local' })
            setUser(null)
            setEmailVerified(false)
            setIsAdmin(false)
            setLoading(false)
            return
          }
          
          // Set user state IMMEDIATELY without waiting for display name
          const userObject = {
            id: session.user.id,
            email: session.user.email,
            name: session.user.email.split('@')[0], // Default to email username
            created_at: session.user.created_at
          }
          
          setUser(userObject)
          setEmailVerified(true)
          setLoading(false)
          
          
          // Fetch display name in background and update if found (non-blocking)
          fetchDisplayName(session.user.id).then(displayName => {
            if (displayName) {
              setUser(prev => prev ? { ...prev, name: displayName } : null)
            }
          }).catch(err => {
            console.warn('Could not fetch display name:', err)
          })
          
          // Check admin status in background (non-blocking)
          checkAdminStatus(session.user.id).catch(err => {
            console.warn('Admin check failed:', err)
          })
          
          // Check if user just connected Discord and has existing orders (assign role retroactively)
          if (_event === 'SIGNED_IN') {
            checkDiscordRoleAssignment(session.user.id).catch(err => {
              console.warn('Discord role check failed:', err)
            })
            // Post-OAuth redirect is handled by LoginPage's useEffect which reads
            // the ?redirect= query param encoded in the OAuth redirectTo URL.
          }
        } catch (err) {
          console.error('Error processing auth session:', err)
          // Don't clear user on error - keep them logged in with minimal data
          const fallbackUser = {
            id: session.user.id,
            email: session.user.email,
            name: session.user.email.split('@')[0],
            created_at: session.user.created_at
          }
          setUser(fallbackUser)
          setLoading(false)
        }
      } else {
        // User is logged out (SIGNED_OUT)
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
      const requireCaptcha = !isTurnstileBypassed()
      // Note: captchaToken validation would ideally be done server-side
      // For now, we just require it to be present
      if (requireCaptcha && !captchaToken) {
        return { success: false, error: 'Please complete the CAPTCHA' }
      }


      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
        options: {
          captchaToken: captchaToken || undefined
        }
      })
      
      if (error) {
        console.error('Login error details:', { status: error.status, message: error.message, code: error.code })
        return { success: false, error: error.message || 'Login failed. Please check your credentials.' }
      }

      if (!data?.user?.email_confirmed_at) {
        await supabase.auth.signOut({ scope: 'local' })
        return { success: false, error: 'Please verify your email before logging in.' }
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
    } catch (_err) {
      return { success: false, error: 'An error occurred during login' }
    }
  }

  const verifyMfaChallenge = async ({ factorId, challengeId, code }) => {
    try {
      const { error } = await supabase.auth.mfa.verify({
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

  const loginWithGoogle = async (redirectPath = '/') => {
    try {
      const base = process.env.NEXT_PUBLIC_FRONTEND_URL ||
        (typeof window !== 'undefined' ? window.location.origin : 'https://zeuservices.com')
      // Encode the destination directly in the OAuth redirectTo URL so it
      // survives the OAuth round-trip on all mobile browsers (no localStorage needed).
      const redirectTo = `${base}/login?redirect=${encodeURIComponent(redirectPath)}`
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo }
      })
      if (error) return { success: false, error: error.message }
      return { success: true, url: data?.url }
    } catch (_err) {
      return { success: false, error: 'Could not start Google sign-in' }
    }
  }

  const loginWithDiscord = async (redirectPath = '/') => {
    try {
      const base = process.env.NEXT_PUBLIC_FRONTEND_URL ||
        (typeof window !== 'undefined' ? window.location.origin : 'https://zeuservices.com')
      const redirectTo = `${base}/login?redirect=${encodeURIComponent(redirectPath)}`
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'discord',
        options: { redirectTo, scopes: 'identify email' }
      })
      if (error) return { success: false, error: error.message }
      return { success: true, url: data?.url }
    } catch (_err) {
      return { success: false, error: 'Could not start Discord sign-in' }
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
    } catch (_err) {
      console.warn('Session record creation error:', _err)
    }
  }

  const signup = async (name, email, password, captchaToken) => {
    try {
      const requireCaptcha = !isTurnstileBypassed()
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
          emailRedirectTo: `${process.env.NEXT_PUBLIC_FRONTEND_URL || 'https://zeuservices.com'}/verify-email`,
          captchaToken: requireCaptcha ? captchaToken : undefined
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
      const { error: signOutError } = await supabase.auth.signOut()
      if (signOutError) {
        console.error('Signout error:', signOutError)
      }
      
      setUser(null)
      setEmailVerified(false)

      // Supabase will send confirmation email via SMTP settings
      return { success: true, requiresVerification: true, message: 'Please check your email to verify your account' }
    } catch (_err) {
      console.error('Signup error:', _err)
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
    } catch (_err) {
      // Logout call failed or timed out - that's OK, local state is already cleared
      console.error('Supabase logout failed (non-blocking):', _err)
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

  const resendVerificationEmail = async (captchaToken) => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      
      if (!currentUser) {
        return { success: false, error: 'No user logged in' }
      }

      if (!captchaToken && !isTurnstileBypassed()) {
        return { success: false, error: 'Please complete the CAPTCHA' }
      }

      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: currentUser.email,
        options: {
          emailRedirectTo: `${process.env.NEXT_PUBLIC_FRONTEND_URL || 'https://zeuservices.com'}/verify-email`,
          captchaToken: captchaToken || undefined
        }
      })

      if (error) {
        console.error('Resend verification error:', error)
        return { success: false, error: error.message }
      }

      return { success: true, message: 'Verification email sent! Check your inbox.' }
    } catch (_err) {
      return { success: false, error: 'Failed to resend verification email' }
    }
  }

  const resendVerificationEmailForEmail = async (email, captchaToken) => {
    try {
      if (!email) {
        return { success: false, error: 'Please enter your email first' }
      }

      if (!captchaToken && !isTurnstileBypassed()) {
        return { success: false, error: 'Please complete the CAPTCHA' }
      }

      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: {
          emailRedirectTo: `${process.env.NEXT_PUBLIC_FRONTEND_URL || 'https://zeuservices.com'}/verify-email`,
          captchaToken: captchaToken || undefined
        }
      })

      if (error) {
        console.error('Resend verification error:', error)
        return { success: false, error: error.message }
      }

      return { success: true, message: 'Verification email sent! Check your inbox.' }
    } catch (_err) {
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
    } catch (_err) {
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
    } catch (_err) {
      return { success: false, error: 'Failed to change password' }
    }
  }

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      loginWithGoogle,
      loginWithDiscord,
      signup, 
      logout, 
      loading, 
      emailVerified,
      isAdmin,
      isRecoveringFromRedirect,
      resendVerificationEmail,
      resendVerificationEmailForEmail,
      updateProfile,
      changePassword,
      verifyMfaChallenge,
      refreshAdminStatus: () => user && checkAdminStatus(user.id)
    }}>
      {children}
    </AuthContext.Provider>
  )
}

