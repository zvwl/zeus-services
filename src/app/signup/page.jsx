import { Suspense } from 'react'
import SignupPage from '@/views/SignupPage'
export const metadata = { title: 'Create Account', robots: { index: false, follow: false } }
export default function Page() {
  return (
    <Suspense>
      <SignupPage />
    </Suspense>
  )
}
