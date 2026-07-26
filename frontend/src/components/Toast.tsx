import { useState, useEffect, createContext, useContext, ReactNode } from 'react'
import { cn } from '../lib/utils'
import { CheckCircle, AlertCircle, XCircle, Loader2 } from 'lucide-react'

interface Toast {
  id: string
  type: 'success' | 'error' | 'info' | 'loading'
  message: string
}

interface ToastContextType {
  toasts: Toast[]
  dismissToast: (id: string) => void
}

const ToastContext = createContext<ToastContextType | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  const addToast = (message: string, type: Toast['type'] = 'info') => {
    const id = Math.random().toString(36).slice(2)
    setToasts((prev) => [...prev, { id, type, message }])
    if (type !== 'loading') {
      setTimeout(() => dismissToast(id), 4000)
    }
    return id
  }

  const toast = {
    success: (message: string) => addToast(message, 'success'),
    error: (message: string) => addToast(message, 'error'),
    info: (message: string) => addToast(message, 'info'),
    loading: (message: string) => addToast(message, 'loading'),
    dismiss: dismissToast,
  }

  return (
    <ToastContext.Provider value={{ toasts, dismissToast }}>
      {children}
      <Toaster toasts={toasts} onDismiss={dismissToast} />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

function Toaster({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: string) => void }) {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((t) => (
        <Toast key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>
  )
}

function Toast({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  const icons = {
    success: <CheckCircle className="w-5 h-5 text-green-500" />,
    error: <AlertCircle className="w-5 h-5 text-red-500" />,
    info: <AlertCircle className="w-5 h-5 text-blue-500" />,
    loading: <Loader2 className="w-5 h-5 text-primary animate-spin" />,
  }

  return (
    <div
      className={cn(
        'flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg min-w-[280px] max-w-md animate-slide-up',
        'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
      )}
    >
      {icons[toast.type]}
      <p className="flex-1 text-sm text-gray-900 dark:text-gray-100">{toast.message}</p>
      <button
        onClick={() => onDismiss(toast.id)}
        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
      >
        <XCircle className="w-4 h-4" />
      </button>
    </div>
  )
}