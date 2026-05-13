import { useState, useEffect } from 'react'
import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react'
import './Toast.css'

const TOAST_ICONS = {
  success: CheckCircle,
  error: XCircle,
  info: Info,
  warning: AlertTriangle,
}

export default function Toast({ message, type = 'info', duration = 3500, onClose }) {
  const [isVisible, setIsVisible] = useState(true)
  const [isExiting, setIsExiting] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true)
      setTimeout(() => {
        setIsVisible(false)
        if (onClose) onClose()
      }, 300)
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, onClose])

  if (!isVisible) return null

  const Icon = TOAST_ICONS[type] || Info

  return (
    <div className={`toast toast-${type} ${isExiting ? 'toast-exit' : 'toast-enter'}`}>
      <div className="toast-icon"><Icon size={18} strokeWidth={2.2} /></div>
      <div className="toast-message">{message}</div>
      <button
        className="toast-close"
        onClick={() => {
          setIsExiting(true)
          setTimeout(() => {
            setIsVisible(false)
            if (onClose) onClose()
          }, 300)
        }}
        aria-label="Close notification"
      >
        <X size={14} strokeWidth={2.5} />
      </button>
    </div>
  )
}

// Toast Container Component
export function ToastContainer({ toasts, removeToast, isCartDrawerOpen = false, isUserMenuOpen = false }) {
  const cartClass = isCartDrawerOpen ? 'toast-container-cart-open' : ''
  const menuClass = isUserMenuOpen ? 'toast-container-menu-open' : ''

  return (
    <div className={`toast-container ${cartClass} ${menuClass}`.trim()}>
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  )
}
