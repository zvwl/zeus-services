export const isTurnstileBypassed = () => {
  if (import.meta.env.VITE_TURNSTILE_BYPASS === 'true') {
    return true
  }

  if (!import.meta.env.DEV) {
    return false
  }

  if (typeof window === 'undefined') {
    return false
  }

  const host = window.location.hostname
  return host === 'localhost' || host === '127.0.0.1'
}
