import { Suspense } from 'react'
import RefundPage from '@/views/RefundPage'
export const metadata = { title: 'Refund Policy', robots: { index: false, follow: false } }
export default function Page() {
  return (
    <Suspense>
      <RefundPage />
    </Suspense>
  )
}
