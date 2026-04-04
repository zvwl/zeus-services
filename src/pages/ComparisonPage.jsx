import { useRef } from 'react'
import SEO from '../components/SEO'
import Breadcrumb from '../components/Breadcrumb'
import { Gamepad2, Zap, CircleCheck, CircleX } from 'lucide-react'
import AnimatedLucideIcon from '../components/AnimatedLucideIcon'

export default function ComparisonPage() {
  const gamepadIconRef = useRef(null)
  const zapIconRef = useRef(null)
  
  return (
    <>
      <SEO 
        title="Modded Account vs Boosting Service - Which Is Right For You? | zeuservices"
        description="Compare modded accounts and account boosting services across all games. Learn the differences in delivery time, cost, customization, and account control for GTA, Fortnite, Rocket League, and more."
        keywords="modded account vs boosting, account comparison, buy modded account or boost service, gaming services comparison"
      />
      
      <section className="section">
        <Breadcrumb customItems={[{ label: 'Home', path: '/' }, { label: 'Modded vs Boosting', path: '/comparison' }]} />
        <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '3rem 2rem' }}>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', color: '#f1f5f9', textAlign: 'center' }}>
            Modded Accounts vs Account Boosting
          </h1>
          <p style={{ fontSize: '1.1rem', color: '#cbd5e1', marginBottom: '3rem', textAlign: 'center', lineHeight: '1.6' }}>
            Not sure whether to buy a pre-ranked modded account or use our boosting service? This comparison applies to GTA Online, Fortnite, Rocket League, Forza Horizon, and all games we support. Check out the differences below and choose what's best for you.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '3rem' }}>
            {/* Modded Accounts Card */}
            <div style={{ backgroundColor: '#1a2332', padding: '2rem', borderRadius: '8px', borderLeft: '4px solid #fbbf24' }}>
              <h2 style={{ fontSize: '2rem', color: '#fbbf24', marginBottom: '1.5rem' }}>
                <span 
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}
                  onMouseEnter={() => gamepadIconRef.current?.startAnimation?.()}
                  onMouseLeave={() => gamepadIconRef.current?.stopAnimation?.()}
                >
                  <AnimatedLucideIcon ref={gamepadIconRef} icon={Gamepad2} size={28} animation="bounce" animateOnHover={false} />
                  <span>Modded Accounts</span>
                </span>
              </h2>
              
              <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ color: '#f1f5f9', marginBottom: '1rem', fontSize: '1.2rem' }}>How It Works</h3>
                <p style={{ color: '#cbd5e1', lineHeight: '1.8' }}>
                  You purchase a pre-ranked account that's ready to play immediately. The account comes with high rank/level, in-game currency, all cosmetics/vehicles unlocked, and full progress already completed - customized to your specifications.
                </p>
              </div>

              <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ color: '#f1f5f9', marginBottom: '1rem', fontSize: '1.2rem' }}>Delivery Time</h3>
                <p style={{ color: '#fbbf24', fontWeight: '600' }}>Instant or within 20 minutes to 3 hours</p>
              </div>

              <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ color: '#f1f5f9', marginBottom: '1rem', fontSize: '1.2rem' }}>Pros</h3>
                <ul style={{ color: '#cbd5e1', lineHeight: '2', marginLeft: '1.5rem' }}>
                  <li><AnimatedLucideIcon icon={CircleCheck} size={16} animation="pulse" animateOnHover={false} /> Play immediately after delivery</li>
                  <li><AnimatedLucideIcon icon={CircleCheck} size={16} animation="pulse" animateOnHover={false} /> No account sharing required</li>
                  <li><AnimatedLucideIcon icon={CircleCheck} size={16} animation="pulse" animateOnHover={false} /> Completely fresh, unprotected account</li>
                  <li><AnimatedLucideIcon icon={CircleCheck} size={16} animation="pulse" animateOnHover={false} /> No waiting time</li>
                  <li><AnimatedLucideIcon icon={CircleCheck} size={16} animation="pulse" animateOnHover={false} /> You own the account from day one</li>
                </ul>
              </div>

              <div>
                <h3 style={{ color: '#f1f5f9', marginBottom: '1rem', fontSize: '1.2rem' }}>Cons</h3>
                <ul style={{ color: '#cbd5e1', lineHeight: '2', marginLeft: '1.5rem' }}>
                  <li><AnimatedLucideIcon icon={CircleX} size={16} animation="shake" animateOnHover={false} /> Can't customize existing account</li>
                  <li><AnimatedLucideIcon icon={CircleX} size={16} animation="shake" animateOnHover={false} /> Have to abandon your current account</li>
                  <li><AnimatedLucideIcon icon={CircleX} size={16} animation="shake" animateOnHover={false} /> Price varies per account</li>
                  <li><AnimatedLucideIcon icon={CircleX} size={16} animation="shake" animateOnHover={false} /> Limited customization options</li>
                </ul>
              </div>
            </div>

            {/* Boosting Service Card */}
            <div style={{ backgroundColor: '#1a2332', padding: '2rem', borderRadius: '8px', borderLeft: '4px solid #60a5fa' }}>
              <h2 style={{ fontSize: '2rem', color: '#60a5fa', marginBottom: '1.5rem' }}>
                <span 
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}
                  onMouseEnter={() => zapIconRef.current?.startAnimation?.()}
                  onMouseLeave={() => zapIconRef.current?.stopAnimation?.()}
                >
                  <AnimatedLucideIcon ref={zapIconRef} icon={Zap} size={28} animation="bounce" animateOnHover={false} />
                  <span>Account Boosting Service</span>
                </span>
              </h2>
              
              <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ color: '#f1f5f9', marginBottom: '1rem', fontSize: '1.2rem' }}>How It Works</h3>
                <p style={{ color: '#cbd5e1', lineHeight: '1.8' }}>
                  You provide your account details for your game. Our expert team logs in and manually progresses your account to your exact specifications (rank, currency, cosmetics, vehicles, achievements, etc.). You keep your original account and character.
                </p>
              </div>

              <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ color: '#f1f5f9', marginBottom: '1rem', fontSize: '1.2rem' }}>Delivery Time</h3>
                <p style={{ color: '#60a5fa', fontWeight: '600' }}>20 minutes to a few hours (depending on game and items)</p>
              </div>

              <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ color: '#f1f5f9', marginBottom: '1rem', fontSize: '1.2rem' }}>Pros</h3>
                <ul style={{ color: '#cbd5e1', lineHeight: '2', marginLeft: '1.5rem' }}>
                  <li><AnimatedLucideIcon icon={CircleCheck} size={16} animation="pulse" animateOnHover={false} /> Keep your original account</li>
                  <li><AnimatedLucideIcon icon={CircleCheck} size={16} animation="pulse" animateOnHover={false} /> Fully customizable to your needs</li>
                  <li><AnimatedLucideIcon icon={CircleCheck} size={16} animation="pulse" animateOnHover={false} /> Works on any existing account</li>
                  <li><AnimatedLucideIcon icon={CircleCheck} size={16} animation="pulse" animateOnHover={false} /> Fixed pricing</li>
                  <li><AnimatedLucideIcon icon={CircleCheck} size={16} animation="pulse" animateOnHover={false} /> Specific rank/money/vehicles</li>
                  <li><AnimatedLucideIcon icon={CircleCheck} size={16} animation="pulse" animateOnHover={false} /> You always control your account</li>
                </ul>
              </div>

              <div>
                <h3 style={{ color: '#f1f5f9', marginBottom: '1rem', fontSize: '1.2rem' }}>Cons</h3>
                <ul style={{ color: '#cbd5e1', lineHeight: '2', marginLeft: '1.5rem' }}>
                  <li><AnimatedLucideIcon icon={CircleX} size={16} animation="shake" animateOnHover={false} /> Takes 20 minutes to a few hours to complete</li>
                  <li><AnimatedLucideIcon icon={CircleX} size={16} animation="shake" animateOnHover={false} /> Requires account access</li>
                  <li><AnimatedLucideIcon icon={CircleX} size={16} animation="shake" animateOnHover={false} /> Longer wait time</li>
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
                  { feature: 'Delivery Speed', modded: 'Instant or 20 mins - 3 hours', boosting: '20 mins - few hours' },
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
                onClick={() => window.location.href = '/accounts'}
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
                onClick={() => window.location.href = '/boosting'}
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
