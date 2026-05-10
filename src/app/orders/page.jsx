import { Suspense } from 'react'
import OrdersPage from '@/views/OrdersPage'
export const metadata = { title: 'Your Orders', robots: { index: false, follow: false } }
export default function Page() {
  return (
    <Suspense>
      <OrdersPage />
    </Suspense>
  )
}
