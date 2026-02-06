import { useCallback } from 'react'
import Particles from 'react-tsparticles'
import { loadSlim } from 'tsparticles-slim'
import './Banner.css'

export default function Banner({ onGetStarted, onScrollAbout }) {
  const particlesInit = useCallback(async (engine) => {
    await loadSlim(engine)
  }, [])

  return (
    <div className="banner">
      <Particles
        className="banner-particles"
        init={particlesInit}
        options={{
          background: { color: { value: 'transparent' } },
          fpsLimit: 60,
          detectRetina: true,
          interactivity: {
            events: {
              onHover: { enable: false },
              onClick: { enable: false },
              resize: true,
            },
          },
          particles: {
            color: { value: ['#38bdf8', '#60a5fa', '#fbbf24'] },
            links: {
              enable: true,
              color: '#60a5fa',
              distance: 140,
              opacity: 0.2,
              width: 1,
            },
            move: {
              enable: true,
              speed: 1.2,
              outModes: { default: 'out' },
            },
            number: {
              value: 55,
              density: { enable: true, area: 800 },
            },
            opacity: { value: 0.6 },
            shape: { type: 'circle' },
            size: { value: { min: 1, max: 3 } },
          },
        }}
      />
      <div className="banner-overlay"></div>
      <div className="banner-content">
        <p className="eyebrow">GTA Online Account Services</p>
        <h2 className="banner-title">Play Smarter, Not Harder</h2>
        <p className="banner-subtitle">GTA Online account boosting and progression made simple.</p>
        <div className="banner-actions">
          <button className="primary-btn" onClick={onGetStarted}>Get started</button>
        </div>
      </div>
      <div className="banner-accent"></div>
    </div>
  )
}
