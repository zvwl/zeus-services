import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '../supabaseClient'
import { isPrerender } from '../utils/isPrerender'
import './StatusBanner.css'

const STATUS_LABELS = {
  info: 'Status',
  warning: 'Notice',
  outage: 'Outage',
  success: 'Update',
  maintenance: 'Maintenance',
}

export default function StatusBanner() {
  const [announcements, setAnnouncements] = useState([])
  const [activeIndex, setActiveIndex] = useState(0)
  const activeIndexRef = useRef(0)

  useEffect(() => {
    activeIndexRef.current = activeIndex
  }, [activeIndex])

  const reconcileAnnouncements = useCallback((prev, next) => {
    if (!next.length) {
      setActiveIndex(0)
      return []
    }

    const currentId = prev[activeIndexRef.current]?.id
    const nextIndex = currentId
      ? next.findIndex((item) => item.id === currentId)
      : -1

    setActiveIndex(nextIndex >= 0 ? nextIndex : 0)
    return next
  }, [])

  const fetchLatest = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('status_announcements')
        .select('id, message, status, active, created_at')
        .eq('active', true)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Status banner fetch error:', error.message, error.code)
        setAnnouncements([])
        return
      }

      const nextAnnouncements = data || []
      setAnnouncements((prev) => reconcileAnnouncements(prev, nextAnnouncements))
    } catch (err) {
      console.error('Status banner fetch failed:', err)
      setAnnouncements([])
    }
  }, [reconcileAnnouncements])

  useEffect(() => {
    if (isPrerender()) return

    fetchLatest()

    const channel = supabase
      .channel('status_announcements')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'status_announcements' },
        (payload) => {
          const eventType = payload?.eventType
          const nextRow = payload?.new
          const prevRow = payload?.old

          setAnnouncements((prev) => {
            let next = [...prev]

            if (eventType === 'DELETE' && prevRow?.id) {
              next = next.filter((item) => item.id !== prevRow.id)
            }

            if ((eventType === 'INSERT' || eventType === 'UPDATE') && nextRow?.id) {
              next = next.filter((item) => item.id !== nextRow.id)
              if (nextRow.active) {
                next = [nextRow, ...next]
              }
            }

            next.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
            return reconcileAnnouncements(prev, next)
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchLatest, reconcileAnnouncements])

  useEffect(() => {
    if (announcements.length <= 1) return

    const intervalId = setInterval(() => {
      setActiveIndex((index) => (index + 1) % announcements.length)
    }, 8000)

    return () => clearInterval(intervalId)
  }, [announcements.length])

  const announcement = announcements[activeIndex]
  const [shouldScroll, setShouldScroll] = useState(false)

  // Check if text overflows and needs scrolling
  useEffect(() => {
    if (!announcement?.message) {
      setShouldScroll(false)
      return
    }

    // Reset animation state immediately when message changes
    setShouldScroll(false)

    const checkOverflow = () => {
      // Create temporary element to measure text width
      const temp = document.createElement('span')
      temp.style.cssText = `
        position: absolute;
        visibility: hidden;
        white-space: nowrap;
        font-size: 0.75rem;
        font-weight: 400;
      `
      temp.textContent = announcement.message
      document.body.appendChild(temp)
      
      const textWidth = temp.offsetWidth
      const containerWidth = window.innerWidth - 200 // Account for pill and padding
      
      document.body.removeChild(temp)
      
      setShouldScroll(textWidth > containerWidth)
    }

    // Check after a short delay to ensure rendering is complete
    const timeoutId = setTimeout(checkOverflow, 100)
    
    // Recheck on window resize
    window.addEventListener('resize', checkOverflow)

    return () => {
      clearTimeout(timeoutId)
      window.removeEventListener('resize', checkOverflow)
    }
  }, [announcement?.message, announcement?.id])

  // Always render the banner to maintain spacing
  if (!announcement?.message) {
    return <div className="status-banner status-banner--empty" />
  }

  const status = announcement.status || 'info'
  const label = STATUS_LABELS[status] || STATUS_LABELS.info

  return (
    <div className={`status-banner status-banner--${status}`} role="status" aria-live="polite">
      <div className="status-banner__content" key={announcement.id}>
        <span className="status-pill">{label}</span>
        <span className="status-message">
          {shouldScroll ? (
            <span className="status-message-text" key={`scroll-${announcement.id}`}>
              {announcement.message} • {announcement.message} • {announcement.message}
            </span>
          ) : (
            announcement.message
          )}
        </span>
      </div>
    </div>
  )
}
