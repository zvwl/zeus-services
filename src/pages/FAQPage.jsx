import { useState } from 'react'
import SEO from '../components/SEO'
import Breadcrumb from '../components/Breadcrumb'
import '../pages/ReviewsPage.css'

export default function FAQPage() {
  const [expandedIndex, setExpandedIndex] = useState(null)

  const faqs = [
    {
      question: "Is account boosting safe?",
      answer: "Our services minimize detection risks through 9+ years of experience with each game's security systems. However, game bans are always a possibility - enforcement is unpredictable. We're honest about these risks upfront. All boosting is done securely through Discord, and you maintain full account access throughout the process. We stand behind our work with strong account guarantees."
    },
    {
      question: "What is the difference between boosting and modded accounts?",
      answer: "Boosting: We log into your existing account and progress it manually (ranking up, unlocking items, farming currency). Takes 20 minutes to a few hours depending on game and items purchased. Modded Accounts: Pre-built accounts delivered ready to play with progression already complete. Instant delivery. Choose boosting to keep your original account, or choose a modded account for instant high-level access."
    },
    {
      question: "How fast are your services?",
      answer: "Delivery times vary by game and service: Account boosting typically takes 20 minutes to a few hours depending on game and items. Modded accounts are delivered within 1-2 hours. Topups and currency services are delivered within 20 minutes to a few hours depending on game. Custom requests depend on complexity. Contact us for exact timeline for your specific game and service."
    },
    {
      question: "What platforms and games do you support?",
      answer: "We support multiple games across PC and other platforms: GTA 5 (Steam, Epic, Xbox App, Rockstar), Fortnite, Rocket League, Forza Horizon 6, and more. Each game has different platform options. Check our catalog to see which platforms we support for your specific game. Contact us if you need a game not listed."
    },
    {
      question: "Will I get banned for using your services?",
      answer: "Our services are designed to minimize detection risk through safe, manual methods developed over 9+ years. Each modded account is tested and verified before delivery. However, game security systems are unpredictable. We recommend following each game's terms of service to maintain account safety. We stand behind all accounts with strong ban protection guarantees."
    },
    {
      question: "How do I receive my account or service?",
      answer: "After purchase, we'll contact you via Discord (our preferred method for instant communication). For modded accounts, we provide login credentials ONCE - we cannot retrieve them later, so save them immediately and change the email/password right away. For boosting services, you provide account access securely, we update you on progress via Discord. All communication is private and secure. We respond within hours maximum."
    },
    {
      question: "What payment methods do you accept?",
      answer: "We accept all major credit and debit cards through Stripe Checkout (Visa, Mastercard, American Express). Payment is secure, encrypted, and PCI-compliant. We do not accept cryptocurrency or alternative payment methods. Your payment information is never stored on our servers."
    },
    {
      question: "Can I get a refund?",
      answer: "No refunds are issued once a service or account has been made and sent to you. All sales are final. However, if something goes wrong with the service (like an account ban due to our methods), we'll redo the order for free. Refunds are not available, only redos of the service. Check our Refund Policy page for complete details."
    },
    {
      question: "How is account security handled?",
      answer: "Security is our priority. For boosting: You maintain full account access and control throughout. For modded accounts: You receive the login details once - we CANNOT retrieve them after sending. You MUST change the email and password immediately upon receiving the account. We do not keep copies of credentials. Enable 2FA immediately. No accounts are shared or reused."
    },
    {
      question: "Do you offer custom services?",
      answer: "Absolutely! Our listed packages are base offerings. Need something specific? We create custom boosting plans, selective progression unlocks, or targeted farming. Contact us on Discord with your exact requirements and we'll provide a custom quote tailored to your needs."
    },
    {
      question: "How long have you been in business?",
      answer: "zeuservices has been providing gaming account services for 9+ years. We started with GTA on PS3 and Xbox 360 and have adapted through every game update, security patch, and enforcement wave. Our experience means proven safe methods, fast delivery, and reliability you can count on."
    },
    {
      question: "What happens if my account has issues after delivery?",
      answer: "If your account is banned within 30 days due to our service (not from other cheating/hacking), we'll redo the order for free. For boosting services, if our method is detected and causes issues, we'll redo the boosting. Note: No refunds are issued - we provide redos/replacements only. See our Refund Policy for complete details."
    },
    {
      question: "Can I customize what I order?",
      answer: "Yes! Want specific items unlocked, custom ranking levels, targeted weapons, or selective progression? We can customize almost any service. Contact us on Discord with details about what you need, and we'll provide a custom quote. Customization costs vary based on game and complexity."
    },
    {
      question: "How do I contact support?",
      answer: "Best way: Join our Discord server for instant responses and direct chat with our team. We respond within a few hours maximum. For account orders, you get a personal Discord contact who updates you throughout the process. Email support is also available at support@zeuservices.com."
    }
  ]

  return (
    <>
      <SEO 
        title="FAQ - Gaming Services, Boosting & Modded Accounts | zeuservices"
        description="Frequently asked questions about account boosting, modded accounts, topups, delivery times, safety, platforms, and more. Get answers from our 9+ year experts covering all games."
        keywords="gaming FAQ, boosting services questions, modded accounts questions, account safety, service help, gaming services"
      />
      
      <section className="section">
        <Breadcrumb customItems={[{ label: 'Home', path: '/' }, { label: 'FAQ', path: '/faq' }]} />
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '3rem 2rem' }}>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem', color: '#f1f5f9' }}>
            Frequently Asked Questions
          </h1>
          <p style={{ fontSize: '1.1rem', color: '#cbd5e1', marginBottom: '3rem', lineHeight: '1.6' }}>
            Have questions about our account boosting services, modded accounts, topups, how services work, or account safety? Find answers to common questions below. If you don't find your answer, reach out to us on Discord.
          </p>

          <div className="faq-list">
            {faqs.map((faq, index) => (
              <details key={index} className="faq-item" open={expandedIndex === index}>
                <summary 
                  onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
                  style={{ cursor: 'pointer', padding: '1rem', borderBottom: '1px solid #334155' }}
                >
                  <span style={{ fontSize: '1.1rem', fontWeight: '600', color: '#fbbf24' }}>
                    {faq.question}
                  </span>
                </summary>
                <p style={{ padding: '1rem 1rem 1.5rem 1rem', color: '#cbd5e1', lineHeight: '1.8' }}>
                  {faq.answer}
                </p>
              </details>
            ))}
          </div>

          <div style={{ marginTop: '3rem', padding: '2rem', backgroundColor: '#1a2332', borderRadius: '8px', textAlign: 'center' }}>
            <h3 style={{ fontSize: '1.3rem', marginBottom: '1rem', color: '#f1f5f9' }}>
              Still have questions?
            </h3>
            <p style={{ color: '#cbd5e1', marginBottom: '1.5rem' }}>
              Our support team is here to help. Join our Discord community or contact us directly for personalized assistance.
            </p>
            <button 
              style={{
                padding: '1rem 2rem',
                backgroundColor: '#fbbf24',
                color: '#000',
                border: 'none',
                borderRadius: '4px',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: 'pointer'
              }}
              onClick={() => window.open('http://discord.gg/zeusservices', '_blank')}
            >
              Join Discord Support
            </button>
          </div>
        </div>
      </section>
    </>
  )
}
