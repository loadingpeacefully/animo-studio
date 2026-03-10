'use client'

import { useEffect, useState } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ToastProps {
  message: string
  duration?: number     // ms, default 3000
  onDismiss?: () => void
}

// ─── Single toast ─────────────────────────────────────────────────────────────

export function Toast({ message, duration = 3000, onDismiss }: ToastProps) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false)
      setTimeout(() => onDismiss?.(), 400) // wait for exit anim
    }, duration)
    return () => clearTimeout(timer)
  }, [duration, onDismiss])

  return (
    <div
      className={`
        fixed bottom-6 left-1/2 -translate-x-1/2 z-50
        bg-[var(--sidebar)] text-white
        px-6 py-3 rounded-10 shadow-toast
        text-[13px] font-medium
        transition-all duration-300
        ${visible ? 'toast-in opacity-100' : 'opacity-0 translate-y-4'}
      `}
    >
      {message}
    </div>
  )
}

// ─── Toast manager hook ───────────────────────────────────────────────────────

interface ToastItem {
  id: string
  message: string
  duration?: number
}

export function useToast() {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const show = (message: string, duration = 3000) => {
    const id = Math.random().toString(36).slice(2)
    setToasts(prev => [...prev, { id, message, duration }])
  }

  const dismiss = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }

  const ToastContainer = () => (
    <>
      {toasts.map(t => (
        <Toast
          key={t.id}
          message={t.message}
          duration={t.duration}
          onDismiss={() => dismiss(t.id)}
        />
      ))}
    </>
  )

  return { show, ToastContainer }
}
