'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react'
import { create } from 'zustand'

interface Toast {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message?: string
  duration?: number
}

interface ToastStore {
  toasts: Toast[]
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
}

export const useToast = create<ToastStore>((set) => ({
  toasts: [],
  addToast: (toast) => {
    const id = Date.now().toString()
    set((state) => ({
      toasts: [...state.toasts, { ...toast, id }]
    }))
    
    // Auto remove after duration
    if (toast.duration !== 0) {
      setTimeout(() => {
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id)
        }))
      }, toast.duration || 5000)
    }
  },
  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id)
    }))
  }
}))

export function ToastContainer() {
  const { toasts, removeToast } = useToast()
  
  const icons = {
    success: <CheckCircle className="h-5 w-5" />,
    error: <AlertCircle className="h-5 w-5" />,
    warning: <AlertTriangle className="h-5 w-5" />,
    info: <Info className="h-5 w-5" />
  }
  
  const colors = {
    success: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
    error: 'bg-red-500/10 border-red-500/20 text-red-400',
    warning: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
    info: 'bg-blue-500/10 border-blue-500/20 text-blue-400'
  }
  
  return (
    <div className="fixed top-4 right-4 z-50 pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast, index) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 100, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.8 }}
            transition={{ 
              type: 'spring', 
              stiffness: 300, 
              damping: 25,
              delay: index * 0.05
            }}
            className={`
              glass p-4 rounded-lg border shadow-xl mb-3 pointer-events-auto
              min-w-[320px] max-w-md
              ${colors[toast.type]}
            `}
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                {icons[toast.type]}
              </div>
              
              <div className="flex-1">
                <h4 className="font-semibold text-white">{toast.title}</h4>
                {toast.message && (
                  <p className="mt-1 text-sm text-gray-300">{toast.message}</p>
                )}
              </div>
              
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => removeToast(toast.id)}
                className="flex-shrink-0 text-gray-400 hover:text-white transition-colors"
              >
                <X className="h-4 w-4" />
              </motion.button>
            </div>
            
            {/* Progress bar */}
            {toast.duration !== 0 && (
              <motion.div
                initial={{ scaleX: 1 }}
                animate={{ scaleX: 0 }}
                transition={{ 
                  duration: (toast.duration || 5000) / 1000, 
                  ease: 'linear' 
                }}
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-current origin-left rounded-b-lg"
                style={{ 
                  backgroundColor: toast.type === 'success' ? '#10b981' : 
                                  toast.type === 'error' ? '#ef4444' :
                                  toast.type === 'warning' ? '#f59e0b' : '#3b82f6'
                }}
              />
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

// Helper function for easy toast creation
export const toast = {
  success: (title: string, message?: string, duration?: number) => {
    useToast.getState().addToast({ 
      type: 'success', 
      title, 
      ...(message !== undefined && { message }),
      ...(duration !== undefined && { duration })
    })
  },
  error: (title: string, message?: string, duration?: number) => {
    useToast.getState().addToast({ 
      type: 'error', 
      title, 
      ...(message !== undefined && { message }),
      ...(duration !== undefined && { duration })
    })
  },
  warning: (title: string, message?: string, duration?: number) => {
    useToast.getState().addToast({ 
      type: 'warning', 
      title, 
      ...(message !== undefined && { message }),
      ...(duration !== undefined && { duration })
    })
  },
  info: (title: string, message?: string, duration?: number) => {
    useToast.getState().addToast({ 
      type: 'info', 
      title, 
      ...(message !== undefined && { message }),
      ...(duration !== undefined && { duration })
    })
  }
}