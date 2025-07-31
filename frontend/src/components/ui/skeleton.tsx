import { motion } from 'framer-motion'

interface SkeletonProps {
  className?: string
  variant?: 'text' | 'rectangular' | 'circular'
  width?: string | number
  height?: string | number
  count?: number
}

export default function Skeleton({ 
  className = '', 
  variant = 'rectangular',
  width = '100%',
  height = 20,
  count = 1
}: SkeletonProps) {
  const baseClasses = 'skeleton'
  
  const variantClasses = {
    text: 'rounded',
    rectangular: 'rounded-lg',
    circular: 'rounded-full'
  }
  
  const elements = Array.from({ length: count }, (_, i) => (
    <motion.div
      key={i}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: i * 0.1 }}
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      style={{ width, height }}
    />
  ))
  
  return count > 1 ? (
    <div className="space-y-2">
      {elements}
    </div>
  ) : (
    elements[0]
  )
}

// Specific skeleton components for common use cases
export function CardSkeleton() {
  return (
    <div className="card-modern glass p-6">
      <div className="flex items-center justify-between mb-4">
        <Skeleton variant="text" width={150} height={24} />
        <Skeleton variant="circular" width={40} height={40} />
      </div>
      <Skeleton variant="text" count={3} />
    </div>
  )
}

export function TableRowSkeleton() {
  return (
    <div className="flex items-center gap-4 p-4 border-b border-gray-800">
      <Skeleton variant="circular" width={40} height={40} />
      <div className="flex-1">
        <Skeleton variant="text" width="60%" height={16} />
        <Skeleton variant="text" width="40%" height={14} className="mt-1" />
      </div>
      <Skeleton variant="text" width={80} height={32} />
    </div>
  )
}

export function ListItemSkeleton() {
  return (
    <div className="p-4 bg-gray-900/30 rounded-lg">
      <div className="flex items-start gap-3">
        <Skeleton variant="rectangular" width={48} height={48} />
        <div className="flex-1">
          <Skeleton variant="text" width="80%" height={18} />
          <Skeleton variant="text" width="60%" height={14} className="mt-2" />
          <Skeleton variant="text" width="40%" height={12} className="mt-2" />
        </div>
      </div>
    </div>
  )
}