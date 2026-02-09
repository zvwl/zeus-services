export const isPrerender = () => {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent || ''
  return ua === 'ReactSnap' || ua.includes('jsdom') || ua.includes('Prerender')
}
