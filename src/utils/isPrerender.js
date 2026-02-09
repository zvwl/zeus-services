export const isPrerender = () => {
  return typeof navigator !== 'undefined' && navigator.userAgent === 'ReactSnap'
}
