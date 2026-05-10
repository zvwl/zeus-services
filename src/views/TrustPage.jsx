'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import SEO from '@/components/SEO'
import Breadcrumb from '@/components/Breadcrumb'
import { isPrerender } from '../utils/isPrerender'

export default function TrustPage() {
  const [reviewCount, setReviewCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isPrerender()) {
      setReviewCount(0)
      setLoading(false)
      return
    }
    fetchReviewCount()
  }, [])

  const fetchReviewCount = async () => {
    try {
      const { count, error } = await supabase
        .from('reviews')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'approved')

      if (error) throw error
      setReviewCount(count || 0)
    } catch (err) {
      console.error('Error fetching review count:', err)
      setReviewCount(0)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <SEO 
        title="Why Customers Trust zeuservices - 9+ Years of GTA Account Services"
        description="Discover why customers choose zeuservices. 9+ years of proven service, transparent policies, professional Discord support, and hundreds of satisfied customers."
        keywords="zeuservices trust, reliable service, customer satisfaction, professional support"
      />
      
      <section className="section">
        <Breadcrumb customItems={[{ label: 'Home', path: '/' }, { label: 'Why Trust Us', path: '/trust' }]} />
        <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '3rem 2rem' }}>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', color: '#f1f5f9', textAlign: 'center' }}>
            Why Customers Trust zeuservices
          </h1>
          <p style={{ fontSize: '1.1rem', color: '#cbd5e1', marginBottom: '3rem', lineHeight: '1.8', textAlign: 'center' }}>
            9+ years of proven service. Transparent policies. Professional support. See what makes us different.
          </p>

          {/* Trust Stats */}
          <div className="trust-stats-grid" style={{ marginBottom: '3rem' }}>
            <div 
              className="trust-stat-card"
              style={{ 
                backgroundColor: '#1a2332', 
                padding: '1.5rem', 
                borderRadius: '8px', 
                textAlign: 'center',
                transition: 'all 0.3s ease',
                border: '2px solid transparent'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#0f1720'
                e.currentTarget.style.transform = 'translateY(-2px)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#1a2332'
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              <div style={{ fontSize: '2.5rem', color: '#fbbf24', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                9+
              </div>
              <div style={{ color: '#cbd5e1', fontSize: '0.95rem' }}>
                Years Experience
              </div>
            </div>

            <div 
              className="trust-stat-card"
              style={{ 
                backgroundColor: '#1a2332', 
                padding: '1.5rem', 
                borderRadius: '8px', 
                textAlign: 'center',
                transition: 'all 0.3s ease',
                border: '2px solid transparent'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#0f1720'
                e.currentTarget.style.transform = 'translateY(-2px)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#1a2332'
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              <div style={{ fontSize: '2.5rem', color: '#60a5fa', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                200+
              </div>
              <div style={{ color: '#cbd5e1', fontSize: '0.95rem' }}>
                Satisfied Customers
              </div>
            </div>

            <div 
              className="trust-stat-card"
              style={{ 
                backgroundColor: '#1a2332', 
                padding: '1.5rem', 
                borderRadius: '8px', 
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                border: '2px solid transparent'
              }}
              onClick={() => window.location.href = '/reviews'}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#0f1720'
                e.currentTarget.style.borderColor = '#34d399'
                e.currentTarget.style.transform = 'translateY(-4px)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#1a2332'
                e.currentTarget.style.borderColor = 'transparent'
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              <div style={{ fontSize: '2.5rem', color: '#34d399', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                {loading ? '...' : reviewCount}
              </div>
              <div style={{ color: '#cbd5e1', fontSize: '0.95rem' }}>
                Customer Reviews
              </div>
            </div>

            <div 
              className="trust-stat-card"
              style={{ 
                backgroundColor: '#1a2332', 
                padding: '1.5rem', 
                borderRadius: '8px', 
                textAlign: 'center',
                transition: 'all 0.3s ease',
                border: '2px solid transparent'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#0f1720'
                e.currentTarget.style.transform = 'translateY(-2px)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#1a2332'
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              <div style={{ fontSize: '2.5rem', color: '#a78bfa', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                0
              </div>
              <div style={{ color: '#cbd5e1', fontSize: '0.95rem' }}>
                Scam Reports
              </div>
            </div>
          </div>

          {/* Reviews Section - Link to Real Reviews */}
          <div style={{ marginBottom: '3rem', backgroundColor: '#1a2332', padding: '2rem', borderRadius: '8px', textAlign: 'center', borderTop: '3px solid #fbbf24' }}>
            <h2 style={{ fontSize: '2rem', color: '#fbbf24', marginBottom: '1.5rem' }}>
              Read Real Customer Reviews
            </h2>
            <p style={{ color: '#cbd5e1', fontSize: '1.05rem', lineHeight: '1.8', marginBottom: '2rem' }}>
              We don't post fake testimonials. All reviews on our site are from verified customers who actually purchased services. See what real buyers say about their experience.
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
                cursor: 'pointer'
              }}
              onClick={() => window.location.href = '/reviews'}
            >
              View All Customer Reviews
            </button>
          </div>

          {/* Why Trust Us */}
          <div style={{ marginBottom: '3rem', backgroundColor: '#1a2332', padding: '2rem', borderRadius: '8px' }}>
            <h2 style={{ fontSize: '2rem', color: '#fbbf24', marginBottom: '2rem' }}>
              Why People Trust zeuservices
            </h2>

            <div className="trust-grid" style={{ display: 'grid', gap: '1.5rem' }}>
              <div className="trust-card" style={{ borderLeft: '3px solid #fbbf24', paddingLeft: '1rem' }}>
                <h3 style={{ color: '#fbbf24', marginBottom: '0.75rem', fontSize: '1rem', fontWeight: '600' }}>
                  🏆 Proven Track Record
                </h3>
                <p style={{ color: '#cbd5e1', lineHeight: '1.7' }}>
                  9+ years of consistent, reliable service. We've been around longer than 99% of competing services. That longevity speaks to our legitimacy and consistency.
                </p>
              </div>

              <div className="trust-card" style={{ borderLeft: '3px solid #60a5fa', paddingLeft: '1rem' }}>
                <h3 style={{ color: '#60a5fa', marginBottom: '0.75rem', fontSize: '1rem', fontWeight: '600' }}>
                  ✓ Honest About Risks
                </h3>
                <p style={{ color: '#cbd5e1', lineHeight: '1.7' }}>
                  We don't hide that Rockstar enforces against boosted/modded accounts. We tell you upfront the risks involved. This honesty is why people trust us - we don't overpromise safety.
                </p>
              </div>

              <div className="trust-card" style={{ borderLeft: '3px solid #a78bfa', paddingLeft: '1rem' }}>
                <h3 style={{ color: '#a78bfa', marginBottom: '0.75rem', fontSize: '1rem', fontWeight: '600' }}>
                  Real Professional Support
                </h3>
                <p style={{ color: '#cbd5e1', lineHeight: '1.7' }}>
                  Responsive Discord support from real people. Not bots. Not automated responses. You get actual help from staff who care about your experience.
                </p>
              </div>

              <div className="trust-card" style={{ borderLeft: '3px solid #34d399', paddingLeft: '1rem' }}>
                <h3 style={{ color: '#34d399', marginBottom: '0.75rem', fontSize: '1rem', fontWeight: '600' }}>
                  Account Security First
                </h3>
                <p style={{ color: '#cbd5e1', lineHeight: '1.7' }}>
                  We prioritize your security over everything. Immediate password reset, no retained access, encrypted communications. Your account is always yours.
                </p>
              </div>

              <div className="trust-card" style={{ borderLeft: '3px solid #f97316', paddingLeft: '1rem' }}>
                <h3 style={{ color: '#f97316', marginBottom: '0.75rem', fontSize: '1rem', fontWeight: '600' }}>
                  No Hidden Fees
                </h3>
                <p style={{ color: '#cbd5e1', lineHeight: '1.7' }}>
                  Price upfront, no surprises. What you see is what you pay. No extra charges at delivery, no "expedite fees." Full transparency always.
                </p>
              </div>

              <div className="trust-card" style={{ borderLeft: '3px solid #06b6d4', paddingLeft: '1rem' }}>
                <h4 style={{ color: '#06b6d4', marginBottom: '0.75rem', fontSize: '1rem', fontWeight: '600' }}>
                  Fast Reliable Delivery
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
          <div className="trust-cta" style={{ backgroundColor: '#1a2332', padding: '2rem', borderRadius: '8px', textAlign: 'center' }}>
            <h2 style={{ fontSize: '1.8rem', color: '#fbbf24', marginBottom: '1rem' }}>
              Join Our Growing Community
            </h2>
            <p style={{ color: '#cbd5e1', fontSize: '1.05rem', marginBottom: '1.5rem', lineHeight: '1.8' }}>
              Experience the honest, transparent service backed by 9+ years of experience. Check our real customer reviews and see why people trust us.
            </p>
            <div className="trust-cta-actions">
            <button
              className="trust-cta-btn trust-cta-btn--primary"
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
              onClick={() => window.location.href = '/accounts'}
            >
              Get Modded Accounts
            </button>
            <button
              className="trust-cta-btn trust-cta-btn--secondary"
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
              onClick={() => window.location.href = '/boosting'}
            >
              Boost Your Account
            </button>
            </div>
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
                Yes. 9+ years of experience, 200+ satisfied customers, zero scam reports. We have a documented track record of reliable service. Check our <a href="/reviews" style={{ color: '#fbbf24', textDecoration: 'none' }}>real customer reviews</a> and Discord for community discussion.
              </p>
            </details>

            <details style={{ backgroundColor: '#1a2332', padding: '1.5rem', marginBottom: '1rem', borderRadius: '8px', cursor: 'pointer' }}>
              <summary style={{ color: '#f1f5f9', fontWeight: '600', fontSize: '1rem' }}>
                Will my account get banned?
              </summary>
              <p style={{ color: '#cbd5e1', marginTop: '1rem', lineHeight: '1.7' }}>
                Bans are always possible - it's luck-based. We have 9+ years of experience minimizing risk, but Rockstar enforcement is unpredictable. We're honest about this risk upfront. If YOU use additional cheats or mods after delivery, that increases ban risk significantly.
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
