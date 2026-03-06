import { useState, useEffect } from 'react'
import './Toast.css'

export default function Toast({ message, type = 'info', duration = 3500, onClose }) {
  const [isVisible, setIsVisible] = useState(true)
  const [isExiting, setIsExiting] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true)
      setTimeout(() => {
        setIsVisible(false)
        if (onClose) onClose()
      }, 300) // Match animation duration
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, onClose])

  if (!isVisible) return null

  const icons = {
    success: '✓',
    error: '✕',
    info: 'ℹ',
    warning: '⚠'
  }

  return (
    <div className={`toast toast-${type} ${isExiting ? 'toast-exit' : 'toast-enter'}`}>
      <div className="toast-icon">{icons[type]}</div>
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
        ✕
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
