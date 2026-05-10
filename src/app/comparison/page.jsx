import { Suspense } from 'react'
import ComparisonPage from '@/views/ComparisonPage'
export const metadata = { title: 'Modded Accounts vs Boosting', description: 'Compare modded accounts and boosting services on Zeuservices. Find out which option suits your needs.', robots: { index: true, follow: true } }
export default function Page() {
  return (
    <Suspense>
      <ComparisonPage />
    </Suspense>
  )
}
