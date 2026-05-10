import { Suspense } from 'react'
import SettingsPage from '@/views/SettingsPage'
export const metadata = { title: 'Account Settings', robots: { index: false, follow: false } }
export default function Page() {
  return (
    <Suspense>
      <SettingsPage />
    </Suspense>
  )
}
