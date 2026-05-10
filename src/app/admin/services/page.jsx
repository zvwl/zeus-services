import { Suspense } from 'react'
import AdminServicesPage from '@/views/AdminServicesPage'
export const metadata = { title: 'Manage Services', robots: { index: false, follow: false } }
export default function Page() {
  return (
    <Suspense>
      <AdminServicesPage />
    </Suspense>
  )
}
