import { Suspense } from 'react'
import CartPage from '@/views/CartPage'
export const metadata = { title: 'Your Cart', robots: { index: false, follow: false } }
export default function Page() {
  return (
    <Suspense>
      <CartPage />
    </Suspense>
  )
}
