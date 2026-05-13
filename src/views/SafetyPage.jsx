'use client'

import { CheckCircle } from 'lucide-react'
import SEO from '@/components/SEO'
import Breadcrumb from '@/components/Breadcrumb'

export default function SafetyPage() {
  return (
    <>
      <SEO 
        title="Understanding Gaming Account Services - Be Informed Before Purchasing | zeuservices"
        description="Learn the facts about gaming account services across all platforms. Understand publisher enforcement, account risk, and what zeuservices actually does to help you make informed decisions."
        keywords="gaming account risk, game ban, modded accounts safety, boosting risks, informed decision, account services"
      />
      
      <section className="section">
        <Breadcrumb customItems={[{ label: 'Home', path: '/' }, { label: 'Important Information', path: '/safety' }]} />
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '3rem 2rem' }}>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', color: '#f1f5f9' }}>
            Important: Understand the Facts About Gaming Account Services
          </h1>
          <p style={{ fontSize: '1.1rem', color: '#cbd5e1', marginBottom: '2rem', lineHeight: '1.8' }}>
            Before purchasing any account service for any game, you need to understand what's actually happening, the real risks involved, and what we can and cannot do to protect you. This applies to all our supported games.
          </p>

          {/* The Hard Truth */}
          <div style={{ marginBottom: '3rem', backgroundColor: '#991b1b', padding: '2rem', borderRadius: '8px' }}>
            <h2 style={{ fontSize: '1.8rem', color: '#fff', marginBottom: '1rem' }}>
              The Reality You Need to Know
            </h2>
            <div style={{ color: '#f9fafb', lineHeight: '1.9', fontSize: '1.05rem' }}>
              <p style={{ marginBottom: '1rem' }}>
                <strong>Account services and boosting violate game publishers' Terms of Service (including Rockstar Games, Epic Games, Psyonix, and others).</strong>
              </p>
              <p style={{ marginBottom: '1rem' }}>
                Game publishers actively enforce against this, which means:
              </p>
              <ul style={{ marginLeft: '1.5rem', color: '#f9fafb' }}>
                <li>Your account <strong>CAN be reset, suspended, or permanently banned</strong> at any time</li>
                <li>Bans happen <strong>without warning</strong> - this is completely <strong>luck-based</strong></li>
                <li>We <strong>cannot prevent, stop, or reverse</strong> any publisher's actions - no one can</li>
                <li><strong>Risk varies by game</strong> - each publisher has different detection methods and enforcement</li>
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
                  <CheckCircle size={16} strokeWidth={2} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '6px' }} />9+ Years of Experience
                </h3>
                <p style={{ color: '#cbd5e1', lineHeight: '1.8' }}>
                  We've been operating gaming services for over 9 years across multiple games and platforms. This experience means we understand what patterns publishers look for and how to minimize detection risk. However, bans are ultimately luck-based and cannot be prevented.
                </p>
              </div>

              <div style={{ backgroundColor: '#1a2332', padding: '1.5rem', borderRadius: '8px', borderLeft: '4px solid #60a5fa' }}>
                <h3 style={{ color: '#60a5fa', marginBottom: '1rem', fontSize: '1.1rem' }}>
                  <CheckCircle size={16} strokeWidth={2} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '6px' }} />Multi-Game & Platform Support
                </h3>
                <p style={{ color: '#cbd5e1', lineHeight: '1.8' }}>
                  We support multiple games (GTA 5, Fortnite, Rocket League, Forza Horizon 6) across all major PC platforms: Steam, Epic Games, Xbox App (Microsoft Store), PlayStation Network, Xbox Live, and Rockstar Social Club. Services are tailored to your specific game and platform.
                </p>
              </div>

              <div style={{ backgroundColor: '#1a2332', padding: '1.5rem', borderRadius: '8px', borderLeft: '4px solid #a78bfa' }}>
                <h3 style={{ color: '#a78bfa', marginBottom: '1rem', fontSize: '1.1rem' }}>
                  <CheckCircle size={16} strokeWidth={2} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '6px' }} />Safe Progression Limits
                </h3>
                <p style={{ color: '#cbd5e1', lineHeight: '1.8' }}>
                  <strong>CRITICAL:</strong> We follow safe daily limits when building your account to minimize detection risk. These limits vary by game (currency caps, rank progression speed, unlock frequency). Requesting accelerated service beyond our recommendations significantly increases ban risk. We're not responsible for bans if you choose faster delivery.
                </p>
              </div>

              <div style={{ backgroundColor: '#1a2332', padding: '1.5rem', borderRadius: '8px', borderLeft: '4px solid #34d399' }}>
                <h3 style={{ color: '#34d399', marginBottom: '1rem', fontSize: '1.1rem' }}>
                  <CheckCircle size={16} strokeWidth={2} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '6px' }} />Tested Accounts (For Ready-Made Accounts)
                </h3>
                <p style={{ color: '#cbd5e1', lineHeight: '1.8' }}>
                  Pre-built accounts are tested on live game servers before delivery. This verifies they work at that moment. It does not mean they'll never get banned - publishers can issue a ban retroactively at any time.
                </p>
              </div>

              <div style={{ backgroundColor: '#1a2332', padding: '1.5rem', borderRadius: '8px', borderLeft: '4px solid #f97316' }}>
                <h3 style={{ color: '#f97316', marginBottom: '1rem', fontSize: '1.1rem' }}>
                  <CheckCircle size={16} strokeWidth={2} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '6px' }} />Immediate Account Security
                </h3>
                <p style={{ color: '#cbd5e1', lineHeight: '1.8' }}>
                  For pre-built accounts, you change credentials immediately after delivery. We don't store passwords. For boosting services, you maintain full account control throughout. Your account security is always in your hands.
                </p>
              </div>

              <div style={{ backgroundColor: '#1a2332', padding: '1.5rem', borderRadius: '8px', borderLeft: '4px solid #06b6d4' }}>
                <h3 style={{ color: '#06b6d4', marginBottom: '1rem', fontSize: '1.1rem' }}>
                  <CheckCircle size={16} strokeWidth={2} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '6px' }} />Possible Free Recovery (Conditions Apply)
                </h3>
                <p style={{ color: '#cbd5e1', lineHeight: '1.8' }}>
                  If you follow our guidelines when using the account AND get banned, we may offer a discretionary free replacement depending on the game and service. <strong>This is NOT guaranteed.</strong> If you requested accelerated service beyond our recommendations or violate our guidelines, there's no recovery offered.
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
                <h3 style={{ color: '#ef4444', marginBottom: '0.75rem', fontSize: '1rem', fontWeight: '600' }}>
                  No Ban Guarantee
                </h3>
                <p style={{ color: '#cbd5e1', lineHeight: '1.6', fontSize: '0.95rem' }}>
                  Despite our best efforts, bans can happen. We cannot prevent them or guarantee your account won't be banned.
                </p>
              </div>

              <div>
                <h3 style={{ color: '#ef4444', marginBottom: '0.75rem', fontSize: '1rem', fontWeight: '600' }}>
                  No Account Recovery Warranty
                </h3>
                <p style={{ color: '#cbd5e1', lineHeight: '1.6', fontSize: '0.95rem' }}>
                  If banned, we may help, but there's no guarantee your account can be recovered or that Rockstar will lift the ban.
                </p>
              </div>

              <div>
                <h3 style={{ color: '#ef4444', marginBottom: '0.75rem', fontSize: '1rem', fontWeight: '600' }}>
                  No Refunds for Any Reason
                </h3>
                <p style={{ color: '#cbd5e1', lineHeight: '1.6', fontSize: '0.95rem' }}>
                  All sales are final. Bans, disappointment, change of mind - no refunds. This is in our T&Cs.
                </p>
              </div>

              <div>
                <h3 style={{ color: '#ef4444', marginBottom: '0.75rem', fontSize: '1rem', fontWeight: '600' }}>
                  No Control Over Publishers
                </h3>
                <p style={{ color: '#cbd5e1', lineHeight: '1.6', fontSize: '0.95rem' }}>
                  We have zero influence on any game publisher's enforcement decisions. Their actions are outside our control completely.
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
                  • Play naturally - avoid sudden skill spikes or suspicious patterns<br/>
                  • Don't use additional cheats or mods on the account<br/>
                  • Follow game-specific guidelines provided by us<br/>
                  • Don't brag about the service publicly or in-game<br/>
                  • Don't share login credentials with others
                </p>
              </div>

              <p style={{ color: '#cbd5e1', lineHeight: '1.8' }}>
                Following these doesn't guarantee safety - publishers can still detect services even with careful play. But violating these guidelines almost guarantees detection and action.
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
              If you understand the risks, accept no refunds, and want to proceed, we're here. Open a Discord ticket after purchase and follow our guidance carefully for your specific game.
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
                Browse Accounts
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
                Browse Boosting
              </button>
            </div>
          </div>

          {/* Full Disclaimer */}
          <div style={{ marginTop: '3rem', padding: '1.5rem', backgroundColor: '#0f1720', borderRadius: '8px', border: '1px solid #334155' }}>
            <p style={{ color: '#cbd5e1', fontSize: '0.9rem', lineHeight: '1.8' }}>
              <strong style={{ color: '#fbbf24' }}>READ THIS:</strong> By purchasing, you acknowledge that our services may violate game publishers' Terms of Service, that bans can occur without warning, that we provide NO refunds, and that you accept full responsibility for any account actions or bans. This applies to all games we support. Read our full Terms & Conditions before purchasing.
            </p>
          </div>
        </div>
      </section>
    </>
  )
}
