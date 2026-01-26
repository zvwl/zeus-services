import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

export default function ProtectedAdminRoute({ children }) {
  const { user, isAdmin, loading: authLoading, refreshAdminStatus } = useAuth()
  const navigate = useNavigate()
  const [hasChecked, setHasChecked] = useState(false)
  const [timeoutReached, setTimeoutReached] = useState(false)

  // If auth is taking too long, show fallback actions
  useEffect(() => {
    if (!authLoading) return
    const t = setTimeout(() => setTimeoutReached(true), 7000)
    return () => clearTimeout(t)
  }, [authLoading])

  useEffect(() => {
    // Wait for auth to fully load
    if (authLoading) return
    
    // Mark that we've done the check
    setHasChecked(true)
    
    if (!user) {
      navigate('/login')
      return
    }
    
    if (!isAdmin) {
      console.warn(`Unauthorized access attempt by user ${user.id} (${user.email}) to admin route`)
      navigate('/')
      return
    }
  }, [user, isAdmin, authLoading, navigate])

  // Show loading while auth is being checked, with fallback actions if it stalls
  if (authLoading || !hasChecked) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#cbd5e1' }}>
        <div>Verifying access...</div>
        {timeoutReached && (
          <div style={{ marginTop: '1rem' }}>
            <button
              onClick={() => refreshAdminStatus && refreshAdminStatus()}
              style={{
                padding: '0.6rem 1rem',
                marginRight: '0.6rem',
                borderRadius: 6,
                border: '1px solid rgba(251,191,36,0.5)',
                background: 'rgba(251,191,36,0.1)',
                color: '#fbbf24',
                cursor: 'pointer'
              }}
            >
              Retry Admin Check
            </button>
            <button
              onClick={async () => {
                try {
                  await supabase.auth.signOut({ scope: 'global' })
                } catch {}
                try {
                  localStorage.clear()
                  sessionStorage.clear()
                } catch {}
                window.location.href = '/login'
              }}
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
