import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { useEffect } from 'react'

export default function ProtectedAdminRoute({ children }) {
  const { user, isAdmin, loading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (loading) return
    
    if (!user) {
      navigate('/login')
      return
    }
    
    if (!isAdmin) {
      console.warn(`Unauthorized access attempt by user ${user.id} (${user.email}) to admin route`)
      navigate('/')
      return
    }
  }, [user, isAdmin, loading, navigate])

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#cbd5e1' }}>
        Verifying access...
      </div>
    )
  }

  if (!user || !isAdmin) {
    return null
  }

  return children
}
