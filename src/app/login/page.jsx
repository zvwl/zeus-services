import { Suspense } from 'react'
import LoginPage from '@/views/LoginPage'
export const metadata = { title: 'Sign In', robots: { index: false, follow: false } }
export default function Page() {
  return (
    <Suspense>
      <LoginPage />
    </Suspense>
  )
}
