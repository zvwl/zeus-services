import { Suspense } from 'react'
import AdminGamesPage from '@/views/AdminGamesPage'
export const metadata = { title: 'Manage Games', robots: { index: false, follow: false } }
export default function Page() {
  return (
    <Suspense>
      <AdminGamesPage />
    </Suspense>
  )
}
