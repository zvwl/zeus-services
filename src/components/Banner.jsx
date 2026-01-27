import { useEffect, useRef } from 'react'
import './Banner.css'

export default function Banner({ onGetStarted, onScrollAbout }) {
  const bannerRef = useRef(null)

  useEffect(() => {
    let effect
    let cancelled = false

    async function loadVanta() {
      if (!bannerRef.current || typeof window === 'undefined') return
      const [THREE, VANTA] = await Promise.all([
        import('three'),
        import('vanta/dist/vanta.net.min'),
      ])

      if (cancelled) return

       effect = VANTA.default({
        el: bannerRef.current,
        THREE: THREE.default || THREE,
        color: 0x99e0ff,          // bright blue-white lines
        backgroundColor: 0x050914, // deep navy background
        points: 18.0,              // more nodes
        maxDistance: 18.0,         // shorter, snappier links
        spacing: 14.0,             // tighter mesh
        shininess: 60,             // extra glow
        gyroControls: false,
      })
    }

    loadVanta()

    return () => {
      cancelled = true
      if (effect && typeof effect.destroy === 'function') effect.destroy()
    }
  }, [])

  return (
    <div className="banner" ref={bannerRef}>
      <div className="banner-overlay"></div>
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
