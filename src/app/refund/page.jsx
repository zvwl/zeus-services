import { Suspense } from 'react'
import RefundPage from '@/views/RefundPage'
export const metadata = {
  title: 'Refund Policy',
  robots: { index: true, follow: true },
  alternates: { canonical: '/refund' },
}
export default function Page() {
  return (
    <Suspense>
      <RefundPage />
    </Suspense>
  )
}
