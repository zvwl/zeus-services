import { useCallback, useEffect, useState } from 'react'
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

  const fetchLatest = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('status_announcements')
        .select('id, message, status, active')
        .eq('active', true)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Status banner fetch error:', error.message, error.code)
        setAnnouncements([])
        return
      }

      const nextAnnouncements = data || []
      setAnnouncements((prev) => {
        const currentId = prev[activeIndex]?.id
        if (!nextAnnouncements.length) {
          setActiveIndex(0)
          return []
        }

        const nextIndex = currentId
          ? nextAnnouncements.findIndex((item) => item.id === currentId)
          : -1

        setActiveIndex(nextIndex >= 0 ? nextIndex : 0)
        return nextAnnouncements
      })
    } catch (err) {
      console.error('Status banner fetch failed:', err)
      setAnnouncements([])
    }
  }, [activeIndex])

  useEffect(() => {
    if (isPrerender()) return

    fetchLatest()

    const channel = supabase
      .channel('status_announcements')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'status_announcements' },
        () => {
          fetchLatest()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchLatest])

  useEffect(() => {
    if (announcements.length <= 1) return

    const intervalId = setInterval(() => {
      setActiveIndex((index) => (index + 1) % announcements.length)
    }, 6000)

    return () => clearInterval(intervalId)
  }, [announcements.length])

  const announcement = announcements[activeIndex]

  if (!announcement?.message) return null

  const status = announcement.status || 'info'
  const label = STATUS_LABELS[status] || STATUS_LABELS.info

  return (
    <div className={`status-banner status-banner--${status}`} role="status" aria-live="polite">
      <div className="status-banner__content" key={announcement.id}>
        <span className="status-pill">{label}</span>
        <span className="status-message">{announcement.message}</span>
      </div>
    </div>
  )
}
