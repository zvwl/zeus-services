import { Link } from 'react-router-dom'
import './Footer.css'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-section">
          <h3>Services</h3>
          <div className="footer-links">
            <Link to="/services">Browse Services</Link>
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
          <h3>Support</h3>
          <div className="footer-links">
            <a
              href="https://discord.gg/NSNSmmaA"
              target="_blank"
              rel="noreferrer"
              className="discord-link"
            >
              <img src="/discordLogo.png" alt="Discord" className="discord-icon" />
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
