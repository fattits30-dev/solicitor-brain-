import { ReactNode, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, X } from 'lucide-react'

interface FABAction {
  icon: ReactNode
  label: string
  onClick: () => void
  color?: string
}

interface FABProps {
  actions: FABAction[]
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
}

export default function FAB({ actions, position = 'bottom-right' }: FABProps) {
  const [isOpen, setIsOpen] = useState(false)
  
  const positionClasses = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6',
    'top-right': 'top-20 right-6',
    'top-left': 'top-20 left-6'
  }
  
  const actionDirection = {
    'bottom-right': { x: 0, y: -70 },
    'bottom-left': { x: 0, y: -70 },
    'top-right': { x: 0, y: 70 },
    'top-left': { x: 0, y: 70 }
  }
  
  return (
    <div className={`fixed ${positionClasses[position]} z-50`}>
      <AnimatePresence>
        {isOpen && (
          <div className="absolute bottom-16 right-0 mb-2">
            {actions.map((action, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.3, y: 0 }}
                animate={{ 
                  opacity: 1, 
                  scale: 1, 
                  y: actionDirection[position].y * (index + 1)
                }}
                exit={{ opacity: 0, scale: 0.3, y: 0 }}
                transition={{ 
                  type: 'spring', 
                  stiffness: 300, 
                  damping: 25,
                  delay: index * 0.05
                }}
                className="absolute bottom-0 right-0 flex items-center gap-3"
              >
                {/* Label */}
                <motion.span
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + index * 0.05 }}
                  className="bg-gray-900 text-white text-sm px-3 py-1 rounded-lg whitespace-nowrap shadow-lg"
                >
                  {action.label}
                </motion.span>
                
                {/* Action button */}
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => {
                    action.onClick()
                    setIsOpen(false)
                  }}
                  className={`w-12 h-12 rounded-full shadow-lg flex items-center justify-center ${
                    action.color || 'bg-gray-700 hover:bg-gray-600'
                  }`}
                >
                  {action.icon}
                </motion.button>
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>
      
      {/* Main FAB button */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 rounded-full bg-blue-500 hover:bg-blue-600 shadow-xl flex items-center justify-center text-white relative z-10"
      >
        <motion.div
          animate={{ rotate: isOpen ? 45 : 0 }}
          transition={{ type: 'spring', stiffness: 300 }}
        >
          {isOpen ? <X className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
        </motion.div>
      </motion.button>
      
      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm -z-10"
          />
        )}
      </AnimatePresence>
    </div>
  )
}