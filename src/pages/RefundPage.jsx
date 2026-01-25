import '../App.css'
import './RefundPage.css'

export default function RefundPage() {
  return (
    <section className="section refund-page">
      <div className="refund-container">
        <h1>Refund & Cancellation Policy</h1>
        <p className="last-updated">Last updated: January 2026</p>

        <div className="refund-content">
          <section className="refund-section">
            <h2>Overview</h2>
            <p>
              Our refund policy differs based on the type of service purchased: Account Services (boosts, modifications) 
              or Pre-Made Accounts. Please review the section that applies to your purchase.
            </p>
          </section>

          <section className="refund-section">
            <h2>Account Services (Boosts, Outfits, Vehicles, Cash, Level, Unlocks)</h2>
            
            <h3>What Happens If a Service Doesn't Work?</h3>
            <p>
              If the service you paid for ends up not working—such as items disappearing, modifiers resetting, 
              or the service not being properly applied—we will provide a <strong>free account service restoration at no charge</strong>. 
              We will re-apply the service once to restore what was lost.
            </p>

            <h3>Can I Get a Refund Instead?</h3>
            <p>
              <strong>No refunds are available for account services.</strong> Your only option is to request a free re-service 
              to restore the modifications. If you would simply like your money back instead of receiving the service again, 
              we are able to cancel the order and issue a full refund—but only if:
            </p>
            <ul>
              <li>The service has not yet been delivered to your account</li>
              <li>You contact us via Discord before delivery begins</li>
            </ul>

            <h3>What If the Service Works But I Changed My Mind?</h3>
            <p>
              Once the service has been successfully delivered to your account, <strong>no refunds or cancellations are available</strong>. 
              We recommend carefully reviewing the service details before purchase.
            </p>

            <h3>Important Note on Service Modifications</h3>
            <p>
              Please understand that account modifications are subject to game updates and Rockstar Games policies. 
              While we apply services safely, items or modifications may be reset or removed by the game itself. 
              This is not our responsibility, and we cannot issue refunds for changes made by Rockstar Games after delivery.
            </p>
          </section>

          <section className="refund-section">
            <h2>Pre-Made Accounts (Full Modded Accounts)</h2>
            
            <h3>Refund Policy</h3>
            <p>
              <strong>No refunds are available for pre-made modded accounts.</strong> Once we provide you with full account 
              access details via Discord, the purchase is final and non-refundable. You assume full responsibility for the account.
            </p>

            <h3>What If the Account Has Issues After Delivery?</h3>
            <p>
              Once we hand over the account details:
            </p>
            <ul>
              <li><strong>Account Lockouts:</strong> We are not responsible if the account becomes locked after we provide you with access. 
                This includes lockouts caused by incorrect login attempts, security measures, or suspicious activity detected by Rockstar Games.</li>
              <li><strong>Account Bans:</strong> If the account receives a ban after delivery, we will provide one free account 
                restoration service to create a new replacement account or modify a new one. However, no additional refunds are available.</li>
              <li><strong>Missing Items or Modifications:</strong> We are not responsible for items or modifications that are missing 
                or reset after delivery, as this may be caused by game updates or Rockstar Games actions.</li>
              <li><strong>Third-Party Interference:</strong> If the account is compromised due to you sharing details with unauthorized users 
                or losing your credentials, we are not responsible and cannot issue refunds.</li>
            </ul>

            <h3>Important Disclaimer</h3>
            <p>
              By purchasing a pre-made account, you acknowledge:
            </p>
            <ul>
              <li>You are purchasing an account with pre-applied modifications that may be subject to removal by Rockstar Games</li>
              <li>We are not responsible for account security, lockouts, or moderation actions after we provide the account details</li>
              <li>You assume all risk associated with using a modified account</li>
              <li>Game updates or Rockstar policies may affect the account after purchase, and we bear no responsibility for these changes</li>
            </ul>
          </section>

          <section className="refund-section">
            <h2>Refund Process</h2>
            <p>
              <strong>If you are eligible for a refund:</strong>
            </p>
            <ol>
              <li>Contact us immediately via Discord before service delivery begins</li>
              <li>Provide your order ID and reason for cancellation</li>
              <li>We will verify your request and process the refund through Stripe within 3–5 business days</li>
              <li>Refunds will be issued to the original payment method</li>
            </ol>
            <p>
              <strong>Refunds cannot be issued:</strong>
            </p>
            <ul>
              <li>After service has been delivered to your account</li>
              <li>If the service worked correctly at the time of delivery</li>
              <li>For changes caused by game updates or Rockstar Games policies</li>
            </ul>
          </section>

          <section className="refund-section">
            <h2>Payment Method & Stripe</h2>
            <p>
              All payments are processed securely through Stripe. By making a purchase, you agree to Stripe's 
              <a href="https://stripe.com/legal" target="_blank" rel="noreferrer"> Terms of Service</a>. 
              Refunds are issued to your original payment method and may take 3–5 business days to appear depending on your bank.
            </p>
          </section>

          <section className="refund-section">
            <h2>Service Guarantee</h2>
            <p>
              While we do not offer full refunds, we do stand behind our services:
            </p>
            <ul>
              <li><strong>Account Services:</strong> If your service doesn't work, we'll restore it for free—once</li>
              <li><strong>Pre-Made Accounts:</strong> If your account is banned, we'll provide one free replacement—no game key purchase included</li>
            </ul>
            <p>
              Beyond this guarantee, refunds are not available. We encourage you to review the service details and 
              <a href="/terms"> Terms & Conditions</a> carefully before purchasing.
            </p>
          </section>

          <section className="refund-section">
            <h2>Contact & Disputes</h2>
            <p>
              If you have questions about a refund or wish to discuss your order, please contact us via Discord. 
              All disputes are handled through Discord conversation, and we maintain full chat history for transparency.
            </p>
          </section>

          <section className="refund-section disclaimer">
            <p>
              <strong>Final Note:</strong> This refund policy is designed to be fair to both Zeus Services and our customers. 
              However, due to the digital nature of account services and the policies of Rockstar Games, refunds are extremely limited. 
              We strongly recommend ensuring you understand what you are purchasing before completing your order.
            </p>
          </section>
        </div>
      </div>
    </section>
  )
}
