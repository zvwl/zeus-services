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
          <h2 style={{fontSize: '1.8rem', marginBottom: '1rem', color: '#f1f5f9'}}>Professional Multi-Game Account Services & Boosting</h2>
          <p style={{fontSize: '1.1rem', lineHeight: '1.8', color: '#cbd5e1', marginBottom: '1.5rem'}}>
            Welcome to Zeus Services - your trusted partner for professional gaming services across multiple platforms. We provide premium account services and boosting for GTA 5, Fortnite, Rocket League, Forza Horizon 6, and more. With 9+ years of experience, we deliver safe, manual, and reliable services tailored to each game.
          </p>
        </div>
      </section>

      <section className="section" style={{backgroundColor: '#0f1720', padding: '3rem 2rem'}}>
        <div style={{maxWidth: '1200px', margin: '0 auto'}}>
          <h2 style={{fontSize: '2rem', marginBottom: '1rem', color: '#fbbf24', textAlign: 'center'}}>Our Services</h2>
          <p style={{fontSize: '1.05rem', color: '#cbd5e1', textAlign: 'center', marginBottom: '3rem', maxWidth: '700px', margin: '0 auto 3rem'}}>
            Choose the service type that fits your gaming needs. Available across all our supported games.
          </p>
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem'}}>
            {/* Topups */}
            <div style={{backgroundColor: '#1a2332', padding: '2rem', borderRadius: '8px', textAlign: 'center', border: '1px solid #334155'}}>
              <div style={{fontSize: '3rem', marginBottom: '1rem'}}>💰</div>
              <h3 style={{fontSize: '1.5rem', color: '#f1f5f9', marginBottom: '0.75rem'}}>Topups</h3>
              <p style={{color: '#cbd5e1', marginBottom: '1.5rem', lineHeight: '1.6'}}>In-game currency and credits. Get the currency you need instantly for faster gameplay and better gear.</p>
              <a href="/topups/gta5" style={{display: 'inline-block', padding: '0.75rem 1.5rem', backgroundColor: '#fbbf24', color: '#000', borderRadius: '4px', textDecoration: 'none', fontWeight: '600'}}>Browse Topups</a>
            </div>
            {/* Boosting */}
            <div style={{backgroundColor: '#1a2332', padding: '2rem', borderRadius: '8px', textAlign: 'center', border: '1px solid #334155'}}>
              <div style={{fontSize: '3rem', marginBottom: '1rem'}}>⚡</div>
              <h3 style={{fontSize: '1.5rem', color: '#f1f5f9', marginBottom: '0.75rem'}}>Boosting</h3>
              <p style={{color: '#cbd5e1', marginBottom: '1.5rem', lineHeight: '1.6'}}>Rank progression, level boosting, and achievement grinding. Let us handle the grind while you relax.</p>
              <a href="/boosting/gta5" style={{display: 'inline-block', padding: '0.75rem 1.5rem', backgroundColor: '#60a5fa', color: '#000', borderRadius: '4px', textDecoration: 'none', fontWeight: '600'}}>Browse Boosting</a>
            </div>
            {/* Accounts */}
            <div style={{backgroundColor: '#1a2332', padding: '2rem', borderRadius: '8px', textAlign: 'center', border: '1px solid #334155'}}>
              <div style={{fontSize: '3rem', marginBottom: '1rem'}}>👤</div>
              <h3 style={{fontSize: '1.5rem', color: '#f1f5f9', marginBottom: '0.75rem'}}>Accounts</h3>
              <p style={{color: '#cbd5e1', marginBottom: '1.5rem', lineHeight: '1.6'}}>Pre-built accounts with progression ready to play. Skip the grind and jump straight into fun.</p>
              <a href="/accounts/gta5" style={{display: 'inline-block', padding: '0.75rem 1.5rem', backgroundColor: '#a78bfa', color: '#000', borderRadius: '4px', textDecoration: 'none', fontWeight: '600'}}>Browse Accounts</a>
            </div>
          </div>
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
              <p>Browse and select from our catalog of accounts and services across all supported games.</p>
            </div>

            <div className="safe-easy-card">
              <div className="safe-easy-number">2</div>
              <div className="safe-easy-icon">💻</div>
              <h3>Select Your Game & Version</h3>
              <p>Choose your game, version, and platform, then add to cart. We support multiple launchers and editions.</p>
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
              <h3>Quick Delivery</h3>
              <p>Accounts and services are delivered manually via Discord. Timelines vary from 20 minutes to 5 hours depending on the game and service type. Full updates provided.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section why-zeus">
        <div className="why-zeus-container">
          <h2 className="section-title">Why run with Zeus Services?</h2>
          <p className="section-subtitle">Over 9 years of experience across multiple gaming platforms. Expert knowledge in boosting, account services, and game-specific methods.</p>
          
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
              <h3>Reliable Delivery</h3>
              <p>Orders are handled personally with attention to detail. Timelines vary by game and service - from 20 minutes to 5 hours. You'll get updates throughout the process.</p>
            </div>

            <div className="why-zeus-card">
              <div className="why-zeus-icon">💎</div>
              <h3>Transparent & Reliable</h3>
              <p>Clear prices, clear items and direct Discord support. You always know what you're buying, how it works, and exactly what to expect.</p>
            </div>

            <div className="why-zeus-card">
              <div className="why-zeus-icon">🛠️</div>
              <h3>Experience That Actually Matters</h3>
              <p>Not new sellers chasing quick cash. Years of experience adapting to game updates, patches, and safety practices across multiple platforms. That experience means smarter methods, safer execution, and fewer mistakes.</p>
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
              <p>Browse our games and services, select your version and platform, add to cart, and checkout securely via Stripe. Once payment is confirmed, we'll contact you via Discord for delivery.</p>
            </details>

            <details className="faq-item">
              <summary>How do I receive my account or service?</summary>
              <p>After payment, we'll reach out on Discord with full instructions and account details. For custom services, we'll confirm the specifications before delivery.</p>
            </details>

            <details className="faq-item">
              <summary>Is this safe and legit?</summary>
              <p>Yes. All transactions are secured via Stripe, delivery is handled manually through Discord with full transparency and communication history. We follow industry best practices and game-specific safety guidelines. See our Terms & Conditions for important details.</p>
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
