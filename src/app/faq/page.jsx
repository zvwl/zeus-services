import { Suspense } from 'react'
import FAQPage from '@/views/FAQPage'
export const metadata = { title: 'FAQ', description: 'Frequently asked questions about Zeuservices — delivery, payment, safety, and more.', robots: { index: true, follow: true } }
export default function Page() {
  return (
    <Suspense>
      <FAQPage />
    </Suspense>
  )
}
