import { Suspense } from 'react'
import ReviewForm from '@/views/ReviewForm'
export const metadata = { title: 'Leave a Review', robots: { index: false, follow: false } }
export default function Page() {
  return (
    <Suspense>
      <ReviewForm />
    </Suspense>
  )
}
