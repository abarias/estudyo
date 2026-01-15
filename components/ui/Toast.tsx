'use client'

import { useEffect, useState, createContext, useContext, useCallback } from 'react'
import { Check, AlertCircle, X } from 'lucide-react'

type ToastType = 'success' | 'error' | 'info'

interface Toast {
  id: string
  type: ToastType
  message: string
}

interface ToastContextValue {
  showToast: (type: ToastType, message: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const showToast = useCallback((type: ToastType, message: string) => {
    const id = `toast-${Date.now()}`
    setToasts((prev) => [...prev, { id, type, message }])
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toasts.length > 0 && (
        <div className="fixed bottom-24 left-4 right-4 z-[60] flex flex-col gap-2 pointer-events-none">
          {toasts.map((toast) => (
            <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
          ))}
        </div>
      )}
    </ToastContext.Provider>
  )
}

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 3000)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (!visible) {
      const timer = setTimeout(() => onRemove(toast.id), 300)
      return () => clearTimeout(timer)
    }
  }, [visible, toast.id, onRemove])

  const bgColor = {
    success: 'bg-sage/90',
    error: 'bg-blush/90',
    info: 'bg-sky/90',
  }[toast.type]

  const Icon = {
    success: Check,
    error: AlertCircle,
    info: AlertCircle,
  }[toast.type]

  return (
    <div
      className={`${bgColor} ${visible ? 'animate-toast-in' : 'animate-toast-out'} 
        rounded-2xl px-4 py-3 shadow-md flex items-center gap-3 pointer-events-auto`}
    >
      <Icon size={18} className="text-white flex-shrink-0" />
      <p className="text-sm text-white font-medium flex-1">{toast.message}</p>
      <button
        onClick={() => setVisible(false)}
        className="text-white/70 hover:text-white p-1"
      >
        <X size={16} />
      </button>
    </div>
  )
}

export default ToastProvider
