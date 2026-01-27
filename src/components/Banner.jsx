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
        size: 1.4,                 // larger halo arcs
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
