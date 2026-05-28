import { Suspense } from 'react'
import TermsPage from '@/views/TermsPage'
export const metadata = {
  title: 'Terms & Conditions',
  robots: { index: true, follow: true },
  alternates: { canonical: '/terms' },
}
export default function Page() {
  return (
    <Suspense>
      <TermsPage />
    </Suspense>
  )
}
