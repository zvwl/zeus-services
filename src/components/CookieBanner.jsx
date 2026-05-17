'use client'

import { useEffect, useState } from 'react'
import { Cookie, X, ShieldCheck } from 'lucide-react'
import './CookieBanner.css'

const STORAGE_KEY = 'cookieConsent'

function CookieBanner() {
  const [decided, setDecided] = useState(true) // start hidden to avoid flash
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    try {
      const existing = localStorage.getItem(STORAGE_KEY)
      setDecided(!!existing)
    } catch {
      setDecided(false)
    }
  }, [])

  const handleChoice = (value) => {
    try { localStorage.setItem(STORAGE_KEY, value) } catch { /* ignore */ }

    const analyticsStorage = value === 'accepted' ? 'granted' : 'denied'
    if (typeof window !== 'undefined') {
      window.dataLayer = window.dataLayer || []
      window.dataLayer.push({ event: 'cookie_consent_update', analytics_storage: analyticsStorage })
      if (typeof window.gtag === 'function') {
        window.gtag('consent', 'update', {
          analytics_storage: analyticsStorage,
          ad_storage: 'denied',
          ad_user_data: 'denied',
          ad_personalization: 'denied',
        })
      }
    }
    setDecided(true)
    setExpanded(false)
  }

  if (decided) return null

  return (
    <div className={`ck-root ${expanded ? 'ck-open' : ''}`}>
      {/* Floating trigger */}
      <button
        className="ck-trigger"
        onClick={() => setExpanded(v => !v)}
        aria-label="Cookie preferences"
        aria-expanded={expanded}
      >
        <Cookie size={22} strokeWidth={1.8} />
      </button>

      {/* Popup panel */}
      {expanded && (
        <div className="ck-panel" role="dialog" aria-label="Cookie consent" aria-live="polite">
          <div className="ck-panel-header">
            <div className="ck-panel-title">
              <Cookie size={16} strokeWidth={2} />
              <span>Cookie Preferences</span>
            </div>
            <button className="ck-close" onClick={() => setExpanded(false)} aria-label="Close">
              <X size={16} strokeWidth={2} />
            </button>
          </div>

          <p className="ck-body">
            We use essential cookies to keep you signed in. We also use optional analytics cookies
            to understand how the site is used. No advertising cookies are ever set.{' '}
            <a href="/privacy">Privacy policy</a>.
          </p>

          <div className="ck-note">
            <ShieldCheck size={13} strokeWidth={2} />
            <span>We never sell your data.</span>
          </div>

          <div className="ck-actions">
            <button className="ck-btn ck-btn--ghost" type="button" onClick={() => handleChoice('denied')}>
              Essential only
            </button>
            <button className="ck-btn" type="button" onClick={() => handleChoice('accepted')}>
              Accept all
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default CookieBanner
