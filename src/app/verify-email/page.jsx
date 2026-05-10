import { Suspense } from 'react'
import VerifyEmailPage from '@/views/VerifyEmailPage'
export const metadata = { title: 'Verify Email', robots: { index: false, follow: false } }
export default function Page() {
  return (
    <Suspense>
      <VerifyEmailPage />
    </Suspense>
  )
}
