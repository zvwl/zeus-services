import { Suspense } from 'react'
import PrivacyPage from '@/views/PrivacyPage'
export const metadata = { title: 'Privacy Policy', robots: { index: false, follow: false } }
export default function Page() {
  return (
    <Suspense>
      <PrivacyPage />
    </Suspense>
  )
}
