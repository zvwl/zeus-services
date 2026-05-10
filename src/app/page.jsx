import HomeClient from '@/views/Home'
import { HOME_FAQ_SCHEMA } from '@/lib/seo-utils'

export const metadata = {
  title: 'Zeuservices - Multi-Game Topups, Boosting & Accounts',
  description:
    'Professional gaming services across multiple games. Account boosting, modded accounts, and topups for GTA 5, Fortnite, Rocket League, Forza Horizon 6, and more. Safe, manual delivery. 9+ years trusted.',
  alternates: { canonical: '/' },
}

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(HOME_FAQ_SCHEMA) }}
      />
      <HomeClient />
    </>
  )
}
