import SEO from '../components/SEO'
import Breadcrumb from '../components/Breadcrumb'

export default function ProcessPage() {
  return (
    <>
      <SEO 
        title="How zeuservices Works - Step-by-Step Process for GTA Account Services"
        description="Learn how our GTA account service process works. Discord-based transactions, safe payment through Stripe, service hours 6 PM-1 AM UK time. Professional delivery explained."
        keywords="how zeuservices works, service process, account delivery, Discord ticket, payment process"
      />
      
      <section className="section">
        <Breadcrumb customItems={[{ label: 'Home', path: '/' }, { label: 'How It Works', path: '/process' }]} />
        <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '3rem 2rem' }}>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', color: '#f1f5f9', textAlign: 'center' }}>
            How zeuservices Process Works
          </h1>
          <p style={{ fontSize: '1.1rem', color: '#cbd5e1', marginBottom: '3rem', lineHeight: '1.8', textAlign: 'center' }}>
            Simple, professional, transparent. Here's exactly what happens when you order from us.
          </p>

          {/* CRITICAL REQUIREMENTS */}
          <div style={{ marginBottom: '4rem', backgroundColor: '#dc2626', padding: '2rem', borderRadius: '8px' }}>
            <h2 style={{ fontSize: '1.5rem', color: '#fff', marginBottom: '1.5rem' }}>
              ⚠️ MANDATORY Requirements Before You Order
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', color: '#f3f4f6' }}>
              <div>
                <h4 style={{ fontSize: '1.1rem', marginBottom: '0.75rem', fontWeight: '600' }}>🎫 Discord Ticket Required</h4>
                <p style={{ lineHeight: '1.6' }}>
                  After purchase, you MUST open a Discord ticket to begin service. Services will NOT start without an active Discord ticket. This is how we communicate with you.
                </p>
              </div>
              <div>
                <h4 style={{ fontSize: '1.1rem', marginBottom: '0.75rem', fontWeight: '600' }}>🕐 Service Hours: 6 PM - 1 AM UK Time</h4>
                <p style={{ lineHeight: '1.6' }}>
                  We operate ONLY during these hours. Boosting/account delivery happens within this window. Orders placed outside these hours start processing when service resumes.
                </p>
              </div>
              <div>
                <h4 style={{ fontSize: '1.1rem', marginBottom: '0.75rem', fontWeight: '600' }}>⏰ 24-Hour Unresponsive Rule</h4>
                <p style={{ lineHeight: '1.6' }}>
                  If you don't respond to Discord messages for 24+ hours, your order is CANCELLED. No refund. You must stay responsive during service.
                </p>
              </div>
              <div>
                <h4 style={{ fontSize: '1.1rem', marginBottom: '0.75rem', fontWeight: '600' }}>🔐 2FA Codes Required</h4>
                <p style={{ lineHeight: '1.6' }}>
                  For boosting, you must provide 2FA codes when requested. You'll need to be available to verify logins. This is for YOUR account security.
                </p>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <h4 style={{ fontSize: '1.1rem', marginBottom: '0.75rem', fontWeight: '600' }}>💰 ALL SALES FINAL - NO REFUNDS</h4>
                <p style={{ lineHeight: '1.6' }}>
                  Once purchase is made, there are NO refunds for ANY reason. This includes account bans, service delays, cancellations (due to unresponsiveness), or change of mind. YOU ACCEPT THIS RISK.
                </p>
              </div>
            </div>
          </div>

          {/* Modded Accounts Process */}
          <div style={{ marginBottom: '4rem' }}>
            <h2 style={{ fontSize: '2rem', color: '#fbbf24', marginBottom: '2rem', paddingBottom: '1rem', borderBottom: '2px solid #334155' }}>
              🎮 Modded Accounts - 4 Easy Steps
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem', marginBottom: '2rem' }}>
              {/* Step 1 */}
              <div style={{ display: 'flex', gap: '1.5rem' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '60px',
                  height: '60px',
                  minWidth: '60px',
                  backgroundColor: '#fbbf24',
                  color: '#000',
                  borderRadius: '50%',
                  fontSize: '1.5rem',
                  fontWeight: '700'
                }}>
                  1
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ color: '#f1f5f9', marginBottom: '0.75rem', fontSize: '1.3rem', fontWeight: '600' }}>
                    Choose Your Account
                  </h3>
                  <p style={{ color: '#cbd5e1', lineHeight: '1.7', marginBottom: '1rem' }}>
                    Browse our inventory of modded accounts. Each account has specific stats, money, RP level, vehicles, and properties listed. Pick the exact account that fits what you want.
                  </p>
                  <div style={{ backgroundColor: '#1a2332', padding: '1rem', borderRadius: '6px' }}>
                    <p style={{ color: '#cbd5e1', fontSize: '0.95rem', lineHeight: '1.6' }}>
                      <strong style={{ color: '#60a5fa' }}>What You'll See:</strong> Platform (PC, PlayStation, Xbox), RP level, money amount, properties owned, vehicles owned, rank recommendations
                    </p>
                  </div>
                </div>
              </div>

              {/* Step 2 */}
              <div style={{ display: 'flex', gap: '1.5rem' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '60px',
                  height: '60px',
                  minWidth: '60px',
                  backgroundColor: '#60a5fa',
                  color: '#000',
                  borderRadius: '50%',
                  fontSize: '1.5rem',
                  fontWeight: '700'
                }}>
                  2
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ color: '#f1f5f9', marginBottom: '0.75rem', fontSize: '1.3rem', fontWeight: '600' }}>
                    Place Order & Pay
                  </h3>
                  <p style={{ color: '#cbd5e1', lineHeight: '1.7', marginBottom: '1rem' }}>
                    Click "Order Now", confirm the account details, and proceed to checkout. We use secure Stripe for all payments. Your payment is encrypted and safe.
                  </p>
                  <div style={{ backgroundColor: '#1a2332', padding: '1rem', borderRadius: '6px' }}>
                    <p style={{ color: '#cbd5e1', fontSize: '0.95rem', lineHeight: '1.6' }}>
                      <strong style={{ color: '#a78bfa' }}>Payment Options:</strong> Credit/Debit Card via Stripe. No payment info stored by us. Encrypted end-to-end.
                    </p>
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div style={{ display: 'flex', gap: '1.5rem' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '60px',
                  height: '60px',
                  minWidth: '60px',
                  backgroundColor: '#a78bfa',
                  color: '#000',
                  borderRadius: '50%',
                  fontSize: '1.5rem',
                  fontWeight: '700'
                }}>
                  3
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ color: '#f1f5f9', marginBottom: '0.75rem', fontSize: '1.3rem', fontWeight: '600' }}>
                    Account Delivered
                  </h3>
                  <p style={{ color: '#cbd5e1', lineHeight: '1.7', marginBottom: '1rem' }}>
                    We test the account on a live Rockstar server. Everything is verified working. Then we securely deliver it to you with instructions. You get login details and we immediately change the password to something only you know.
                  </p>
                  <div style={{ backgroundColor: '#1a2332', padding: '1rem', borderRadius: '6px' }}>
                    <p style={{ color: '#cbd5e1', fontSize: '0.95rem', lineHeight: '1.6' }}>
                      <strong style={{ color: '#34d399' }}>Typical Timeline:</strong> Same day or next day depending on order time. Modded accounts usually ship 2-4 hours after order.
                    </p>
                  </div>
                </div>
              </div>

              {/* Step 4 */}
              <div style={{ display: 'flex', gap: '1.5rem' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '60px',
                  height: '60px',
                  minWidth: '60px',
                  backgroundColor: '#34d399',
                  color: '#000',
                  borderRadius: '50%',
                  fontSize: '1.5rem',
                  fontWeight: '700'
                }}>
                  4
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ color: '#f1f5f9', marginBottom: '0.75rem', fontSize: '1.3rem', fontWeight: '600' }}>
                    Play & Enjoy
                  </h3>
                  <p style={{ color: '#cbd5e1', lineHeight: '1.7', marginBottom: '1rem' }}>
                    Log in and start playing. Your account is fully yours. Change the password to something you'll remember. We recommend enabling 2FA for extra security. Now you have a fully modded account ready to go.
                  </p>
                  <div style={{ backgroundColor: '#1a2332', padding: '1rem', borderRadius: '6px' }}>
                    <p style={{ color: '#cbd5e1', fontSize: '0.95rem', lineHeight: '1.6' }}>
                      <strong style={{ color: '#fbbf24' }}>Remember:</strong> Play legitimately after delivery. No mods, cheats, or exploits. Just enjoy your modded account accounts normally and safely.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Boosting Process */}
          <div style={{ marginBottom: '4rem' }}>
            <h2 style={{ fontSize: '2rem', color: '#fbbf24', marginBottom: '2rem', paddingBottom: '1rem', borderBottom: '2px solid #334155' }}>
              ⚡ Account Boosting - 4 Easy Steps
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem', marginBottom: '2rem' }}>
              {/* Step 1 */}
              <div style={{ display: 'flex', gap: '1.5rem' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '60px',
                  height: '60px',
                  minWidth: '60px',
                  backgroundColor: '#fbbf24',
                  color: '#000',
                  borderRadius: '50%',
                  fontSize: '1.5rem',
                  fontWeight: '700'
                }}>
                  1
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ color: '#f1f5f9', marginBottom: '0.75rem', fontSize: '1.3rem', fontWeight: '600' }}>
                    Choose Your Service
                  </h3>
                  <p style={{ color: '#cbd5e1', lineHeight: '1.7', marginBottom: '1rem' }}>
                    Browse our boosting services. Choose what you want boosted: RP, Money, Unlock vehicles, Reach specific rank, or full progression. Each service has a clear price and timeline.
                  </p>
                  <div style={{ backgroundColor: '#1a2332', padding: '1rem', borderRadius: '6px' }}>
                    <p style={{ color: '#cbd5e1', fontSize: '0.95rem', lineHeight: '1.6' }}>
                      <strong style={{ color: '#60a5fa' }}>Popular Services:</strong> RNG (Rank, Money, Progress), RP Boost, Money Grind, Vehicle Unlock Packages, Full Progression
                    </p>
                  </div>
                </div>
              </div>

              {/* Step 2 */}
              <div style={{ display: 'flex', gap: '1.5rem' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '60px',
                  height: '60px',
                  minWidth: '60px',
                  backgroundColor: '#60a5fa',
                  color: '#000',
                  borderRadius: '50%',
                  fontSize: '1.5rem',
                  fontWeight: '700'
                }}>
                  2
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ color: '#f1f5f9', marginBottom: '0.75rem', fontSize: '1.3rem', fontWeight: '600' }}>
                    Place Order & Grant Access
                  </h3>
                  <p style={{ color: '#cbd5e1', lineHeight: '1.7', marginBottom: '1rem' }}>
                    Order your service and pay securely via Stripe. After payment, we'll contact you on Discord to set up account access. You stay in control - we never have your password. Access is only through Discord share/join.
                  </p>
                  <div style={{ backgroundColor: '#1a2332', padding: '1rem', borderRadius: '6px' }}>
                    <p style={{ color: '#cbd5e1', fontSize: '0.95rem', lineHeight: '1.6' }}>
                      <strong style={{ color: '#a78bfa' }}>Your Control:</strong> You're in your account the whole time. Operator can play while you watch or play offline. You can revoke access anytime.
                    </p>
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div style={{ display: 'flex', gap: '1.5rem' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '60px',
                  height: '60px',
                  minWidth: '60px',
                  backgroundColor: '#a78bfa',
                  color: '#000',
                  borderRadius: '50%',
                  fontSize: '1.5rem',
                  fontWeight: '700'
                }}>
                  3
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ color: '#f1f5f9', marginBottom: '0.75rem', fontSize: '1.3rem', fontWeight: '600' }}>
                    We Start Boosting
                  </h3>
                  <p style={{ color: '#cbd5e1', lineHeight: '1.7', marginBottom: '1rem' }}>
                    Our operator starts boosting your account. Manual progression only. We mimic real player behavior with natural playtime. You'll see progress updates through Discord. Typical boosting takes 2-14 days depending on service.
                  </p>
                  <div style={{ backgroundColor: '#1a2332', padding: '1rem', borderRadius: '6px' }}>
                    <p style={{ color: '#cbd5e1', fontSize: '0.95rem', lineHeight: '1.6' }}>
                      <strong style={{ color: '#34d399' }}>Timeline Varies:</strong> Money/RP typically 2-7 days. Full progression often 10-14 days. We meet your deadline.
                    </p>
                  </div>
                </div>
              </div>

              {/* Step 4 */}
              <div style={{ display: 'flex', gap: '1.5rem' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '60px',
                  height: '60px',
                  minWidth: '60px',
                  backgroundColor: '#34d399',
                  color: '#000',
                  borderRadius: '50%',
                  fontSize: '1.5rem',
                  fontWeight: '700'
                }}>
                  4
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ color: '#f1f5f9', marginBottom: '0.75rem', fontSize: '1.3rem', fontWeight: '600' }}>
                    Done! Your Account is Boosted
                  </h3>
                  <p style={{ color: '#cbd5e1', lineHeight: '1.7', marginBottom: '1rem' }}>
                    Boosting complete! You now have the RP, money, unlocks, or rank you wanted. We revoke our access, and it's just your account again. Play with your new resources immediately.
                  </p>
                  <div style={{ backgroundColor: '#1a2332', padding: '1rem', borderRadius: '6px' }}>
                    <p style={{ color: '#cbd5e1', fontSize: '0.95rem', lineHeight: '1.6' }}>
                      <strong style={{ color: '#fbbf24' }}>Enjoy Your Account:</strong> Everything is clean, safe, and untraceable. Play normally from here on.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Comparison */}
          <div style={{ marginBottom: '3rem' }}>
            <h2 style={{ fontSize: '1.8rem', color: '#fbbf24', marginBottom: '1.5rem' }}>
              Modded Accounts vs Boosting - Which is Right for You?
            </h2>

            <div style={{ overflow: 'auto' }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                color: '#cbd5e1',
                backgroundColor: '#1a2332',
                borderRadius: '8px'
              }}>
                <thead>
                  <tr style={{ backgroundColor: '#0f1720', borderBottom: '2px solid #334155' }}>
                    <th style={{ padding: '1rem', textAlign: 'left', color: '#fbbf24', fontWeight: '600' }}>Factor</th>
                    <th style={{ padding: '1rem', textAlign: 'center', color: '#f1f5f9', fontWeight: '600' }}>Modded Account</th>
                    <th style={{ padding: '1rem', textAlign: 'center', color: '#f1f5f9', fontWeight: '600' }}>Boosting</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #334155' }}>
                    <td style={{ padding: '1rem' }}>Setup Time</td>
                    <td style={{ padding: '1rem', textAlign: 'center' }}><strong>2-4 hours</strong></td>
                    <td style={{ padding: '1rem', textAlign: 'center' }}><strong>2-14 days</strong></td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #334155' }}>
                    <td style={{ padding: '1rem' }}>Control</td>
                    <td style={{ padding: '1rem', textAlign: 'center' }}>Fully yours immediately</td>
                    <td style={{ padding: '1rem', textAlign: 'center' }}>Yours, we help progress</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #334155' }}>
                    <td style={{ padding: '1rem' }}>Cost</td>
                    <td style={{ padding: '1rem', textAlign: 'center' }}>Higher upfront</td>
                    <td style={{ padding: '1rem', textAlign: 'center' }}>Lower, by item</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #334155' }}>
                    <td style={{ padding: '1rem' }}>What You Get</td>
                    <td style={{ padding: '1rem', textAlign: 'center' }}>Pre-built account</td>
                    <td style={{ padding: '1rem', textAlign: 'center' }}>Specific items/progress</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #334155' }}>
                    <td style={{ padding: '1rem' }}>Best For</td>
                    <td style={{ padding: '1rem', textAlign: 'center' }}>Instant gratification</td>
                    <td style={{ padding: '1rem', textAlign: 'center' }}>Specific goals</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '1rem' }}>Safety</td>
                    <td style={{ padding: '1rem', textAlign: 'center' }}>Proven safe methods</td>
                    <td style={{ padding: '1rem', textAlign: 'center' }}>Proven safe methods</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Link to FAQ Page */}
          <div style={{ marginBottom: '3rem', backgroundColor: '#1a2332', padding: '2rem', borderRadius: '8px', textAlign: 'center', borderTop: '2px solid #fbbf24' }}>
            <h3 style={{ fontSize: '1.3rem', color: '#f1f5f9', marginBottom: '1rem' }}>
              Have More Questions?
            </h3>
            <p style={{ color: '#cbd5e1', marginBottom: '1.5rem', lineHeight: '1.7' }}>
              Check out our comprehensive <a href="/faq" style={{ color: '#fbbf24', textDecoration: 'none', fontWeight: '600' }}>FAQ page</a> for answers to common questions about boosting, modded accounts, safety, and more.
            </p>
          </div>

          {/* CTA */}
          <div style={{ backgroundColor: '#1a2332', padding: '2rem', borderRadius: '8px', textAlign: 'center' }}>
            <h2 style={{ fontSize: '1.8rem', color: '#fbbf24', marginBottom: '1.5rem' }}>
              Ready to Get Started?
            </h2>
            <p style={{ color: '#cbd5e1', fontSize: '1.05rem', marginBottom: '1.5rem', lineHeight: '1.8' }}>
              Choose modded accounts for instant progression or boosting for targeted improvements. Either way, the process is simple and safe.
            </p>
            <button 
              style={{
                padding: '1rem 2.5rem',
                backgroundColor: '#fbbf24',
                color: '#000',
                border: 'none',
                borderRadius: '4px',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: 'pointer',
                marginRight: '1rem'
              }}
              onClick={() => window.location.href = '/products'}
            >
              Shop Modded Accounts
            </button>
            <button 
              style={{
                padding: '1rem 2.5rem',
                backgroundColor: '#334155',
                color: '#f1f5f9',
                border: '1px solid #60a5fa',
                borderRadius: '4px',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: 'pointer'
              }}
              onClick={() => window.location.href = '/services'}
            >
              Browse Boosting Services
            </button>
          </div>
        </div>
      </section>
    </>
  )
}
