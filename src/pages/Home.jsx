import { useRef } from 'react'
import {
  Wallet,
  Zap,
  UserRound,
  ShoppingBag,
  Monitor,
  CreditCard,
  ClipboardList,
  Lock,
  Gem,
  Wrench,
  MessageCircle,
} from 'lucide-react'
import Banner from '../components/Banner'
import AnimatedLucideIcon from '../components/AnimatedLucideIcon'
import { Accordion, AccordionItem, AccordionButton, AccordionPanel } from '../components/Accordion'
import SEO, { SEO_CONFIGS } from '../components/SEO'
import '../App.css'

export default function Home({ onGetStarted }) {
  const aboutRef = useRef(null)
  
  // Refs for all animated icons
  const walletIconRef = useRef(null)
  const zapIconRef = useRef(null)
  const zapIcon2Ref = useRef(null)
  const zapIcon3Ref = useRef(null)
  const userRoundIconRef = useRef(null)
  const shoppingBagIconRef = useRef(null)
  const monitorIconRef = useRef(null)
  const creditCardIconRef = useRef(null)
  const clipboardIconRef = useRef(null)
  const lockIconRef = useRef(null)
  const gemIconRef = useRef(null)
  const wrenchIconRef = useRef(null)
  const messageIconRef = useRef(null)

  const handleScrollAbout = () => {
    if (aboutRef.current) {
      aboutRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <>
      <SEO {...SEO_CONFIGS.home} />
      <Banner onGetStarted={onGetStarted} onScrollAbout={handleScrollAbout} />

      <section className="section intro">
        <div className="intro-container" style={{maxWidth: '900px', margin: '0 auto', padding: '3rem 2rem', textAlign: 'center'}}>
          <h2 style={{fontSize: '1.8rem', marginBottom: '1rem', color: '#f1f5f9'}}>Professional Multi-Game Account Services & Boosting</h2>
          <p style={{fontSize: '1.1rem', lineHeight: '1.8', color: '#cbd5e1', marginBottom: '1.5rem'}}>
            Welcome to Zeus Services - your trusted partner for professional gaming services across multiple platforms. We provide premium account services and boosting for GTA 5, Fortnite, Rocket League, Forza Horizon 6, and more. With 9+ years of experience, we deliver safe, manual, and reliable services tailored to each game.
          </p>
        </div>
      </section>

      <section className="section" style={{backgroundColor: '#0f1720', padding: '3rem 2rem'}}>
        <div style={{maxWidth: '1200px', margin: '0 auto'}}>
          <h2 style={{fontSize: '2rem', marginBottom: '1rem', color: '#fbbf24', textAlign: 'center'}}>Our Services</h2>
          <p style={{fontSize: '1.05rem', color: '#cbd5e1', textAlign: 'center', marginBottom: '3rem', maxWidth: '700px', margin: '0 auto 3rem'}}>
            Choose the service type that fits your gaming needs. Available across all our supported games.
          </p>
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem'}}>
            {/* Topups */}
            <div 
              style={{backgroundColor: '#1a2332', padding: '2rem', borderRadius: '8px', textAlign: 'center', border: '1px solid #334155'}}
              onMouseEnter={() => walletIconRef.current?.startAnimation?.()}
              onMouseLeave={() => walletIconRef.current?.stopAnimation?.()}
            >
              <div style={{fontSize: '3rem', marginBottom: '1rem'}}><AnimatedLucideIcon ref={walletIconRef} icon={Wallet} size={42} animation="pulse" animateOnHover={false} /></div>
              <h3 style={{fontSize: '1.5rem', color: '#f1f5f9', marginBottom: '0.75rem'}}>Topups</h3>
              <p style={{color: '#cbd5e1', marginBottom: '1.5rem', lineHeight: '1.6'}}>In-game currency and credits. Get the currency you need instantly for faster gameplay and better gear.</p>
              <a href="/topups" style={{display: 'inline-block', padding: '0.75rem 1.5rem', backgroundColor: '#fbbf24', color: '#000', borderRadius: '4px', textDecoration: 'none', fontWeight: '600'}}>Browse Topups</a>
            </div>
            {/* Boosting */}
            <div 
              style={{backgroundColor: '#1a2332', padding: '2rem', borderRadius: '8px', textAlign: 'center', border: '1px solid #334155'}}
              onMouseEnter={() => zapIconRef.current?.startAnimation?.()}
              onMouseLeave={() => zapIconRef.current?.stopAnimation?.()}
            >
              <div style={{fontSize: '3rem', marginBottom: '1rem'}}><AnimatedLucideIcon ref={zapIconRef} icon={Zap} size={42} animation="bounce" animateOnHover={false} /></div>
              <h3 style={{fontSize: '1.5rem', color: '#f1f5f9', marginBottom: '0.75rem'}}>Boosting</h3>
              <p style={{color: '#cbd5e1', marginBottom: '1.5rem', lineHeight: '1.6'}}>Rank progression, level boosting, and achievement grinding. Let us handle the grind while you relax.</p>
              <a href="/boosting" style={{display: 'inline-block', padding: '0.75rem 1.5rem', backgroundColor: '#60a5fa', color: '#000', borderRadius: '4px', textDecoration: 'none', fontWeight: '600'}}>Browse Boosting</a>
            </div>
            {/* Accounts */}
            <div 
              style={{backgroundColor: '#1a2332', padding: '2rem', borderRadius: '8px', textAlign: 'center', border: '1px solid #334155'}}
              onMouseEnter={() => userRoundIconRef.current?.startAnimation?.()}
              onMouseLeave={() => userRoundIconRef.current?.stopAnimation?.()}
            >
              <div style={{fontSize: '3rem', marginBottom: '1rem'}}><AnimatedLucideIcon ref={userRoundIconRef} icon={UserRound} size={42} animation="wiggle" animateOnHover={false} /></div>
              <h3 style={{fontSize: '1.5rem', color: '#f1f5f9', marginBottom: '0.75rem'}}>Accounts</h3>
              <p style={{color: '#cbd5e1', marginBottom: '1.5rem', lineHeight: '1.6'}}>Pre-built accounts with progression ready to play. Skip the grind and jump straight into fun.</p>
              <a href="/accounts" style={{display: 'inline-block', padding: '0.75rem 1.5rem', backgroundColor: '#a78bfa', color: '#000', borderRadius: '4px', textDecoration: 'none', fontWeight: '600'}}>Browse Accounts</a>
            </div>
          </div>
        </div>
      </section>

      <section className="section safe-easy">
        <div className="safe-easy-container">
          <h2 className="section-title">Safe & Easy</h2>
          <p className="section-subtitle">A simple flow from browsing to delivery – no chaos, no confusion.</p>
          
          <div className="safe-easy-grid">
            <div 
              className="safe-easy-card"
              onMouseEnter={() => shoppingBagIconRef.current?.startAnimation?.()}
              onMouseLeave={() => shoppingBagIconRef.current?.stopAnimation?.()}
            >
              <div className="safe-easy-number">1</div>
              <div className="safe-easy-icon"><AnimatedLucideIcon ref={shoppingBagIconRef} icon={ShoppingBag} size={28} animation="bounce" animateOnHover={false} /></div>
              <h3>Pick your product/service</h3>
              <p>Browse and select from our catalog of accounts and services across all supported games.</p>
            </div>

            <div 
              className="safe-easy-card"
              onMouseEnter={() => monitorIconRef.current?.startAnimation?.()}
              onMouseLeave={() => monitorIconRef.current?.stopAnimation?.()}
            >
              <div className="safe-easy-number">2</div>
              <div className="safe-easy-icon"><AnimatedLucideIcon ref={monitorIconRef} icon={Monitor} size={28} animation="float" animateOnHover={false} /></div>
              <h3>Select Your Game & Version</h3>
              <p>Choose your game, version, and platform, then add to cart. We support multiple launchers and editions.</p>
            </div>

            <div 
              className="safe-easy-card"
              onMouseEnter={() => creditCardIconRef.current?.startAnimation?.()}
              onMouseLeave={() => creditCardIconRef.current?.stopAnimation?.()}
            >
              <div className="safe-easy-number">3</div>
              <div className="safe-easy-icon"><AnimatedLucideIcon ref={creditCardIconRef} icon={CreditCard} size={28} animation="slide" animateOnHover={false} /></div>
              <h3>Secure payment</h3>
              <p>Complete your purchase through the checkout – payments can be verified via Stripe.</p>
            </div>

            <div 
              className="safe-easy-card"
              onMouseEnter={() => zapIcon2Ref.current?.startAnimation?.()}
              onMouseLeave={() => zapIcon2Ref.current?.stopAnimation?.()}
            >
              <div className="safe-easy-number">4</div>
              <div className="safe-easy-icon"><AnimatedLucideIcon ref={zapIcon2Ref} icon={Zap} size={28} animation="bounce" animateOnHover={false} /></div>
              <h3>Quick Delivery</h3>
              <p>Accounts and services are delivered manually via Discord. Timelines vary from 20 minutes to 5 hours depending on the game and service type. Full updates provided.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section why-zeus">
        <div className="why-zeus-container">
          <h2 className="section-title">Why run with Zeus Services?</h2>
          <p className="section-subtitle">Over 9 years of experience across multiple gaming platforms. Expert knowledge in boosting, account services, and game-specific methods.</p>
          
          <div className="why-zeus-grid">
            <div 
              className="why-zeus-card"
              onMouseEnter={() => clipboardIconRef.current?.startAnimation?.()}
              onMouseLeave={() => clipboardIconRef.current?.stopAnimation?.()}
            >
              <div className="why-zeus-icon"><AnimatedLucideIcon ref={clipboardIconRef} icon={ClipboardList} size={28} animation="shake" animateOnHover={false} /></div>
              <h3>Manual, not messy</h3>
              <p>Orders are handled manually through Discord so nothing is rushed or botched. Something changes, you've got full chat history to fall back on.</p>
            </div>

            <div 
              className="why-zeus-card"
              onMouseEnter={() => lockIconRef.current?.startAnimation?.()}
              onMouseLeave={() => lockIconRef.current?.stopAnimation?.()}
            >
              <div className="why-zeus-icon"><AnimatedLucideIcon ref={lockIconRef} icon={Lock} size={28} animation="shake" animateOnHover={false} /></div>
              <h3>Maximum Security</h3>
              <p>Measures are taken to ensure account security and reliability. We craft each order carefully and handle all accounts with care to prevent unwanted issues down the line.</p>
            </div>

            <div 
              className="why-zeus-card"
              onMouseEnter={() => zapIcon3Ref.current?.startAnimation?.()}
              onMouseLeave={() => zapIcon3Ref.current?.stopAnimation?.()}
            >
              <div className="why-zeus-icon"><AnimatedLucideIcon ref={zapIcon3Ref} icon={Zap} size={28} animation="bounce" animateOnHover={false} /></div>
              <h3>Reliable Delivery</h3>
              <p>Orders are handled personally with attention to detail. Timelines vary by game and service - from 20 minutes to 5 hours. You'll get updates throughout the process.</p>
            </div>

            <div 
              className="why-zeus-card"
              onMouseEnter={() => gemIconRef.current?.startAnimation?.()}
              onMouseLeave={() => gemIconRef.current?.stopAnimation?.()}
            >
              <div className="why-zeus-icon"><AnimatedLucideIcon ref={gemIconRef} icon={Gem} size={28} animation="pulse" animateOnHover={false} /></div>
              <h3>Transparent & Reliable</h3>
              <p>Clear prices, clear items and direct Discord support. You always know what you're buying, how it works, and exactly what to expect.</p>
            </div>

            <div 
              className="why-zeus-card"
              onMouseEnter={() => wrenchIconRef.current?.startAnimation?.()}
              onMouseLeave={() => wrenchIconRef.current?.stopAnimation?.()}
            >
              <div className="why-zeus-icon"><AnimatedLucideIcon ref={wrenchIconRef} icon={Wrench} size={28} animation="spin" animateOnHover={false} /></div>
              <h3>Experience That Actually Matters</h3>
              <p>Not new sellers chasing quick cash. Years of experience adapting to game updates, patches, and safety practices across multiple platforms. That experience means smarter methods, safer execution, and fewer mistakes.</p>
            </div>

            <div 
              className="why-zeus-card"
              onMouseEnter={() => messageIconRef.current?.startAnimation?.()}
              onMouseLeave={() => messageIconRef.current?.stopAnimation?.()}
            >
              <div className="why-zeus-icon"><AnimatedLucideIcon ref={messageIconRef} icon={MessageCircle} size={28} animation="wiggle" animateOnHover={false} /></div>
              <h3>Real Human Support</h3>
              <p>No bots, no ticket black holes. You speak directly with real people who actually do the service. Need changes, updates, or advice? You're always one Discord message away.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section faq">
        <div className="faq-container">
          <h2 className="section-title">Questions & Answers</h2>
          
          <Accordion className="faq-list">
            <AccordionItem>
              <AccordionButton>Why buy from Zeus Services?</AccordionButton>
              <AccordionPanel>
                <p>We ensure that accounts and services are as secure as possible and help prevent unwanted issues after purchase. With 9+ years of experience, we craft every order carefully and handle your account with the utmost care.</p>
              </AccordionPanel>
            </AccordionItem>

            <AccordionItem>
              <AccordionButton>How do I buy from Zeus Services?</AccordionButton>
              <AccordionPanel>
                <p>Browse our games and services, select your version and platform, add to cart, and checkout securely via Stripe. Once payment is confirmed, we'll contact you via Discord for delivery.</p>
              </AccordionPanel>
            </AccordionItem>

            <AccordionItem>
              <AccordionButton>How do I receive my account or service?</AccordionButton>
              <AccordionPanel>
                <p>After payment, we'll reach out on Discord with full instructions and account details. For custom services, we'll confirm the specifications before delivery.</p>
              </AccordionPanel>
            </AccordionItem>

            <AccordionItem>
              <AccordionButton>Is this safe and legit?</AccordionButton>
              <AccordionPanel>
                <p>Yes. All transactions are secured via Stripe, delivery is handled manually through Discord with full transparency and communication history. We follow industry best practices and game-specific safety guidelines. See our Terms & Conditions for important details.</p>
              </AccordionPanel>
            </AccordionItem>

            <AccordionItem>
              <AccordionButton>What payment methods will you support?</AccordionButton>
              <AccordionPanel>
                <p>We support all major credit/debit cards through Stripe Checkout – no cryptocurrency, no risky payment gateways.</p>
              </AccordionPanel>
            </AccordionItem>

            <AccordionItem>
              <AccordionButton>How do I contact support?</AccordionButton>
              <AccordionPanel>
                <p>Join our Discord community for direct support, or email support@kiroozmare.resend.app. We respond within a few hours.</p>
              </AccordionPanel>
            </AccordionItem>
          </Accordion>
        </div>
      </section>


    </>
  )
}
