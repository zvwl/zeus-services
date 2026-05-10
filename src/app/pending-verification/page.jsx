import { Suspense } from 'react'
import PendingVerificationPage from '@/views/PendingVerificationPage'
export const metadata = { title: 'Pending Verification', robots: { index: false, follow: false } }
export default function Page() {
  return (
    <Suspense>
      <PendingVerificationPage />
    </Suspense>
  )
}
