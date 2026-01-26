import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'

export default function ProtectedAdminRoute({ children }) {
  const { user, isAdmin, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [hasChecked, setHasChecked] = useState(false)

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

  // Show loading while auth is being checked
  if (authLoading || !hasChecked) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#cbd5e1' }}>
        Verifying access...
      </div>
    )
  }

  // Only render children if we've checked and user is admin
  if (!user || !isAdmin) {
    return null
  }

  return children
}
