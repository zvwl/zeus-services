import { Suspense } from 'react'
import ResetPasswordPage from '@/views/ResetPasswordPage'
export const metadata = { title: 'Reset Password', robots: { index: false, follow: false } }
export default function Page() {
  return (
    <Suspense>
      <ResetPasswordPage />
    </Suspense>
  )
}
