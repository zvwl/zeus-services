import { Suspense } from 'react'
import ReviewsPage from '@/views/ReviewsPage'
export const metadata = { title: 'Customer Reviews', description: 'Read verified reviews from Zeuservices customers. 9+ years of trusted gaming services.', robots: { index: true, follow: true } }
export default function Page() {
  return (
    <Suspense>
      <ReviewsPage />
    </Suspense>
  )
}
