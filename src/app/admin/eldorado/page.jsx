import { Suspense } from 'react'
import AdminEldoradoPage from '@/views/AdminEldoradoPage'
export const metadata = { title: 'Eldorado Management', robots: { index: false, follow: false } }
export default function Page() {
  return (
    <Suspense>
      <AdminEldoradoPage />
    </Suspense>
  )
}
