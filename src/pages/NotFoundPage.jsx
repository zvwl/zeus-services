import { Link } from 'react-router-dom'
import SEO from '../components/SEO'
import '../App.css'
import './NotFoundPage.css'

export default function NotFoundPage({
  heading = 'Page Not Found',
  message = 'The page you are looking for does not exist or is no longer available.'
}) {
  return (
    <section className="not-found-page" aria-label="Not Found">
      <SEO
        title="404 Not Found | Zeuservices"
        description="The page you are looking for does not exist."
        robots="noindex, follow"
      />

      <div className="not-found-glow not-found-glow-left" aria-hidden="true" />
      <div className="not-found-glow not-found-glow-right" aria-hidden="true" />

      <div className="not-found-card">
        <p className="not-found-code" aria-label="404">404</p>
        <h1 className="not-found-heading">{heading}</h1>
        <p className="not-found-message">{message}</p>

        <div className="not-found-actions">
          <Link to="/" className="not-found-btn not-found-btn-primary">
            Go Home
          </Link>
          <Link to="/boosting" className="not-found-btn not-found-btn-secondary">
            Browse Services
          </Link>
        </div>
      </div>
    </section>
  )
}