import { useRef } from 'react'
import Banner from '../components/Banner'
import SEO, { SEO_CONFIGS } from '../components/SEO'
import '../App.css'

export default function Home({ onGetStarted }) {
  const aboutRef = useRef(null)

  const handleScrollAbout = () => {
    if (aboutRef.current) {
      aboutRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <>
      <SEO {...SEO_CONFIGS.home} />
      <Banner onGetStarted={onGetStarted} onScrollAbout={handleScrollAbout} />

      <section className="section intro">
        <div className="intro-container" style={{maxWidth: '900px', margin: '0 auto', padding: '3rem 2rem', textAlign: 'center'}}>
          <h2 style={{fontSize: '1.8rem', marginBottom: '1rem', color: '#f1f5f9'}}>Professional GTA Online Account Boosting & Modded Accounts</h2>
          <p style={{fontSize: '1.1rem', lineHeight: '1.8', color: '#cbd5e1', marginBottom: '1.5rem'}}>
            Welcome to zeuservices, your trusted partner for GTA Online account services. We specialize in professional GTA Online account boosting and premium modded accounts for PC. Whether you're looking for a high-rank account, need rank boosting, vehicle unlocks, or complete GTA5 account progression services, we've got you covered. With over 9 years of experience in the gaming services industry, we offer safe, secure, and reliable GTA Online account solutions.
          </p>
          <p style={{fontSize: '1.1rem', lineHeight: '1.8', color: '#cbd5e1'}}>
            Our GTA account boosting services support all major platforms including Steam, Epic Games, Xbox App, and Rockstar Launcher. We deliver instant, pre-ranked GTA5 modded accounts with all vehicles unlocked, or we'll boost your existing account safely. Every account and service is handled manually for maximum security and reliability. Looking for the fast way to get rank 500+, millions in GTA money, or specific vehicle collections? zeuservices makes it simple, safe, and fast.
          </p>
        </div>
      </section>

      <section className="section safe-easy">
        <div className="safe-easy-container">
          <h2 className="section-title">Safe & Easy</h2>
          <p className="section-subtitle">A simple flow from browsing to delivery – no chaos, no confusion.</p>
          
          <div className="safe-easy-grid">
            <div className="safe-easy-card">
              <div className="safe-easy-number">1</div>
              <div className="safe-easy-icon">🛍️</div>
              <h3>Pick your product/service</h3>
              <p>Choose the GTA Online PC account or service that fits what you want.</p>
            </div>

            <div className="safe-easy-card">
              <div className="safe-easy-number">2</div>
              <div className="safe-easy-icon">💻</div>
              <h3>Select Platform & Version</h3>
              <p>Choose your platform: Steam, Social Club, Epic Games, or Xbox App – then select your preferred version and add to cart.</p>
            </div>

            <div className="safe-easy-card">
              <div className="safe-easy-number">3</div>
              <div className="safe-easy-icon">💳</div>
              <h3>Secure payment</h3>
              <p>Complete your purchase through the checkout – payments can be verified via Stripe.</p>
            </div>

            <div className="safe-easy-card">
              <div className="safe-easy-number">4</div>
              <div className="safe-easy-icon">⚡</div>
              <h3>Delivery</h3>
              <p>Accounts and services are delivered manually. We'll contact you via Discord to provide full details and guide you through the process.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section why-zeus">
        <div className="why-zeus-container">
          <h2 className="section-title">Why run with Zeus Services?</h2>
          <p className="section-subtitle">Over 9 years of experience in account boosting and services. Been supporting GTA 5 since the PS3 and Xbox 360 days.</p>
          
          <div className="why-zeus-grid">
            <div className="why-zeus-card">
              <div className="why-zeus-icon">📋</div>
              <h3>Manual, not messy</h3>
              <p>Orders are handled manually through Discord so nothing is rushed or botched. Something changes, you've got full chat history to fall back on.</p>
            </div>

            <div className="why-zeus-card">
              <div className="why-zeus-icon">🔒</div>
              <h3>Maximum Security</h3>
              <p>Measures are taken to ensure account security and reliability. We craft each order carefully and handle all accounts with care to prevent unwanted issues down the line.</p>
            </div>

            <div className="why-zeus-card">
              <div className="why-zeus-icon">⚡</div>
              <h3>Fast delivery window</h3>
              <p>For in-stock accounts and services, delivery starts as soon as payment is confirmed – no long waits, no delays.</p>
            </div>

            <div className="why-zeus-card">
              <div className="why-zeus-icon">💎</div>
              <h3>Transparent & Reliable</h3>
              <p>Clear prices, clear items and direct Discord support. You always know what you're buying, how it works, and exactly what to expect.</p>
            </div>

            <div className="why-zeus-card">
              <div className="why-zeus-icon">🛠️</div>
              <h3>Experience That Actually Matters</h3>
              <p>Not new sellers chasing quick cash. We've been around since PS3/Xbox 360 days and adapted through every GTA era, patch, and ban wave. That experience means smarter methods, safer execution, and fewer mistakes.</p>
            </div>

            <div className="why-zeus-card">
              <div className="why-zeus-icon">💬</div>
              <h3>Real Human Support</h3>
              <p>No bots, no ticket black holes. You speak directly with real people who actually do the service. Need changes, updates, or advice? You're always one Discord message away.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section faq">
        <div className="faq-container">
          <h2 className="section-title">Questions & Answers</h2>
          
          <div className="faq-list">
            <details className="faq-item">
              <summary>Why buy from Zeus Services?</summary>
              <p>We ensure that accounts and services are as secure as possible and help prevent unwanted issues after purchase. With 9+ years of experience, we craft every order carefully and handle your account with the utmost care.</p>
            </details>

            <details className="faq-item">
              <summary>How do I buy from Zeus Services?</summary>
              <p>Browse our services, select your platform and version, add to cart, and checkout securely via Stripe. Once payment is confirmed, we'll contact you via Discord for account delivery.</p>
            </details>

            <details className="faq-item">
              <summary>How do I receive my account or service?</summary>
              <p>After payment, we'll reach out on Discord with full instructions and account details. For custom services, we'll confirm the specifications before delivery.</p>
            </details>

            <details className="faq-item">
              <summary>Is this safe and legit?</summary>
              <p>Yes. All transactions are secured via Stripe, and delivery is handled manually through Discord so you have full transparency and communication history. See our Terms & Conditions for important details about account responsibility.</p>
            </details>

            <details className="faq-item">
              <summary>What payment methods will you support?</summary>
              <p>We support all major credit/debit cards through Stripe Checkout – no cryptocurrency, no risky payment gateways.</p>
            </details>

            <details className="faq-item">
              <summary>How do I contact support?</summary>
              <p>Join our Discord community for direct support, or email support@kiroozmare.resend.app. We respond within a few hours.</p>
            </details>
          </div>
        </div>
      </section>


    </>
  )
}
