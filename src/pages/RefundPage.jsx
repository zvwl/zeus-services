import SEO, { SEO_CONFIGS } from '../components/SEO'
import '../App.css'
import './RefundPage.css'

export default function RefundPage() {
  return (
    <>
      <SEO {...SEO_CONFIGS.refund} />
      <section className="section refund-page">
      <div className="refund-container">
        <h1>Refund Policy</h1>
        <p className="last-updated">Last Updated: January 2026</p>

        <div className="refund-content">
          <section className="refund-section critical">
            <h2>NO REFUNDS - REDO GUARANTEE INSTEAD</h2>
            <ul>
              <li><strong>Services Are Final:</strong> Once a service or account is made and sent to you, no refunds are issued. All sales are final.</li>
              <li><strong>If Something Goes Wrong:</strong> If your account experiences an issue (like a ban) due to our service methods within 30 days, we will redo the order for free - not refund it.</li>
              <li><strong>Account Details Sent Once Only:</strong> We provide account login credentials ONCE and cannot retrieve them after sending. Save them immediately and change the email/password right away. Lost credentials are your responsibility.</li>
              <li><strong>No Password/Email Resets:</strong> We never reset passwords or emails on any accounts. You receive full control and must secure your account immediately.</li>
              <li><strong>What We Don't Cover:</strong> Account bans from hacking, player reports, or your own changes are not our responsibility and don't qualify for a redo.</li>
              <li><strong>Redo Timeline:</strong> If we redo a service, there may be additional wait time depending on game and service complexity.</li>
              <li><strong>By Purchasing:</strong> You agree that once delivered, the service is complete and non-refundable. Redos are our only guarantee for service failures.</li>
            </ul>
          </section>

          <section className="refund-section">
            <h2>What Qualifies for a Redo</h2>
            <p>While we don't offer refunds, we will redo your order for free if:</p>
            <ul>
              <li>Your account is banned within 30 days <strong>due to our service methods</strong> (not from hacking, player reports, or your own actions)</li>
              <li>A boosting service fails to complete properly due to our methods</li>
              <li>A topup doesn't deliver as promised due to our error</li>
              <li>Our methods are directly detected and cause immediate consequences</li>
            </ul>
            <p><strong>Note:</strong> We will redo the service, not provide a refund. Redos may take additional time depending on game and service type.</p>
          </section>

          <section className="refund-section">
            <h2>Why No Refunds - Only Redos?</h2>
            <ul>
              <li><strong>Service is Complete Once Delivered:</strong> We cannot "give back" a service that's already been provided. The work is done, the account/boost is delivered.</li>
              <li><strong>Digital Products Cannot Be Returned:</strong> Unlike physical items, digital services cannot be returned or undone once provided.</li>
              <li><strong>We Stand Behind Our Work:</strong> If something goes wrong, we redo it for free. This is stronger than a refund - you get the service again.</li>
              <li><strong>Game Publisher Enforcement:</strong> Bans by publishers (Rockstar, Epic, Psyonix, etc.) may happen instantly or take weeks. If our methods cause it, we redo the service.</li>
              <li><strong>Prevention Over Refunds:</strong> We use proven, tested methods to minimize risk. If an issue still occurs, we fix it with a redo, not a refund.</li>
            </ul>
          </section>

          <section className="refund-section">
            <h2>What You Agree To</h2>
            <p>By purchasing from Zeus Services, you:</p>
            <ul>
              <li><strong>Accept No Refunds:</strong> Once your service is delivered, all sales are final and non-refundable.</li>
              <li><strong>Acknowledge the Risk:</strong> Third-party services carry inherent risk. Account bans or penalties may happen despite our precautions.</li>
              <li><strong>Understand Our Redo Guarantee:</strong> If something goes wrong due to our service, we will redo it for free - not refund it.</li>
              <li><strong>No Password/Email Changes by Us:</strong> We don't reset passwords or emails on accounts. You must secure your account immediately after delivery.</li>
              <li><strong>Account Details Are Sent Once Only:</strong> Once we provide account login details, we cannot retrieve them. It is YOUR responsibility to save the details and change the email/password immediately. Lost credentials are not our responsibility.</li>
              <li><strong>Follow Safety Guidelines:</strong> You agree to follow all safety instructions provided with your service to minimize risk.</li>
              <li><strong>Hold Us Harmless for Publisher Actions:</strong> We are not liable for bans or penalties issued by game publishers, even if they're related to our service.</li>
              <li><strong>Accept Responsibility:</strong> You accept full responsibility for any account penalties or bans once you take possession of the account or service.</li>
            </ul>
          </section>
        </div>
      </div>
    </section>
    </>
  )
}

