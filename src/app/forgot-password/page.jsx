import { Suspense } from 'react'
import ForgotPasswordPage from '@/views/ForgotPasswordPage'
export const metadata = { title: 'Forgot Password', robots: { index: false, follow: false } }
export default function Page() {
  return (
    <Suspense>
      <ForgotPasswordPage />
    </Suspense>
  )
}
