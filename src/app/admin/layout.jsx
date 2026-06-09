import ProtectedAdminRoute from '@/components/ProtectedAdminRoute'
import AdminNav from '@/components/AdminNav'

export default function AdminLayout({ children }) {
  return (
    <ProtectedAdminRoute>
      <AdminNav />
      {children}
    </ProtectedAdminRoute>
  )
}
