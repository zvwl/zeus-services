import { useRef } from 'react'
import Banner from '../components/Banner'
import '../App.css'

export default function Home({ onGetStarted }) {
  const aboutRef = useRef(null)

  const handleScrollAbout = () => {
    if (aboutRef.current) {
      aboutRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <>
      <Banner onGetStarted={onGetStarted} onScrollAbout={handleScrollAbout} />

      <section className="section about" ref={aboutRef} id="about">
        <p className="eyebrow">About us</p>
        <h2 className="section-title">Built for bold digital launches</h2>
        <p className="section-subtitle">We are a multi-disciplinary crew delivering end-to-end web, mobile, and brand experiences with measurable outcomes.</p>
        <div className="about-grid">
          <div className="about-card">
            <span className="about-icon">⚡</span>
            <h3>Speed to market</h3>
            <p>Rapid sprints, weekly demos, and zero fluff so you ship fast and learn faster.</p>
          </div>
          <div className="about-card">
            <span className="about-icon">🎯</span>
            <h3>Outcome first</h3>
            <p>We align design, engineering, and analytics to hit the metrics that matter.</p>
          </div>
          <div className="about-card">
            <span className="about-icon">🛡️</span>
            <h3>Reliable delivery</h3>
            <p>Senior talent, clear ownership, and transparent communication every step.</p>
          </div>
        </div>
      </section>
    </>
  )
}
