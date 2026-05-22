'use client'

import { useState, useEffect } from 'react'
import { ChevronUp } from 'lucide-react'
import './ScrollToTop.css'

export default function ScrollToTop() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' })

  return (
    <button
      className={`scroll-to-top-btn${visible ? '' : ' is-hidden'}`}
      onClick={scrollToTop}
      aria-label="Scroll to top"
    >
      <ChevronUp size={22} strokeWidth={2.5} />
    </button>
  )
}
