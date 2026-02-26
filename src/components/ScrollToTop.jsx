import { useState, useEffect, useLayoutEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import './ScrollToTop.css'

export default function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false)
  const scrollContainerRef = useRef(null)
  const hasMountedRef = useRef(false)
  const { pathname, search } = useLocation()

  const resolveScrollContainer = () => {
    // For iOS Safari, always use window/document scroll
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream
    if (isIOS) {
      return document.documentElement
    }
    
    const candidates = [
      document.scrollingElement,
      document.getElementById('root'),
      document.querySelector('.app'),
      document.body,
      document.documentElement
    ].filter(Boolean)

    return candidates.find((node) => node.scrollHeight > node.clientHeight + 4) || document.scrollingElement || document.documentElement
  }

  const forceTop = (behavior = 'auto') => {
    const container = scrollContainerRef.current || resolveScrollContainer()
    scrollContainerRef.current = container

    if (container && container.scrollTo) {
      container.scrollTo({ top: 0, left: 0, behavior })
    } else {
      window.scrollTo({ top: 0, left: 0, behavior })
    }

    if (document.body) {
      document.body.scrollTop = 0
    }
    if (document.documentElement) {
      document.documentElement.scrollTop = 0
    }
  }

  // Scroll to top whenever page changes
  useLayoutEffect(() => {
    scrollContainerRef.current = resolveScrollContainer()
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const behavior = (!hasMountedRef.current || prefersReducedMotion) ? 'auto' : 'smooth'
    
    forceTop(behavior)
    requestAnimationFrame(() => forceTop(behavior))
    hasMountedRef.current = true
  }, [pathname, search])

  useEffect(() => {
    let activeContainer = scrollContainerRef.current || resolveScrollContainer()
    scrollContainerRef.current = activeContainer
    let ticking = false

    const updateVisibility = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const container = scrollContainerRef.current || resolveScrollContainer()
          // Use multiple methods to get scroll position for iOS compatibility
          const scrollTop = window.pageYOffset || window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || container?.scrollTop || 0
          const scrollHeight = document.documentElement.scrollHeight || container?.scrollHeight || 0
          const clientHeight = window.innerHeight || document.documentElement.clientHeight || container?.clientHeight || 0
          const canScroll = scrollHeight - clientHeight > 50
          setIsVisible(canScroll && scrollTop > 50)
          ticking = false
        })
        ticking = true
      }
    }

    const handleResize = () => {
      scrollContainerRef.current = resolveScrollContainer()
      updateVisibility()
    }

    // Initial visibility check
    updateVisibility()
    
    // Add multiple event listeners for better iOS compatibility
    activeContainer?.addEventListener('scroll', updateVisibility, { passive: true })
    window.addEventListener('scroll', updateVisibility, { passive: true })
    window.addEventListener('resize', handleResize, { passive: true })
    // Add touchmove for iOS momentum scrolling
    window.addEventListener('touchmove', updateVisibility, { passive: true })
    // Add touchend for when momentum scrolling stops
    window.addEventListener('touchend', updateVisibility, { passive: true })

    return () => {
      activeContainer?.removeEventListener('scroll', updateVisibility)
      window.removeEventListener('scroll', updateVisibility)
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('touchmove', updateVisibility)
      window.removeEventListener('touchend', updateVisibility)
    }
  }, [pathname])

  const scrollToTop = () => {
    forceTop('smooth')
  }

  return (
    <button
      className={`scroll-to-top-btn${isVisible ? '' : ' is-hidden'}`}
      onClick={scrollToTop}
      title="Scroll to top"
      aria-label="Scroll to top"
    >
      ↑
    </button>
  )
}
