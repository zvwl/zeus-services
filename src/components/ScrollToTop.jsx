import { useState, useEffect, useLayoutEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import './ScrollToTop.css'

export default function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false)
  const scrollContainerRef = useRef(null)
  const hasMountedRef = useRef(false)
  const { pathname, search } = useLocation()

  const resolveScrollContainer = () => {
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

    const updateVisibility = () => {
      const container = scrollContainerRef.current || resolveScrollContainer()
      const scrollTop = container?.scrollTop || window.pageYOffset || 0
      const scrollHeight = container?.scrollHeight || document.documentElement.scrollHeight
      const clientHeight = container?.clientHeight || window.innerHeight
      const canScroll = scrollHeight - clientHeight > 80
      setIsVisible(canScroll && scrollTop > 80)
    }

    const handleResize = () => {
      scrollContainerRef.current = resolveScrollContainer()
      updateVisibility()
    }

    updateVisibility()
    activeContainer?.addEventListener('scroll', updateVisibility, { passive: true })
    window.addEventListener('scroll', updateVisibility, { passive: true })
    window.addEventListener('resize', handleResize, { passive: true })

    return () => {
      activeContainer?.removeEventListener('scroll', updateVisibility)
      window.removeEventListener('scroll', updateVisibility)
      window.removeEventListener('resize', handleResize)
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
