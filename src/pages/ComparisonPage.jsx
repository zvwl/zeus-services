import SEO from '../components/SEO'
import Breadcrumb from '../components/Breadcrumb'

export default function ComparisonPage() {
  return (
    <>
      <SEO 
        title="Modded Account vs Boosting Service - Which Is Right For You? | zeuservices"
        description="Compare GTA Online modded accounts and account boosting services. Learn the differences in delivery time, cost, customization, and account control."
        keywords="modded account vs boosting, GTA account comparison, buy modded account or boost service, GTA online services"
      />
      
      <section className="section">
        <Breadcrumb customItems={[{ label: 'Home', path: '/' }, { label: 'Modded vs Boosting', path: '/comparison' }]} />
        <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '3rem 2rem' }}>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', color: '#f1f5f9', textAlign: 'center' }}>
            Modded Accounts vs Account Boosting
          </h1>
          <p style={{ fontSize: '1.1rem', color: '#cbd5e1', marginBottom: '3rem', textAlign: 'center', lineHeight: '1.6' }}>
            Not sure whether to buy a pre-ranked modded GTA account or use our boosting service? Compare the two options below and choose what's best for you.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '3rem' }}>
            {/* Modded Accounts Card */}
            <div style={{ backgroundColor: '#1a2332', padding: '2rem', borderRadius: '8px', borderLeft: '4px solid #fbbf24' }}>
              <h2 style={{ fontSize: '2rem', color: '#fbbf24', marginBottom: '1.5rem' }}>
                🎮 Modded Accounts
              </h2>
              
              <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ color: '#f1f5f9', marginBottom: '1rem', fontSize: '1.2rem' }}>How It Works</h3>
                <p style={{ color: '#cbd5e1', lineHeight: '1.8' }}>
                  You purchase a pre-ranked GTA Online account that's ready to play immediately. The account comes with high rank, millions in cash, all vehicles unlocked, and full progress already completed.
                </p>
              </div>

              <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ color: '#f1f5f9', marginBottom: '1rem', fontSize: '1.2rem' }}>Delivery Time</h3>
                <p style={{ color: '#fbbf24', fontWeight: '600' }}>Instant (within 1-2 hours)</p>
              </div>

              <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ color: '#f1f5f9', marginBottom: '1rem', fontSize: '1.2rem' }}>Pros</h3>
                <ul style={{ color: '#cbd5e1', lineHeight: '2', marginLeft: '1.5rem' }}>
                  <li>✅ Play immediately after delivery</li>
                  <li>✅ No account sharing required</li>
                  <li>✅ Completely fresh, unprotected account</li>
                  <li>✅ No waiting time</li>
                  <li>✅ You own the account from day one</li>
                </ul>
              </div>

              <div>
                <h3 style={{ color: '#f1f5f9', marginBottom: '1rem', fontSize: '1.2rem' }}>Cons</h3>
                <ul style={{ color: '#cbd5e1', lineHeight: '2', marginLeft: '1.5rem' }}>
                  <li>❌ Can't customize existing account</li>
                  <li>❌ Have to abandon your current account</li>
                  <li>❌ Price varies per account</li>
                  <li>❌ Limited customization options</li>
                </ul>
              </div>
            </div>

            {/* Boosting Service Card */}
            <div style={{ backgroundColor: '#1a2332', padding: '2rem', borderRadius: '8px', borderLeft: '4px solid #60a5fa' }}>
              <h2 style={{ fontSize: '2rem', color: '#60a5fa', marginBottom: '1.5rem' }}>
                ⚡ Account Boosting Service
              </h2>
              
              <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ color: '#f1f5f9', marginBottom: '1rem', fontSize: '1.2rem' }}>How It Works</h3>
                <p style={{ color: '#cbd5e1', lineHeight: '1.8' }}>
                  You provide your GTA Online account details. Our expert team logs in and manually progresses your account to your exact specifications (rank, money, vehicles, etc.). You keep your original account and character.
                </p>
              </div>

              <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ color: '#f1f5f9', marginBottom: '1rem', fontSize: '1.2rem' }}>Delivery Time</h3>
                <p style={{ color: '#60a5fa', fontWeight: '600' }}>2-7 days (depending on service)</p>
              </div>

              <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ color: '#f1f5f9', marginBottom: '1rem', fontSize: '1.2rem' }}>Pros</h3>
                <ul style={{ color: '#cbd5e1', lineHeight: '2', marginLeft: '1.5rem' }}>
                  <li>✅ Keep your original account</li>
                  <li>✅ Fully customizable to your needs</li>
                  <li>✅ Works on any existing account</li>
                  <li>✅ Fixed pricing</li>
                  <li>✅ Specific rank/money/vehicles</li>
                  <li>✅ You always control your account</li>
                </ul>
              </div>

              <div>
                <h3 style={{ color: '#f1f5f9', marginBottom: '1rem', fontSize: '1.2rem' }}>Cons</h3>
                <ul style={{ color: '#cbd5e1', lineHeight: '2', marginLeft: '1.5rem' }}>
                  <li>❌ Takes 2-7 days to complete</li>
                  <li>❌ Requires account access</li>
                  <li>❌ Longer wait time</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Comparison Table */}
          <div style={{ marginBottom: '3rem', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#0f1720' }}>
                  <th style={{ padding: '1rem', textAlign: 'left', color: '#f1f5f9', borderBottom: '2px solid #334155' }}>Feature</th>
                  <th style={{ padding: '1rem', textAlign: 'center', color: '#fbbf24', borderBottom: '2px solid #334155' }}>Modded Accounts</th>
                  <th style={{ padding: '1rem', textAlign: 'center', color: '#60a5fa', borderBottom: '2px solid #334155' }}>Boosting Service</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { feature: 'Delivery Speed', modded: 'Instant (1-2 hrs)', boosting: '2-7 days' },
                  { feature: 'Customization', modded: 'Limited', boosting: 'Full customization' },
                  { feature: 'Keep Original Account', modded: 'No', boosting: 'Yes' },
                  { feature: 'Account Access', modded: 'New account', boosting: 'Your account' },
                  { feature: 'Cost', modded: 'Variable', boosting: 'Fixed pricing' },
                  { feature: 'Security Risk', modded: 'Very low', boosting: 'Very low' },
                  { feature: 'Best For', modded: 'Instant play', boosting: 'Customization' },
                  { feature: 'Multiple Characters', modded: 'One account', boosting: 'Your existing' }
                ].map((row, index) => (
                  <tr key={index} style={{ borderBottom: '1px solid #334155' }}>
                    <td style={{ padding: '1rem', color: '#f1f5f9', fontWeight: '600' }}>{row.feature}</td>
                    <td style={{ padding: '1rem', textAlign: 'center', color: '#cbd5e1' }}>{row.modded}</td>
                    <td style={{ padding: '1rem', textAlign: 'center', color: '#cbd5e1' }}>{row.boosting}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Decision Guide */}
          <div style={{ backgroundColor: '#1a2332', padding: '2rem', borderRadius: '8px', marginBottom: '3rem' }}>
            <h2 style={{ fontSize: '1.5rem', color: '#fbbf24', marginBottom: '1.5rem' }}>
              Which Should You Choose?
            </h2>
            
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ color: '#f1f5f9', marginBottom: '0.5rem', fontSize: '1.1rem' }}>
                Choose Modded Account If You Want:
              </h3>
              <ul style={{ color: '#cbd5e1', lineHeight: '2', marginLeft: '1.5rem' }}>
                <li>To start playing today with a high-rank account</li>
                <li>A fresh, new account (no old progress to keep)</li>
                <li>Instant delivery without any waiting</li>
                <li>Zero account access requirements</li>
              </ul>
            </div>

            <div>
              <h3 style={{ color: '#f1f5f9', marginBottom: '0.5rem', fontSize: '1.1rem' }}>
                Choose Boosting Service If You Want:
              </h3>
              <ul style={{ color: '#cbd5e1', lineHeight: '2', marginLeft: '1.5rem' }}>
                <li>To keep your current account and progress</li>
                <li>Specific rank, money, vehicles, or properties</li>
                <li>Full control and customization of your progression</li>
                <li>To level up your existing character</li>
              </ul>
            </div>
          </div>

          {/* CTA Section */}
          <div style={{ textAlign: 'center', padding: '2rem', backgroundColor: '#1a2332', borderRadius: '8px' }}>
            <h3 style={{ fontSize: '1.3rem', marginBottom: '1rem', color: '#f1f5f9' }}>
              Ready to get started?
            </h3>
            <p style={{ color: '#cbd5e1', marginBottom: '1.5rem', lineHeight: '1.6' }}>
              Browse our pre-ranked modded accounts or choose a custom boosting service. All accounts come with maximum security and instant delivery.
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button 
                style={{
                  padding: '1rem 2rem',
                  backgroundColor: '#fbbf24',
                  color: '#000',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
                onClick={() => window.location.href = '/products'}
              >
                Browse Modded Accounts
              </button>
              <button 
                style={{
                  padding: '1rem 2rem',
                  backgroundColor: '#60a5fa',
                  color: '#000',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
                onClick={() => window.location.href = '/services'}
              >
                View Boosting Services
              </button>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
