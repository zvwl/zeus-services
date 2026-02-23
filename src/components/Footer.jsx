import { Link } from 'react-router-dom'
import './Footer.css'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-section">
          <h3>Boosting</h3>
          <div className="footer-links">
            <Link to="/boosting/gta5">Browse Boosting</Link>
            <Link to="/cart">Your Cart</Link>
            <Link to="/orders">Your Orders</Link>
          </div>
        </div>

        <div className="footer-section">
          <h3>Legal</h3>
          <div className="footer-links">
            <Link to="/terms">Terms & Conditions</Link>
            <Link to="/privacy">Privacy Policy</Link>
            <Link to="/refund">Refund Policy</Link>
          </div>
        </div>

        <div className="footer-section">
          <h3>Information</h3>
          <div className="footer-links">
            <Link to="/safety">Safety & Security</Link>
            <Link to="/trust">Why Trust Us</Link>
            <Link to="/process">How It Works</Link>
          </div>
        </div>

        <div className="footer-section">
          <h3>Support</h3>
          <div className="footer-links">
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
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} Zeus Services. All rights reserved.</p>
      </div>
    </footer>
  )
}
