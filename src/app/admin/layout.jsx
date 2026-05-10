import ProtectedAdminRoute from '@/components/ProtectedAdminRoute'

export default function AdminLayout({ children }) {
  return <ProtectedAdminRoute>{children}</ProtectedAdminRoute>
}
