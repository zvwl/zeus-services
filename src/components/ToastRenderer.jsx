'use client'

import { useCart } from '@/contexts/CartContext'
import { ToastContainer } from './Toast'

export default function ToastRenderer() {
  const { toasts, removeToast } = useCart()
  return <ToastContainer toasts={toasts} onRemove={removeToast} />
}
