import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { isPrerender } from '../utils/isPrerender'
import './StatusBanner.css'

const STATUS_LABELS = {
  info: 'Status',
  warning: 'Notice',
  outage: 'Outage',
  success: 'Update',
}

export default function StatusBanner() {
  const [announcement, setAnnouncement] = useState(null)

  const fetchLatest = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('status_announcements')
        .select('id, message, status, active')
        .eq('active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (error) {
        console.error('Status banner fetch error:', error.message, error.code)
        setAnnouncement(null)
        return
      }

      setAnnouncement(data || null)
    } catch (err) {
      console.error('Status banner fetch failed:', err)
      setAnnouncement(null)
    }
  }, [])

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

  if (!announcement?.message) return null

  const status = announcement.status || 'info'
  const label = STATUS_LABELS[status] || STATUS_LABELS.info

  return (
    <div className={`status-banner status-banner--${status}`} role="status" aria-live="polite">
      <span className="status-pill">{label}</span>
      <span className="status-message">{announcement.message}</span>
    </div>
  )
}
