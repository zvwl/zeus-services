import { Suspense } from 'react'
import ProcessPage from '@/views/ProcessPage'
export const metadata = { title: 'How It Works', description: 'How Zeuservices works — order, pay via Stripe, get delivered via Discord. Simple, safe, fast.', robots: { index: true, follow: true } }
export default function Page() {
  return (
    <Suspense>
      <ProcessPage />
    </Suspense>
  )
}
