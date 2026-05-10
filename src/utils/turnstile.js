export const isTurnstileBypassed = () => {
  if (process.env.NEXT_PUBLIC_TURNSTILE_BYPASS === 'true') {
    return true
  }

  if (!process.env.NODE_ENV === 'development') {
    return false
  }

  if (typeof window === 'undefined') {
    return false
  }

  const host = window.location.hostname
  return host === 'localhost' || host === '127.0.0.1'
}
