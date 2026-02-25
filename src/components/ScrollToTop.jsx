import { useState, useEffect, useLayoutEffect } from 'react'
import { useLocation } from 'react-router-dom'
import './ScrollToTop.css'

export default function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(true)
  const { pathname, search } = useLocation()

  const forceTop = (behavior = 'auto') => {
    const scrollingElement = document.scrollingElement || document.documentElement
    window.scrollTo({ top: 0, left: 0, behavior })
    scrollingElement.scrollTop = 0
    document.body.scrollTop = 0
  }

  // Scroll to top whenever page changes
  useLayoutEffect(() => {
    forceTop('auto')
    requestAnimationFrame(() => forceTop('auto'))
  }, [pathname, search])

  useEffect(() => {
    let rafId
    let lastScrollTop = -1

    const getScrollTop = () => window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0

    const updateVisibility = () => {
      const currentTop = getScrollTop()
      const scrollingElement = document.scrollingElement || document.documentElement
      const scrollHeight = scrollingElement?.scrollHeight || document.body.scrollHeight
      const canScroll = scrollHeight - window.innerHeight > 80

      if (currentTop !== lastScrollTop) {
        lastScrollTop = currentTop
        setIsVisible(canScroll && currentTop > 80)
      }
    }

    const tick = () => {
      updateVisibility()
      rafId = requestAnimationFrame(tick)
    }

    updateVisibility()
    rafId = requestAnimationFrame(tick)
    window.addEventListener('scroll', updateVisibility, { passive: true })
    document.addEventListener('scroll', updateVisibility, { passive: true, capture: true })
    window.addEventListener('resize', updateVisibility, { passive: true })
    return () => {
      window.removeEventListener('scroll', updateVisibility)
      document.removeEventListener('scroll', updateVisibility, true)
      window.removeEventListener('resize', updateVisibility)
      if (rafId) {
        cancelAnimationFrame(rafId)
      }
    }
  }, [])

  const scrollToTop = () => {
    forceTop('smooth')
  }

  return (
    <>
      {isVisible && (
        <button
          className="scroll-to-top-btn"
          onClick={scrollToTop}
          title="Scroll to top"
          aria-label="Scroll to top"
        >
          ↑
        </button>
      )}
    </>
  )
}
