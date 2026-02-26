import SEO, { SEO_CONFIGS } from '../components/SEO'
import '../App.css'
import './TermsPage.css'

export default function PrivacyPage() {
  return (
    <>
      <SEO {...SEO_CONFIGS.privacy} />
      <section className="section terms-page">
      <div className="terms-container">
        <h1>Privacy Policy</h1>
        <p className="last-updated">Last Updated: January 2026</p>

        <div className="terms-content">
          <section className="terms-section">
            <h2>Introduction</h2>
            <p>
              This Privacy Policy explains how <strong>Zeus Services</strong> collects, uses, and protects your information. 
              By using our website, you agree to this policy.
            </p>
          </section>

          <section className="terms-section">
            <h2>1. Information We Collect</h2>
            <p>We collect information you provide directly (email, password, payment details, orders) and information automatically collected when you use our website (IP address, browser type, usage data, location data).</p>
          </section>

          <section className="terms-section">
            <h2>2. How We Use Your Information</h2>
            <p>We use your information to deliver services, process payments, communicate with you, prevent fraud, improve our website, and comply with legal obligations.</p>
          </section>

          <section className="terms-section">
            <h2>3. Data Security</h2>
            <p>
              We use HTTPS encryption, encrypted databases, and access controls to protect your data. 
              However, no system is completely secure, so use strong passwords and keep your login credentials confidential.
            </p>
          </section>

          <section className="terms-section">
            <h2>4. Data Sharing</h2>
            <p>We <strong>do not sell your personal information</strong>. We may share data with service providers, law enforcement when required by law, or in case of business transfers.</p>
          </section>

          <section className="terms-section">
            <h2>5. Your Rights</h2>
            <p>Depending on your location, you may have rights to access, correct, delete, or port your data. You can also unsubscribe from marketing communications. Contact us to exercise these rights.</p>
          </section>

          <section className="terms-section">
            <h2>6. Cookies</h2>
            <p>We use cookies to maintain your session and improve your experience. You can disable cookies in your browser settings, though this may affect functionality.</p>
          </section>

          <section className="terms-section">
            <h2>7. Children's Privacy</h2>
            <p>Our services are not intended for individuals under 18. We do not knowingly collect information from children. Parents can contact us if they believe we've collected data from their child.</p>
          </section>

          <section className="terms-section">
            <h2>8. Third-Party Links</h2>
            <p>Our website may contain links to external sites. We're not responsible for their privacy practices. Review their policies before providing information.</p>
          </section>

          <section className="terms-section">
            <h2>9. Data Retention</h2>
            <p>We keep account data for the duration of your account and for legal/tax purposes. Transaction data is retained for accounting and dispute resolution. Marketing data is kept until you opt-out.</p>
          </section>

          <section className="terms-section">
            <h2>10. GDPR & CCPA Compliance</h2>
            <p>
              We comply with GDPR (EU/EEA) and CCPA (California) regulations. If you're in the EU/EEA or California, you have additional rights regarding your personal data. 
              Contact us if you have questions about your rights.
            </p>
          </section>

          <section className="terms-section">
            <h2>11. Contact Us</h2>
            <p>
              If you have questions about this Privacy Policy or your data, contact us:
            </p>
            <ul>
              <li><strong>Email:</strong> support@kiroozmare.resend.app</li>
              <li><strong>Discord:</strong> <a href="http://discord.gg/zeusservices" target="_blank" rel="noopener noreferrer">http://discord.gg/zeusservices</a></li>
              <li><strong>Website:</strong> www.zeuservices.com</li>
            </ul>
            <p>
              We'll respond to your inquiry within 30 days.
            </p>
          </section>

          <section className="terms-section">
            <p style={{ marginTop: '2rem', fontSize: '0.95rem', color: '#94a3b8' }}>
              By using Zeus Services, you acknowledge that you have read, understood, and agree to be bound by this Privacy Policy.
            </p>
          </section>
        </div>
      </div>
    </section>
    </>
  )
}

