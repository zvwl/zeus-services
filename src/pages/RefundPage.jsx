import '../App.css'
import './RefundPage.css'

export default function RefundPage() {
  return (
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
              <li>Bans, resets, or penalties imposed by Rockstar Games do not qualify for refunds</li>
              <li>Orders cancelled due to buyer unresponsiveness (24+ hours) are not refundable</li>
              <li>By completing a purchase, you explicitly agree to this Refund Policy</li>
            </ul>
          </section>
        </div>
      </div>
    </section>
  )
}
