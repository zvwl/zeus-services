import { Link } from 'react-router-dom'
import tiktokLogo from '../assets/tiktok-logo.svg'
import './Footer.css'

export default function Footer() {
  const handleFooterLinkClick = () => {
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' })
  }

  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-section">
          <h3>Services</h3>
          <div className="footer-links">
            <Link to="/topups" onClick={handleFooterLinkClick}>Topups</Link>
            <Link to="/boosting" onClick={handleFooterLinkClick}>Boosting</Link>
            <Link to="/accounts" onClick={handleFooterLinkClick}>Accounts</Link>
          </div>
        </div>

        <div className="footer-section">
          <h3>Account</h3>
          <div className="footer-links">
            <Link to="/cart" onClick={handleFooterLinkClick}>Your Cart</Link>
            <Link to="/orders" onClick={handleFooterLinkClick}>Your Orders</Link>
            <Link to="/reviews" onClick={handleFooterLinkClick}>Reviews</Link>
          </div>
        </div>

        <div className="footer-section">
          <h3>Resources</h3>
          <div className="footer-links">
            <Link to="/faq" onClick={handleFooterLinkClick}>FAQ</Link>
            <Link to="/process" onClick={handleFooterLinkClick}>How It Works</Link>
            <Link to="/comparison" onClick={handleFooterLinkClick}>Modded vs Boosting</Link>
            <Link to="/safety" onClick={handleFooterLinkClick}>Safety & Security</Link>
          </div>
        </div>

        <div className="footer-section">
          <h3>Legal</h3>
          <div className="footer-links">
            <Link to="/terms" onClick={handleFooterLinkClick}>Terms & Conditions</Link>
            <Link to="/privacy" onClick={handleFooterLinkClick}>Privacy Policy</Link>
            <Link to="/refund" onClick={handleFooterLinkClick}>Refund Policy</Link>
          </div>
        </div>

        <div className="footer-section">
          <h3>Company</h3>
          <div className="footer-links">
            <Link to="/trust" onClick={handleFooterLinkClick}>Why Trust Us</Link>
            <a
              href="http://discord.gg/zeusservices"
              target="_blank"
              rel="noreferrer"
              className="discord-link"
            >
              <picture>
                <source
                  type="image/webp"
                  srcSet="/discordLogo-40.webp 40w, /discordLogo-80.webp 80w"
                  sizes="20px"
                />
                <img
                  src="/discordLogo.png"
                  alt="Discord"
                  className="discord-icon"
                  width="20"
                  height="20"
                  loading="lazy"
                  decoding="async"
                />
              </picture>
              Join our Discord
            </a>
            <a
              href="https://www.tiktok.com/@zxzeusxzz"
              target="_blank"
              rel="noreferrer"
              className="tiktok-link"
            >
              <img
                src={tiktokLogo}
                alt="TikTok"
                className="tiktok-icon"
                width="20"
                height="20"
                loading="lazy"
                decoding="async"
              />
              Follow on TikTok
            </a>
            <a
              href="https://buymeacoffee.com/zeuservices"
              target="_blank"
              rel="noreferrer"
              className="donate-link"
            >
              <img
                src="https://cdn.buymeacoffee.com/buttons/bmc-new-btn-logo.svg"
                alt="Buy Me a Coffee"
                className="donate-icon"
                width="20"
                height="20"
                loading="lazy"
                decoding="async"
              />
              Donate Here!
            </a>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} Zeus Services. All rights reserved.</p>
      </div>
    </footer>
  )
}
