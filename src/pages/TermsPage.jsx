import '../App.css'
import './TermsPage.css'

export default function TermsPage() {
  return (
    <section className="section terms-page">
      <div className="terms-container">
        <h1>Terms & Conditions</h1>
        <p className="last-updated">Last updated: January 2026</p>

        <div className="terms-content">
          <section className="terms-section">
            <h2>1. Agreement to Terms</h2>
            <p>
              By accessing and using Zeus Services, you agree to be bound by these Terms & Conditions. 
              If you do not agree to abide by these terms, please do not use this service.
            </p>
          </section>

          <section className="terms-section">
            <h2>2. Description of Service</h2>
            <p>
              Zeus Services provides GTA Online account services and account modifications. Our services include:
            </p>
            <ul>
              <li>Account boosts (cash, level, unlocks, etc.)</li>
              <li>Account modifications and services (custom outfits, vehicles, properties)</li>
              <li>Pre-made modded accounts</li>
            </ul>
            <p>
              All services are delivered manually through Discord after payment confirmation. You must already own 
              GTA V / GTA Online on your chosen platform before purchasing our services.
            </p>
          </section>

          <section className="terms-section">
            <h2>3. User Responsibility & Account Ownership</h2>
            <p>
              By purchasing our services, you acknowledge and agree that:
            </p>
            <ul>
              <li>You own the GTA Online account and have the right to use our services on it</li>
              <li>You are solely responsible for maintaining the security of your account</li>
              <li>You are the sole owner of the account and have the authority to grant us temporary access if required for service delivery</li>
              <li>Zeus Services is not responsible for any unauthorized access, account lockouts, or security breaches that occur after we deliver our services</li>
            </ul>
          </section>

          <section className="terms-section">
            <h2>4. Account Moderation Risk & Limitations</h2>
            <p>
              We take measures to ensure account security and reliability. However, you acknowledge that:
            </p>
            <ul>
              <li>Account moderation policies are enforced by Rockstar Games and are beyond our control</li>
              <li>While we craft orders carefully and use safe methods, the use of any modified accounts or services carries inherent risk</li>
              <li>Any negative implications (such as account restrictions, bans, or resets) are the sole responsibility of the account owner</li>
              <li>We cannot guarantee immunity from account moderation actions taken by Rockstar Games</li>
              <li>Zeus Services bears no responsibility for account-related issues that arise after delivery of services or accounts</li>
            </ul>
            <p>
              If an account receives a ban after our service is delivered, we will provide one free account restoration service. 
              However, we cannot purchase a game key for you if your game license is lost or restricted.
            </p>
          </section>

          <section className="terms-section">
            <h2>5. After-Delivery Accountability</h2>
            <p>
              Once we provide you with full account access details and deliver our services:
            </p>
            <ul>
              <li>We are not responsible for account lockouts caused by incorrect login attempts or compromised credentials</li>
              <li>We are not responsible for account restrictions due to suspicious activity on the account</li>
              <li>We are not liable for any issues arising from your or third-party actions on the account after delivery</li>
              <li>We are not responsible if you share your account details with unauthorized users</li>
              <li>Any service disruptions, game updates, or Rockstar policy changes are not our responsibility</li>
            </ul>
          </section>

          <section className="terms-section">
            <h2>6. Account Services vs. Pre-Made Accounts</h2>
            <p>
              <strong>Account Services (Boosts, Outfits, Vehicles, Cash):</strong>
              Applied to your existing account. You must provide login access. If the service ends up not working 
              (e.g., items disappear, modifiers reset), we will provide a free re-service. Refunds are not available 
              for account services—you may request cancellation only before delivery begins.
            </p>
            <p>
              <strong>Pre-Made Accounts:</strong>
              Fully prepared accounts with built-in modifications delivered to you via Discord. Once we provide you 
              with the account details, we are not responsible for subsequent account lockouts, bans, or any other 
              issues that occur after we hand over the account. We bear no responsibility for what happens to the 
              account after successful delivery. Refunds are not available. See our Refund Policy for more details.
            </p>
          </section>

          <section className="terms-section">
            <h2>7. Payment & Refund Policy</h2>
            <p>
              All payments are processed through Stripe and are final. Please see our <a href="/refund">Refund Policy</a> for 
              detailed information about refunds, cancellations, and our money-back guarantee.
            </p>
          </section>

          <section className="terms-section">
            <h2>8. Dispute Resolution & Communication</h2>
            <p>
              All communication regarding orders, disputes, and support is handled exclusively through Discord. 
              By using Zeus Services, you agree to resolve any disputes through Discord discussion with our team. 
              We maintain full chat history for transparency and accountability.
            </p>
          </section>

          <section className="terms-section">
            <h2>9. Limitation of Liability</h2>
            <p>
              Zeus Services is provided on an "as-is" basis. We are not liable for:
            </p>
            <ul>
              <li>Any indirect, incidental, or consequential damages</li>
              <li>Loss of game access, virtual currency, or items due to account moderation</li>
              <li>Third-party actions or Rockstar Games policy changes</li>
              <li>Any service interruptions or delays</li>
            </ul>
            <p>
              Our total liability is limited to the amount you paid for the service.
            </p>
          </section>

          <section className="terms-section">
            <h2>10. Prohibited Uses</h2>
            <p>
              You agree not to:
            </p>
            <ul>
              <li>Use our services for accounts you do not own or have authorization to modify</li>
              <li>Share account details provided to unauthorized third parties if they are not the account owner</li>
              <li>Resell or redistribute pre-made accounts</li>
              <li>Hold Zeus Services liable for misuse of our services after delivery</li>
            </ul>
          </section>

          <section className="terms-section">
            <h2>11. Modification of Terms</h2>
            <p>
              Zeus Services reserves the right to modify these terms at any time. Changes become effective 
              immediately upon posting. Your continued use of the service after changes indicates acceptance.
            </p>
          </section>

          <section className="terms-section">
            <h2>12. Contact</h2>
            <p>
              For questions about these Terms & Conditions, please contact us via Discord or email support.
            </p>
          </section>

          <section className="terms-section disclaimer">
            <p>
              <strong>Disclaimer:</strong> Zeus Services operates independently. We are not affiliated with, endorsed by, 
              or in partnership with Rockstar Games. GTA Online is a registered trademark of Rockstar Games. 
              Users acknowledge that using our services may violate Rockstar Games' Terms of Service, and Zeus Services 
              bears no responsibility for actions taken by Rockstar Games against your account.
            </p>
          </section>
        </div>
      </div>
    </section>
  )
}
