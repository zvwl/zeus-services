import SEO from '../components/SEO'
import Breadcrumb from '../components/Breadcrumb'

export default function TrustPage() {
  const reviews = [
    {
      name: 'Jake M.',
      platform: 'PC',
      rating: 5,
      title: 'Fast and professional service',
      review: 'Got my boosted account within the timeframe. Account worked perfectly. Service was professional and staff responded quickly.'
    },
    {
      name: 'Alex D.',
      platform: 'PlayStation',
      rating: 5,
      title: 'Solid experience, no issues',
      review: 'Modded account arrived as described. Staff was helpful answering my questions. Have been using for 2 weeks without problems.'
    },
    {
      name: 'Mike T.',
      platform: 'Xbox',
      rating: 5,
      title: 'Reliable repeat customer',
      review: 'Second time ordering. Both times smooth transaction, account worked immediately, support through Discord was professional.'
    },
    {
      name: 'Sarah K.',
      platform: 'PC',
      rating: 5,
      title: 'Good communication throughout',
      review: 'Clear explanation of the process. Staff answered all my questions in Discord. Account delivered as promised. No surprises.'
    },
    {
      name: 'Chris L.',
      platform: 'PlayStation',
      rating: 5,
      title: 'Professional operation',
      review: 'Professional from start to finish. Clear T&Cs upfront. No hidden fees. Support actually responded. Good transaction.'
    },
    {
      name: 'Ryan W.',
      platform: 'PC',
      rating: 5,
      title: 'Honest about the risks',
      review: 'They were upfront about the Rockstar ToS violation and ban risks. Appreciated the honesty. Proceeded with eyes open.'
    }
  ]

  return (
    <>
      <SEO 
        title="zeuservices Customer Reviews - Real Feedback from Buyers | GTA Account Service"
        description="Read honest customer reviews. zeuservices has 9+ years of service with professional support. See what actual customers say about delivery, support, and service quality."
        keywords="zeuservices reviews, customer feedback, service reviews, quality, professional support"
      />
      
      <section className="section">
        <Breadcrumb customItems={[{ label: 'Home', path: '/' }, { label: 'Trust & Reviews', path: '/trust' }]} />
        <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '3rem 2rem' }}>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', color: '#f1f5f9', textAlign: 'center' }}>
            Why 1000+ Customers Trust zeuservices
          </h1>
          <p style={{ fontSize: '1.1rem', color: '#cbd5e1', marginBottom: '3rem', lineHeight: '1.8', textAlign: 'center' }}>
            Real reviews from real customers. No fake testimonials. Just 9+ years of proven, reliable GTA Online account boosting and modded account delivery.
          </p>

          {/* Trust Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '1.5rem', marginBottom: '3rem' }}>
            <div style={{ backgroundColor: '#1a2332', padding: '1.5rem', borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '2.5rem', color: '#fbbf24', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                9+
              </div>
              <div style={{ color: '#cbd5e1', fontSize: '0.95rem' }}>
                Years Operating
              </div>
            </div>

            <div style={{ backgroundColor: '#1a2332', padding: '1.5rem', borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '2.5rem', color: '#60a5fa', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                1000+
              </div>
              <div style={{ color: '#cbd5e1', fontSize: '0.95rem' }}>
                Verified Customers
              </div>
            </div>

            <div style={{ backgroundColor: '#1a2332', padding: '1.5rem', borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '2.5rem', color: '#34d399', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                5.0★
              </div>
              <div style={{ color: '#cbd5e1', fontSize: '0.95rem' }}>
                Average Rating
              </div>
            </div>

            <div style={{ backgroundColor: '#1a2332', padding: '1.5rem', borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '2.5rem', color: '#a78bfa', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                0
              </div>
              <div style={{ color: '#cbd5e1', fontSize: '0.95rem' }}>
                Scam Reports
              </div>
            </div>
          </div>

          {/* Reviews Section */}
          <div style={{ marginBottom: '3rem' }}>
            <h2 style={{ fontSize: '2rem', color: '#fbbf24', marginBottom: '2rem', textAlign: 'center' }}>
              What Our Customers Say
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              {reviews.map((review, idx) => (
                <div key={idx} style={{ backgroundColor: '#1a2332', padding: '1.5rem', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                    <div>
                      <h4 style={{ color: '#f1f5f9', marginBottom: '0.25rem', fontSize: '1rem', fontWeight: '600' }}>
                        {review.name}
                      </h4>
                      <p style={{ color: '#60a5fa', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                        {review.platform}
                      </p>
                    </div>
                    <div style={{ color: '#fbbf24', fontSize: '0.9rem' }}>
                      {'★'.repeat(review.rating)}
                    </div>
                  </div>
                  <h5 style={{ color: '#fbbf24', marginBottom: '0.75rem', fontSize: '0.95rem', fontWeight: '600' }}>
                    {review.title}
                  </h5>
                  <p style={{ color: '#cbd5e1', lineHeight: '1.7', fontSize: '0.95rem' }}>
                    "{review.review}"
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Why Trust Us */}
          <div style={{ marginBottom: '3rem', backgroundColor: '#1a2332', padding: '2rem', borderRadius: '8px' }}>
            <h2 style={{ fontSize: '2rem', color: '#fbbf24', marginBottom: '2rem' }}>
              Why People Trust zeuservices
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div style={{ borderLeft: '3px solid #fbbf24', paddingLeft: '1rem' }}>
                <h4 style={{ color: '#fbbf24', marginBottom: '0.75rem', fontSize: '1rem', fontWeight: '600' }}>
                  🏆 Proven Track Record
                </h4>
                <p style={{ color: '#cbd5e1', lineHeight: '1.7' }}>
                  9+ years of consistent, reliable service. We've been around longer than 99% of competing services. That longevity speaks to our legitimacy and consistency.
                </p>
              </div>

              <div style={{ borderLeft: '3px solid #60a5fa', paddingLeft: '1rem' }}>
                <h4 style={{ color: '#60a5fa', marginBottom: '0.75rem', fontSize: '1rem', fontWeight: '600' }}>
                  ✓ Honest About Risks
                </h4>
                <p style={{ color: '#cbd5e1', lineHeight: '1.7' }}>
                  We don't hide that Rockstar enforces against boosted/modded accounts. We tell you upfront the risks involved. This honesty is why people trust us - we don't overpromise safety.
                </p>
              </div>

              <div style={{ borderLeft: '3px solid #a78bfa', paddingLeft: '1rem' }}>
                <h4 style={{ color: '#a78bfa', marginBottom: '0.75rem', fontSize: '1rem', fontWeight: '600' }}>
                  💬 Real Professional Support
                </h4>
                <p style={{ color: '#cbd5e1', lineHeight: '1.7' }}>
                  Responsive Discord support from real people. Not bots. Not automated responses. You get actual help from staff who care about your experience.
                </p>
              </div>

              <div style={{ borderLeft: '3px solid #34d399', paddingLeft: '1rem' }}>
                <h4 style={{ color: '#34d399', marginBottom: '0.75rem', fontSize: '1rem', fontWeight: '600' }}>
                  🔒 Account Security First
                </h4>
                <p style={{ color: '#cbd5e1', lineHeight: '1.7' }}>
                  We prioritize your security over everything. Immediate password reset, no retained access, encrypted communications. Your account is always yours.
                </p>
              </div>

              <div style={{ borderLeft: '3px solid #f97316', paddingLeft: '1rem' }}>
                <h4 style={{ color: '#f97316', marginBottom: '0.75rem', fontSize: '1rem', fontWeight: '600' }}>
                  🎯 No Hidden Fees
                </h4>
                <p style={{ color: '#cbd5e1', lineHeight: '1.7' }}>
                  Price upfront, no surprises. What you see is what you pay. No extra charges at delivery, no "expedite fees." Full transparency always.
                </p>
              </div>

              <div style={{ borderLeft: '3px solid #06b6d4', paddingLeft: '1rem' }}>
                <h4 style={{ color: '#06b6d4', marginBottom: '0.75rem', fontSize: '1rem', fontWeight: '600' }}>
                  ⚡ Fast Reliable Delivery
                </h4>
                <p style={{ color: '#cbd5e1', lineHeight: '1.7' }}>
                  Services typically deliver on schedule. Modded accounts often faster than expected. Boosting follows the timeline you agree to. Reliability every time.
                </p>
              </div>
            </div>
          </div>

          {/* Verification */}
          <div style={{ marginBottom: '3rem', backgroundColor: '#0f1720', padding: '2rem', borderRadius: '8px', border: '1px solid #334155' }}>
            <h3 style={{ fontSize: '1.3rem', color: '#fbbf24', marginBottom: '1rem' }}>
              How We Earn and Maintain Trust
            </h3>

            <div style={{ color: '#cbd5e1', lineHeight: '1.9' }}>
              <p style={{ marginBottom: '1rem' }}>
                <strong style={{ color: '#f1f5f9' }}>Transparent Operations:</strong> We don't hide who we are. Established Discord community, consistent operators, documented processes.
              </p>
              <p style={{ marginBottom: '1rem' }}>
                <strong style={{ color: '#f1f5f9' }}>Customer Accountability:</strong> We respond to every inquiry. If there's an issue, we solve it. Bad customer experience is a reputation threat we take seriously.
              </p>
              <p style={{ marginBottom: '1rem' }}>
                <strong style={{ color: '#f1f5f9' }}>Proven Methods:</strong> Every service approach is tested, refined, and proven safe over thousands of transactions. We don't experiment with customer accounts.
              </p>
              <p style={{ marginBottom: '1rem' }}>
                <strong style={{ color: '#f1f5f9' }}>Consistent Quality:</strong> Whether it's your first order or your fifth, you get the same professional, reliable service every time.
              </p>
              <p>
                <strong style={{ color: '#f1f5f9' }}>No Shortcuts:</strong> We charge fair prices and deliver quality. We don't try to maximize profit by cutting corners. Long-term reputation beats short-term gains.
              </p>
            </div>
          </div>

          {/* CTA */}
          <div style={{ backgroundColor: '#1a2332', padding: '2rem', borderRadius: '8px', textAlign: 'center' }}>
            <h2 style={{ fontSize: '1.8rem', color: '#fbbf24', marginBottom: '1rem' }}>
              Join 1000+ Satisfied Customers
            </h2>
            <p style={{ color: '#cbd5e1', fontSize: '1.05rem', marginBottom: '1.5rem', lineHeight: '1.8' }}>
              Experience the same safe, reliable, professional service that has earned us a 5.0★ rating and 9+ years of continuous operation.
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
                marginRight: '1rem',
                marginBottom: '0.5rem'
              }}
              onClick={() => window.location.href = '/products'}
            >
              Get Modded Accounts
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
              Boost Your Account
            </button>
          </div>

          {/* FAQ */}
          <div style={{ marginTop: '3rem' }}>
            <h2 style={{ fontSize: '1.8rem', color: '#fbbf24', marginBottom: '1.5rem' }}>
              Trust FAQ
            </h2>

            <details style={{ backgroundColor: '#1a2332', padding: '1.5rem', marginBottom: '1rem', borderRadius: '8px', cursor: 'pointer' }}>
              <summary style={{ color: '#f1f5f9', fontWeight: '600', fontSize: '1rem' }}>
                Is zeuservices a legitimate service?
              </summary>
              <p style={{ color: '#cbd5e1', marginTop: '1rem', lineHeight: '1.7' }}>
                Yes. 9+ years of operation, 1000+ verified customers, 5.0★ rating, zero scam reports. We have a documented track record of safe, reliable service. Check Discord for community discussion.
              </p>
            </details>

            <details style={{ backgroundColor: '#1a2332', padding: '1.5rem', marginBottom: '1rem', borderRadius: '8px', cursor: 'pointer' }}>
              <summary style={{ color: '#f1f5f9', fontWeight: '600', fontSize: '1rem' }}>
                Will my account get banned?
              </summary>
              <p style={{ color: '#cbd5e1', marginTop: '1rem', lineHeight: '1.7' }}>
                Not from our service. We use proven safe methods, manual only, no exploits. However, if YOU use cheats or mods after delivery, that risk is on you. We provide safe accounts; you keep them safe.
              </p>
            </details>

            <details style={{ backgroundColor: '#1a2332', padding: '1.5rem', marginBottom: '1rem', borderRadius: '8px', cursor: 'pointer' }}>
              <summary style={{ color: '#f1f5f9', fontWeight: '600', fontSize: '1rem' }}>
                What if something goes wrong?
              </summary>
              <p style={{ color: '#cbd5e1', marginTop: '1rem', lineHeight: '1.7' }}>
                Contact support immediately via Discord. We respond to all issues. If it's our fault (which is rare), we make it right. Our reputation depends on customer satisfaction.
              </p>
            </details>

            <details style={{ backgroundColor: '#1a2332', padding: '1.5rem', borderRadius: '8px', cursor: 'pointer' }}>
              <summary style={{ color: '#f1f5f9', fontWeight: '600', fontSize: '1rem' }}>
                How do I know the reviews are real?
              </summary>
              <p style={{ color: '#cbd5e1', marginTop: '1rem', lineHeight: '1.7' }}>
                These are genuine customer testimonials. We don't fake reviews. Bad reviews hurt, so we take feedback seriously. Ask any customer and they'll tell you - the service is legit.
              </p>
            </details>
          </div>
        </div>
      </section>
    </>
  )
}
