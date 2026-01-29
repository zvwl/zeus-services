import '../App.css'
import './TermsPage.css'

export default function PrivacyPage() {
  return (
    <section className="section terms-page">
      <div className="terms-container">
        <h1>Privacy Policy</h1>
        <p className="last-updated">Last Updated: January 2026</p>

        <div className="terms-content">
          <section className="terms-section">
            <h2>Introduction</h2>
            <p>
              Welcome to <strong>Zeus Services</strong> ("we", "us", "our", "the Company"). We are committed to protecting 
              your privacy and ensuring you have a positive experience on our website. This Privacy Policy explains how we 
              collect, use, disclose, and safeguard your information when you visit our website and use our services.
            </p>
            <p>
              Please read this Privacy Policy carefully. If you do not agree with our policies and practices, please do not use our website.
            </p>
          </section>

          <section className="terms-section">
            <h2>1. Information We Collect</h2>
            
            <h3>1.1 Information You Provide Directly</h3>
            <p>We collect information that you voluntarily provide, including:</p>
            <ul>
              <li><strong>Account Information:</strong> Email address, password, display name, and profile information</li>
              <li><strong>Payment Information:</strong> Payment method details (processed securely by Stripe)</li>
              <li><strong>Order Information:</strong> Items purchased, quantities, platforms, and delivery preferences</li>
              <li><strong>Communication Data:</strong> Messages, support requests, and feedback you send us</li>
              <li><strong>Gaming Information:</strong> Gaming platform details (Steam, Epic Games, Xbox App, Rockstar Launcher) necessary to deliver services</li>
            </ul>

            <h3>1.2 Information Automatically Collected</h3>
            <p>When you use our website, we automatically collect:</p>
            <ul>
              <li><strong>Device Information:</strong> IP address, browser type, operating system, and device identifiers</li>
              <li><strong>Usage Data:</strong> Pages visited, time spent on pages, clicks, and interactions</li>
              <li><strong>Location Data:</strong> General location based on IP address (country/region) to determine currency and local regulations</li>
              <li><strong>Cookies & Tracking:</strong> Session cookies and analytics to improve user experience</li>
            </ul>

            <h3>1.3 Third-Party Information</h3>
            <p>We may receive information about you from:</p>
            <ul>
              <li><strong>Payment Processors:</strong> Stripe provides payment confirmation and transaction details</li>
              <li><strong>Authentication Providers:</strong> Google OAuth and other providers for sign-up/login</li>
              <li><strong>Analytics Services:</strong> Website analytics and user behavior data</li>
            </ul>
          </section>

          <section className="terms-section">
            <h2>2. How We Use Your Information</h2>
            <p>We use collected information for the following purposes:</p>
            <ul>
              <li><strong>Service Delivery:</strong> Creating your account, processing orders, and delivering services</li>
              <li><strong>Payment Processing:</strong> Handling transactions securely through Stripe</li>
              <li><strong>Communication:</strong> Sending order confirmations, updates, notifications, and customer support</li>
              <li><strong>Security:</strong> Preventing fraud, verifying user identity, and protecting our systems</li>
              <li><strong>Improvement:</strong> Analyzing usage patterns to improve website functionality and user experience</li>
              <li><strong>Legal Compliance:</strong> Meeting legal obligations and regulatory requirements</li>
              <li><strong>Marketing:</strong> Sending promotional materials (only with your consent)</li>
              <li><strong>Account Management:</strong> Managing your profile, preferences, and account settings</li>
            </ul>
          </section>

          <section className="terms-section">
            <h2>3. Data Security</h2>
            <p>
              We take your data security seriously. We implement industry-standard security measures, including:
            </p>
            <ul>
              <li><strong>HTTPS Encryption:</strong> All data transmitted to/from our website is encrypted using SSL/TLS</li>
              <li><strong>Database Encryption:</strong> Sensitive data (passwords, payment details) are encrypted at rest</li>
              <li><strong>Supabase Security:</strong> We use Supabase's enterprise-grade authentication and database security</li>
              <li><strong>Row-Level Security:</strong> Data access is restricted to authorized users only</li>
              <li><strong>Regular Audits:</strong> We regularly review and update our security practices</li>
              <li><strong>Payment Security:</strong> Payment information is handled by PCI DSS-compliant Stripe</li>
            </ul>
            <p>
              <strong>Note:</strong> While we implement robust security measures, no system is 100% secure. We encourage you to 
              use strong passwords and keep your login credentials confidential.
            </p>
          </section>

          <section className="terms-section">
            <h2>4. Data Sharing & Disclosure</h2>
            <p>We do <strong>not sell, trade, or rent</strong> your personal information. However, we may share data with:</p>
            <ul>
              <li><strong>Service Providers:</strong> Stripe (payments), Supabase (hosting), Resend (email), Vercel (deployment)</li>
              <li><strong>Legal Compliance:</strong> Law enforcement or government agencies when required by law</li>
              <li><strong>Business Transfers:</strong> In the event of merger, acquisition, or asset sale (you will be notified)</li>
              <li><strong>With Your Consent:</strong> Any other sharing requires your explicit permission</li>
            </ul>
          </section>

          <section className="terms-section">
            <h2>5. Your Data Rights</h2>
            <p>Depending on your location, you may have the following rights:</p>
            <ul>
              <li><strong>Right to Access:</strong> Request a copy of the personal data we hold about you</li>
              <li><strong>Right to Correction:</strong> Request corrections to inaccurate or incomplete information</li>
              <li><strong>Right to Deletion:</strong> Request deletion of your personal data (subject to legal requirements)</li>
              <li><strong>Right to Data Portability:</strong> Request your data in a portable, machine-readable format</li>
              <li><strong>Right to Opt-Out:</strong> Unsubscribe from marketing communications at any time</li>
              <li><strong>Right to Restrict Processing:</strong> Request limitation on how we process your data</li>
            </ul>
            <p>
              To exercise any of these rights, please contact us at <strong>[INSERT CONTACT EMAIL]</strong>.
            </p>
          </section>

          <section className="terms-section">
            <h2>6. Cookies & Tracking Technologies</h2>
            <p>
              Our website uses cookies and similar tracking technologies to enhance your experience:
            </p>
            <ul>
              <li><strong>Session Cookies:</strong> Maintain your login session and preferences</li>
              <li><strong>Analytics Cookies:</strong> Track website usage and user behavior</li>
              <li><strong>Security Cookies:</strong> Protect against fraud and unauthorized access</li>
            </ul>
            <p>
              You can disable cookies in your browser settings, but this may affect website functionality. 
              For more information, visit <strong>www.allaboutcookies.org</strong>.
            </p>
          </section>

          <section className="terms-section">
            <h2>7. Children's Privacy</h2>
            <p>
              Our services are not intended for individuals under the age of 18. We do not knowingly collect personal 
              information from children. If we become aware that we have collected information from a child without parental consent, 
              we will delete such information immediately. Parents or guardians who believe their child has provided information to us 
              should contact us immediately.
            </p>
          </section>

          <section className="terms-section">
            <h2>8. Third-Party Links & Services</h2>
            <p>
              Our website may contain links to third-party websites and services. We are not responsible for the privacy practices 
              or content of external websites. We encourage you to review the privacy policies of any third-party services before 
              providing your information.
            </p>
          </section>

          <section className="terms-section">
            <h2>9. Data Retention</h2>
            <p>
              We retain your personal information for as long as necessary to provide our services and fulfill the purposes outlined 
              in this policy. Specifically:
            </p>
            <ul>
              <li><strong>Account Data:</strong> Retained for the duration of your account and for legal/tax purposes (up to 7 years)</li>
              <li><strong>Transaction Data:</strong> Retained for accounting, tax, and dispute resolution purposes</li>
              <li><strong>Login/Session Data:</strong> Automatically deleted after account logout</li>
              <li><strong>Marketing Data:</strong> Retained until you opt-out</li>
            </ul>
          </section>

          <section className="terms-section">
            <h2>10. International Data Transfers</h2>
            <p>
              Your information may be transferred to, stored in, and processed in countries other than your country of residence. 
              These countries may have data protection laws that differ from your home country. By using our website, you consent 
              to the transfer of your information to countries outside your country of residence, which may provide a different 
              level of data protection than your home country.
            </p>
          </section>

          <section className="terms-section">
            <h2>11. GDPR Compliance (EU & EEA Users)</h2>
            <p>
              If you are located in the European Union, European Economic Area, or other jurisdictions with similar data protection laws, 
              you have additional rights under the General Data Protection Regulation (GDPR). Our legal basis for processing your data includes:
            </p>
            <ul>
              <li><strong>Contract Performance:</strong> Processing necessary to fulfill service agreements</li>
              <li><strong>Legal Obligation:</strong> Compliance with applicable laws</li>
              <li><strong>Legitimate Interest:</strong> Business operations, fraud prevention, and security</li>
              <li><strong>Consent:</strong> Your explicit agreement for marketing communications</li>
            </ul>
            <p>
              You have the right to lodge a complaint with your local data protection authority if you believe your rights have been violated.
            </p>
          </section>

          <section className="terms-section">
            <h2>12. California Privacy Rights (CCPA)</h2>
            <p>
              If you are a California resident, you have specific rights under the California Consumer Privacy Act (CCPA), including:
            </p>
            <ul>
              <li>The right to know what personal information is collected, used, shared, and sold</li>
              <li>The right to delete personal information collected from you</li>
              <li>The right to opt-out of the sale or sharing of your personal information</li>
              <li>The right to non-discrimination for exercising your CCPA rights</li>
            </ul>
            <p>
              To exercise these rights, please contact us using the information below.
            </p>
          </section>

          <section className="terms-section">
            <h2>13. Updates to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time to reflect changes in our practices, technology, or legal requirements. 
              When we make material changes, we will notify you by updating the "Last Updated" date at the top of this page or by sending 
              you a notification email. Your continued use of our website after changes constitutes your acceptance of the updated Privacy Policy.
            </p>
          </section>

          <section className="terms-section">
            <h2>14. Contact Us</h2>
            <p>
              If you have questions, concerns, or requests regarding this Privacy Policy or our privacy practices, please contact us at:
            </p>
            <ul>
              <li><strong>Email:</strong> [INSERT CONTACT EMAIL]</li>
              <li><strong>Website:</strong> www.zeuservices.com</li>
              <li><strong>Mail:</strong> [INSERT PHYSICAL ADDRESS IF APPLICABLE]</li>
            </ul>
            <p>
              We will respond to your inquiry within 30 days of receipt.
            </p>
          </section>

          <section className="terms-section">
            <h2>15. Data Protection Officer</h2>
            <p>
              If you are in the EU/EEA and have data protection concerns, you may contact our Data Protection Officer at:
              <strong>[INSERT DPO EMAIL IF APPLICABLE]</strong>
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
  )
}
