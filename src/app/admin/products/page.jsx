import { Suspense } from 'react'
import AdminProductsPage from '@/views/AdminProductsPage'
export const metadata = { title: 'Manage Products', robots: { index: false, follow: false } }
export default function Page() {
  return (
    <Suspense>
      <AdminProductsPage />
    </Suspense>
  )
}
