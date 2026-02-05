import SEO from '../components/SEO'
import Breadcrumb from '../components/Breadcrumb'

export default function SafetyPage() {
  return (
    <>
      <SEO 
        title="Understanding GTA Account Services - Be Informed Before Purchasing | zeuservices"
        description="Learn the facts about GTA account services. Understand Rockstar enforcement, account risk, and what zeuservices actually does to help you make informed decisions."
        keywords="GTA account risk, Rockstar ban, modded accounts safety, GTA boosting risks, informed decision"
      />
      
      <section className="section">
        <Breadcrumb customItems={[{ label: 'Home', path: '/' }, { label: 'Important Information', path: '/safety' }]} />
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '3rem 2rem' }}>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', color: '#f1f5f9' }}>
            Important: Understand the Facts About GTA Account Services
          </h1>
          <p style={{ fontSize: '1.1rem', color: '#cbd5e1', marginBottom: '2rem', lineHeight: '1.8' }}>
            Before purchasing any account service, you need to understand what's actually happening, the real risks involved, and what we can and cannot do to protect you.
          </p>

          {/* The Hard Truth */}
          <div style={{ marginBottom: '3rem', backgroundColor: '#dc2626', padding: '2rem', borderRadius: '8px' }}>
            <h2 style={{ fontSize: '1.8rem', color: '#fff', marginBottom: '1rem' }}>
              The Reality You Need to Know
            </h2>
            <div style={{ color: '#f3f4f6', lineHeight: '1.9', fontSize: '1.05rem' }}>
              <p style={{ marginBottom: '1rem' }}>
                <strong>Modded accounts and account boosting violate Rockstar Games' Terms of Service.</strong>
              </p>
              <p style={{ marginBottom: '1rem' }}>
                Rockstar actively enforces against this, which means:
              </p>
              <ul style={{ marginLeft: '1.5rem', color: '#f3f4f6' }}>
                <li>Your account <strong>CAN be reset, suspended, or permanently banned</strong> at any time</li>
                <li>Bans happen <strong>without warning</strong> - this is completely <strong>luck-based</strong></li>
                <li>We <strong>cannot prevent, stop, or reverse</strong> Rockstar's actions - no one can</li>
                <li><strong>Risk increases</strong> if we add more than <strong>50M to your account per day</strong></li>
                <li><strong>There are NO refunds</strong> if your account gets banned - you accept this risk</li>
              </ul>
            </div>
          </div>

          {/* What We Actually Do */}
          <div style={{ marginBottom: '3rem' }}>
            <h2 style={{ fontSize: '2rem', color: '#fbbf24', marginBottom: '1.5rem' }}>
              What We Actually Do to Minimize Risk
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
              <div style={{ backgroundColor: '#1a2332', padding: '1.5rem', borderRadius: '8px', borderLeft: '4px solid #fbbf24' }}>
                <h3 style={{ color: '#fbbf24', marginBottom: '1rem', fontSize: '1.1rem' }}>
                  ✓ 9+ Years of Experience
                </h3>
                <p style={{ color: '#cbd5e1', lineHeight: '1.8' }}>
                  We've been operating GTA services for over 9 years. This experience means we understand what patterns Rockstar looks for and how to minimize detection risk. However, bans are ultimately luck-based and cannot be prevented.
                </p>
              </div>

              <div style={{ backgroundColor: '#1a2332', padding: '1.5rem', borderRadius: '8px', borderLeft: '4px solid #60a5fa' }}>
                <h3 style={{ color: '#60a5fa', marginBottom: '1rem', fontSize: '1.1rem' }}>
                  ✓ PC Platform Support
                </h3>
                <p style={{ color: '#cbd5e1', lineHeight: '1.8' }}>
                  We support all major PC platforms: Steam, Epic Games, Xbox App (Microsoft Store), and Rockstar Social Club. Accounts are created and delivered for your specific platform.
                </p>
              </div>

              <div style={{ backgroundColor: '#1a2332', padding: '1.5rem', borderRadius: '8px', borderLeft: '4px solid #a78bfa' }}>
                <h3 style={{ color: '#a78bfa', marginBottom: '1rem', fontSize: '1.1rem' }}>
                  ✓ Safe Money Limits on Account Creation
                </h3>
                <p style={{ color: '#cbd5e1', lineHeight: '1.8' }}>
                  <strong>CRITICAL:</strong> We can only safely add up to <strong>50 million GTA$ per day</strong> when building your account. You can request more, but anything over 50M significantly increases ban risk. We're not responsible for bans if you choose higher amounts.
                </p>
              </div>

              <div style={{ backgroundColor: '#1a2332', padding: '1.5rem', borderRadius: '8px', borderLeft: '4px solid #34d399' }}>
                <h3 style={{ color: '#34d399', marginBottom: '1rem', fontSize: '1.1rem' }}>
                  ✓ Tested Accounts (For Modded Accounts)
                </h3>
                <p style={{ color: '#cbd5e1', lineHeight: '1.8' }}>
                  Modded accounts are tested on live Rockstar servers before delivery. This verifies they work at that moment. It does not mean they'll never get banned - Rockstar can issue a ban retroactively.
                </p>
              </div>

              <div style={{ backgroundColor: '#1a2332', padding: '1.5rem', borderRadius: '8px', borderLeft: '4px solid #f97316' }}>
                <h3 style={{ color: '#f97316', marginBottom: '1rem', fontSize: '1.1rem' }}>
                  ✓ Immediate Password Reset
                </h3>
                <p style={{ color: '#cbd5e1', lineHeight: '1.8' }}>
                  For modded accounts, you set a new password immediately after delivery. We don't store credentials. For boosting, you maintain account control. Either way, you secure your account.
                </p>
              </div>

              <div style={{ backgroundColor: '#1a2332', padding: '1.5rem', borderRadius: '8px', borderLeft: '4px solid #06b6d4' }}>
                <h3 style={{ color: '#06b6d4', marginBottom: '1rem', fontSize: '1.1rem' }}>
                  ✓ Possible Free Recovery (Conditions Apply)
                </h3>
                <p style={{ color: '#cbd5e1', lineHeight: '1.8' }}>
                  If you follow our guidelines when using the account AND get banned, we may offer a discretionary free replacement. <strong>This is NOT guaranteed.</strong> If you requested over 50M on the account or violate our guidelines, there's no recovery offered.
                </p>
              </div>
            </div>
          </div>

          {/* What We Cannot Guarantee */}
          <div style={{ marginBottom: '3rem', backgroundColor: '#1a2332', padding: '2rem', borderRadius: '8px', border: '1px solid #334155' }}>
            <h2 style={{ fontSize: '1.5rem', color: '#f1f5f9', marginBottom: '1.5rem' }}>
              What We CANNOT and DO NOT Guarantee
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div>
                <h4 style={{ color: '#ef4444', marginBottom: '0.75rem', fontSize: '1rem', fontWeight: '600' }}>
                  ❌ No Ban Guarantee
                </h4>
                <p style={{ color: '#cbd5e1', lineHeight: '1.6', fontSize: '0.95rem' }}>
                  Despite our best efforts, bans can happen. We cannot prevent them or guarantee your account won't be banned.
                </p>
              </div>

              <div>
                <h4 style={{ color: '#ef4444', marginBottom: '0.75rem', fontSize: '1rem', fontWeight: '600' }}>
                  ❌ No Account Recovery Warranty
                </h4>
                <p style={{ color: '#cbd5e1', lineHeight: '1.6', fontSize: '0.95rem' }}>
                  If banned, we may help, but there's no guarantee your account can be recovered or that Rockstar will lift the ban.
                </p>
              </div>

              <div>
                <h4 style={{ color: '#ef4444', marginBottom: '0.75rem', fontSize: '1rem', fontWeight: '600' }}>
                  ❌ No Refunds for Any Reason
                </h4>
                <p style={{ color: '#cbd5e1', lineHeight: '1.6', fontSize: '0.95rem' }}>
                  All sales are final. Bans, disappointment, change of mind - no refunds. This is in our T&Cs.
                </p>
              </div>

              <div>
                <h4 style={{ color: '#ef4444', marginBottom: '0.75rem', fontSize: '1rem', fontWeight: '600' }}>
                  ❌ No Control Over Rockstar
                </h4>
                <p style={{ color: '#cbd5e1', lineHeight: '1.6', fontSize: '0.95rem' }}>
                  We have zero influence on Rockstar's enforcement decisions. Their actions are outside our control completely.
                </p>
              </div>
            </div>
          </div>

          {/* After You Receive Your Service */}
          <div style={{ marginBottom: '3rem' }}>
            <h2 style={{ fontSize: '1.5rem', color: '#fbbf24', marginBottom: '1.5rem' }}>
              After You Receive Your Account/Service
            </h2>

            <div style={{ backgroundColor: '#0f1720', padding: '1.5rem', borderRadius: '8px' }}>
              <p style={{ color: '#cbd5e1', lineHeight: '1.8', marginBottom: '1rem' }}>
                <strong style={{ color: '#fbbf24' }}>Your Responsibility:</strong> The account/progression is now yours. How you use it determines your ban risk.
              </p>

              <div style={{ backgroundColor: '#1a2332', padding: '1rem', borderRadius: '6px', marginBottom: '1rem' }}>
                <p style={{ color: '#cbd5e1', fontSize: '0.95rem', lineHeight: '1.7' }}>
                  <strong style={{ color: '#fbbf24' }}>To minimize ban risk after delivery:</strong><br/>
                  • Don't spend large amounts of cash rapidly in-game<br/>
                  • Don't use cheats or additional mods on the account<br/>
                  • Play normally and avoid suspicious behavior<br/>
                  • Don't brag about the account publicly<br/>
                  • Don't share login with others
                </p>
              </div>

              <p style={{ color: '#cbd5e1', lineHeight: '1.8' }}>
                Following these doesn't guarantee safety - Rockstar can still detect modded accounts even with careful play. But violating these almost guarantees Rockstar will notice and act.
              </p>
            </div>
          </div>

          {/* Why You Might Still Choose Us */}
          <div style={{ marginBottom: '3rem', backgroundColor: '#1a2332', padding: '2rem', borderRadius: '8px' }}>
            <h2 style={{ fontSize: '1.5rem', color: '#fbbf24', marginBottom: '1.5rem' }}>
              Why People Choose zeuservices Despite The Risks
            </h2>

            <ul style={{ color: '#cbd5e1', lineHeight: '2.2', marginLeft: '1.5rem' }}>
              <li><strong style={{ color: '#f1f5f9' }}>9+ Years of Experience:</strong> We've survived every ban wave. We know what works.</li>
              <li><strong style={{ color: '#f1f5f9' }}>Transparent About Risks:</strong> We don't pretend there's no risk. We're honest about what can happen.</li>
              <li><strong style={{ color: '#f1f5f9' }}>Professional Service:</strong> Fast delivery, professional support, clear communication.</li>
              <li><strong style={{ color: '#f1f5f9' }}>Community Trust:</strong> 1000+ customers over 9 years with no scam reports.</li>
              <li><strong style={{ color: '#f1f5f9' }}>Best Effort:</strong> While we can't guarantee safety, we genuinely use proven methods to minimize risk.</li>
            </ul>
          </div>

          {/* CTA */}
          <div style={{ backgroundColor: '#1a2332', padding: '2rem', borderRadius: '8px', textAlign: 'center', borderTop: '2px solid #fbbf24' }}>
            <h2 style={{ fontSize: '1.5rem', color: '#f1f5f9', marginBottom: '1rem' }}>
              Ready to Proceed?
            </h2>
            <p style={{ color: '#cbd5e1', fontSize: '1rem', marginBottom: '1.5rem', lineHeight: '1.8' }}>
              If you understand the risks, accept no refunds, and want to proceed, we're here. Open a Discord ticket after purchase and follow our guidance carefully.
            </p>
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
              I Understand - Browse Products
            </button>
          </div>

          {/* Full Disclaimer */}
          <div style={{ marginTop: '3rem', padding: '1.5rem', backgroundColor: '#0f1720', borderRadius: '8px', border: '1px solid #334155' }}>
            <p style={{ color: '#cbd5e1', fontSize: '0.9rem', lineHeight: '1.8' }}>
              <strong style={{ color: '#fbbf24' }}>READ THIS:</strong> By purchasing, you acknowledge that modded accounts violate Rockstar's ToS, that bans can occur without warning, that we provide NO refunds, and that you accept full responsibility for any account actions or bans. Read our full T&Cs before purchasing.
            </p>
          </div>
        </div>
      </section>
    </>
  )
}
