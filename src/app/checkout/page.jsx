import { Suspense } from 'react'
import CheckoutPage from '@/views/CheckoutPage'
export const metadata = { title: 'Checkout', robots: { index: false, follow: false } }
export default function Page() {
  return (
    <Suspense>
      <CheckoutPage />
    </Suspense>
  )
}
