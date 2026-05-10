import { Suspense } from 'react'
import AdminOrdersPage from '@/views/AdminOrdersPage'
export const metadata = { title: 'Manage Orders', robots: { index: false, follow: false } }
export default function Page() {
  return (
    <Suspense>
      <AdminOrdersPage />
    </Suspense>
  )
}
