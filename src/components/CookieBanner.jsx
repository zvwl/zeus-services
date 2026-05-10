'use client'

import { useEffect, useState } from 'react'
import './CookieBanner.css'

const STORAGE_KEY = 'cookieConsent'

function CookieBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    try {
      const existing = localStorage.getItem(STORAGE_KEY)
      setVisible(!existing)
    } catch {
      setVisible(true)
    }
  }, [])

  const handleChoice = (value) => {
    try {
      localStorage.setItem(STORAGE_KEY, value)
    } catch {
      // ignore storage errors
    }

    const analyticsStorage = value === 'accepted' ? 'granted' : 'denied'
    if (typeof window !== 'undefined') {
      window.dataLayer = window.dataLayer || []
      window.dataLayer.push({
        event: 'cookie_consent_update',
        analytics_storage: analyticsStorage
      })

      if (typeof window.gtag === 'function') {
        window.gtag('consent', 'update', {
          analytics_storage: analyticsStorage,
          ad_storage: 'denied',
          ad_user_data: 'denied',
          ad_personalization: 'denied'
        })
      }
    }

    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="cookie-banner" role="dialog" aria-live="polite" aria-label="Cookie consent">
      <div className="cookie-banner__content">
        <p>
          We use cookies to keep you signed in and improve the site.{' '}
          <a href="/privacy">Privacy policy</a>.
        </p>
        <div className="cookie-banner__actions">
          <button
            className="cookie-banner__btn cookie-banner__btn--ghost"
            type="button"
            onClick={() => handleChoice('denied')}
          >
            Deny
          </button>
          <button
            className="cookie-banner__btn"
            type="button"
            onClick={() => handleChoice('accepted')}
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  )
}

export default CookieBanner
