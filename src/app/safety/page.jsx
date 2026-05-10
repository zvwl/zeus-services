import { Suspense } from 'react'
import SafetyPage from '@/views/SafetyPage'
export const metadata = { title: 'Safety & Security', description: 'How Zeuservices keeps your account safe. Manual delivery, Stripe payments, and game-specific best practices.', robots: { index: true, follow: true } }
export default function Page() {
  return (
    <Suspense>
      <SafetyPage />
    </Suspense>
  )
}
