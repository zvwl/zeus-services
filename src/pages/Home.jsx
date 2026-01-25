import { useRef } from 'react'
import Banner from '../components/Banner'
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
      <Banner onGetStarted={onGetStarted} onScrollAbout={handleScrollAbout} />

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
              <h3>Select platform</h3>
              <p>Steam, Social Club or Epic Games – lock in where you play and add it to your cart.</p>
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
              <h3>Delivery in-game</h3>
              <p>Accounts and services are delivered manually and Discord is used for direct contact.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section why-zeus">
        <div className="why-zeus-container">
          <h2 className="section-title">Why run with Zeus Services?</h2>
          <p className="section-subtitle">Styled for GTA V, built for clarity and speed.</p>
          
          <div className="why-zeus-grid">
            <div className="why-zeus-card">
              <div className="why-zeus-icon">📋</div>
              <h3>Manual, not messy</h3>
              <p>Orders are handled manually through Discord so nothing is rushed or botched. Something changes, you've got full chat history to fall back on.</p>
            </div>

            <div className="why-zeus-card">
              <div className="why-zeus-icon">🔒</div>
              <h3>Secure & private</h3>
              <p>No random links or sketchy login pages. Every step is confirmed directly with you before delivery so you always know what's happening.</p>
            </div>

            <div className="why-zeus-card">
              <div className="why-zeus-icon">⚡</div>
              <h3>Fast delivery window</h3>
              <p>For in-stock accounts and money packs, delivery starts as soon as payment is confirmed – the next-long waits.</p>
            </div>

            <div className="why-zeus-card">
              <div className="why-zeus-icon">💎</div>
              <h3>Transparent deals</h3>
              <p>Clear prices, clear items and direct Discord support so you always know what you're buying and how it works.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section faq">
        <div className="faq-container">
          <h2 className="section-title">Questions & Answers</h2>
          
          <div className="faq-list">
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
              <p>Yes. All transactions are secured via Stripe, and delivery is handled manually through Discord so you have full transparency and communication history.</p>
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

      <section className="section about" ref={aboutRef} id="about">
        <p className="eyebrow">About us</p>
        <h2 className="section-title">Built for bold digital launches</h2>
        <p className="section-subtitle">We are a multi-disciplinary crew delivering end-to-end web, mobile, and brand experiences with measurable outcomes.</p>
        <div className="about-grid">
          <div className="about-card">
            <span className="about-icon">⚡</span>
            <h3>Speed to market</h3>
            <p>Rapid sprints, weekly demos, and zero fluff so you ship fast and learn faster.</p>
          </div>
          <div className="about-card">
            <span className="about-icon">🎯</span>
            <h3>Outcome first</h3>
            <p>We align design, engineering, and analytics to hit the metrics that matter.</p>
          </div>
          <div className="about-card">
            <span className="about-icon">🛡️</span>
            <h3>Reliable delivery</h3>
            <p>Senior talent, clear ownership, and transparent communication every step.</p>
          </div>
        </div>
      </section>
    </>
  )
}
