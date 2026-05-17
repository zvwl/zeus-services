import './Banner.css'

export default function Banner({ onGetStarted }) {
  return (
    <div className="banner">
      {/* Animated gradient orbs */}
      <div className="banner-orb banner-orb--1" />
      <div className="banner-orb banner-orb--2" />
      <div className="banner-orb banner-orb--3" />

      {/* Grid overlay */}
      <div className="banner-grid" />

      {/* Overlay vignette */}
      <div className="banner-overlay" />

      <div className="banner-content">
        <p className="eyebrow">Multi-Game Account Services</p>
        <h2 className="banner-title">Level Up Your Game</h2>
        <p className="banner-subtitle">
          Professional boosting and account services for GTA 5, Fortnite, Rocket League, Forza Horizon 6, and more.
        </p>
        <div className="banner-actions">
          <button className="banner-cta" onClick={onGetStarted}>Get started</button>
        </div>
      </div>

      {/* Bottom accent line */}
      <div className="banner-accent" />
    </div>
  )
}
