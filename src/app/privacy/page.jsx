import { Suspense } from 'react'
import PrivacyPage from '@/views/PrivacyPage'
export const metadata = {
  title: 'Privacy Policy',
  robots: { index: true, follow: true },
  alternates: { canonical: '/privacy' },
}
export default function Page() {
  return (
    <Suspense>
      <PrivacyPage />
    </Suspense>
  )
}
