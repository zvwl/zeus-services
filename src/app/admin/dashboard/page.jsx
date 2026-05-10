import { Suspense } from 'react'
import AdminDashboard from '@/views/AdminDashboard'
export const metadata = { title: 'Admin Dashboard', robots: { index: false, follow: false } }
export default function Page() {
  return (
    <Suspense>
      <AdminDashboard />
    </Suspense>
  )
}
