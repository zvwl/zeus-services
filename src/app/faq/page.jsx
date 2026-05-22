import { Suspense } from 'react'
import FAQPage from '@/views/FAQPage'

export const metadata = {
  title: 'FAQ - Game Boosting, Accounts & Top-ups | Zeuservices',
  description: 'Answers to the most common questions about Zeuservices: how boosting works, is it safe, delivery times, payment methods, refunds, and account security.',
  alternates: { canonical: 'https://zeuservices.com/faq' },
  robots: { index: true, follow: true },
}

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    { '@type': 'Question', name: 'Is account boosting safe?', acceptedAnswer: { '@type': 'Answer', text: 'Our services minimize detection risks through 9+ years of experience with each game\'s security systems. All boosting is done securely through Discord, and you maintain full account access throughout the process.' } },
    { '@type': 'Question', name: 'How fast are your gaming services?', acceptedAnswer: { '@type': 'Answer', text: 'Delivery times vary: account boosting typically takes 20 minutes to a few hours. Modded accounts are delivered within 1–2 hours. Top-ups and currency services are usually completed within 20 minutes to a few hours depending on the game.' } },
    { '@type': 'Question', name: 'What payment methods do you accept?', acceptedAnswer: { '@type': 'Answer', text: 'We accept all major credit and debit cards through Stripe Checkout (Visa, Mastercard, American Express). Payment is secure, encrypted, and PCI-compliant. We do not accept cryptocurrency.' } },
    { '@type': 'Question', name: 'Will I get banned for using your services?', acceptedAnswer: { '@type': 'Answer', text: 'Our services are designed to minimize detection risk through safe, manual methods developed over 9+ years. Each modded account is tested and verified before delivery. However, game security systems are unpredictable, so a small risk always exists.' } },
    { '@type': 'Question', name: 'How do I receive my account or service?', acceptedAnswer: { '@type': 'Answer', text: 'After purchase, we contact you via Discord. For modded accounts, we provide login credentials once. For boosting services, you provide account access securely and we update you on progress via Discord throughout.' } },
    { '@type': 'Question', name: 'What games and platforms do you support?', acceptedAnswer: { '@type': 'Answer', text: 'We support GTA 5, Fortnite, Rocket League, Forza Horizon 6, and more across PC, PlayStation, and Xbox platforms. Check our catalog or contact us on Discord for specific platform availability.' } },
    { '@type': 'Question', name: 'Can I get a refund?', acceptedAnswer: { '@type': 'Answer', text: 'No refunds are issued once a service or account has been delivered. If something goes wrong due to our methods (such as an account ban), we will redo the order for free. All sales are final.' } },
    { '@type': 'Question', name: 'How long has Zeuservices been operating?', acceptedAnswer: { '@type': 'Answer', text: 'Zeuservices has been providing gaming services for 9+ years, starting with GTA on PS3 and Xbox 360. Our experience covers every major game update, security patch, and enforcement change.' } },
  ],
}

export default function Page() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <Suspense>
        <FAQPage />
      </Suspense>
    </>
  )
}
