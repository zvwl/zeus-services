import './Banner.css'

export default function Banner({ onGetStarted, onScrollAbout }) {
  return (
    <div className="banner">
      <div className="banner-content">
        <p className="eyebrow">Full-service studio</p>
        <h2 className="banner-title">Unleash the Power of Zeus</h2>
        <p className="banner-subtitle">Web, mobile, brand, and growth services delivered as fast, tangible outcomes.</p>
        <div className="banner-actions">
          <button className="primary-btn" onClick={onGetStarted}>Get started</button>
          <button className="ghost-btn" onClick={onScrollAbout}>About us</button>
        </div>
      </div>
      <div className="banner-accent"></div>
    </div>
  )
}
