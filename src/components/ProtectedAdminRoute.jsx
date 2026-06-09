'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'

const DEV_BYPASS = process.env.NEXT_PUBLIC_DEV_ADMIN_BYPASS === 'true'

export default function ProtectedAdminRoute({ children }) {
  if (DEV_BYPASS) return children
  const { user, isAdmin, loading: authLoading } = useAuth()
  const router = useRouter()
  const [hasChecked, setHasChecked] = useState(false)
  const [timeoutReached, setTimeoutReached] = useState(false)

  // If auth is taking too long, show fallback actions after 6 seconds
  useEffect(() => {
    if (!authLoading) return
    const t = setTimeout(() => setTimeoutReached(true), 6000)
    return () => clearTimeout(t)
  }, [authLoading])

  useEffect(() => {
    // Wait for auth to fully load
    if (authLoading) return
    
    // Mark that we've done the check
    setHasChecked(true)
    
    if (!user) {
      router.push('/login')
      return
    }
    
    if (!isAdmin) {
      router.push('/')
      return
    }
  }, [user, isAdmin, authLoading, router])

  const handleForceLogout = async () => {
    // Clear state immediately
    try {
      localStorage.clear()
      sessionStorage.clear()
    } catch (_storageErr) {
      // Ignore storage clear errors.
    }
    
    // Try Supabase logout but don't wait long
    try {
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), 2000)
      )
      await Promise.race([
        supabase.auth.signOut({ scope: 'global' }),
        timeoutPromise
      ])
    } catch (_signOutErr) {
      // Ignore signout timeout/network errors and continue redirect.
    }
    
    // Redirect immediately
    window.location.href = '/login'
  }

  // Show loading while auth is being checked, with fallback actions if it stalls
  if (authLoading || !hasChecked) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#cbd5e1' }}>
        <div>Verifying access...</div>
        {timeoutReached && (
          <div style={{ marginTop: '1rem' }}>
            <button
              onClick={handleForceLogout}
              style={{
                padding: '0.6rem 1rem',
                borderRadius: 6,
                border: '1px solid rgba(239,68,68,0.5)',
                background: 'rgba(239,68,68,0.1)',
                color: '#ef4444',
                cursor: 'pointer'
              }}
            >
              Force Logout
            </button>
          </div>
        )}
      </div>
    )
  }

  // Only render children if we've checked and user is admin
  if (!user || !isAdmin) {
    return null
  }

  return children
}
