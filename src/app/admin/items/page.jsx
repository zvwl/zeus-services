import { Suspense } from 'react'
import AdminItemsPage from '@/views/AdminItemsPage'
export const metadata = { title: 'Manage Items', robots: { index: false, follow: false } }
export default function Page() {
  return (
    <Suspense>
      <AdminItemsPage />
    </Suspense>
  )
}
