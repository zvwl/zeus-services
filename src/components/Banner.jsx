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
        import('vanta/dist/vanta.halo.min'),
      ])

      if (cancelled) return

       effect = VANTA.default({
        el: bannerRef.current,
        THREE: THREE.default || THREE,
        mouseControls: true,
        touchControls: true,
        gyroControls: false,
        minHeight: 200.0,
        minWidth: 200.0,
        color: 0x66ccff,           // electric blue
        backgroundColor: 0x050914, // deep navy
        amplitudeFactor: 2.2,      // more ripple energy
        size: 1.9,                 // larger halo arcs
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
