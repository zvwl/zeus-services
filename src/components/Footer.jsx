'use client'

import Link from 'next/link'
const tiktokLogo = '/tiktok-logo.svg'
import './Footer.css'

export default function Footer() {
  const scrollTop = () => window.scrollTo({ top: 0, left: 0, behavior: 'smooth' })

  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-section">
          <h3>Services</h3>
          <div className="footer-links">
            <Link href="/topups" onClick={scrollTop}>Topups</Link>
            <Link href="/boosting" onClick={scrollTop}>Boosting</Link>
            <Link href="/accounts" onClick={scrollTop}>Accounts</Link>
          </div>
        </div>

        <div className="footer-section">
          <h3>Account</h3>
          <div className="footer-links">
            <Link href="/cart" onClick={scrollTop}>Your Cart</Link>
            <Link href="/orders" onClick={scrollTop}>Your Orders</Link>
            <Link href="/reviews" onClick={scrollTop}>Reviews</Link>
          </div>
        </div>

        <div className="footer-section">
          <h3>Resources</h3>
          <div className="footer-links">
            <Link href="/faq" onClick={scrollTop}>FAQ</Link>
            <Link href="/process" onClick={scrollTop}>How It Works</Link>
            <Link href="/comparison" onClick={scrollTop}>Modded vs Boosting</Link>
            <Link href="/safety" onClick={scrollTop}>Safety &amp; Security</Link>
          </div>
        </div>

        <div className="footer-section">
          <h3>Legal</h3>
          <div className="footer-links">
            <Link href="/terms" onClick={scrollTop}>Terms &amp; Conditions</Link>
            <Link href="/privacy" onClick={scrollTop}>Privacy Policy</Link>
            <Link href="/refund" onClick={scrollTop}>Refund Policy</Link>
          </div>
        </div>

        <div className="footer-section">
          <h3>Company</h3>
          <div className="footer-links">
            <Link href="/trust" onClick={scrollTop}>Why Trust Us</Link>
            <a href="http://discord.gg/zeusservices" target="_blank" rel="noreferrer" className="discord-link">
              <picture>
                <source type="image/webp" srcSet="/discordLogo-40.webp 40w, /discordLogo-80.webp 80w" sizes="20px" />
                <img src="/discordLogo.png" alt="Discord" className="discord-icon" width="20" height="20" loading="lazy" decoding="async" />
              </picture>
              Join our Discord
            </a>
            <a href="https://www.tiktok.com/@zxzeusxzz" target="_blank" rel="noreferrer" className="tiktok-link">
              <img src={tiktokLogo} alt="TikTok" className="tiktok-icon" width="20" height="20" loading="lazy" decoding="async" />
              Follow on TikTok
            </a>
            <a href="https://buymeacoffee.com/zeuservices" target="_blank" rel="noreferrer" className="donate-link">
              <img src="https://cdn.buymeacoffee.com/buttons/bmc-new-btn-logo.svg" alt="Buy Me a Coffee" className="donate-icon" width="20" height="20" loading="lazy" decoding="async" />
              Donate Here!
            </a>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} Zeuservices. All rights reserved.</p>
      </div>
    </footer>
  )
}
