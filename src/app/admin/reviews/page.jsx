import { Suspense } from 'react'
import AdminReviewsPage from '@/views/AdminReviewsPage'
export const metadata = { title: 'Manage Reviews', robots: { index: false, follow: false } }
export default function Page() {
  return (
    <Suspense>
      <AdminReviewsPage />
    </Suspense>
  )
}
