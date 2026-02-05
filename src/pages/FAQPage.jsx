import { useState } from 'react'
import SEO from '../components/SEO'
import Breadcrumb from '../components/Breadcrumb'
import '../pages/ReviewsPage.css'

export default function FAQPage() {
  const [expandedIndex, setExpandedIndex] = useState(null)

  const faqs = [
    {
      question: "Is GTA Online account boosting safe?",
      answer: "Our services come with ban risk - this is always a possibility and it's luck-based. We have 9+ years of experience minimizing detection risk, but Rockstar enforcement is unpredictable. We're honest about these risks upfront. All boosting is done through your Discord contact, and you maintain full account access throughout the process."
    },
    {
      question: "What is the difference between boosting and modded accounts?",
      answer: "Boosting is where we log into your existing GTA Online account and progress it manually (ranking up, unlocking vehicles, earning money). Modded accounts are pre-ranked accounts we deliver to you ready to play. Boosting takes 2-7 days depending on service, while modded accounts are instant delivery. Choose boosting if you want to keep your original account, or choose a modded account for instant high-rank access."
    },
    {
      question: "How fast is GTA Online account boosting?",
      answer: "Our rank boosting service typically takes 2-7 days depending on target rank and current level. Money farming can be done in 24-48 hours. Vehicle unlocks are usually completed within 24 hours. Account progression speed depends on the complexity of your request. Contact us for an exact timeline for your specific boosting needs."
    },
    {
      question: "What platforms do you support?",
      answer: "We support PC only: Steam, Epic Games, Xbox App (Microsoft Store), and Rockstar Social Club. We do not support console versions (PlayStation or Xbox consoles). All modded accounts and boosting services are for PC platforms only."
    },
    {
      question: "Will I get banned for buying a modded GTA account?",
      answer: "Our modded accounts are safe and designed to minimize ban risk. Each account is tested and verified before delivery. However, we recommend following Rockstar's terms of service to maintain account safety. Never use cheats or mods on your account after purchase. Your account safety is our priority, and we stand behind all our accounts."
    },
    {
      question: "How do I receive my boosted account or modded account?",
      answer: "After you purchase, we'll contact you through Discord (our preferred method). We'll provide account login details, walk you through the setup process, and answer any questions. For boosting services, you'll provide your account details securely, and we'll update you on progress daily via Discord. All communication is private and secure."
    },
    {
      question: "What payment methods do you accept?",
      answer: "We accept all major credit and debit cards through Stripe Checkout (Visa, Mastercard, American Express). Payment is secure and encrypted. We do not accept cryptocurrency or alternative payment methods. All transactions are processed securely and your payment information is never stored on our servers."
    },
    {
      question: "Can I get a refund if I'm not satisfied?",
      answer: "Yes, we offer a satisfaction guarantee. If you're unhappy with your modded account or boosting service, contact us within 7 days for a full refund. We stand behind the quality of our accounts and services. See our Refund Policy page for complete details."
    },
    {
      question: "What platforms do your modded accounts support?",
      answer: "Our GTA Online modded accounts are available for Steam, Epic Games, Xbox App (Microsoft Store), and Rockstar Launcher. All accounts are exclusive to your PC and cannot be transferred to other platforms. We ensure compatibility with the latest GTA Online updates."
    },
    {
      question: "How do you ensure my account stays secure?",
      answer: "We take security seriously. All boosting is done directly through your Discord, you control the account the entire time. For modded accounts, we reset the password and email immediately after delivery so only you have access. We recommend enabling 2FA on your Rockstar account for extra security. No accounts are shared or reused ever."
    },
    {
      question: "Do you offer custom boosting services?",
      answer: "Yes! Our boosting packages are base offerings. Contact us for custom GTA Online progression services. Want specific rank, money amount, vehicles, or properties? We can create a custom boosting plan for you. Message us on Discord to discuss your exact requirements and pricing."
    },
    {
      question: "How many years have you been doing this?",
      answer: "zeuservices has been providing GTA Online account services for 9+ years. We've been supporting GTA since the PS3 and Xbox 360 days and have adapted through every update, patch, and ban wave. Our experience means safer methods, faster delivery, and fewer mistakes compared to newer services."
    },
    {
      question: "What happens if my boosted account gets banned?",
      answer: "While extremely rare with our methods, we offer account safety guarantees. If your account is banned within 30 days of service completion due to our boosting (and not due to other cheating/hacking), contact us immediately. See our Terms & Conditions for the full account protection policy."
    },
    {
      question: "Can you unlock specific vehicles or properties?",
      answer: "Yes, absolutely. Our vehicle unlock and property services allow you to request specific vehicles or properties. You can specify which vehicles you want unlocked (sports cars, military vehicles, planes, etc.) and which properties you want owned. Contact us with your specific requests and we'll provide a custom quote."
    },
    {
      question: "How do I contact support?",
      answer: "The best way to contact us is via our Discord server for instant responses. You can also email us at support@zeuservices.com. For account boosting customers, you'll have direct Discord chat with the operator handling your account. We respond within a few hours maximum."
    }
  ]

  return (
    <>
      <SEO 
        title="FAQ - GTA Online Account Boosting & Modded Accounts | zeuservices"
        description="Frequently asked questions about GTA Online account boosting, modded accounts, delivery time, safety, platforms, and more. Get answers from our 9+ year experts."
        keywords="GTA boosting FAQ, modded accounts questions, GTA Online services questions, account safety, boost service help"
      />
      
      <section className="section">
        <Breadcrumb customItems={[{ label: 'Home', path: '/' }, { label: 'FAQ', path: '/faq' }]} />
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '3rem 2rem' }}>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem', color: '#f1f5f9' }}>
            Common Questions About GTA Boosting & Modded Accounts
          </h1>
          <p style={{ fontSize: '1.1rem', color: '#cbd5e1', marginBottom: '3rem', lineHeight: '1.6' }}>
            Have questions about our GTA Online account boosting services, modded accounts, how boosting works, or account safety? Find answers to the most common questions below. If you don't find your answer, reach out to us on Discord.
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
              onClick={() => window.open('https://discord.gg/zeuservices', '_blank')}
            >
              Join Discord Support
            </button>
          </div>
        </div>
      </section>
    </>
  )
}
