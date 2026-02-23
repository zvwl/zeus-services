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
            <h2>ALL SALES ARE FINAL</h2>
            <ul>
              <li>We do not offer refunds, returns, or exchanges</li>
              <li>Digital services are non-refundable once started or delivered</li>
              <li>Account bans, suspensions, resets, or penalties imposed by game publishers do not qualify for refunds</li>
              <li>Orders cancelled due to buyer unresponsiveness (24+ hours) are not refundable</li>
              <li>By completing a purchase, you explicitly agree to this Refund Policy</li>
            </ul>
          </section>

          <section className="refund-section">
            <h2>What This Covers</h2>
            <p>This refund policy applies to all services across the Zeus Services platform, including but not limited to:</p>
            <ul>
              <li><strong>Account Services:</strong> Modded accounts, premium accounts, account unlocks</li>
              <li><strong>Boosting Services:</strong> Rank boosts, progression services, leveling</li>
              <li><strong>Topup Services:</strong> In-game currency, credits, premium currency</li>
              <li><strong>All Games:</strong> GTA 5, Fortnite, Rocket League, Forza Horizon, and any future games we support</li>
            </ul>
          </section>

          <section className="refund-section">
            <h2>Why No Refunds?</h2>
            <ul>
              <li><strong>Digital Delivery:</strong> All services are digital and cannot be "returned"</li>
              <li><strong>Third-Party Enforcement:</strong> Game publishers (Rockstar, Epic Games, Psyonix, Forza) enforce their own Terms of Service independently</li>
              <li><strong>Uncontrollable Outcomes:</strong> Account bans and penalties are entirely outside our control and happen at the publisher's discretion</li>
              <li><strong>Service Completion:</strong> Once a service has started or been delivered, it is considered fulfilled</li>
            </ul>
          </section>

          <section className="refund-section">
            <h2>Your Responsibility</h2>
            <p>By purchasing from Zeus Services, you:</p>
            <ul>
              <li>Accept full responsibility for any account penalties or bans</li>
              <li>Agree to follow all safety guidelines provided with your service</li>
              <li>Understand that publisher enforcement is beyond our control</li>
              <li>Accept that there are inherent risks with using third-party services</li>
              <li>Agree not to hold us liable for actions taken by game publishers</li>
            </ul>
          </section>
        </div>
      </div>
    </section>
    </>
  )
}

