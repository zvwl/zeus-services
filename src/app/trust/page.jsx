import { Suspense } from 'react'
import TrustPage from '@/views/TrustPage'
export const metadata = { title: 'Why Trust Us', description: 'Why customers trust Zeuservices — 9+ years experience, thousands of orders, 5-star reviews.', robots: { index: true, follow: true } }
export default function Page() {
  return (
    <Suspense>
      <TrustPage />
    </Suspense>
  )
}
