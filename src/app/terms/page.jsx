import { Suspense } from 'react'
import TermsPage from '@/views/TermsPage'
export const metadata = { title: 'Terms & Conditions', robots: { index: false, follow: false } }
export default function Page() {
  return (
    <Suspense>
      <TermsPage />
    </Suspense>
  )
}
